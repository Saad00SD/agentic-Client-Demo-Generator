import io
import zipfile

from fastapi.testclient import TestClient

from backend.api import routes
from backend.main import app


def test_generate_preview_and_download_after_session_reset(tmp_path, monkeypatch):
    monkeypatch.setattr(routes, "GENERATED_DIR", str(tmp_path))
    monkeypatch.setattr(routes, "PROJECTS", {})
    with TestClient(app) as client:
        assert client.get("/health").json()["status"] == "ok"
        response = client.post("/api/generate-direct", json={"clientConfig": {
            "clientName": "Deployment Check", "platformName": "Rewards",
            "homepage": {"title": "Ready to launch", "description": "Your rewards"},
        }})
        assert response.status_code == 200
        result = response.json()
        assert result["validation"]["valid"], result["validation"]
        routes.PROJECTS.clear()
        preview = client.get(result["previewUrl"])
        assert preview.status_code == 200
        assert "Ready to launch" in preview.text
        assert client.get(result["previewUrl"].replace("index.html", "assets/app.css")).status_code == 200
        download = client.get(result["downloadUrl"])
        assert download.status_code == 200
        with zipfile.ZipFile(io.BytesIO(download.content)) as archive:
            assert "index.html" in archive.namelist()


def test_preview_cannot_read_sibling_project(tmp_path, monkeypatch):
    monkeypatch.setattr(routes, "GENERATED_DIR", str(tmp_path))
    (tmp_path / "demo").mkdir()
    (tmp_path / "demo-private").mkdir()
    (tmp_path / "demo-private" / "secret.txt").write_text("private")
    with TestClient(app) as client:
        response = client.get("/api/projects/demo/preview/%2e%2e%2fdemo-private%2fsecret.txt")
        assert response.status_code == 403
