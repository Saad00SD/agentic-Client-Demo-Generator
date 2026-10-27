import base64
import io
import json
from urllib.error import HTTPError

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.api import conversations
from backend.agents import chat_agent
from backend.agents.chat_agent import AgentDecision, AgentError


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(conversations, "SESSION_DIR", tmp_path / "sessions")
    monkeypatch.setattr(conversations, "GENERATED_DIR", tmp_path / "generated")
    from backend.api import routes
    monkeypatch.setattr(routes, "GENERATED_DIR", str(tmp_path / "generated"))
    with TestClient(app) as client:
        yield client


def test_chat_build_edit_and_rebuild_preserves_uploaded_images(client, monkeypatch):
    def planner(config, messages):
        config = chat_agent.merge_config(config, {
            "clientName": "Acme", "platformName": "Rewards", "country": {"name": "Germany"},
            "homepage": {"title": "Acme rewards"},
        })
        return AgentDecision(reply="I'll build your demo.", action="generate"), config
    monkeypatch.setattr(conversations, "plan_turn", planner)
    session = client.post("/api/conversations").json()
    url = f"/api/conversations/{session['id']}"
    image = "data:image/png;base64," + base64.b64encode(b"test-image").decode()
    response = client.post(url + "/messages", json={"message": "Build Acme rewards for Germany", "attachments": [
        {"target": "hero", "name": "hero.png", "data": image},
        {"target": "logo", "name": "logo.png", "data": image},
    ]})
    assert response.status_code == 200, response.text
    session = response.json()
    assert session["config"]["homepage"]["heroImage"] == image
    assert session["result"]["validation"]["valid"]
    first = session["result"]["previewUrl"]
    assert "Acme rewards" in client.get(first).text
    assert client.get(first.replace("index.html", "assets/homepage/hero.png")).content == b"test-image"
    session["config"]["homepage"]["title"] = "Updated manually"
    saved = client.put(url + "/config", json={"clientConfig": session["config"]})
    assert saved.json()["dirty"]
    rebuilt = client.post(url + "/generate").json()
    assert rebuilt["result"]["previewUrl"] != first
    assert "Updated manually" in client.get(rebuilt["result"]["previewUrl"]).text
    assert "Acme rewards" in client.get(first).text
    restored = client.get(url).json()
    assert restored["config"]["branding"]["logo"] == image
    assert restored["messages"][1]["role"] == "user"
    assert not restored["dirty"]


def test_missing_details_and_invalid_attachments_are_rejected(client):
    session = client.post("/api/conversations").json()
    url = f"/api/conversations/{session['id']}"
    assert client.post(url + "/generate").status_code == 422
    assert client.post(url + "/messages", json={"message": ""}).status_code == 422
    assert client.post(url + "/messages", json={"attachments": [{"target": "logo", "name": "bad", "data": "data:text/plain;base64,SGk="}]}).status_code == 422
    assert client.post(url + "/messages", json={"attachments": [{"target": "campaign_99", "name": "a.png", "data": "data:image/png;base64,SGk="}]}).status_code == 422
    assert client.get("/api/conversations/invalid").status_code == 404


def test_provider_failure_does_not_change_saved_details(client, monkeypatch):
    session = client.post("/api/conversations").json()
    url = f"/api/conversations/{session['id']}"
    def failed(*args):
        raise AgentError("Groq is rate limited. Please retry.")
    monkeypatch.setattr(conversations, "plan_turn", failed)
    response = client.post(url + "/messages", json={"message": "Build something"})
    assert response.status_code == 502
    assert client.get(url).json() == session


def test_chat_update_waits_for_build_and_generate_button_uses_agent(client, monkeypatch):
    calls = []
    def planner(config, messages):
        calls.append(messages[-1]["content"])
        config.update(clientName="Acme", platformName="Rewards")
        config["country"]["name"] = "Germany"
        config["homepage"]["title"] = "Agent-written homepage"
        return AgentDecision(reply="Ready when you are.", action="update"), config
    monkeypatch.setattr(conversations, "plan_turn", planner)
    session = client.post("/api/conversations").json()
    url = f"/api/conversations/{session['id']}"
    updated = client.post(url + "/messages", json={"message": "Acme, Rewards, Germany"}).json()
    assert updated["result"] is None
    built = client.post(url + "/generate")
    assert built.status_code == 200
    assert len(calls) == 2
    assert "Generate the demo now" in calls[-1]
    assert "Agent-written homepage" in client.get(built.json()["result"]["previewUrl"]).text


class FakeResponse(io.BytesIO):
    def __init__(self, data):
        super().__init__(json.dumps({"choices": [{"message": {"content": json.dumps(data)}}]}).encode())


def test_groq_transport_redacts_and_restores_campaign_images(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "test-secret")
    config = conversations.ClientConfig(campaigns=[{"id": "c1", "name": "Original", "img": "data:image/png;base64,SGk="}]).model_dump()
    def transport(request, timeout):
        body = json.loads(request.data)
        assert "data:image/png" not in request.data.decode()
        assert body["response_format"] == {"type": "json_object"}
        return FakeResponse({"reply": "Updated", "action": "update", "patch": {"campaigns": [{"id": "c1", "name": "Revised", "img": "uploaded-image:0"}]}})
    monkeypatch.setattr(chat_agent, "urlopen", transport)
    decision, merged = chat_agent.plan_turn(config, [{"role": "user", "content": "Rename campaign"}])
    assert merged["campaigns"][0]["img"] == config["campaigns"][0]["img"]
    assert merged["campaigns"][0]["name"] == "Revised"
    assert decision.action == "update"


def test_invalid_model_output_retries_without_applying_local_file_path(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "test-secret")
    calls = []
    def transport(request, timeout):
        calls.append(1)
        return FakeResponse({"reply": "Updated", "action": "update", "patch": {"branding": {"logo": "C:/private/logo.svg"}}})
    monkeypatch.setattr(chat_agent, "urlopen", transport)
    with pytest.raises(AgentError, match="invalid configuration"):
        chat_agent.plan_turn(conversations.ClientConfig().model_dump(), [])
    assert len(calls) == 2


def test_missing_key_and_rate_limit_have_safe_errors(monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    with pytest.raises(AgentError, match="Set GROQ_API_KEY"):
        chat_agent.plan_turn({}, [])
    monkeypatch.setenv("GROQ_API_KEY", "test-secret")
    def limited(*args, **kwargs):
        raise HTTPError("https://api.groq.com", 429, "rate limit", {}, None)
    monkeypatch.setattr(chat_agent, "urlopen", limited)
    with pytest.raises(AgentError, match="rate limited"):
        chat_agent.plan_turn({}, [])
