import os
import uuid
import shutil
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path

from backend.models.client_config import ClientConfig
from backend.agents.graph import demo_graph
from backend.agents.llm_extractor import extract_client_config_from_prompt
from backend.generator.engine import generate_demo

router = APIRouter(prefix="/api")

# In-memory store for project sessions
PROJECTS: Dict[str, Dict[str, Any]] = {}

BASE_DIR = Path(__file__).resolve().parent.parent.parent
MASTER_TEMPLATE_DIR = str(BASE_DIR / "master-template")
GENERATED_DIR = str(BASE_DIR / "generated")
UPLOADS_DIR = str(BASE_DIR / "uploads")

os.makedirs(GENERATED_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

@router.post("/projects")
async def create_project(data: Optional[Dict[str, Any]] = None):
    project_id = f"proj-{uuid.uuid4().hex[:8]}"
    client_config = data.get("clientConfig") if data else None

    PROJECTS[project_id] = {
        "id": project_id,
        "user_request": (data.get("userRequest") if data else ""),
        "client_config": client_config or ClientConfig().model_dump(),
        "uploaded_assets": {},
        "template_path": MASTER_TEMPLATE_DIR,
        "output_path": os.path.join(GENERATED_DIR, project_id),
        "validation_errors": [],
        "generation_status": "created",
        "zip_path": None,
        "report": None
    }

    return {"projectId": project_id, "status": "created", "project": PROJECTS[project_id]}

@router.post("/projects/{project_id}/requirements")
async def set_requirements(project_id: str, body: Dict[str, Any]):
    if project_id not in PROJECTS:
        raise HTTPException(status_code=404, detail="Project not found")

    user_prompt = body.get("prompt", "")
    if user_prompt:
        extracted = extract_client_config_from_prompt(user_prompt)
        PROJECTS[project_id]["user_request"] = user_prompt
        PROJECTS[project_id]["client_config"] = extracted
    elif body.get("clientConfig"):
        PROJECTS[project_id]["client_config"] = body["clientConfig"]

    return {"projectId": project_id, "clientConfig": PROJECTS[project_id]["client_config"]}

@router.post("/projects/{project_id}/assets")
async def upload_asset(
    project_id: str,
    asset_type: str = Form("logo"),
    file: UploadFile = File(...)
):
    if project_id not in PROJECTS:
        raise HTTPException(status_code=404, detail="Project not found")

    proj_upload_dir = Path(UPLOADS_DIR) / project_id
    os.makedirs(proj_upload_dir, exist_ok=True)

    safe_filename = re_sub_filename(file.filename or "upload.bin")
    file_path = proj_upload_dir / safe_filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    PROJECTS[project_id]["uploaded_assets"][asset_type] = str(file_path)

    return {
        "projectId": project_id,
        "assetType": asset_type,
        "filename": safe_filename,
        "path": str(file_path)
    }

@router.post("/projects/{project_id}/generate")
async def generate_project(project_id: str):
    if project_id not in PROJECTS:
        raise HTTPException(status_code=404, detail="Project not found")

    state = PROJECTS[project_id]
    state["generation_status"] = "running"

    # Execute LangGraph workflow
    final_state = demo_graph.invoke(state)

    PROJECTS[project_id] = final_state

    return {
        "projectId": project_id,
        "status": final_state.get("generation_status"),
        "report": final_state.get("report"),
        "errors": final_state.get("validation_errors", []),
        "previewUrl": f"/api/projects/{project_id}/preview/index.html",
        "downloadUrl": f"/api/projects/{project_id}/download"
    }

@router.post("/generate-direct")
async def generate_direct(body: Dict[str, Any]):
    project_id = f"direct-{uuid.uuid4().hex[:8]}"
    client_config = body.get("clientConfig")
    user_request = body.get("userRequest", "")

    if user_request and not client_config:
        client_config = extract_client_config_from_prompt(user_request)

    if not client_config:
        client_config = ClientConfig().model_dump()

    output_dir = os.path.join(GENERATED_DIR, project_id)

    res = generate_demo(
        client_config=client_config,
        master_template_dir=MASTER_TEMPLATE_DIR,
        output_dir=output_dir,
        uploaded_assets=body.get("uploadedAssets")
    )

    PROJECTS[project_id] = {
        "id": project_id,
        "user_request": user_request,
        "client_config": res["config"],
        "output_path": output_dir,
        "generation_status": "completed",
        "zip_path": res["zip_path"],
        "report": res["validation"]
    }

    return {
        "projectId": project_id,
        "status": "completed",
        "validation": res["validation"],
        "previewUrl": f"/api/projects/{project_id}/preview/index.html",
        "downloadUrl": f"/api/projects/{project_id}/download"
    }

@router.get("/projects/{project_id}/status")
async def get_status(project_id: str):
    if project_id not in PROJECTS:
        raise HTTPException(status_code=404, detail="Project not found")

    proj = PROJECTS[project_id]
    return {
        "projectId": project_id,
        "status": proj.get("generation_status"),
        "config": proj.get("client_config"),
        "report": proj.get("report"),
        "errors": proj.get("validation_errors", []),
        "previewUrl": f"/api/projects/{project_id}/preview/index.html" if proj.get("output_path") else None,
        "downloadUrl": f"/api/projects/{project_id}/download" if proj.get("zip_path") else None
    }

@router.get("/projects/{project_id}/preview/{file_path:path}")
async def preview_file(project_id: str, file_path: str):
    proj_dir = Path(GENERATED_DIR) / project_id
    if not proj_dir.exists():
        raise HTTPException(status_code=404, detail="Project output not found")

    target_file = (proj_dir / file_path).resolve()

    # Prevent path traversal outside project directory
    if not str(target_file).startswith(str(proj_dir)):
        raise HTTPException(status_code=403, detail="Access denied: path traversal detected")

    if not target_file.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

    return FileResponse(str(target_file))

@router.get("/projects/{project_id}/download")
async def download_project_zip(project_id: str):
    zip_path = Path(GENERATED_DIR) / f"{project_id}.zip"
    if not zip_path.exists():
        # Check if project exists and generate zip on demand if needed
        proj_dir = Path(GENERATED_DIR) / project_id
        if proj_dir.exists():
            from backend.services.packaging_service import package_demo_to_zip
            package_demo_to_zip(str(proj_dir), str(zip_path))
        else:
            raise HTTPException(status_code=404, detail="Project zip archive not found")

    return FileResponse(
        path=str(zip_path),
        filename=f"{project_id}-client-demo.zip",
        media_type="application/zip"
    )

def re_sub_filename(name: str) -> str:
    import re
    clean = os.path.basename(name)
    return re.sub(r'[^a-zA-Z0-9_\.\-]', '_', clean)
