"""Groq planning with validated configuration updates and no executable model output."""
import json
import os
from copy import deepcopy
from typing import Literal
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from pydantic import BaseModel, Field, ValidationError
from backend.models.client_config import ClientConfig
from backend.observability import annotate, event, instrument, sanitize
from langsmith import get_current_run_tree, trace, traceable


@traceable(name="groq.chat_completion", run_type="llm",
           process_inputs=lambda inputs: sanitize(inputs["payload"]), process_outputs=sanitize)
def groq_completion(payload: dict, attempt: int) -> dict:
    """One span per paid model attempt, including the provider's actual usage."""
    annotate(ls_provider="groq", ls_model_name=payload["model"], ls_model_type="chat",
             ls_temperature=payload.get("temperature"), attempt=attempt,
             ls_max_tokens=payload.get("max_completion_tokens"))
    request = Request("https://api.groq.com/openai/v1/chat/completions",
                      data=json.dumps(payload).encode(),
                      headers={"Authorization": f"Bearer {os.environ['GROQ_API_KEY']}",
                               "Content-Type": "application/json", "User-Agent": "DemoGenerator/3.0"})
    with urlopen(request, timeout=60) as response:
        result = json.load(response)
    usage = result.get("usage") or {}
    if "prompt_tokens" in usage and "completion_tokens" in usage:
        normalized = {"input_tokens": usage["prompt_tokens"], "output_tokens": usage["completion_tokens"],
                      "total_tokens": usage.get("total_tokens", usage["prompt_tokens"] + usage["completion_tokens"])}
        for source, target, kind in [("prompt_tokens_details", "input_token_details", "cached_tokens"),
                                     ("completion_tokens_details", "output_token_details", "reasoning_tokens")]:
            details = usage.get(source) or {}
            if kind in details:
                normalized[target] = {"cache_read" if kind == "cached_tokens" else "reasoning": details[kind]}
        # Optional explicit prices avoid assuming Groq charges another provider's rate.
        for side in ("input", "output"):
            price = os.getenv(f"GROQ_{side.upper()}_COST_PER_MILLION")
            if price:
                try:
                    from decimal import Decimal
                    rate = Decimal(price)
                    if rate.is_finite() and rate >= 0:
                        normalized[f"{side}_cost"] = float(rate * normalized[f"{side}_tokens"] / 1_000_000)
                except (ValueError, ArithmeticError):
                    event("invalid_cost_setting", side=side)
        if "input_cost" in normalized and "output_cost" in normalized:
            normalized["total_cost"] = normalized["input_cost"] + normalized["output_cost"]
        run = get_current_run_tree()
        if run:
            run.set(usage_metadata=normalized)
        result["usage_metadata"] = normalized
    annotate(groq_response_id=result.get("id"),
             groq_timings={k: usage[k] for k in ("queue_time", "prompt_time", "completion_time", "total_time") if k in usage})
    return result


class AgentError(Exception):
    pass


class AgentDecision(BaseModel):
    reply: str = Field(min_length=1, max_length=6000)
    action: Literal["ask", "update", "generate"]
    patch: dict = Field(default_factory=dict)


def merge_config(current: dict, patch: dict) -> dict:
    result = deepcopy(current)
    for key, value in patch.items():
        if isinstance(value, dict) and isinstance(result.get(key), dict):
            result[key] = merge_config(result[key], value)
        else:
            result[key] = value
    return result


def media_safe(config: dict, current: dict) -> dict:
    """The model can select template images, but cannot supply server file paths."""
    from pathlib import Path
    template = Path(__file__).resolve().parents[2] / "master-template"
    allowed = {str(p.relative_to(template)).replace("\\", "/") for p in (template / "assets").rglob("*") if p.is_file()}
    def collect(value):
        if isinstance(value, dict):
            for k, v in value.items():
                if k in {"logo", "img", "tileImage", "heroImage"} and isinstance(v, str):
                    allowed.add(v)
                collect(v)
        elif isinstance(value, list):
            for v in value:
                collect(v)
    collect(current)
    def check(value):
        if isinstance(value, dict):
            for k, v in value.items():
                if k in {"logo", "img", "tileImage", "heroImage"} and v and v not in allowed:
                    raise ValueError("Agent proposed an unavailable image")
                check(v)
        elif isinstance(value, list):
            for v in value:
                check(v)
    check(config)
    return config


