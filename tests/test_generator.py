import os
import shutil
import pytest
from pathlib import Path

from backend.models.client_config import ClientConfig, BrandingConfig, CountryConfig
from backend.services.template_service import copy_master_template
from backend.services.asset_service import copy_asset, sanitize_filename
from backend.services.localization_service import generate_locales
from backend.services.validation_service import validate_generated_demo
from backend.services.packaging_service import package_demo_to_zip
from backend.generator.engine import generate_demo

BASE_DIR = Path(__file__).resolve().parent.parent
MASTER_TEMPLATE_DIR = str(BASE_DIR / "master-template")
TEST_OUTPUT_DIR = str(BASE_DIR / "generated" / "test-renault-pulse")

@pytest.fixture(autouse=True)
def cleanup():
    yield
    import gc
    gc.collect()
    if os.path.exists(TEST_OUTPUT_DIR):
        try:
            shutil.rmtree(TEST_OUTPUT_DIR)
        except Exception:
            pass
    zip_p = TEST_OUTPUT_DIR + ".zip"
    if os.path.exists(zip_p):
        try:
            os.remove(zip_p)
        except Exception:
            pass

def test_client_config_validation():
    config = ClientConfig(
        clientName="Renault",
        platformName="Pulse",
        branding=BrandingConfig(primaryColor="#000000", accentColor="#FFD200"),
        country=CountryConfig(code="RO", name="Romania", currency="RON", symbol="RON")
    )
    assert config.clientName == "Renault"
    assert config.platformName == "Pulse"
    assert config.branding.accentColor == "#FFD200"
    assert config.country.code == "RO"

def test_template_copying():
    out_dir = copy_master_template(MASTER_TEMPLATE_DIR, TEST_OUTPUT_DIR)
    assert os.path.exists(out_dir)
    assert os.path.exists(os.path.join(out_dir, "index.html"))
    assert os.path.exists(os.path.join(out_dir, "assets", "app.css"))

def test_asset_sanitization_and_copying():
    out_dir = copy_master_template(MASTER_TEMPLATE_DIR, TEST_OUTPUT_DIR)
    dummy_logo = os.path.join(out_dir, "assets", "geely-logo.svg")

    # Safe copy test
    copied = copy_asset(dummy_logo, os.path.join(out_dir, "assets", "client"), "test_logo.svg")
    assert os.path.exists(copied)
    assert sanitize_filename("../../../malicious.svg") == "malicious.svg"

def test_localization_generation():
    out_dir = copy_master_template(MASTER_TEMPLATE_DIR, TEST_OUTPUT_DIR)
    langs = [{"code": "en", "label": "English"}, {"code": "ro", "label": "Română"}]

    locales = generate_locales(out_dir, langs, "Renault", "Pulse")
    assert len(locales) == 2
    assert os.path.exists(os.path.join(out_dir, "locales", "ro.json"))

def test_full_demo_generation_and_validation():
    sample_config = {
        "clientName": "Renault",
        "platformName": "Pulse",
        "tagline": "Drive Passion",
        "defaultLanguage": "ro",
        "branding": {
            "logo": "assets/geely-logo.svg",
            "primaryColor": "#000000",
            "secondaryColor": "#ffffff",
            "accentColor": "#FFD200"
        },
        "country": {
            "code": "RO",
            "name": "Romania",
            "currency": "RON",
            "symbol": "RON",
            "pointsRatio": 100
        },
        "countryConfig": {
            "country": "Romania",
            "regions": ["Bucharest", "Transylvania", "Moldavia", "Banat"],
            "branches": ["Bucharest Central", "Cluj-Napoca", "Timișoara", "Iași"],
            "defaultBranch": "Bucharest Central"
        },
        "languages": [
            {"code": "en", "label": "English"},
            {"code": "ro", "label": "Română"}
        ],
        "campaigns": [
            {
                "id": "renault-summer",
                "name": "Renault Summer Challenge",
                "type": "Hit & Win Incentive",
                "img": "assets/img/demonstrator.jpg",
                "blurb": "Earn extra RON points on summer service items.",
                "status": "Active"
            }
        ]
    }

    res = generate_demo(
        client_config=sample_config,
        master_template_dir=MASTER_TEMPLATE_DIR,
        output_dir=TEST_OUTPUT_DIR
    )

    assert res["status"] in ["success", "warning"]
    assert os.path.exists(res["output_dir"])
    assert os.path.exists(res["zip_path"])
    assert os.path.exists(os.path.join(res["output_dir"], "assets", "config.js"))
    assert os.path.exists(os.path.join(res["output_dir"], "locales", "ro.json"))

    val_report = res["validation"]
    assert val_report["valid"] is True or len(val_report["errors"]) == 0

