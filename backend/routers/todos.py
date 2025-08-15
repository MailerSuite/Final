import math
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.base import User  # Use the main User model
from models.todo import Todo

# Import the main authentication function
from routers.auth import get_current_user
from schemas.todo import TodoCreate, TodoListResponse, TodoResponse, TodoUpdate

router = APIRouter(prefix="/api/v1/todos", tags=["Automation"])


# Todo endpoints
@router.get("/", response_model=TodoListResponse)
async def get_todos(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    completed: bool | None = None,
    search: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Todo).filter(Todo.user_id == str(current_user.id))

    if completed is not None:
        query = query.filter(Todo.completed == completed)

    if search:
        query = query.filter(
            or_(
                Todo.title.ilike(f"%{search}%"),
                Todo.description.ilike(f"%{search}%"),
            )
        )

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get paginated results
    paginated_query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(paginated_query)
    todos = result.scalars().all()

    total_pages = math.ceil(total / per_page)

    return {
        "todos": todos,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
    }


@router.post(
    "/", response_model=TodoResponse, status_code=status.HTTP_201_CREATED
)
async def create_todo(
    todo: TodoCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        # Convert UUID to string for SQLite compatibility
        user_id_str = str(current_user.id)

        # Use Pydantic v2 model_dump() instead of deprecated dict()
        todo_data = todo.model_dump()
        db_todo = Todo(**todo_data, user_id=user_id_str)

        db.add(db_todo)
        await db.commit()
        await db.refresh(db_todo)
        return db_todo
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create todo: {str(e)}",
        )


@router.get("/{todo_id}", response_model=TodoResponse)
async def get_todo(
    todo_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Todo).filter(
        and_(Todo.id == todo_id, Todo.user_id == str(current_user.id))
    )
    result = await db.execute(query)
    todo = result.scalar_one_or_none()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


@router.put("/{todo_id}", response_model=TodoResponse)
async def update_todo(
    todo_id: int,
    todo_update: TodoUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Todo).filter(
        and_(Todo.id == todo_id, Todo.user_id == str(current_user.id))
    )
    result = await db.execute(query)
    todo = result.scalar_one_or_none()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    # Use Pydantic v2 model_dump() with exclude_unset
    update_data = todo_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(todo, field, value)

    todo.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(todo)
    return todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(
    todo_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Todo).filter(
        and_(Todo.id == todo_id, Todo.user_id == str(current_user.id))
    )
    result = await db.execute(query)
    todo = result.scalar_one_or_none()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")

    await db.delete(todo)
    await db.commit()
    return None
