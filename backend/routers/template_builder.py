"""
Template Builder Router
Handles email template building, editing, and management
"""

import logging
import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models import User
from routers.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


# Request/Response Models
class TemplateBlock(BaseModel):
    id: str
    type: str  # "text", "image", "button", "divider", "spacer"
    content: dict[str, Any]
    styles: dict[str, Any]
    position: int


class TemplateLayout(BaseModel):
    id: str
    name: str
    type: str  # "single_column", "two_column", "three_column"
    blocks: list[TemplateBlock]
    global_styles: dict[str, Any]


class TemplateTheme(BaseModel):
    id: str
    name: str
    colors: dict[str, str]
    fonts: dict[str, str]
    spacing: dict[str, int]


class TemplateSession(BaseModel):
    id: str
    template_id: str | None
    layout: TemplateLayout
    theme: TemplateTheme
    created_at: datetime
    updated_at: datetime
    is_saved: bool


@router.get("/")
async def template_builder_info() -> dict[str, Any]:
    """Template Builder API information."""
    return {
        "service": "Template Builder API",
        "version": "1.0.0",
        "description": "Visual email template builder and editor",
        "endpoints": {
            "sessions": "/sessions",
            "layouts": "/layouts",
            "themes": "/themes",
            "blocks": "/blocks",
            "preview": "/preview",
            "save": "/save",
            "export": "/export",
        },
    }