def test_data_url_asset_generation():
    # 1x1 red PNG base64 data URL
    data_url_logo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    data_url_camp = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

    sample_config = {
        "clientName": "Peugeot",
        "platformName": "Drive",
        "branding": {
            "logo": data_url_logo
        },
        "campaigns": [
            {
                "id": "camp-1",
                "name": "Peugeot Winter Campaign",
                "type": "Hit & Win",
                "img": data_url_camp,
                "heroImage": data_url_camp,
                "blurb": "Special winter offer",
                "status": "Active"
            }
        ]
    }

    res = generate_demo(
        client_config=sample_config,
        master_template_dir=MASTER_TEMPLATE_DIR,
        output_dir=TEST_OUTPUT_DIR
    )

    assert res["status"] in ["success", "warning"]
    assert res["config"]["branding"]["logo"] == "assets/client/logo.svg"
    assert res["config"]["campaigns"][0]["img"].startswith("assets/campaigns/")
    assert res["config"]["campaigns"][0]["heroImage"] == res["config"]["campaigns"][0]["img"]
    assert res["config"]["campaigns"][0]["tileImage"] == res["config"]["campaigns"][0]["img"]
    assert os.path.exists(os.path.join(res["output_dir"], res["config"]["branding"]["logo"]))
    assert os.path.exists(os.path.join(res["output_dir"], res["config"]["campaigns"][0]["img"]))



def test_each_campaign_has_unique_detail_page(tmp_path):
    campaigns = [
        {"id": "duplicate", "name": f"Custom Campaign {i}",
         "blurb": f"Description {i}", "status": "Live", "type": "Custom",
         "href": "missing-page.html" if i % 2 else "#"}
        for i in range(7)
    ]
    result = generate_demo(
        {"campaigns": campaigns, "branding": {"logo": "assets/geely-logo.svg"}}, MASTER_TEMPLATE_DIR, str(tmp_path / "demo")
    )
    links = [camp["href"] for camp in result["config"]["campaigns"]]
    assert len(set(links)) == len(campaigns)
    import zipfile
    with zipfile.ZipFile(result["zip_path"]) as archive:
        for i, link in enumerate(links):
            page = (Path(result["output_dir"]) / link).read_text(encoding="utf-8")
            assert f"<h1>Custom Campaign {i}</h1>" in page
            assert f'<p class="cam-lede">Description {i}</p>' in page
            assert link in archive.namelist()
    assert not result["validation"]["errors"]


def test_logo_conversion_preserves_svg_and_embeds_raster(tmp_path):
    import base64
    import xml.etree.ElementTree as ET
    from backend.services.asset_service import save_logo_as_svg
    svg = b'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="60"><path fill="red" d="M0 0h30v30z"/></svg>'
    result = save_logo_as_svg('data:image/svg+xml;base64,' + base64.b64encode(svg).decode(), str(tmp_path))
    root = ET.parse(result).getroot()
    assert root.get('viewBox') == '0 0 300.0 60.0'
    assert root.find('{http://www.w3.org/2000/svg}path') is not None
    raster = tmp_path / 'upload.png'
    raster.write_bytes(b'raster-test-content')
    result = save_logo_as_svg(str(raster), str(tmp_path / 'raster'))
    image = ET.parse(result).getroot().find('{http://www.w3.org/2000/svg}image')
    assert base64.b64decode(image.get('href').split(',')[1]) == raster.read_bytes()
    assert Path(result).suffix == '.svg'


def test_homepage_inputs_are_rendered_and_packaged(tmp_path):
    import base64
    import zipfile
    image_bytes = b"homepage-image-content"
    result = generate_demo({
        "homepage": {
            "title": "Drive <further> & earn",
            "description": "Your rewards <script>alert(1)</script>",
            "heroImage": "data:image/png;base64," + base64.b64encode(image_bytes).decode(),
        }
    }, MASTER_TEMPLATE_DIR, str(tmp_path / "homepage-demo"))
    output = Path(result["output_dir"])
    home = (output / "index.html").read_text(encoding="utf-8")
    assert "<h1>Drive &lt;further&gt; &amp; earn</h1>" in home
    assert "Your rewards &lt;script&gt;alert(1)&lt;/script&gt;" in home
    assert '<div class="hero-media"><img src="assets/homepage/hero.png"' in home
    assert (output / "assets/homepage/hero.png").read_bytes() == image_bytes
    assert result["config"]["homepage"]["heroImage"] == "assets/homepage/hero.png"
    assert 'class="hero-media"' not in (output / "shop.html").read_text(encoding="utf-8")
    with zipfile.ZipFile(result["zip_path"]) as archive:
        assert archive.read("assets/homepage/hero.png") == image_bytes


def test_homepage_empty_image_uses_template(tmp_path):
    result = generate_demo({"homepage": {"heroImage": ""}}, MASTER_TEMPLATE_DIR, str(tmp_path / "default-home"))
    home = (Path(result["output_dir"]) / "index.html").read_text(encoding="utf-8")
    assert '<div class="hero-media"><img src="assets/img/handover-keys.jpg"' in home
