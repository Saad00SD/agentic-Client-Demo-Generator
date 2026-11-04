import shutil
import os
from pathlib import Path
from backend.observability import instrument

@instrument("packaging.create_zip")
def package_demo_to_zip(output_dir: str, zip_output_path: str) -> str:
    source_path = Path(output_dir).resolve()
    zip_path = Path(zip_output_path).resolve()

    if not source_path.exists():
        raise FileNotFoundError(f"Output directory does not exist: {output_dir}")

    os.makedirs(zip_path.parent, exist_ok=True)

    # Base name without .zip extension for shutil.make_archive
    archive_base = str(zip_path.with_suffix(''))
    archive_format = 'zip'

    created_zip = shutil.make_archive(
        base_name=archive_base,
        format=archive_format,
        root_dir=str(source_path)
    )

    return created_zip
