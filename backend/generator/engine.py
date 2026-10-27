import os
import json
import re
from html import escape
from pathlib import Path
from typing import Dict, Any, Optional

from backend.models.client_config import ClientConfig
from backend.services.template_service import copy_master_template
from backend.services.asset_service import copy_asset, save_data_url_asset, save_logo_as_svg
from backend.services.localization_service import generate_locales
from backend.services.validation_service import validate_generated_demo, ValidationReport
from backend.services.packaging_service import package_demo_to_zip
from backend.observability import instrument, annotate

@instrument("template.generate_demo")
def generate_demo(
    client_config: Any,
    master_template_dir: str,
    output_dir: str,
    uploaded_assets: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:

    # 1. Parse and validate config model
    if isinstance(client_config, dict):
        config_obj = ClientConfig(**client_config)
    elif isinstance(client_config, ClientConfig):
        config_obj = client_config
    else:
        raise ValueError("Invalid client_config type provided.")

    config_dict = config_obj.model_dump()

    # 2. Copy Master Template
    target_dir = copy_master_template(master_template_dir, output_dir)
    target_path = Path(target_dir)

    # 3. Handle logo & campaign assets (Data URLs or file uploads)
    branding_logo = config_dict.get("branding", {}).get("logo", "")
    if branding_logo and branding_logo.startswith("data:"):
        dest_logo = save_logo_as_svg(branding_logo, str(target_path / "assets" / "client"))
        config_dict["branding"]["logo"] = f"assets/client/{os.path.basename(dest_logo)}"
    elif uploaded_assets and "logo" in uploaded_assets and os.path.exists(uploaded_assets["logo"]):
        dest_logo = save_logo_as_svg(uploaded_assets["logo"], str(target_path / "assets" / "client"))
        config_dict["branding"]["logo"] = f"assets/client/{os.path.basename(dest_logo)}"

    homepage = config_dict["homepage"]
    homepage["heroImage"] = homepage["heroImage"] or "assets/img/handover-keys.jpg"
    hero_image = homepage["heroImage"]
    if hero_image.startswith("data:"):
        saved_image = save_data_url_asset(hero_image, str(target_path / "assets" / "homepage"), "hero")
        homepage["heroImage"] = f"assets/homepage/{os.path.basename(saved_image)}"
    home_path = target_path / "index.html"
    home_html = home_path.read_text(encoding="utf-8")
    home_html = re.sub(r"(<h1[^>]*>).*?(</h1>)", lambda m: m[1] + escape(homepage["title"]) + m[2], home_html, count=1, flags=re.S)
    home_html = re.sub(r'(<p class="hero-lede">).*?(</p>)', lambda m: m[1] + escape(homepage["description"]) + m[2], home_html, count=1, flags=re.S)
    home_html = re.sub(r'(<div class="hero-media"><img src=")[^"]*', lambda m: m[1] + escape(homepage["heroImage"], quote=True), home_html, count=1)
    home_path.write_text(home_html, encoding="utf-8")

    campaigns = config_dict.get("campaigns", [])
    detail_pages = ["first-time-fix.html", "service-league.html", "genuine-parts.html", "ev-service-ready.html", "next-service-booked.html"]
    for idx, camp in enumerate(campaigns):
        # Each campaign owns a page, including campaigns beyond the five layouts.
        template_page = detail_pages[idx % len(detail_pages)]
        page_html = (target_path / template_page).read_text(encoding="utf-8")
        camp["href"] = f"campaign-{idx + 1}.html"
        page_html = re.sub(r"(<h1[^>]*>).*?(</h1>)", lambda m: m[1] + escape(camp["name"]) + m[2], page_html, count=1, flags=re.S)
        page_html = re.sub(r'(<p class="cam-lede">).*?(</p>)', lambda m: m[1] + escape(camp["blurb"]) + m[2], page_html, count=1, flags=re.S)
        (target_path / camp["href"]).write_text(page_html, encoding="utf-8")
        img_val = camp.get("img", "")
        key = f"campaign_{idx}"
        if img_val and img_val.startswith("data:"):
            dest_img = save_data_url_asset(img_val, str(target_path / "assets" / "campaigns"), f"campaign_{idx+1}")
            rel_path = f"assets/campaigns/{os.path.basename(dest_img)}"
            camp["img"] = rel_path
            camp["tileImage"] = rel_path
            if camp.get("heroImage") == img_val:
                camp["heroImage"] = rel_path
        elif uploaded_assets and key in uploaded_assets and os.path.exists(uploaded_assets[key]):
            dest_img = copy_asset(uploaded_assets[key], str(target_path / "assets" / "campaigns"))
            rel_path = f"assets/campaigns/{os.path.basename(dest_img)}"
            camp["img"] = rel_path
            camp["tileImage"] = rel_path
            if camp.get("heroImage") == img_val:
                camp["heroImage"] = rel_path

    # Apply browser-tab branding to every generated page, including campaign pages.
    favicon = config_dict.get("branding", {}).get("logo", "")
    if branding_logo.startswith("data:") and not branding_logo.startswith("data:image/svg+xml"):
        # Keep raster icons native: browser favicons cannot reliably render embedded SVG images.
        favicon_path = save_data_url_asset(branding_logo, str(target_path / "assets" / "client"), "favicon")
        favicon = f"assets/client/{os.path.basename(favicon_path)}"
    elif uploaded_assets and "logo" in uploaded_assets:
        uploaded_logo = uploaded_assets["logo"]
        if os.path.exists(uploaded_logo) and Path(uploaded_logo).suffix.lower() != ".svg":
            favicon_path = copy_asset(uploaded_logo, str(target_path / "assets" / "client"), "favicon" + Path(uploaded_logo).suffix.lower())
            favicon = f"assets/client/{os.path.basename(favicon_path)}"
    tab_name = escape(f"{config_dict['clientName']} {config_dict['platformName']}".strip())
    for page in target_path.rglob("*.html"):
        html = page.read_text(encoding="utf-8")
        html = re.sub(r"(<title[^>]*>)XPENG Vector", lambda match: match[1] + tab_name, html, flags=re.I)
        if favicon:
            icon_url = os.path.relpath(target_path / favicon, page.parent).replace(os.sep, "/")
            icon_tag = f'<link rel="icon" href="{escape(icon_url, quote=True)}">'
            html = re.sub(r"<link\b[^>]*>", lambda match: "" if re.search(r"\brel\s*=\s*[\"'](?:shortcut\s+)?icon[\"']", match[0], re.I) else match[0], html, flags=re.I)
            html = re.sub(r"</head\s*>", lambda match: icon_tag + "\n" + match[0], html, count=1, flags=re.I)
        page.write_text(html, encoding="utf-8")

    # 4. Write generated assets/config.js
    config_js_path = target_path / "assets" / "config.js"
    os.makedirs(config_js_path.parent, exist_ok=True)
    with open(config_js_path, "w", encoding="utf-8") as f:
        f.write("/* Generated Client Configuration */\n")
        f.write(f"window.CLIENT_CONFIG = {json.dumps(config_dict, indent=2, ensure_ascii=False)};\n")

    # 5. Generate localization files
    generate_locales(
        output_dir=str(target_path),
        languages=config_dict.get("languages", []),
        client_name=config_dict.get("clientName", ""),
        platform_name=config_dict.get("platformName", "")
    )

    # 6. Run automated post-generation validation pass
    report = validate_generated_demo(str(target_path), config_dict)

    # 7. Package ZIP archive
    zip_path = str(target_path) + ".zip"
    created_zip = package_demo_to_zip(str(target_path), zip_path)
    annotate(validation_valid=report.valid, validation_error_count=len(report.errors),
             validation_warning_count=len(report.warnings), campaign_count=len(campaigns),
             page_count=sum(1 for _ in target_path.rglob("*.html")),
             zip_bytes=Path(created_zip).stat().st_size)

    return {
        "status": "success" if report.valid else "warning",
        "output_dir": str(target_path),
        "zip_path": created_zip,
        "config": config_dict,
        "validation": report.model_dump()
    }
