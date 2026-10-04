import os
import shutil
import stat
from pathlib import Path

def _remove_readonly(func, path, exc_info):
    os.chmod(path, stat.S_IWRITE)
    func(path)

def copy_master_template(master_template_dir: str, output_dir: str) -> str:
    master_path = Path(master_template_dir).resolve()
    target_path = Path(output_dir).resolve()

    if not master_path.exists():
        raise FileNotFoundError(f"Master template directory not found at {master_path}")

    # Ensure target_path does not overwrite master_path
    if target_path == master_path or master_path in target_path.parents:
        raise ValueError("Cannot overwrite master template or output within master template directory.")

    # Remove target if it already exists
    if target_path.exists():
        try:
            shutil.rmtree(target_path, onerror=_remove_readonly)
        except Exception:
            shutil.rmtree(target_path, ignore_errors=True)

    os.makedirs(target_path.parent, exist_ok=True)
    shutil.copytree(master_path, target_path, dirs_exist_ok=True)

    return str(target_path)
