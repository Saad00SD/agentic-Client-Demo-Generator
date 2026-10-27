"""Shared LangSmith instrumentation for HTTP, custom LLM calls and template tools."""
import json
import logging
import os
import re
import threading
from contextvars import ContextVar
from functools import lru_cache
from pathlib import Path

from langsmith import Client, get_current_run_tree, trace, traceable, tracing_context
from pydantic import BaseModel

logger = logging.getLogger(__name__)
ARTIFACT_DIR = Path(__file__).resolve().parents[1] / "uploads" / "observability"
_delivery_lock = threading.Lock()
_delivery_error = None
_http_run = ContextVar("demo_http_trace", default=None)
_DATA_URL = re.compile(r"data:[\w.+/-]+(?:;[\w=.-]+)*,[A-Za-z0-9+/=\s%.-]+")
_CREDENTIAL = re.compile(r"\b(?:gsk_[A-Za-z0-9_-]+|lsv2_[A-Za-z0-9_-]+|sk-[A-Za-z0-9_-]+)")
_SECRET_FIELDS = {"authorization", "cookie", "set-cookie", "password", "api_key", "apikey", "access_token", "refresh_token"}


def enabled() -> bool:
    return os.getenv("LANGSMITH_TRACING", "false").lower() in {"true", "1", "yes"} and bool(os.getenv("LANGSMITH_API_KEY"))


