import os
import re
import glob
from pathlib import Path
from typing import List, Dict, Any
from pydantic import BaseModel

class ValidationReport(BaseModel):
    valid: bool
    errors: List[str] = []
    warnings: List[str] = []

REQUIRED_PAGES = [
    "index.html",
    "campaigns.html",
    "dashboard.html",
    "commercial.html",
    "ev-service-ready.html",
    "first-time-fix.html",
    "game-mechanics.html",
    "genuine-parts.html",
    "help.html",
    "network-intelligence.html",
    "network.html",
    "next-service-booked.html",
    "points-bank.html",
    "service-league.html",
    "sherbot.html",
    "shop.html",
    "voucher-wallet.html"
]

REQUIRED_ASSETS = [
    "assets/app.css",
    "assets/app.js",
    "assets/data.js",
    "assets/config.js",
    "assets/i18n.js"
]

def validate_generated_demo(output_dir: str, config: Dict[str, Any]) -> ValidationReport:
    errors = []
    warnings = []
    base_path = Path(output_dir).resolve()

    if not base_path.exists():
        return ValidationReport(valid=False, errors=[f"Generated project directory does not exist: {output_dir}"])

    # 1. Required Pages Check
    for page in REQUIRED_PAGES:
        page_path = base_path / page
        if not page_path.exists():
            errors.append(f"Missing required page: {page}")

    # 2. Required Assets Check
    for asset in REQUIRED_ASSETS:
        asset_path = base_path / asset
        if not asset_path.exists():
            errors.append(f"Missing required asset: {asset}")

    # 3. Branding & Logo Check
    branding = config.get("branding", {})
    logo_rel = branding.get("logo", "")
    if logo_rel:
        logo_path = base_path / logo_rel
        if not logo_path.exists():
            errors.append(f"Client logo referenced ({logo_rel}) does not exist on disk.")

    # 4. Campaign Images Check
    campaigns = config.get("campaigns", [])
    for idx, camp in enumerate(campaigns):
        img_rel = camp.get("img") or camp.get("tileImage")
        if img_rel and not (base_path / img_rel).exists():
            warnings.append(f"Campaign #{idx+1} ({camp.get('name')}) image not found: {img_rel}")

    # 5. Selected Languages Check
    languages = config.get("languages", [])
    if not languages:
        errors.append("No languages configured for the demo.")
    for lang in languages:
        code = lang.get("code")
        locale_path = base_path / "locales" / f"{code}.json"
        if not locale_path.exists():
            errors.append(f"Missing locale file for selected language '{code}': locales/{code}.json")

    # 6. Check internal links resolution in HTML files
    html_files = glob.glob(str(base_path / "*.html"))
    link_pattern = re.compile(r'href=["\']([^"\']+\.html)["\']')

    for html_file in html_files:
        filename = os.path.basename(html_file)
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()

        links = link_pattern.findall(content)
        for link in links:
            # ignore query params or fragments
            clean_link = link.split('?')[0].split('#')[0]
            if clean_link and not (base_path / clean_link).exists():
                warnings.append(f"Broken internal link in {filename}: href='{link}' points to non-existent file.")

    # 7. Check for leftover previous client strings if client name changed
    client_name = config.get("clientName", "")
    if client_name and client_name.lower() != "lkq euro car parts":
        config_js = base_path / "assets" / "config.js"
        if config_js.exists():
            with open(config_js, 'r', encoding='utf-8') as f:
                cfg_content = f.read()
                if client_name not in cfg_content:
                    errors.append(f"Client name '{client_name}' not properly written to assets/config.js")

    is_valid = len(errors) == 0
    return ValidationReport(valid=is_valid, errors=errors, warnings=warnings)
