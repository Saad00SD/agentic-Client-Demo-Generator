import os
import shutil
import re
from pathlib import Path

from typing import Optional

def sanitize_filename(filename: str) -> str:
    clean_name = os.path.basename(filename)
    clean_name = re.sub(r'[^a-zA-Z0-9_\.\-]', '_', clean_name)
    return clean_name

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



