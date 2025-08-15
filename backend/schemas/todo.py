from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class TodoBase(BaseModel):
    """Base todo schema"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    completed: bool = Field(default=False)


class TodoCreate(TodoBase):
    """Schema for creating a todo"""
    pass


class TodoUpdate(BaseModel):
    """Schema for updating a todo"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    completed: Optional[bool] = None


class TodoResponse(TodoBase):
    """Schema for todo response"""
    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TodoListResponse(BaseModel):
    """Schema for todo list response"""
    todos: List[TodoResponse]
    total: int
    page: int
    per_page: int
    total_pages: int 