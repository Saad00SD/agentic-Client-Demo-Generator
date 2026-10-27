"""Check real SDK span creation and serialization without sending network traffic."""
import base64
import io
import json
import uuid

import pytest
from fastapi.testclient import TestClient
from langsmith import Client, tracing_context

from backend import observability as telemetry
from backend.agents import chat_agent
from backend.api import conversations, routes
from backend.main import app


class RecordingClient(Client):
    def __init__(self):
        super().__init__(api_key="test-key", api_url="http://127.0.0.1:1", auto_batch_tracing=False,
                         anonymizer=telemetry.sanitize, info={})
        self.runs_recorded = {}

    def create_run(self, name, inputs, run_type, **kwargs):
        row = self._run_transform(dict(name=name, inputs=inputs, run_type=run_type, **kwargs), copy=True)
        self.runs_recorded[str(row["id"])] = row

    def update_run(self, run_id, **kwargs):
        row = self._run_transform(dict(id=run_id, **kwargs), update=True, copy=True)
        self.runs_recorded.setdefault(str(run_id), {}).update({k: v for k, v in row.items() if v is not None})

    def flush(self, timeout=None):
        pass


@pytest.fixture
def traced_client(monkeypatch, tmp_path):
    monkeypatch.setenv("LANGSMITH_TRACING", "true")
    monkeypatch.setenv("LANGSMITH_API_KEY", "langsmith-test-secret")
    monkeypatch.setenv("GROQ_API_KEY", "groq-test-secret")
    monkeypatch.setenv("LANGSMITH_PROJECT", "test-demo-traces")
    monkeypatch.setattr(telemetry, "_delivery_error", None)
    recording = RecordingClient()
    monkeypatch.setattr(telemetry, "get_client", lambda: recording)
    import backend.main
    monkeypatch.setattr(backend.main, "flush", lambda: None)
    monkeypatch.setattr(conversations, "SESSION_DIR", tmp_path / "sessions")
    monkeypatch.setattr(conversations, "GENERATED_DIR", tmp_path / "generated")
    monkeypatch.setattr(routes, "GENERATED_DIR", str(tmp_path / "generated"))
    monkeypatch.setattr(telemetry, "ARTIFACT_DIR", tmp_path / "telemetry")
    with TestClient(app) as client:
        yield client, recording


def fake_response(patch, action="update"):
    return io.BytesIO(json.dumps({"id": "groq-test", "choices": [{"message": {"role": "assistant", "content": json.dumps({
        "reply": "Details updated.", "action": action, "patch": patch})}, "finish_reason": "stop"}],
        "usage": {"prompt_tokens": 100, "completion_tokens": 25, "total_tokens": 125,
                  "completion_tokens_details": {"reasoning_tokens": 5}, "total_time": .2}}).encode())


def test_chat_span_nesting_tokens_threads_and_redaction(traced_client, monkeypatch):
    client, recording = traced_client
    monkeypatch.setenv("GROQ_INPUT_COST_PER_MILLION", "1")
    monkeypatch.setenv("GROQ_OUTPUT_COST_PER_MILLION", "2")
    monkeypatch.setattr(chat_agent, "urlopen", lambda *a, **k: fake_response({"clientName": "Acme"}))
    session = client.post("/api/conversations").json()
    image = "data:image/png;base64," + base64.b64encode(b"private-image-content").decode()
    response = client.post(f"/api/conversations/{session['id']}/messages", json={
        "message": "Acme client; accidentally pasted groq-test-secret",
        "attachments": [{"target": "logo", "name": "logo.png", "data": image}],
    })
    assert response.status_code == 200, response.text
    root_id = response.headers["x-langsmith-trace-id"]
    uuid.UUID(root_id)
    runs = recording.runs_recorded
    root = runs[root_id]
    assert root["outputs"]["statusCode"] == 200
    assert root["inputs"]["messages"][0]["role"] == "user"
    assert root["outputs"]["messages"][0]["role"] == "assistant"
    child_runs = [r for r in runs.values() if str(r.get("trace_id")) == root_id]
    llm = next(r for r in child_runs if r["name"] == "groq.chat_completion")
    assert llm["run_type"] == "llm"
    assert llm["inputs"]["messages"]
    metadata = llm["extra"]["metadata"]
    assert metadata["ls_provider"] == "groq"
    assert metadata["attempt"] == 1
    usage = llm["outputs"]["usage_metadata"]
    assert usage["total_tokens"] == 125
    assert usage["output_token_details"]["reasoning"] == 5
    assert usage["total_cost"] == pytest.approx(.00015)
    assert all(r["extra"]["metadata"]["thread_id"] == session["id"] for r in child_runs)
    assert any(r["name"] == "agent.validate_decision" for r in child_runs)
    serialized = json.dumps(list(runs.values()), default=str)
    assert image not in serialized
    assert "groq-test-secret" not in serialized
    assert "private-image-content" not in serialized
    # Sanitization is logging-only; stored images and actual message are unchanged.
    stored = response.json()
    assert stored["config"]["branding"]["logo"] == image
    assert "groq-test-secret" in stored["messages"][-2]["content"]