def sanitize(value):
    """Return a detached log representation; never modify application state."""
    if isinstance(value, BaseModel):
        value = value.model_dump()
    if isinstance(value, dict):
        return {str(k): "[redacted]" if str(k).lower() in _SECRET_FIELDS or str(k).lower().endswith("_api_key")
                else sanitize(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [sanitize(v) for v in value]
    if isinstance(value, bytes):
        return f"[binary: {len(value)} bytes]"
    if isinstance(value, Path):
        return str(value)
    if isinstance(value, str):
        value = _DATA_URL.sub("[image/file data omitted]", value)
        value = _CREDENTIAL.sub("[redacted]", value)
        for name, secret in os.environ.items():
            if len(secret) >= 8 and (name.endswith("_API_KEY") or name.endswith("_ACCESS_TOKEN")):
                value = value.replace(secret, "[redacted]")
        return value
    return value


def _delivery_failed(error):
    global _delivery_error
    # Keep status actionable without retaining credentials or provider response bodies.
    with _delivery_lock:
        _delivery_error = type(error).__name__
    logger.warning("LangSmith trace delivery failed (%s); application requests continue.", type(error).__name__)


@lru_cache(maxsize=1)
def get_client() -> Client:
    return Client(
        anonymizer=sanitize,
        hide_inputs=os.getenv("LANGSMITH_HIDE_INPUTS", "false").lower() == "true",
        hide_outputs=os.getenv("LANGSMITH_HIDE_OUTPUTS", "false").lower() == "true",
        timeout_ms=5000,
        tracing_error_callback=_delivery_failed,
    )


def instrument(name: str, run_type: str = "tool"):
    return traceable(name=name, run_type=run_type, process_inputs=sanitize, process_outputs=sanitize)


def annotate(**metadata):
    run = get_current_run_tree()
    if run:
        run.add_metadata(sanitize(metadata))
        correlation = {k: v for k, v in metadata.items() if k in {"thread_id", "project_id"}}
        parent = run.parent_run
        while parent and correlation:
            parent.add_metadata(correlation)
            parent = parent.parent_run
        root = _http_run.get()
        if root and correlation:
            root.add_metadata(correlation)


def event(event_name: str, **details):
    run = get_current_run_tree()
    if run:
        run.add_event({"name": event_name, "kwargs": sanitize(details)})


def trace_id():
    run = get_current_run_tree()
    return str(run.trace_id) if run else None


def conversation_messages(*, inputs=None, outputs=None):
    """Give the HTTP root standard chat messages for LangSmith's thread viewer."""
    run = _http_run.get() or get_current_run_tree()
    if not run:
        return
    while run.parent_run:
        run = run.parent_run
    if inputs is not None:
        run.add_inputs({"messages": sanitize(inputs)})
    if outputs is not None:
        run.add_outputs({"messages": sanitize(outputs)})


def register_artifact(project_id: str, conversation_id: str | None = None):
    """Small local index links preview/download requests to the original build."""
    if not enabled() or not re.fullmatch(r"[\w-]+", project_id):
        return
    metadata = {"project_id": project_id, "build_trace_id": trace_id()}
    if conversation_id:
        metadata["thread_id"] = conversation_id
    try:
        ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
        (ARTIFACT_DIR / f"{project_id}.json").write_text(json.dumps(metadata), encoding="utf-8")
    except OSError:
        logger.warning("Could not save trace correlation for generated demo.")


def status() -> dict:
    return {"enabled": enabled(), "configured": bool(os.getenv("LANGSMITH_API_KEY")),
            "project": os.getenv("LANGSMITH_PROJECT", "demo-generator-v3"),
            "endpoint": os.getenv("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com"),
            "hideInputs": os.getenv("LANGSMITH_HIDE_INPUTS", "false").lower() == "true",
            "hideOutputs": os.getenv("LANGSMITH_HIDE_OUTPUTS", "false").lower() == "true",
            "lastDeliveryError": _delivery_error,
            "deliveryVerified": False}


def flush():
    if get_client.cache_info().currsize:
        try:
            get_client().flush(timeout=5)
        except Exception as exc:
            _delivery_failed(exc)


class LangSmithMiddleware:
    """ASGI span surrounds response completion and propagates to FastAPI workers."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        path = scope.get("path", "")
        # Preview assets are noisy; page visits and downloads are useful actions.
        tracked = path.startswith("/api/") and path != "/api/observability/status"
        if "/preview/" in path and not path.endswith(".html"):
            tracked = os.getenv("LANGSMITH_TRACE_ASSETS", "false").lower() == "true"
        if not enabled() or not tracked:
            with tracing_context(enabled=False):
                return await self.app(scope, receive, send)
        try:
            client = get_client()
        except Exception as exc:
            _delivery_failed(exc)
            with tracing_context(enabled=False):
                return await self.app(scope, receive, send)
        metadata = {"application": "demo-generator", "version": "3.0.0",
                    "environment": os.getenv("APP_ENV", "development"), "http_method": scope["method"]}
        conversation = re.match(r"/api/conversations/(chat-[a-f0-9]{32})(?:/|$)", path)
        project = re.match(r"/api/projects/([\w-]+)(?:/|$)", path)
        if conversation:
            metadata["thread_id"] = conversation[1]
        if project:
            metadata["project_id"] = project[1]
            try:
                metadata.update(json.loads((ARTIFACT_DIR / f"{project[1]}.json").read_text(encoding="utf-8")))
            except (OSError, ValueError):
                pass
        operation = re.sub(r"/(?:chat-[a-f0-9]{32}|(?:demo|direct|proj)-[a-f0-9]+)", "/{id}", path)
        with tracing_context(enabled=True, client=client,
                             project_name=os.getenv("LANGSMITH_PROJECT", "demo-generator-v3"),
                             metadata=metadata, tags=["demo-generator", "v3", metadata["environment"]]):
            with trace(f"HTTP {scope['method']} {operation}", inputs={"method": scope["method"], "path": path}) as run:
                root_token = _http_run.set(run)
                response_status = 500
                async def traced_send(message):
                    nonlocal response_status
                    if message["type"] == "http.response.start":
                        response_status = message["status"]
                        message = dict(message)
                        message["headers"] = list(message.get("headers", [])) + [(b"x-langsmith-trace-id", str(run.trace_id).encode())]
                    await send(message)
                try:
                    await self.app(scope, receive, traced_send)
                    run.end(outputs={"statusCode": response_status},
                            error=f"HTTP {response_status}" if response_status >= 400 else None)
                    # Messages are added in the route, after the root was posted.
                    try:
                        run.patch(exclude_inputs=False)
                    except Exception as exc:
                        _delivery_failed(exc)
                finally:
                    _http_run.reset(root_token)