@instrument("agent.plan_turn", "chain")
def plan_turn(config: dict, messages: list) -> tuple[AgentDecision, dict]:
    key = os.environ.get("GROQ_API_KEY")
    if not key:
        raise AgentError("Set GROQ_API_KEY in the backend .env and restart the backend.")
    # Images remain stored locally; text model receives references, never image bytes.
    image_refs = {}
    def redact(value):
        if isinstance(value, str) and value.startswith("data:"):
            token = f"uploaded-image:{len(image_refs)}"
            image_refs[token] = value
            return token
        if isinstance(value, dict):
            return {k: redact(v) for k, v in value.items()}
        if isinstance(value, list):
            return [redact(v) for v in value]
        return value
    system = """You are the demo-building agent for a client rewards website generator.
Return a JSON object with reply (friendly concise text), action (ask, update, generate),
and patch (only changed ClientConfig fields, recursive object merge, arrays replace).
Ask for missing clientName, platformName and country.name conversationally, one or two
questions per turn. Never invent these three required details. For other fields offer
sensible demo defaults; generate coherent country/currency/regions/branches/languages,
customer, brand colors, homepage copy and campaigns when asked to build. Explain assumptions.
Use generate only when the user asks to build/generate or approves your proposal and the
three required details are present. A normal revision uses update unless rebuild is requested.
Preserve all previous details and uploaded images unless explicitly changed. To preserve an
uploaded image omit its field from the patch or copy its exact uploaded-image:N reference.
When replacing campaign arrays preserve each campaign's uploaded-image:N references.
Do not claim to have viewed images.
Images may only reference existing template paths; do not invent paths, URLs or data URLs.
Never produce code or HTML. The template engine applies your configuration and validates it.
Do not claim generation has completed; the application runs that tool after your response.
Configuration schema: """ + json.dumps(ClientConfig.model_json_schema())
    history = [{"role": m["role"], "content": m["content"]} for m in messages[-24:]]
    payload = {"model": os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b"),
               "temperature": 0.2, "max_completion_tokens": 6000,
               "response_format": {"type": "json_object"},
               "messages": [{"role": "system", "content": system},
                            {"role": "system", "content": "Current stored configuration: " + json.dumps(redact(config))}] + history}
    def restore(value):
        if isinstance(value, str):
            return image_refs.get(value, value)
        if isinstance(value, dict):
            return {k: restore(v) for k, v in value.items()}
        if isinstance(value, list):
            return [restore(v) for v in value]
        return value
    for attempt in range(2):
        try:
            result = groq_completion(payload, attempt + 1)
            content = result["choices"][0]["message"]["content"]
        except HTTPError as exc:
            if exc.code == 429:
                raise AgentError("Groq is rate limited. Please wait a moment and retry.") from None
            raise AgentError(f"Groq request failed (HTTP {exc.code}). Check the backend key and GROQ_MODEL.") from None
        except (URLError, TimeoutError, OSError):
            raise AgentError("Could not reach Groq. Please retry shortly.") from None
        except (ValueError, KeyError, IndexError, TypeError):
            raise AgentError("Groq returned an unreadable response. Please retry.") from None
        try:
            with trace("agent.validate_decision", inputs={"attempt": attempt + 1}):
                decision = AgentDecision.model_validate_json(content)
                decision.patch = restore(decision.patch)
                merged = ClientConfig.model_validate(merge_config(config, decision.patch)).model_dump()
                media_safe(merged, config)
            annotate(agent_action=decision.action, attempts=attempt + 1, changed_fields=list(decision.patch))
            event("agent_decision", action=decision.action, patch=sanitize(decision.patch))
            return decision, merged
        except (ValidationError, ValueError, KeyError, TypeError):
            event("decision_validation_failed", attempt=attempt + 1, retry=attempt == 0)
            payload["messages"].append({"role": "user", "content": "Your response had invalid configuration or image references. Return corrected JSON following the schema and preserve uploaded images by omitting their fields."})
    raise AgentError("The agent returned invalid configuration. Your saved details are unchanged; please retry.")
