from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.logger import get_logger
from models.base import IMAPAccount, Session
from routers.auth import get_current_user
from schemas.common import MessageResponse
from schemas.imap import (
    IMAPFolderInfo,
    IMAPMessageResponse,
)
from services.imap_service import IMAPConnectionError, IMAPService

router = APIRouter()
logger = get_logger(__name__)


async def verify_account_access(
    account_id: UUID, user_id: str, db: AsyncSession
) -> IMAPAccount:
    """Ensure the IMAP account belongs to the user and return it."""
    stmt = (
        select(IMAPAccount)
        .join(Session)
        .where(IMAPAccount.id == account_id, Session.user_id == user_id)
    )
    result = await db.execute(stmt)
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="IMAP account not found",
        )
    return account


@router.get(
    "/{account_id}/folders",
    response_model=list[IMAPFolderInfo],
    summary="List IMAP Folders",
    description="Retrieves a list of folders for a specific IMAP account, including message counts.",
)
async def list_imap_folders(
    account_id: UUID,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    List IMAP folders for a given account.
    """
    imap_service = IMAPService(db)
    try:
        account = await verify_account_access(
            account_id, current_user.id, db
        )
        folders = await imap_service.get_folders(account)
        return folders
    except IMAPConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )
    except Exception as e:
        logger.error(
            f"Error listing IMAP folders for account {account_id}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve folders",
        )


@router.get(
    "/{account_id}/folders/{folder_name}/messages",
    response_model=list[IMAPMessageResponse],
    summary="List Messages in Folder",
    description="Retrieves a list of messages from a specific IMAP folder.",
)
async def list_messages_in_folder(
    account_id: UUID,
    folder_name: str,
    limit: int = 10,
    offset: int = 0,
    unread_only: bool = False,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    imap_service = IMAPService(db)
    try:
        account = await verify_account_access(
            account_id, current_user.id, db
        )
        messages = await imap_service.get_messages(
            account, folder_name, limit, offset
        )
        return messages
    except IMAPConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )
    except Exception as e:
        logger.error(
            f"Error listing messages in folder '{folder_name}' for account {account_id}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve messages",
        )


@router.get(
    "/{account_id}/folders/{folder_name}/messages/{uid}",
    response_model=IMAPMessageResponse,
    summary="Get Message Detail",
    description="Retrieves the full content of a specific message by its UID.",
)
async def get_message_detail(
    account_id: UUID,
    folder_name: str,
    uid: int,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    imap_service = IMAPService(db)
    try:
        account = await verify_account_access(
            account_id, current_user.id, db
        )
        message = await imap_service.get_message_content(
            account, folder_name, uid
        )
        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found",
            )
        return message
    except IMAPConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )
    except Exception as e:
        logger.error(
            f"Error getting message detail for account {account_id}, folder {folder_name}, UID {uid}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve message content",
        )


@router.post(
    "/{account_id}/folders/{folder_name}/messages/{uid}/mark-read",
    response_model=MessageResponse,
    summary="Mark Message as Read",
    description="Marks a specific message as read.",
)
async def mark_message_as_read(
    account_id: UUID,
    folder_name: str,
    uid: int,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Mark a specific message as read.
    """
    imap_service = IMAPService(db)
    try:
        account = await verify_account_access(
            account_id, current_user.id, db
        )
        success = await imap_service.mark_as_read(
            account, folder_name, uid, True
        )
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to mark message as read",
            )
        return MessageResponse(message="Message marked as read successfully")
    except IMAPConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )
    except Exception as e:
        logger.error(
            f"Error marking message UID {uid} as read for account {account_id}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark message as read",
        )


@router.post(
    "/{account_id}/folders/{folder_name}/messages/{uid}/mark-unread",
    response_model=MessageResponse,
    summary="Mark Message as Unread",
    description="Marks a specific message as unread.",
)
async def mark_message_as_unread(
    account_id: UUID,
    folder_name: str,
    uid: int,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Mark a specific message as unread.
    """
    imap_service = IMAPService(db)
    try:
        account = await verify_account_access(
            account_id, current_user.id, db
        )
        success = await imap_service.mark_as_read(
            account, folder_name, uid, False
        )
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to mark message as unread",
            )
        return MessageResponse(message="Message marked as unread successfully")
    except IMAPConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )
    except Exception as e:
        logger.error(
            f"Error marking message UID {uid} as unread for account {account_id}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark message as unread",
        )


@router.delete(
    "/{account_id}/folders/{folder_name}/messages/{uid}",
    response_model=MessageResponse,
    summary="Delete Message",
    description="Deletes a specific message from an IMAP folder.",
)
async def delete_message(
    account_id: UUID,
    folder_name: str,
    uid: int,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Delete a specific message from an IMAP folder.
    """
    imap_service = IMAPService(db)
    try:
        account = await verify_account_access(
            account_id, current_user.id, db
        )
        success = await imap_service.delete_message(account, folder_name, uid)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete message",
            )
        return MessageResponse(message="Message deleted successfully")
    except IMAPConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )
    except Exception as e:
        logger.error(
            f"Error deleting message UID {uid} for account {account_id}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete message",
        )


@router.post(
    "/{account_id}/sync",
    response_model=MessageResponse,
    summary="Synchronize IMAP Account",
    description="Synchronizes folders and messages for a given IMAP account.",
)
async def sync_imap_account(
    account_id: UUID,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Synchronize folders and messages for a given IMAP account.
    """
    imap_service = IMAPService(db)
    try:
        await verify_account_access(account_id, current_user.id, db)
        await imap_service.sync_account(account_id)
        return MessageResponse(message="IMAP account synchronization started.")
    except IMAPConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error synchronizing IMAP account {account_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to synchronize account",
        )


@router.post(
    "/{account_id}/check-folders",
    response_model=MessageResponse,
    summary="Check and Fix Essential Folders",
    description="Checks for essential IMAP folders (INBOX, Sent, Drafts, Trash, Spam) and creates them if missing.",
)
async def check_and_fix_essential_folders(
    account_id: UUID,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Check and fix essential IMAP folders for a given account.
    """
    imap_service = IMAPService(db)
    try:
        await verify_account_access(account_id, current_user.id, db)
        success = await imap_service.check_and_fix_folders(account_id)
        if success:
            return MessageResponse(
                message="Essential folders checked and fixed."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to ensure all essential folders exist.",
            )
    except IMAPConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )
    except Exception as e:
        logger.error(
            f"Error checking/fixing folders for account {account_id}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check and fix folders",
        )


@router.get(
    "/{account_id}/retrieve-messages",
    response_model=list[IMAPMessageResponse],
    summary="Retrieve Messages with Filters",
    description="Retrieves messages from a specific IMAP folder, with optional date filtering.",
)
async def retrieve_messages_with_filters(
    account_id: UUID,
    folder_name: str = "INBOX",
    since_date: datetime | None = None,
    limit: int = 100,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Retrieve messages from a specific IMAP folder, optionally filtered by date.
    """
    imap_service = IMAPService(db)
    try:
        await verify_account_access(account_id, current_user.id, db)
        messages = await imap_service.retrieve_messages(str(account_id), limit)
        return messages
    except IMAPConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )
    except Exception as e:
        logger.error(
            f"Error retrieving messages for account {account_id}, folder {folder_name}: {e}"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve messages",
        )
