from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from models.base import Base


class Todo(Base):
    """Todo model for user task management"""
    
    __tablename__ = "todos"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    completed = Column(Boolean, default=False, index=True)
    # UUID as string for compatibility
    user_id = Column(String(36), nullable=False, index=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )
    
    def __repr__(self):
        return (
            f"<Todo(id={self.id}, title='{self.title}', "
            f"completed={self.completed})>"
        ) 