def test_retry_attempts_and_http_errors_are_visible(traced_client, monkeypatch):
    client, recording = traced_client
    attempts = iter([{"branding": {"logo": "C:/secret.svg"}}, {"clientName": "Acme"}])
    monkeypatch.setattr(chat_agent, "urlopen", lambda *a, **k: fake_response(next(attempts)))
    session = client.post("/api/conversations").json()
    url = f"/api/conversations/{session['id']}"
    response = client.post(url + "/messages", json={"message": "Set Acme"})
    assert response.status_code == 200
    llms = [r for r in recording.runs_recorded.values() if r["name"] == "groq.chat_completion"]
    assert [r["extra"]["metadata"]["attempt"] for r in llms] == [1, 2]
    assert any(r.get("error") for r in recording.runs_recorded.values() if r["name"] == "agent.validate_decision")
    invalid = client.post(url + "/generate")
    assert invalid.status_code == 422
    assert recording.runs_recorded[invalid.headers["x-langsmith-trace-id"]]["error"] == "HTTP 422"


def test_generation_graph_tools_and_artifact_correlation(traced_client):
    client, recording = traced_client
    session = client.post("/api/conversations").json()
    url = f"/api/conversations/{session['id']}"
    session["config"].update(clientName="Acme", platformName="Rewards")
    session["config"]["country"]["name"] = "Germany"
    image = "data:image/png;base64," + base64.b64encode(b"private-graph-image").decode()
    session["config"]["homepage"]["heroImage"] = image
    # Set a prior build marker so this rebuild exercises tools without another LLM.
    session["result"] = {"projectId": "previous"}
    with tracing_context(enabled=False):
        conversations.save_session(session)
    response = client.post(url + "/generate")
    assert response.status_code == 200, response.text
    result = response.json()["result"]
    assert result["traceId"] == response.headers["x-langsmith-trace-id"]
    names = {r["name"] for r in recording.runs_recorded.values()}
    assert {"demo.build", "template.generate_demo", "template.copy_master", "localization.generate",
            "validation.check_demo", "packaging.create_zip", "generate_demo", "validate_demo"} <= names
    graph_runs = [r for r in recording.runs_recorded.values() if r["name"] == "generate_demo"]
    assert graph_runs[0]["extra"]["metadata"]["thread_id"] == session["id"]
    assert graph_runs[0]["parent_run_id"]
    assert image not in json.dumps(list(recording.runs_recorded.values()), default=str)
    preview = client.get(result["previewUrl"])
    preview_root = recording.runs_recorded[preview.headers["x-langsmith-trace-id"]]
    assert preview_root["extra"]["metadata"]["thread_id"] == session["id"]
    assert preview_root["extra"]["metadata"]["build_trace_id"] == result["traceId"]
    assert client.get(result["previewUrl"].replace("index.html", "assets/app.css")).headers.get("x-langsmith-trace-id") is None
    assert client.get(result["downloadUrl"]).headers.get("x-langsmith-trace-id")


def test_disabled_and_client_setup_failure_do_not_break_app(traced_client, monkeypatch):
    client, recording = traced_client
    monkeypatch.setenv("LANGSMITH_TRACING", "false")
    assert "x-langsmith-trace-id" not in client.post("/api/conversations").headers
    assert not recording.runs_recorded
    monkeypatch.setenv("LANGSMITH_TRACING", "true")
    def broken():
        raise ValueError("Bad telemetry configuration")
    monkeypatch.setattr(telemetry, "get_client", broken)
    assert client.post("/api/conversations").status_code == 200
    state = client.get("/api/observability/status").json()
    assert state["lastDeliveryError"] == "ValueError"
    assert "langsmith-test-secret" not in json.dumps(state)


def test_sanitizer_masks_nested_models_embedded_data_and_credentials(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "my-private-api-key")
    original = {"body": conversations.ChatTurn(message="my-private-api-key", attachments=[
        {"target": "logo", "name": "logo", "data": "data:image/png;base64,c2VjcmV0"}]),
        "Authorization": "Bearer secret", "error": 'failure data:image/png;base64,c2VjcmV0 and my-private-api-key',
        "output_tokens": 42}
    sanitized = telemetry.sanitize(original)
    assert sanitized["body"]["message"] == "[redacted]"
    assert sanitized["Authorization"] == "[redacted]"
    assert "c2VjcmV0" not in sanitized["error"]
    assert sanitized["output_tokens"] == 42
    assert original["body"].message == "my-private-api-key"
