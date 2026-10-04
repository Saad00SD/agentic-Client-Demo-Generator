import os
from typing import Dict, Any
from backend.agents.state import DemoGenerationState
from backend.agents.llm_extractor import extract_client_config_from_prompt
from backend.models.client_config import ClientConfig
from backend.generator.engine import generate_demo

def receive_requirements_node(state: DemoGenerationState) -> DemoGenerationState:
    state["generation_status"] = "receiving_requirements"
    return state

def extract_client_requirements_node(state: DemoGenerationState) -> DemoGenerationState:
    state["generation_status"] = "extracting_requirements"
    if not state.get("client_config") and state.get("user_request"):
        extracted = extract_client_config_from_prompt(state["user_request"])
        state["client_config"] = extracted
    return state

def validate_requirements_node(state: DemoGenerationState) -> DemoGenerationState:
    state["generation_status"] = "validating_requirements"
    errors = []
    cfg = state.get("client_config", {})

    if not cfg.get("clientName"):
        errors.append("Client name is required.")
    if not cfg.get("platformName"):
        errors.append("Platform name is required.")

    state["validation_errors"] = errors
    if errors:
        state["generation_status"] = "requirements_invalid"
    else:
        state["generation_status"] = "requirements_valid"
    return state

def prepare_template_node(state: DemoGenerationState) -> DemoGenerationState:
    state["generation_status"] = "preparing_template"
    return state

def configure_branding_node(state: DemoGenerationState) -> DemoGenerationState:
    state["generation_status"] = "configuring_branding"
    return state

def configure_country_node(state: DemoGenerationState) -> DemoGenerationState:
    state["generation_status"] = "configuring_country"
    return state

def configure_languages_node(state: DemoGenerationState) -> DemoGenerationState:
    state["generation_status"] = "configuring_languages"
    return state

def configure_campaigns_node(state: DemoGenerationState) -> DemoGenerationState:
    state["generation_status"] = "configuring_campaigns"
    return state

def process_assets_node(state: DemoGenerationState) -> DemoGenerationState:
    state["generation_status"] = "processing_assets"
    return state

def generate_demo_node(state: DemoGenerationState) -> DemoGenerationState:
    state["generation_status"] = "generating_demo"
    res = generate_demo(
        client_config=state["client_config"],
        master_template_dir=state["template_path"],
        output_dir=state["output_path"],
        uploaded_assets=state.get("uploaded_assets")
    )
    state["zip_path"] = res.get("zip_path")
    state["report"] = res.get("validation")
    state["client_config"] = res.get("config")
    return state

def validate_demo_node(state: DemoGenerationState) -> DemoGenerationState:
    state["generation_status"] = "validating_demo"
    report = state.get("report", {})
    if report and not report.get("valid"):
        state["validation_errors"] = report.get("errors", [])
        state["generation_status"] = "validation_failed"
    else:
        state["generation_status"] = "validation_passed"
    return state

def package_demo_node(state: DemoGenerationState) -> DemoGenerationState:
    state["generation_status"] = "completed"
    return state
