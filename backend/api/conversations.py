"""Persistent chat projects. Session metadata lives outside generated preview files."""
import base64
import json
import re
import threading
import uuid
from copy import deepcopy
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.agents.chat_agent import AgentError, plan_turn
from backend.agents.graph import demo_graph
from backend.models.client_config import ClientConfig
from backend.observability import annotate, conversation_messages, event, instrument, register_artifact, trace_id

router = APIRouter(prefix="/api/conversations")
ROOT = Path(__file__).resolve().parents[2]
SESSION_DIR = ROOT / "uploads" / "conversations"
GENERATED_DIR = ROOT / "generated"
LOCK = threading.RLock()


class Attachment(BaseModel):
    target: str = Field(pattern=r"^(logo|hero|campaign_\d+)$")
    name: str = Field(max_length=200)
    data: str = Field(max_length=7_000_000)


class ChatTurn(BaseModel):
    message: str = Field(default="", max_length=12000)
    attachments: list[Attachment] = Field(default_factory=list, max_length=5)


class SaveConfig(BaseModel):
    clientConfig: ClientConfig


def session_path(session_id: str) -> Path:
    if not re.fullmatch(r"chat-[a-f0-9]{32}", session_id):
        raise HTTPException(404, "Conversation not found")
    return SESSION_DIR / f"{session_id}.json"


@instrument("session.load")
def read_session(session_id: str) -> dict:
    path = session_path(session_id)
    if not path.is_file():
        raise HTTPException(404, "Conversation not found")
    return json.loads(path.read_text(encoding="utf-8"))


@instrument("session.save")
def save_session(session: dict):
    SESSION_DIR.mkdir(parents=True, exist_ok=True)
    path = session_path(session["id"])
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(session, ensure_ascii=False), encoding="utf-8")
    temporary.replace(path)


def missing(config: dict) -> list[str]:
    return [name for name, value in [("client name", config["clientName"]),
            ("platform name", config["platformName"]), ("country", config["country"]["name"])] if not value.strip()]


@instrument("demo.build")
def build(session: dict):
    required = missing(session["config"])
    if required:
        raise HTTPException(422, "Please add " + ", ".join(required) + " before generating.")
    # Each build owns a fresh output directory, preserving media and previous previews.
    project_id = f"demo-{uuid.uuid4().hex[:16]}"
    annotate(project_id=project_id, thread_id=session["id"], client_name=session["config"]["clientName"])
    state = {"client_config": deepcopy(session["config"]), "user_request": "",
             "uploaded_assets": {}, "template_path": str(ROOT / "master-template"),
             "output_path": str(GENERATED_DIR / project_id), "validation_errors": [],
             "generation_status": "running", "zip_path": None, "report": None}
    logs = []
    for updates in demo_graph.stream(state, config={"metadata": {"thread_id": session["id"], "project_id": project_id},
                                                  "tags": ["demo-generation"]}, stream_mode="updates"):
        for node, update in updates.items():
            logs.append(node.replace("_", " "))
            state.update(update)
    report = state.get("report") or {}
    result = {"projectId": project_id, "status": "completed" if report.get("valid") else "validation_failed",
              "previewUrl": f"/api/projects/{project_id}/preview/index.html",
              "downloadUrl": f"/api/projects/{project_id}/download", "validation": report,
              "executionLog": logs}
    if trace_id():
        result["traceId"] = trace_id()
    annotate(validation_valid=report.get("valid"), validation_error_count=len(report.get("errors", [])),
             validation_warning_count=len(report.get("warnings", [])))
    event("generation_validation", report=report)
    register_artifact(project_id, session["id"])
    session["result"] = result
    session["dirty"] = False
    session["messages"].append({"role": "assistant", "content":
        "Your demo is ready. Preview it below, edit the details, or tell me what to change."
        if report.get("valid") else "The demo was built, but validation found issues. Review the report before using it."})
    save_session(session)


@router.post("")
@instrument("conversation.create", "chain")
def create_conversation():
    config = ClientConfig().model_dump()
    config.update(clientName="", platformName="")
    config["country"]["name"] = ""
    session = {"id": "chat-" + uuid.uuid4().hex, "config": config,
               "messages": [{"role": "assistant", "content": "Let's build your client demo. Who is the client, what should the platform be called, and which country is it for? You can attach a logo and images as we go."}],
               "result": None, "dirty": True}
    annotate(thread_id=session["id"])
    with LOCK:
        save_session(session)
    return session


