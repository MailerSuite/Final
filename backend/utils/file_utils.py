import os
import tempfile
import zipfile
from pathlib import Path


def is_zip_file(filename: str) -> bool:
    """Return True if filename has a .zip extension."""
    return filename.lower().endswith(".zip")


def save_bytes_to_tempfile(data: bytes, suffix: str = "") -> Path:
    """Write bytes to a temporary file and return its Path."""
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(data)
    tmp.close()
    return Path(tmp.name)


def remove_file(path: Path) -> None:
    """Remove file if it exists."""
    try:
        path.unlink()
    except FileNotFoundError:
        pass


def safe_extract_zip(zip_file: zipfile.ZipFile, dest: str) -> None:
    """Safely extract ZIP ensuring no path traversal."""
    for member in zip_file.namelist():
        member_path = os.path.join(dest, member)
        abs_dest = os.path.abspath(dest)
        abs_member = os.path.abspath(member_path)
        if not abs_member.startswith(abs_dest):
            raise ValueError("attempted path traversal in zip file")
    zip_file.extractall(dest)
