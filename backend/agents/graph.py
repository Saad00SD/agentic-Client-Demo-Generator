from langgraph.graph import StateGraph, START, END
from backend.agents.state import DemoGenerationState
from backend.agents.nodes import (
    receive_requirements_node,
    extract_client_requirements_node,
    validate_requirements_node,
    prepare_template_node,
    configure_branding_node,
    configure_country_node,
    configure_languages_node,
    configure_campaigns_node,
    process_assets_node,
    generate_demo_node,
    validate_demo_node,
    package_demo_node
)

def route_after_validation(state: DemoGenerationState) -> str:
    if state.get("generation_status") == "requirements_invalid":
        return "END"
    return "prepare_template"

def route_after_demo_validation(state: DemoGenerationState) -> str:
    return "package_demo"

def build_demo_generation_graph():
    builder = StateGraph(DemoGenerationState)

    builder.add_node("receive_requirements", receive_requirements_node)
    builder.add_node("extract_client_requirements", extract_client_requirements_node)
    builder.add_node("validate_requirements", validate_requirements_node)
    builder.add_node("prepare_template", prepare_template_node)
    builder.add_node("configure_branding", configure_branding_node)
    builder.add_node("configure_country", configure_country_node)
    builder.add_node("configure_languages", configure_languages_node)
    builder.add_node("configure_campaigns", configure_campaigns_node)
    builder.add_node("process_assets", process_assets_node)
    builder.add_node("generate_demo", generate_demo_node)
    builder.add_node("validate_demo", validate_demo_node)
    builder.add_node("package_demo", package_demo_node)

    # Sequence edges
    builder.add_edge(START, "receive_requirements")
    builder.add_edge("receive_requirements", "extract_client_requirements")
    builder.add_edge("extract_client_requirements", "validate_requirements")

    builder.add_conditional_edges(
        "validate_requirements",
        route_after_validation,
        {
            "prepare_template": "prepare_template",
            "END": END
        }
    )

    builder.add_edge("prepare_template", "configure_branding")
    builder.add_edge("configure_branding", "configure_country")
    builder.add_edge("configure_country", "configure_languages")
    builder.add_edge("configure_languages", "configure_campaigns")
    builder.add_edge("configure_campaigns", "process_assets")
    builder.add_edge("process_assets", "generate_demo")
    builder.add_edge("generate_demo", "validate_demo")

    builder.add_conditional_edges(
        "validate_demo",
        route_after_demo_validation,
        {
            "package_demo": "package_demo"
        }
    )

    builder.add_edge("package_demo", END)

    return builder.compile()

# Singleton graph instance
demo_graph = build_demo_generation_graph()