@router.get("/{session_id}")
@instrument("conversation.restore", "chain")
def get_conversation(session_id: str):
    with LOCK:
        return read_session(session_id)


@router.put("/{session_id}/config")
@instrument("conversation.edit_details", "chain")
def save_config(session_id: str, body: SaveConfig):
    with LOCK:
        session = read_session(session_id)
        next_config = body.clientConfig.model_dump()
        changed = {key: {"before": session["config"].get(key), "after": value}
                   for key, value in next_config.items() if session["config"].get(key) != value}
        event("manual_config_edit", changes=changed)
        annotate(changed_fields=list(changed))
        session["config"] = next_config
        session["dirty"] = True
        save_session(session)
        return session


@router.post("/{session_id}/generate")
@instrument("conversation.generate", "chain")
def generate(session_id: str):
    with LOCK:
        session = read_session(session_id)
        conversation_messages(inputs=[{"role": "user", "content": "Generate demo from the stored details."}])
        required = missing(session["config"])
        if required:
            raise HTTPException(422, "Please add " + ", ".join(required) + " before generating.")
        if not session["result"]:
            try:
                decision, config = plan_turn(session["config"], session["messages"] + [{
                    "role": "user", "content": "Generate the demo now with my stored details. Fill in coherent demo content and country defaults where needed; preserve all details and images I supplied."}])
            except AgentError as exc:
                raise HTTPException(502, str(exc)) from None
            session["config"] = config
            session["messages"].append({"role": "assistant", "content": decision.reply})
            save_session(session)
        try:
            build(session)
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(500, "Generation failed. Your details are saved; please retry.") from None
        conversation_messages(outputs=[session["messages"][-1]])
        return session


@router.post("/{session_id}/messages")
@instrument("conversation.chat_turn", "chain")
def send_message(session_id: str, body: ChatTurn):
    if not body.message.strip() and not body.attachments:
        raise HTTPException(422, "Enter a message or attach an image.")
    with LOCK:
        session = read_session(session_id)
        annotate(turn_number=sum(m["role"] == "user" for m in session["messages"]) + 1,
                 attachment_count=len(body.attachments))
        draft = deepcopy(session["config"])
        for asset in body.attachments:
            try:
                header, encoded = asset.data.split(",", 1)
                if header not in {"data:image/png;base64", "data:image/jpeg;base64", "data:image/webp;base64", "data:image/svg+xml;base64"}:
                    raise ValueError()
                raw = base64.b64decode(encoded, validate=True)
                if not raw or len(raw) > 5 * 1024 * 1024:
                    raise ValueError()
            except (ValueError, TypeError):
                raise HTTPException(422, "Images must be PNG, JPEG, WebP or SVG, up to 5 MB.") from None
            if asset.target == "logo":
                draft["branding"]["logo"] = asset.data
            elif asset.target == "hero":
                draft["homepage"]["heroImage"] = asset.data
            else:
                index = int(asset.target.split("_")[1])
                if index >= len(draft["campaigns"]):
                    raise HTTPException(422, "Add that campaign before attaching its image.")
                draft["campaigns"][index].update(img=asset.data, tileImage=asset.data, heroImage=asset.data)
            event("image_attached", target=asset.target, name=asset.name, mime_type=header, bytes=len(raw))
        content = body.message.strip()
        if body.attachments:
            content += "\nAttached: " + ", ".join(f"{a.name} ({a.target})" for a in body.attachments)
        messages = session["messages"] + [{"role": "user", "content": content}]
        reply_start = len(messages)
        conversation_messages(inputs=[messages[-1]])
        try:
            decision, config = plan_turn(draft, messages)
        except AgentError as exc:
            raise HTTPException(502, str(exc)) from None
        session.update(config=config, messages=messages, dirty=True)
        annotate(agent_action=decision.action, changed_fields=[k for k in config if config[k] != draft.get(k)])
        session["messages"].append({"role": "assistant", "content": decision.reply})
        save_session(session)
        if decision.action == "generate" and not missing(config):
            try:
                build(session)
            except Exception:
                raise HTTPException(500, "Your chat and details are saved, but generation failed. Use Generate demo to retry.") from None
        conversation_messages(outputs=session["messages"][reply_start:])
        return session
