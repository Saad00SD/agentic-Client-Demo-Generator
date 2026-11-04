# Using LangSmith with Demo Generator v3.0

## Setup

The backend reads the root `.env`. Your existing LangSmith settings are preserved.
Set these values, replacing the placeholder with a key from your LangSmith workspace:

```dotenv
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=your-langsmith-api-key
LANGSMITH_PROJECT=client-demo-generator
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
APP_ENV=development
```

Use the endpoint provided by your LangSmith workspace if it is in another region
or self-hosted. Set `LANGSMITH_WORKSPACE_ID` if your API key requires an explicit workspace.
Keep these values on the backend; do not prefix secret keys with `NEXT_PUBLIC_`.

From the repository root:

```powershell
uv sync --locked
uv run python -m backend.check_tracing
uv run uvicorn backend.main:app --reload
```

The check uploads a small synthetic `demo-generator.connection-check` trace, flushes
the SDK queue, and reads it back. It prints the project and trace ID without showing
the API key. Restart the backend after changing `.env`. Docker Compose already
passes `.env` to the backend; recreate the backend container to apply changes.

Start the frontend as usual with `npm run dev` inside `frontend`.

## View a conversation and its generation

1. Open the app, create a new demo, and send a client brief. Upload an image, ask
   for generation, revise a detail, rebuild, and download the ZIP.
2. Open [LangSmith](https://smith.langchain.com). Select the workspace for your key,
   then **Tracing Projects** under Observability, and open `client-demo-generator`
   (or the value of `LANGSMITH_PROJECT`).
3. Open the most recent `HTTP POST /api/conversations/{id}/messages` trace.
   Expand its children to inspect `conversation.chat_turn`, `agent.plan_turn`,
   `groq.chat_completion`, decision validation, session storage, and any build.
4. Select `groq.chat_completion` to see the actual prompts, completion JSON,
   model/provider, attempt number, token usage, reasoning/cache token details when
   Groq supplies them, Groq timings, and latency. Each retry is a separate LLM run.
5. Use the **Threads** view to group turns by `metadata.thread_id`. The thread ID is
   the app's conversation ID, and is also present on child runs and graph nodes.
   HTTP roots include structured input/output messages for the conversation viewer.
6. Expand **Generation steps and validation** in the app to copy its build trace ID
   and conversation ID. Use these to match the build to traces and thread metadata.
   API responses also include the `X-LangSmith-Trace-Id` response header.

Typical trace structure:

```text
HTTP POST /api/conversations/{id}/messages
  conversation.chat_turn
    session.load
    agent.plan_turn
      groq.chat_completion                 [LLM; usage and model metadata]
      agent.validate_decision              [failed attempt visible if retried]
    session.save
    demo.build                             [when generation is requested]
      LangGraph
        receive_requirements, extract_client_requirements, ...
        generate_demo
          template.generate_demo
            template.copy_master
            assets.prepare_logo / assets.save_image / assets.copy
            localization.generate
            validation.check_demo
            packaging.create_zip
      session.save
```

Some graph nodes currently update orchestration status; the `template.*`, `assets.*`,
localization, validation and packaging child spans measure the actual operations.

## What is recorded

| Operation | Useful trace data |
| --- | --- |
| Chat and agent | Messages, saved configuration, proposed patch, ask/update/generate decision, turn number, retries and errors |
| Groq | Model, provider, request settings, prompts, completions, provider token counts and timings |
| Images | File name, intended role, MIME type, byte count and processing duration; image bytes are masked |
| Manual edits | Changed fields and before/after values in the `manual_config_edit` event |
| Generation | Graph nodes, real tool spans, campaign/page counts, ZIP size, validation report and warning/error counts |
| Sessions | Load/save duration and sanitized configuration snapshots |
| Preview/download | HTTP duration, status, project ID, original build trace ID and conversation thread when available |
| Failures | HTTP error status, failing child span, traceback, validation retry events and provider errors |

The artifact correlation index is stored in `uploads/observability/`, outside the
generated website and ZIP. It lets later preview/download requests join the original
conversation even after a backend restart. Legacy generation endpoints are traced too.

Static preview assets such as CSS and image requests are skipped to keep normal
traces readable. Set `LANGSMITH_TRACE_ASSETS=true` to include them. Browser-only actions
such as typing or cropping before saving do not issue backend requests; their resulting
details are traced when sent or saved. This integration does not collect browser
performance metrics or operating-system metrics. LLM responses are not streamed, so
time-to-first-token is not measured.

## Tokens and costs

Token counts come from Groq's response; they are not estimated. Missing usage is left
unknown. `ls_provider=groq` and `ls_model_name` identify the actual hosted model.

For cost totals, configure the matching provider/model in LangSmith's model pricing
table using your current Groq rates. Alternatively set both optional backend values:

```dotenv
# USD per million tokens for the currently selected GROQ_MODEL:
GROQ_INPUT_COST_PER_MILLION=your-input-rate
GROQ_OUTPUT_COST_PER_MILLION=your-output-rate
```

Replace those placeholders with nonnegative numeric rates. Explicit costs use
`tokens * rate / 1,000,000` per attempt. They are estimates for simple input/output
pricing; use LangSmith's pricing table for cache-specific or other detailed pricing.
No Groq prices are hardcoded. Update the rates when changing models. Retries consume
tokens and appear as separate billable calls.

## Monitoring and improving the agent

Use the project's monitoring views to inspect request volume, latency, error rate,
token usage and costs. Filter by `environment`, `agent_action`, `project_id`,
`thread_id`, `ls_model_name`, or the `demo-generator`, `v3` and environment tags.
Agent actions are on `agent.plan_turn` / `conversation.chat_turn`; validation summaries
are on `demo.build` and `template.generate_demo`.

You can manually annotate traces with feedback and add representative LLM/agent runs
to a LangSmith dataset for later evaluations. No paid evaluators, online evaluation
rules, alerts or external judge models are enabled automatically. Those are separate
LangSmith workspace features you can configure from the recorded traces.

## Data controls and troubleshooting

Client messages and configuration text are logged by default. Keys, binary buffers,
and data-URL payloads are masked before upload, including graph inputs/outputs and
exception strings. Stored application configuration is unchanged. If you also need
to hide textual trace payloads, set `LANGSMITH_HIDE_INPUTS=true` and/or
`LANGSMITH_HIDE_OUTPUTS=true`, then restart. Custom event/metadata fields such as manual
edit events remain visible, with secrets and image bytes masked. To send no traces,
set `LANGSMITH_TRACING=false`.

`GET /api/observability/status` reports whether tracing is enabled/configured, the
project and endpoint, input/output hiding settings, and the last delivery error type
observed in this process. It never returns credentials. Configuration status is not a
connectivity test; run `uv run python -m backend.check_tracing` to verify delivery.

If traces do not appear, check the selected workspace/project and date filter, then
verify key permissions, endpoint region, workspace ID and outbound HTTPS access.
SDK delivery runs in the background and is flushed on graceful backend shutdown.
Delivery failures are logged and do not stop demo requests; a failed backend status
or application error is recorded as an errored trace when LangSmith is reachable.

Official references: [custom LLM tracing](https://docs.langchain.com/langsmith/log-llm-trace),
[threads](https://docs.langchain.com/langsmith/threads),
[cost tracking](https://docs.langchain.com/langsmith/cost-tracking), and
[input/output masking](https://docs.langchain.com/langsmith/mask-inputs-outputs).
