import hashlib
from pathlib import Path

import aiofiles
import aiofiles.os
import magic
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from config.settings import settings
from routers.auth import get_current_user
from schemas.common import MessageResponse
from utils.files import sanitize_filename

router = APIRouter(tags=["Upload"])

# Enhanced security configuration
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/json",
    "application/zip",
}
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
IMAGE_PREFIX = "image/"

# Dangerous file extensions that should never be allowed
DANGEROUS_EXTENSIONS = {
    ".exe",
    ".bat",
    ".cmd",
    ".com",
    ".pif",
    ".scr",
    ".vbs",
    ".js",
    ".jar",
    ".app",
    ".deb",
    ".pkg",
    ".dmg",
    ".sh",
    ".php",
    ".asp",
    ".aspx",
    ".jsp",
}


def validate_file_security(file: UploadFile, content: bytes) -> None:
    """Comprehensive file security validation"""

    # Check file extension
    if file.filename:
        ext = Path(file.filename).suffix.lower()
        if ext in DANGEROUS_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File type {ext} is not allowed for security reasons",
            )

    # Verify actual content type matches declared type
    if len(content) > 0:
        actual_mime = magic.from_buffer(content[:2048], mime=True)
        declared_mime = file.content_type

        # Allow some flexibility for text files
        if declared_mime and not (
            actual_mime == declared_mime
            or (
                declared_mime.startswith("text/")
                and actual_mime.startswith("text/")
            )
            or (
                declared_mime == "application/octet-stream"
            )  # Generic fallback
        ):
            raise HTTPException(
                status_code=400,
                detail=f"File content type mismatch: declared {declared_mime}, actual {actual_mime}",
            )

        # Check if actual MIME type is allowed
        if (
            actual_mime not in ALLOWED_MIME_TYPES
            and not actual_mime.startswith(IMAGE_PREFIX)
        ):
            if actual_mime not in ALLOWED_IMAGE_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail=f"File type {actual_mime} is not allowed",
                )

    # Check for embedded executables or scripts in images
    if content.startswith(b"MZ") or content.startswith(
        b"PK"
    ):  # PE or ZIP headers
        if file.content_type and file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="Image file contains suspicious executable content",
            )


def generate_secure_filename(original_filename: str, content: bytes) -> str:
    """Generate a secure filename with hash to prevent conflicts"""
    try:
        sanitized = sanitize_filename(original_filename)

        # Add content hash to prevent filename conflicts and add uniqueness
        content_hash = hashlib.sha256(content[:1024]).hexdigest()[:8]
        name_part = Path(sanitized).stem[:50]  # Limit name length
        ext_part = Path(sanitized).suffix[:10]  # Limit extension length

        return f"{name_part}_{content_hash}{ext_part}"

    except Exception:
        # Fallback to hash-based name if sanitization fails
        content_hash = hashlib.sha256(content[:1024]).hexdigest()[:16]
        return f"file_{content_hash}.bin"


@router.post(
    "/file/",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a single file",
    description="Upload a single file to the server.",
)
async def upload_file(
    file: UploadFile = File(..., description="File to upload"),
    current_user=Depends(get_current_user),
):
    """Upload a single file to the server with enhanced security."""

    # Basic validation
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    if len(file.filename) > 255:
        raise HTTPException(status_code=400, detail="Filename too long")

    # Create secure upload directory
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Read file content for validation
    content = await file.read()
    await file.seek(0)  # Reset file pointer

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file not allowed")

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024 * 1024)}MB",
        )

    # Security validation
    validate_file_security(file, content)

    # Generate secure filename
    secure_filename = generate_secure_filename(file.filename, content)
    destination = upload_dir / secure_filename

    # Ensure we don't overwrite existing files
    counter = 1
    original_destination = destination
    while destination.exists():
        stem = original_destination.stem
        suffix = original_destination.suffix
        destination = upload_dir / f"{stem}_{counter}{suffix}"
        counter += 1

    try:
        # Write file securely using async I/O
        async with aiofiles.open(destination, "wb") as buffer:
            await buffer.write(content)

        # Set secure file permissions (readable by owner only) - async
        await aiofiles.os.chmod(destination, 0o600)

        return MessageResponse(
            message=f"File uploaded successfully: {destination.name}"
        )

    except Exception as e:
        # Clean up on error
        if destination.exists():
            try:
                await aiofiles.os.unlink(destination)
            except:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not upload file: {str(e)}",
        )
    finally:
        await file.close()


@router.post(
    "/files/",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload multiple files",
    description="Upload multiple files to the server.",
)
async def upload_multiple_files(
    files: list[UploadFile] = File(
        ..., description="Multiple files to upload"
    ),
    current_user=Depends(get_current_user),
):
    """Upload multiple files to the server with enhanced security."""

    if len(files) > 10:  # Limit number of files
        raise HTTPException(
            status_code=400,
            detail="Too many files. Maximum 10 files per request",
        )

    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    saved_files = []
    total_size = 0

    try:
        for file in files:
            if not file.filename:
                continue

            if len(file.filename) > 255:
                raise HTTPException(
                    status_code=400,
                    detail=f"Filename too long: {file.filename}",
                )

            content = await file.read()
            await file.seek(0)

            if len(content) == 0:
                continue  # Skip empty files

            total_size += len(content)
            if total_size > MAX_FILE_SIZE * 5:  # 250MB total limit
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="Total file size too large",
                )

            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File {file.filename} too large",
                )

            # Security validation
            validate_file_security(file, content)

            # Generate secure filename
            secure_filename = generate_secure_filename(file.filename, content)
            destination = upload_dir / secure_filename

            # Ensure unique filename
            counter = 1
            original_destination = destination
            while destination.exists():
                stem = original_destination.stem
                suffix = original_destination.suffix
                destination = upload_dir / f"{stem}_{counter}{suffix}"
                counter += 1

            # Write file using async I/O
            async with aiofiles.open(destination, "wb") as buffer:
                await buffer.write(content)

            await aiofiles.os.chmod(destination, 0o600)
            saved_files.append(str(destination.name))

        return MessageResponse(
            message=f"Uploaded {len(saved_files)} files successfully: {', '.join(saved_files[:5])}"
        )

    except HTTPException:
        # Clean up on error
        for filename in saved_files:
            try:
                (upload_dir / filename).unlink(missing_ok=True)
            except:
                pass
        raise
    except Exception as e:
        # Clean up on error
        for filename in saved_files:
            try:
                (upload_dir / filename).unlink(missing_ok=True)
            except:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not upload files: {str(e)}",
        )
    finally:
        for file in files:
            await file.close()
