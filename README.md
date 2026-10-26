# Client Demo Generator

A Next.js dashboard and FastAPI backend that generate branded demo websites from `master-template/`. Enter client details, upload and crop images, generate a demo, preview it, and download its ZIP.

## Run locally

Requires Python 3.13+, uv, and Node.js 22.

From the project root:

```sh
uv sync --locked
uv run uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

In another terminal:

```sh
cd frontend
npm ci
npm run dev
```

Open http://localhost:3000. Next.js forwards `/api` requests to the backend, including previews and downloads. No API key is needed for the dashboard's form-based generation.

## Deploy with Docker

Requires Docker Engine and the Docker Compose plugin on the deployment server.

```sh
docker compose up -d --build
```

Open `http://YOUR_SERVER:3000`. Set `APP_PORT` in a root `.env` file to change the published port. Point your domain and HTTPS reverse proxy at that port. Only the frontend is published; it forwards API requests to the backend through the private Docker network.

```sh
docker compose logs -f
# Rebuild after updating the source:
docker compose up -d --build
# Stop while retaining saved demos:
docker compose down
```

Generated demos and uploads persist in named Docker volumes. Back these up before replacing the server. Existing local `generated/` and `uploads/` folders are not automatically imported into those volumes. Project sessions are held in memory; previously generated preview and ZIP URLs continue working after a restart because their files persist. Run one backend process while using the session-based API.

For separate hosting, set `BACKEND_URL` in the frontend build environment to the backend's reachable URL before running `npm run build`. The Docker build also accepts it as a build argument. It defaults to `http://127.0.0.1:8000` outside Compose. Set backend `CORS_ORIGINS` as a comma-separated list if accessing the API directly from a different origin. Generation needs writable, persistent `generated/` and `uploads/` directories beside `backend/`.

For a local production run, start the backend without `--reload`, then run `npm run build` and `npm start` from `frontend/`.

## Checks

```sh
uv run pytest tests -q
node --test tests/client-branding.test.cjs
cd frontend
npm run lint
npm run build
```

## Files

- `frontend/`: dashboard, image editor, and demo preview.
- `backend/`: API, generation workflow, asset processing, validation, and ZIP packaging.
- `master-template/`: required source pages, scripts, styles, images, fonts, and translations. Generated demos depend on these files.
- `tests/`: generator, API, and template behavior checks.
- `pyproject.toml`, `uv.lock`, `frontend/package-lock.json`: dependency definitions and locks.
- `compose.yaml`, Dockerfiles, and `.dockerignore` files: deployment configuration.

Local `.env`, `.venv/`, `frontend/node_modules/`, `.next/`, caches, generated demos, and uploads are excluded from version control or container build contexts. Keep secrets out of source control.
