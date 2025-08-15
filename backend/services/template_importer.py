import io
import json
import tempfile
import uuid
import zipfile
from pathlib import Path
from typing import Any

import httpx
from fastapi import HTTPException

from schemas.templates import TemplateFileSchema
from utils.file_utils import safe_extract_zip


class TemplateImporter:
    """Service handling template import from ZIP files or URLs."""

    def __init__(self, db_connection):
        self.db = db_connection

    async def _import_template_data(
        self, data: dict[str, Any], session_id: str
    ) -> str:
        """Insert template into database and return template ID."""
        template = TemplateFileSchema(**data)
        template_id = str(uuid.uuid4())
        query = "\n            INSERT INTO email_templates\n            (id, session_id, name, subject, html_content, text_content, macros, created_at)\n            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())\n            RETURNING id\n        "
        macros_json = json.dumps(template.macros or {})
        await self.db.fetchval(
            query,
            template_id,
            session_id,
            template.name,
            template.subject,
            template.html_content,
            template.text_content,
            macros_json,
        )
        return template_id

    async def import_from_bytes(
        self, zip_bytes: bytes, session_id: str
    ) -> list[dict[str, Any]]:
        """Import templates from raw ZIP bytes."""
        results: list[dict[str, Any]] = []
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zip_file:
                    safe_extract_zip(zip_file, tmpdir)
                for path in Path(tmpdir).rglob("*.json"):
                    try:
                        with open(path, encoding="utf-8") as f:
                            data = json.load(f)
                        template_id = await self._import_template_data(
                            data, session_id
                        )
                        results.append(
                            {
                                "file": path.name,
                                "success": True,
                                "template_id": template_id,
                            }
                        )
                    except Exception as e:
                        results.append(
                            {
                                "file": path.name,
                                "success": False,
                                "error": str(e),
                            }
                        )
        except zipfile.BadZipFile as exc:
            raise HTTPException(
                status_code=400, detail="invalid zip file"
            ) from exc
        return results

    async def import_from_url(
        self, url: str, session_id: str
    ) -> list[dict[str, Any]]:
        """Download ZIP from URL and import templates."""
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            if response.status_code != 200:
                raise HTTPException(
                    status_code=400, detail="failed to download zip"
                )
            return await self.import_from_bytes(response.content, session_id)
