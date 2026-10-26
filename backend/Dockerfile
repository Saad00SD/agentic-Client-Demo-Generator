FROM ghcr.io/astral-sh/uv:0.9.7 AS uv
FROM python:3.13-slim
COPY --from=uv /uv /usr/local/bin/uv
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UV_LINK_MODE=copy
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev --no-install-project
COPY backend ./backend
COPY master-template ./master-template
RUN useradd --uid 10001 --create-home appuser && mkdir -p generated uploads && chown -R appuser:appuser /app
USER appuser
EXPOSE 8000
CMD ["/app/.venv/bin/uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
