from typing import TypedDict, List, Dict, Any, Optional

class DemoGenerationState(TypedDict):
    user_request: str
    client_config: Dict[str, Any]
    uploaded_assets: Dict[str, str]
    template_path: str
    output_path: str
    validation_errors: List[str]
    generation_status: str
    zip_path: Optional[str]
    report: Optional[Dict[str, Any]]
