import os
import shutil
import re
from pathlib import Path

from typing import Optional
import base64
import mimetypes
import xml.etree.ElementTree as ET
from urllib.parse import unquote_to_bytes


from backend.observability import instrument


@instrument("assets.prepare_logo")
def save_logo_as_svg(source: str, dest_dir: str) -> str:
    """Keep vector uploads as SVG; embed raster uploads in a portable SVG."""
    if source.startswith("data:"):
        header, encoded = source.split(",", 1)
        mime = header[5:].split(";")[0]
        data = base64.b64decode(encoded, validate=True) if ";base64" in header else unquote_to_bytes(encoded)
    else:
        path = Path(source)
        data = path.read_bytes()
        mime = mimetypes.guess_type(path.name)[0] or ""
    if mime == "image/svg+xml":
        root = ET.fromstring(data)
        if root.tag.split("}")[-1] != "svg":
            raise ValueError("Logo is not a valid SVG")
        if not root.get("viewBox"):
            width = root.get("width", "160").removesuffix("px")
            height = root.get("height", "48").removesuffix("px")
            try:
                root.set("viewBox", f"0 0 {float(width)} {float(height)}")
            except ValueError:
                pass
        root.set("preserveAspectRatio", "xMidYMid meet")
        data = ET.tostring(root, encoding="utf-8", xml_declaration=True)
    elif mime in {"image/png", "image/jpeg", "image/webp", "image/gif", "image/bmp", "image/avif"}:
        embedded = base64.b64encode(data).decode("ascii")
        data = (f'<svg xmlns="http://www.w3.org/2000/svg" width="160" height="48" viewBox="0 0 160 48">'
                f'<image width="160" height="48" preserveAspectRatio="xMidYMid meet" href="data:{mime};base64,{embedded}"/>'
                '</svg>').encode("utf-8")
    else:
        raise ValueError(f"Unsupported logo image type: {mime}")
    target = Path(dest_dir) / "logo.svg"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    return str(target)

def sanitize_filename(filename: str) -> str:
    clean_name = os.path.basename(filename)
    clean_name = re.sub(r'[^a-zA-Z0-9_\.\-]', '_', clean_name)
    return clean_name

@instrument("assets.copy")
def copy_asset(src_path: str, dest_dir: str, filename: Optional[str] = None) -> str:
    src = Path(src_path).resolve()
    if not src.exists():
        raise FileNotFoundError(f"Asset file not found: {src_path}")

    target_name = sanitize_filename(filename or src.name)
    target_dir = Path(dest_dir).resolve()
    os.makedirs(target_dir, exist_ok=True)

    dest = (target_dir / target_name).resolve()

    # Prevent path traversal outside target_dir
    if not str(dest).startswith(str(target_dir)):
        raise ValueError(f"Security error: path traversal attempt in asset destination {dest}")

    shutil.copy2(src, dest)
    return str(dest)

@instrument("assets.save_image")
def save_data_url_asset(data_url: str, dest_dir: str, filename_prefix: str = "asset") -> str:
    """Decodes base64 data URL and saves to dest_dir, returning the file path."""
    import base64
    if not data_url.startswith("data:"):
        raise ValueError("Invalid data URL format")

    header, encoded = data_url.split(",", 1)
    mime_type = header.split(";")[0].split(":")[1] if ":" in header else "image/png"

    ext = "png"
    if "jpeg" in mime_type or "jpg" in mime_type:
        ext = "jpg"
    elif "svg" in mime_type:
        ext = "svg"
    elif "webp" in mime_type:
        ext = "webp"
    elif "gif" in mime_type:
        ext = "gif"

    filename = f"{filename_prefix}.{ext}"
    target_dir = Path(dest_dir).resolve()
    os.makedirs(target_dir, exist_ok=True)

    dest_path = target_dir / filename
    data = base64.b64decode(encoded)
    with open(dest_path, "wb") as f:
        f.write(data)

    return str(dest_path)



