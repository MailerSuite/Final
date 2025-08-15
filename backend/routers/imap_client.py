from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from sqlalchemy import select
from sqlalchemy.future import select

from core.database import get_db
from core.logger import get_logger
from models.base import IMAPAccount, Session
from routers.auth import get_current_user
from schemas.imap import IMAPAccountSelector
from services.imap_service import IMAPService
from services.proxy_service import ProxyUnavailableError

router = APIRouter(prefix="/imap", tags=["IMAP"])
logger = get_logger(__name__)


class IMAPConnectionManager:
    """Manage WebSocket connections for IMAP updates."""

    def __init__(self) -> None:
        """Initialize the storage for connections."""
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str) -> None:
        """Register a new connection for the given user."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str) -> None:
        """Remove a connection for the given user."""
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_update(self, user_id: str, message: dict) -> None:
        """Send an update message to all connections of a user."""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass


manager = IMAPConnectionManager()


@router.get("/accounts", response_model=list[IMAPAccountSelector])
async def list_accounts(
    include_random: bool = False,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    stmt = (
        select(IMAPAccount)
        .join(Session)
        .where(Session.user_id == current_user.id)
    )
    result = await db.execute(stmt)
    accounts = result.scalars().all()
    items = [
        IMAPAccountSelector(
            id=str(a.id), email=a.email, server=a.imap_server, port=a.imap_port
        )
        for a in accounts
    ]
    if include_random:
        items.insert(0, IMAPAccountSelector(id="random", email="Random"))
    return items


async def get_imap_account(
    account_id: UUID,
    current_user=Depends(get_current_user),
    db=Depends(get_db),
) -> IMAPAccount:
    """Get IMAP account and verify access."""
    query = (
        select(IMAPAccount)
        .join(Session)
        .where(
            IMAPAccount.id == account_id, Session.user_id == current_user.id
        )
    )
    result = await db.execute(query)
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="IMAP account not found or access denied",
        )
    return account


@router.get("/accounts/{account_id}/folders")
async def get_folders(
    account_id: UUID,
    imap_account: IMAPAccount = Depends(get_imap_account),
    db=Depends(get_db),
):
    """Get list of IMAP folders with unread counts."""
    try:
        imap_service = IMAPService(db)
        folders = await imap_service.get_folders(imap_account)
        return {"folders": folders}
    except ProxyUnavailableError as e:
        logger.error(f"Proxy unavailable: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to get folders: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get folders: {str(e)}",
        )


@router.get("/accounts/{account_id}/folders/{folder_name}/messages")
async def get_messages(
    account_id: UUID,
    folder_name: str,
    limit: int = 50,
    imap_account: IMAPAccount = Depends(get_imap_account),
    db=Depends(get_db),
):
    """Get messages from a folder."""
    try:
        imap_service = IMAPService(db)
        messages = await imap_service.get_messages(
            imap_account, folder_name, limit
        )
        return {"messages": messages}
    except ProxyUnavailableError as e:
        logger.error(f"Proxy unavailable: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to get messages: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get messages: {str(e)}",
        )


@router.get("/accounts/{account_id}/folders/{folder_name}/messages/{uid}")
async def get_message(
    account_id: UUID,
    folder_name: str,
    uid: int,
    imap_account: IMAPAccount = Depends(get_imap_account),
    db=Depends(get_db),
):
    """Get full message content."""
    try:
        imap_service = IMAPService(db)
        message = await imap_service.get_message_content(
            imap_account, folder_name, uid
        )
        return message
    except ProxyUnavailableError as e:
        logger.error(f"Proxy unavailable: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to get message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get message: {str(e)}",
        )


@router.post(
    "/accounts/{account_id}/folders/{folder_name}/messages/{uid}/read"
)
async def mark_as_read(
    account_id: UUID,
    folder_name: str,
    uid: int,
    imap_account: IMAPAccount = Depends(get_imap_account),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Mark message as read."""
    try:
        imap_service = IMAPService(db)
        success = await imap_service.mark_as_read(
            imap_account, folder_name, uid
        )
        if success:
            await manager.send_update(
                str(current_user.id),
                {"type": "message_read", "folder": folder_name, "uid": uid},
            )
            return {"success": True, "message": "Message marked as read"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to mark message as read",
            )
    except ProxyUnavailableError as e:
        logger.error(f"Proxy unavailable: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to mark message as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark message as read: {str(e)}",
        )


@router.delete("/accounts/{account_id}/folders/{folder_name}/messages/{uid}")
async def delete_message(
    account_id: UUID,
    folder_name: str,
    uid: int,
    imap_account: IMAPAccount = Depends(get_imap_account),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Delete message."""
    try:
        imap_service = IMAPService(db)
        success = await imap_service.delete_message(
            imap_account, folder_name, uid
        )
        if success:
            await manager.send_update(
                str(current_user.id),
                {"type": "message_deleted", "folder": folder_name, "uid": uid},
            )
            return {"success": True, "message": "Message deleted"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete message",
            )
    except ProxyUnavailableError as e:
        logger.error(f"Proxy unavailable: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to delete message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete message: {str(e)}",
        )


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time IMAP updates."""
    await manager.connect(websocket, user_id)
    try:
        while True:
            try:
                data = await websocket.receive_text()
                if data == "pong":
                    continue
            except WebSocketDisconnect as exc:
                logger.info("IMAP client disconnect code=%s", exc.code)
                break
            except Exception as exc:
                logger.error(f"IMAP client receive error: {exc}")
                break
    finally:
        manager.disconnect(websocket, user_id)
