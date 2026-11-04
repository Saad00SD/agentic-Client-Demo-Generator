"""Run `uv run python -m backend.check_tracing` to verify LangSmith delivery."""
import time
import uuid
import warnings

from dotenv import load_dotenv
from langsmith import trace, tracing_context

from backend.observability import enabled, get_client, status


def main() -> int:
    load_dotenv()
    settings = status()
    if not enabled():
        print("Set LANGSMITH_TRACING=true and LANGSMITH_API_KEY in .env first.")
        return 1
    try:
        client = get_client()
        with tracing_context(enabled=True, client=client, project_name=settings["project"],
                             tags=["demo-generator", "connection-check"],
                             metadata={"application": "demo-generator", "thread_id": "check-" + uuid.uuid4().hex}):
            with trace("demo-generator.connection-check", inputs={"message": "Verify LangSmith trace delivery"}) as run:
                run.end(outputs={"connected": True})
        client.flush(timeout=10)
        # Ingestion can become visible shortly after the write has completed.
        stored = None
        for attempt in range(4):
            try:
                # The synchronous API also works against older/self-hosted servers.
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore", DeprecationWarning)
                    stored = client.read_run(run.id)
                break
            except Exception:
                if attempt == 3:
                    raise
                time.sleep(1)
        print("LangSmith delivery verified.")
        print("Project:", settings["project"])
        print("Trace ID:", stored.id)
        print("Open https://smith.langchain.com and select this tracing project.")
        return 0
    except Exception as exc:
        print(f"LangSmith check failed ({type(exc).__name__}). Check your API key, endpoint, workspace and network access.")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