@router.post("/sessions")
async def create_builder_session(
    template_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TemplateSession:
    """Create a new template builder session."""

    session_id = str(uuid.uuid4())

    # Default layout and theme
    default_layout = TemplateLayout(
        id=str(uuid.uuid4()),
        name="Default Layout",
        type="single_column",
        blocks=[
            TemplateBlock(
                id=str(uuid.uuid4()),
                type="text",
                content={"text": "Welcome to our newsletter!"},
                styles={"fontSize": "24px", "fontWeight": "bold"},
                position=0,
            )
        ],
        global_styles={
            "backgroundColor": "#ffffff",
            "padding": "20px",
            "maxWidth": "600px",
        },
    )

    default_theme = TemplateTheme(
        id="default",
        name="Default Theme",
        colors={
            "primary": "#007bff",
            "secondary": "#6c757d",
            "background": "#ffffff",
            "text": "#333333",
        },
        fonts={"primary": "Arial, sans-serif", "secondary": "Georgia, serif"},
        spacing={"small": 8, "medium": 16, "large": 24},
    )

    return TemplateSession(
        id=session_id,
        template_id=template_id,
        layout=default_layout,
        theme=default_theme,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        is_saved=False,
    )


@router.get("/sessions/{session_id}")
async def get_builder_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TemplateSession:
    """Get template builder session."""

    # Mock session data - in production, get from database
    return TemplateSession(
        id=session_id,
        template_id=None,
        layout=TemplateLayout(
            id=str(uuid.uuid4()),
            name="Current Layout",
            type="single_column",
            blocks=[],
            global_styles={},
        ),
        theme=TemplateTheme(
            id="default", name="Default Theme", colors={}, fonts={}, spacing={}
        ),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        is_saved=False,
    )


@router.put("/sessions/{session_id}")
async def update_builder_session(
    session_id: str,
    session_data: dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Update template builder session."""

    return {
        "success": True,
        "session_id": session_id,
        "updated_at": datetime.utcnow().isoformat(),
        "auto_saved": True,
    }


@router.get("/layouts")
async def get_template_layouts(
    category: str | None = Query(None),
    current_user: User = Depends(get_current_user),
) -> list[TemplateLayout]:
    """Get available template layouts."""

    layouts = [
        TemplateLayout(
            id="single_column",
            name="Single Column",
            type="single_column",
            blocks=[],
            global_styles={"maxWidth": "600px"},
        ),
        TemplateLayout(
            id="two_column",
            name="Two Column",
            type="two_column",
            blocks=[],
            global_styles={"maxWidth": "800px"},
        ),
    ]

    return layouts


@router.get("/themes")
async def get_template_themes(
    current_user: User = Depends(get_current_user),
) -> list[TemplateTheme]:
    """Get available template themes."""

    themes = [
        TemplateTheme(
            id="modern",
            name="Modern",
            colors={
                "primary": "#007bff",
                "secondary": "#6c757d",
                "background": "#ffffff",
                "text": "#333333",
            },
            fonts={
                "primary": "Arial, sans-serif",
                "secondary": "Georgia, serif",
            },
            spacing={"small": 8, "medium": 16, "large": 24},
        ),
        TemplateTheme(
            id="elegant",
            name="Elegant",
            colors={
                "primary": "#8B4513",
                "secondary": "#D2B48C",
                "background": "#F5F5DC",
                "text": "#2F2F2F",
            },
            fonts={
                "primary": "Georgia, serif",
                "secondary": "Arial, sans-serif",
            },
            spacing={"small": 12, "medium": 20, "large": 32},
        ),
    ]

    return themes


@router.get("/blocks/types")
async def get_block_types(
    current_user: User = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """Get available block types for template builder."""

    return [
        {
            "type": "text",
            "name": "Text Block",
            "description": "Rich text content",
            "icon": "text",
            "properties": [
                "content",
                "fontSize",
                "fontWeight",
                "color",
                "alignment",
            ],
        },
        {
            "type": "image",
            "name": "Image Block",
            "description": "Image with optional link",
            "icon": "image",
            "properties": ["src", "alt", "width", "height", "link"],
        },
        {
            "type": "button",
            "name": "Button Block",
            "description": "Call-to-action button",
            "icon": "mouse-pointer",
            "properties": [
                "text",
                "link",
                "backgroundColor",
                "textColor",
                "borderRadius",
            ],
        },
        {
            "type": "divider",
            "name": "Divider Block",
            "description": "Horizontal divider line",
            "icon": "minus",
            "properties": ["color", "thickness", "margin"],
        },
        {
            "type": "spacer",
            "name": "Spacer Block",
            "description": "Empty space",
            "icon": "move-vertical",
            "properties": ["height"],
        },
        {
            "type": "social",
            "name": "Social Media Block",
            "description": "Social media icons",
            "icon": "share-2",
            "properties": ["platforms", "iconSize", "alignment"],
        },
    ]


@router.post("/blocks")
async def add_block_to_template(
    session_id: str,
    block_data: TemplateBlock,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Add a new block to template."""

    return {
        "success": True,
        "block_id": block_data.id,
        "session_id": session_id,
        "position": block_data.position,
    }


@router.put("/blocks/{block_id}")
async def update_block(
    block_id: str,
    block_data: TemplateBlock,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Update existing block."""

    return {
        "success": True,
        "block_id": block_id,
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.delete("/blocks/{block_id}")
async def delete_block(
    block_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Delete block from template."""

    return {
        "success": True,
        "block_id": block_id,
        "deleted_at": datetime.utcnow().isoformat(),
    }


@router.post("/preview")
async def generate_template_preview(
    session_id: str,
    format: str = Query("html", regex="^(html|text)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Generate template preview."""

    # Mock HTML preview
    mock_html = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Email Template</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
            <h1 style="color: #333333;">Welcome to our newsletter!</h1>
            <p>This is a preview of your template.</p>
        </div>
    </body>
    </html>
    """

    return {
        "session_id": session_id,
        "format": format,
        "preview_html": mock_html if format == "html" else None,
        "preview_text": "Welcome to our newsletter!\nThis is a preview of your template."
        if format == "text"
        else None,
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.post("/save")
async def save_template(
    session_id: str,
    template_name: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Save template builder session as template."""

    template_id = str(uuid.uuid4())

    return {
        "success": True,
        "template_id": template_id,
        "template_name": template_name,
        "session_id": session_id,
        "saved_at": datetime.utcnow().isoformat(),
    }


@router.get("/export/{session_id}")
async def export_template(
    session_id: str,
    format: str = Query("html", regex="^(html|json)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Export template in specified format."""

    if format == "html":
        return {
            "format": "html",
            "content": "<html><body><h1>Exported Template</h1></body></html>",
            "filename": f"template_{session_id}.html",
        }
    else:
        return {
            "format": "json",
            "content": {
                "template": {
                    "id": session_id,
                    "layout": {},
                    "theme": {},
                    "blocks": [],
                }
            },
            "filename": f"template_{session_id}.json",
        }
