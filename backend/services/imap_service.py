import asyncio
import base64
import email
import imaplib
import socket
from collections.abc import Sequence
from contextlib import suppress
from datetime import datetime
from typing import Any

import aioimaplib
import python_socks
from fastapi import FastAPI

from utils.socks_patch import patch_python_socks

patch_python_socks()
import re
import time
import uuid
from email.header import decode_header
from email.utils import parsedate_to_datetime
from pathlib import Path
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from config.settings import settings
from core.logger import get_logger
from models.base import IMAPAccount, IMAPFolder, IMAPMessage, ProxyServer
from routers import imap_metrics
from services.oauth_service import OAuthService
from services.proxy_service import ProxyService, ProxyUnavailableError
from utils import imap_utf7
from utils.discovery_utils import get_fallback_hosts
from utils.imap_utils import discover_imap_host


class IMAPConnectionError(Exception):
    pass


class RawDumpError(Exception):
    pass


logger = get_logger(__name__)
REQUIRED_FOLDERS: dict[str, set[str]] = {
    "inbox": {"inbox"},
    "sent": {"sent", "sent items", "sent mail", "[gmail]/sent mail"},
    "drafts": {"drafts", "draft", "drafts_ru"},
    "trash": {"trash", "deleted items", "deleted", "[gmail]/trash"},
    "spam": {"spam", "junk", "bulk mail", "junk email", "[gmail]/spam"},
    "archive": {"archive", "all mail", "[gmail]/all mail"},
}
DYNAMIC_FOLDER_BLACKLIST = {"", "/", ".", ".."}


class IMAPService:
    def __init__(
        self,
        db_session: AsyncSession = None,
        db: AsyncSession | None = None,
    ):
        self.db = db
        if db_session:
            self.db_session = db_session
            self.proxy_service = ProxyService(db_session)
            self.oauth_service = OAuthService(db_session)
        self.connection_timeout = 30
        self._path_prefix = settings.IMAP_PATH_PREFIX_DEFAULT
        self._delimiter = "/"
        self._imap: aioimaplib.IMAP4_SSL | None = None

    def _log_imap(self, direction: str, message: str | bytes) -> None:
        """Print raw IMAP traffic to stdout."""
        if isinstance(message, bytes):
            message = message.decode("utf-8", errors="ignore")
        print(f"IMAP {direction} {message}")

    async def _raw_command(self, command: str, *args) -> Any:
        """Execute an IMAP command and print raw traffic."""
        qargs = [f'"{arg}"' for arg in args]
        cmd_line = " ".join([command] + qargs)
        print("IMAP →", cmd_line)
        if not self._imap:
            raise RuntimeError("IMAP connection not initialized")
        if hasattr(self._imap, "raw_command"):
            resp = await self._imap.raw_command(command, *args)
        else:
            protocol = getattr(self._imap, "protocol", None)
            if protocol:
                from aioimaplib.aioimaplib import Command

                resp = await protocol.execute(
                    Command(command, protocol.new_tag(), *args)
                )
            else:
                method = getattr(self._imap, command.lower())
                if asyncio.iscoroutinefunction(method):
                    resp = await method(*args)
                else:
                    resp = await asyncio.to_thread(method, *args)
        raw_lines = self._lines(resp)
        for line in raw_lines:
            print("IMAP ←", line.decode("utf-8", errors="ignore"))
        return resp

    def _raw_command_sync(self, imap: imaplib.IMAP4_SSL, command: str, *args):
        """Synchronous variant for imaplib IMAP clients."""
        self._log_imap("→", f"{command} {args}")
        method = getattr(imap, command.lower())
        result = method(*args)
        lines = (
            result[1] if isinstance(result, tuple) and len(result) > 1 else []
        )
        for line in lines or []:
            self._log_imap("←", line)
        return result

    @staticmethod
    def _lines(resp: Any) -> list[bytes]:
        return (
            getattr(resp, "lines", None)
            or getattr(resp, "data", None)
            or getattr(resp, "raw", None)
            or []
        )

    async def _cleanup(self, imap: aioimaplib.IMAP4_SSL | None) -> None:
        if not imap:
            return
        try:
            self._imap = imap
            await self._raw_command("LOGOUT")
        except TimeoutError:
            logger.warning("Logout timed out")
            transport = getattr(
                getattr(imap, "protocol", None), "transport", None
            )
            if transport:
                transport.close()
        except Exception as exc:
            logger.warning(f"Error during logout: {exc}")

    def _cleanup_sync(self, imap: imaplib.IMAP4_SSL | None) -> None:
        """Logout for blocking imaplib connections."""
        if not imap:
            return
        with suppress(Exception):
            self._raw_command_sync(imap, "LOGOUT")

    @staticmethod
    def _normalize_folder_name(name: str) -> str:
        """Return a normalized folder identifier for comparisons."""
        if not name:
            return ""
        name = name.strip().strip('"').strip()
        if name.upper().startswith("INBOX."):
            name = name[6:]
        return name.lower()

    @staticmethod
    def _quote_folder(name: str) -> str:
        """Return folder name quoted for IMAP commands."""
        if not name:
            return name
        if name.startswith('"') and name.endswith('"'):
            return name
        if any(ch in name for ch in ' ()"'):
            escaped = name.replace("\\", "\\\\").replace('"', '\\"')
            return f'"{escaped}"'
        return name

    LIST_RE = re.compile(
        b'\\((?P<flags>[^\\)]*)\\)\\s+"?(?P<delim>[^"]*)"?\\s+(?P<name>.+)$'
    )

    @staticmethod
    def _parse_list_line(line: bytes) -> tuple[str, list[str]]:
        """Return folder name and flags from IMAP LIST response line."""
        m = IMAPService.LIST_RE.search(line)
        if not m:
            logger.debug("PARSE FAIL: %r", line)
            return ("", [])
        flags = m.group("flags").decode().split()
        name = m.group("name").decode("latin-1")
        # Remove quotes from folder name if present
        if name.startswith('"') and name.endswith('"'):
            name = name[1:-1]
        return (imap_utf7.decode(name), flags)

    @staticmethod
    def _parse_list(data: Sequence[bytes]) -> list[str]:
        """Return decoded folder names from LIST/LSUB output."""
        folders: list[str] = []
        for raw in data or []:
            if not isinstance(raw, bytes):
                continue
            line = raw
            try:
                name, flags = IMAPService._parse_list_line(line)
            except Exception:
                m = IMAPService.LIST_RE.search(line)
                if not m:
                    continue
                flags = m.group("flags").decode().split()
                name = m.group("name").decode("ascii", errors="replace")
                # Remove quotes from folder name if present
                if name.startswith('"') and name.endswith('"'):
                    name = name[1:-1]
            if "\\Noselect" in flags:
                continue
            folders.append(name)
        return folders

    async def discover_folders(self, imap: aioimaplib.IMAP4_SSL) -> list[str]:
        """Discover real folders on the server using LIST with fallback to LSUB."""
        resp = await imap.list("NIL", "*")
        raw_lines = getattr(resp, "lines", None)
        if raw_lines is None and isinstance(resp, tuple):
            _, raw_lines = resp
        logger.debug("IMAP RAW LIST: %r", raw_lines)
        folders: list[str] = []
        for entry in raw_lines or []:
            if isinstance(entry, bytes):
                name, flags = self._parse_list_line(entry)
                if name and "\\Noselect" not in flags:
                    folders.append(name)
        if not folders:
            resp = await imap.lsub("NIL", "*")
            raw_lines = getattr(resp, "lines", None)
            if raw_lines is None and isinstance(resp, tuple):
                _, raw_lines = resp
            logger.debug("IMAP RAW LIST: %r", raw_lines)
            for entry in raw_lines or []:
                if isinstance(entry, bytes):
                    name, flags = self._parse_list_line(entry)
                    if name and "\\Noselect" not in flags:
                        folders.append(name)
        folders = list(dict.fromkeys(folders))
        return folders

    async def _try_list(self, ref: str, pattern: str) -> list[bytes]:
        """Return raw LIST response lines or empty list."""
        try:
            resp = await self._imap.list(ref, pattern)
            raw = resp.lines or []
            logger.debug("IMAP RAW LIST: %r", raw)
            logger.debug(f"LIST {ref!r} {pattern!r} response: {raw!r}")
        except Exception as exc:
            logger.debug(f"LIST {ref!r} {pattern!r} failed: {exc}")
            return []
        return list(raw)

    async def _try_xlist(self, ref: str, pattern: str) -> list[bytes]:
        protocol = getattr(self._imap, "protocol", None)
        if not protocol:
            return []
        try:
            resp = await self._raw_command("XLIST", ref, pattern)
            logger.debug(
                f"XLIST {ref!r} {pattern!r} response: {self._lines(resp)!r}"
            )
            return list(self._lines(resp))
        except Exception as exc:
            logger.debug(f"XLIST failed: {exc}")
            return []

    async def _list_folders_smart(self) -> list[bytes]:
        """List folders using fallbacks for servers that return no data."""
        ns = await self._raw_command("NAMESPACE")
        ns_lines = self._lines(ns)
        m = (
            re.search(
                b'\\(\\("(?P<prefix>[^"]+)"\\s+"(?P<delim>[^"]+)"\\)\\)',
                ns_lines[0],
            )
            if ns_lines
            else None
        )
        if m:
            prefix = m.group("prefix").decode()
            delim = m.group("delim").decode()
        else:
            prefix = settings.IMAP_PATH_PREFIX_DEFAULT
            delim = "/"
        logger.debug("Detected namespace prefix: %r, delim: %r", prefix, delim)
        self._path_prefix = prefix
        self._delimiter = delim
        if self._imap:
            self._imap._path_prefix = self._path_prefix
        logger.debug(">>> RUN LIST '*' for raw output trace")
        primary = await self._imap.list("NIL", "*")
        logger.debug("IMAP RAW LIST: %r", primary.lines)
        for line in primary.lines or []:
            logger.debug(f"LIST RAW: {line!r}")
        lines_all: list[bytes] = list(primary.lines or [])
        if not lines_all:
            for cmd, arg1, arg2 in [
                ("LIST", "NIL", ""),
                ("LIST", "NIL", "%"),
                ("LSUB", "NIL", "*"),
            ]:
                if cmd == "LIST":
                    resp = await self._imap.list(arg1, arg2)
                else:
                    resp = await self._imap.lsub(arg1, arg2)
                lines_all.extend(resp.lines or [])
            lines_all = list(dict.fromkeys(lines_all))
            if not lines_all:
                logger.debug(
                    "No folders found after LIST/LSUB attempts; will try XLIST"
                )
                lines_all.extend(await self._try_xlist("", "*"))
        lines_all = list(dict.fromkeys(lines_all))
        lines = list(lines_all)
        extra: list[bytes] = []
        for line_bytes in lines:
            if not isinstance(line_bytes, bytes):
                continue
            name, flags = self._parse_list_line(line_bytes)
            if "\\Noselect" in flags and "\\HasChildren" in flags:
                logger.debug("Drilling into container %s", name)
                extra.extend(await self._try_list(name, "*"))
        lines.extend(extra)
        lines = list(dict.fromkeys(lines))
        selectable_found = any(

                "\\Noselect" not in self._parse_list_line(item)[1]
                for item in lines

        )
        if not selectable_found:
            for ref, pattern in [
                ("", ""),
                ("INBOX", "*"),
                ("INBOX.", "*"),
                ("INBOX/", "*"),
            ]:
                lines.extend(await self._try_list(ref, pattern))
            deduped: list[bytes] = []
            seen: set[bytes] = set()
            for ln in lines:
                if ln not in seen:
                    deduped.append(ln)
                    seen.add(ln)
            lines = deduped
        if not lines:
            logger.debug(
                f"LIST '{self._path_prefix}' '*' returned no lines, trying '%'."
            )
            lines = await self._try_list(self._path_prefix, "%")
            extra: list[bytes] = []
            for line in lines:
                if not isinstance(line, bytes):
                    continue
                name, flags = self._parse_list_line(line)
                if not name or "\\Noselect" in flags:
                    continue
                logger.debug(
                    f"Found non-selectable folder '{name}', trying LIST '{name}' '*'."
                )
                extra.extend(await self._try_list(name, "*"))
            lines.extend(extra)
        if not lines:
            logger.debug(
                "LIST with '*' and '%' returned no lines, trying XLIST."
            )
            lines = await self._try_xlist(self._path_prefix, "*")
        if not lines:
            logger.warning('LIST still empty – trying bare LIST "" ""')
            bare = await self._try_list("", "")
            lines.extend(bare)
        if not lines:
            if not getattr(self, "_ensuring_system_folders", False):
                self._ensuring_system_folders = True
                try:
                    await self.ensure_system_folders(self._imap)
                finally:
                    self._ensuring_system_folders = False
            lines = await self._try_list("", "*")
        for line in lines:
            if not isinstance(line, bytes):
                continue
            name, flags = self._parse_list_line(line)
            if (
                "\\Noselect" in flags
                and "\\HasChildren" in flags
                and (name in {"INBOX.", "INBOX/"})
            ):
                if self._imap:
                    self._imap._path_prefix = name
        if not any(
            "\\Noselect" not in self._parse_list_line(ln)[1] for ln in lines
        ):
            logger.warning(
                "No selectable folders found after full scan – will monitor only INBOX",
                extra={"raw_lines": lines},
            )
        logger.debug(f"Final folder list lines: {lines!r}")
        return lines

    async def _get_existing_folders(self) -> set[str]:
        """Return set of normalized folder names from the server."""
        try:
            lines = await self._list_folders_smart()
        except Exception as exc:
            logger.warning(f"Failed to list folders: {exc}")
            return set()
        folders: set[str] = set()
        for line in lines:
            if not isinstance(line, bytes):
                continue
            name, flags = self._parse_list_line(line)
            if not name or "\\Noselect" in flags:
                continue
            normalized = self._normalize_folder_name(name)
            if normalized:
                folders.add(normalized)
        logger.debug(f"Discovered existing folders: {folders}")
        return folders

    async def _get_folder_map(self) -> dict[str, str]:
        """Return mapping of normalized folder names to actual names."""
        try:
            lines = await self._list_folders_smart()
        except Exception as exc:
            logger.warning(f"Failed to list folders: {exc}")
            mapping = {}
        else:
            mapping = {}
            for line in lines:
                if not isinstance(line, bytes):
                    continue
                name, flags = self._parse_list_line(line)
                if not name or "\\Noselect" in flags:
                    continue
                normalized = self._normalize_folder_name(name)
                if normalized:
                    mapping[normalized] = name
        if not mapping:
            logger.warning("Folder map empty – LIST parsing may be broken")
        logger.debug(f"Discovered folder map: {mapping}")
        return mapping

    async def folder_exists(
        self, imap: aioimaplib.IMAP4_SSL, name: str
    ) -> bool:
        """Return True if a folder already exists on the server."""
        if not name or not name.strip():
            return False
        normalized = self._normalize_folder_name(name)
        self._imap = imap
        existing = await self._get_existing_folders()
        return normalized in existing

    async def ensure_folder_exists(
        self, imap: aioimaplib.IMAP4_SSL, name: str
    ) -> bool:
        """Create folder if missing unless it is blacklisted."""
        normalized = self._normalize_folder_name(name)
        if not normalized or normalized in DYNAMIC_FOLDER_BLACKLIST:
            return False
        if await self.folder_exists(imap, name):
            return True
        try:
            resp = await imap.create(
                self._quote_folder(imap_utf7.encode(name))
            )
            lines = b" ".join(getattr(resp, "lines", []))
            if (
                getattr(resp, "result", "OK") == "OK"
                or b"ALREADYEXISTS" in lines
            ):
                logger.info(f"Folder '{name}' ensured to exist.")
                return True
            logger.warning(
                f"Failed to create folder {name}: {getattr(resp, 'lines', '')}"
            )
        except Exception as exc:
            logger.warning(f"Folder create failed for {name}: {exc}")
        return False

    async def _safe_select(
        self, imap: aioimaplib.IMAP4_SSL, folder: str
    ) -> bool:
        """Select a folder if it exists on the server, handling case-insensitivity and fallbacks."""
        encoded_folder = imap_utf7.encode(folder)
        quoted_folder = self._quote_folder(encoded_folder)
        try:
            resp = await imap.select(quoted_folder)
            if getattr(resp, "result", "OK") == "OK":
                logger.debug(f"Successfully selected folder: '{folder}'")
                return True
        except Exception as exc:
            logger.debug(f"Direct select failed for {folder}: {exc}")
        try:
            self._imap = imap
            folder_map = await self._get_folder_map()
            normalized_input = self._normalize_folder_name(folder)
            actual_folder_name = folder_map.get(normalized_input)
            if actual_folder_name and actual_folder_name != folder:
                logger.debug(
                    f"Retrying select with actual folder name '{actual_folder_name}' for '{folder}'"
                )
                encoded_actual = imap_utf7.encode(actual_folder_name)
                quoted_actual = self._quote_folder(encoded_actual)
                resp = await imap.select(quoted_actual)
                if getattr(resp, "result", "OK") == "OK":
                    logger.debug(
                        f"Successfully selected folder (retry): '{actual_folder_name}'"
                    )
                    return True
        except Exception as exc2:
            logger.warning(
                f"Select retry with folder map failed for {folder}: {exc2}"
            )
        if folder_map:
            for alt in folder_map.values():
                if self._normalize_folder_name(alt) == normalized_input:
                    try:
                        resp = await imap.select(
                            self._quote_folder(imap_utf7.encode(alt))
                        )
                        if getattr(resp, "result", "OK") == "OK":
                            logger.debug(
                                "Brute-force select succeeded with %s", alt
                            )
                            return True
                    except Exception:
                        pass
        logger.warning(
            f"Could not select folder '{folder}' after all attempts."
        )
        return False

    async def ensure_all_required_folders(
        self,
        imap: aioimaplib.IMAP4_SSL,
        required: dict[str, set[str]] | list[str] | None = None,
    ) -> None:
        """Ensure provided folders exist on the server."""
        if required is None:
            required = REQUIRED_FOLDERS
        self._imap = imap
        existing = await self._get_existing_folders()
        if isinstance(required, dict):
            items = required.items()
        else:
            items = [(name, {name}) for name in required]
        for logical, aliases in items:
            if any(
                self._normalize_folder_name(a) in existing for a in aliases
            ):
                logger.debug(
                    f"Logical folder '{logical}' or its alias already exists."
                )
                continue
            folder = logical.title() if isinstance(required, dict) else logical
            if await self.ensure_folder_exists(imap, folder):
                existing.add(self._normalize_folder_name(folder))
            else:
                logger.warning(
                    f"Could not ensure existence of logical folder '{logical}' (tried '{folder}')."
                )

    async def ensure_system_folders(self, imap: aioimaplib.IMAP4_SSL) -> None:
        """Ensure standard folders exist or create them."""
        from config.settings import settings

        if not settings.IMAP_CREATE_SYSTEM_FOLDERS:
            logger.debug("Auto-CREATE disabled by settings")
            return
        await self.ensure_all_required_folders(imap, REQUIRED_FOLDERS)

    async def get_accounts(
        self, status: str | None = None, session_id: UUID | None = None
    ) -> list[IMAPAccount]:
        """Return list of IMAP accounts optionally filtered by status and session."""
        stmt = select(IMAPAccount)
        if status:
            stmt = stmt.where(IMAPAccount.status == status)
        if session_id:
            stmt = stmt.where(IMAPAccount.session_id == session_id)
        stmt = stmt.order_by(IMAPAccount.created_at.desc())
        result = await self.db_session.execute(stmt)
        accounts = result.scalars().all()
        return accounts

    async def get_account(self, account_id: str) -> IMAPAccount | None:
        """Retrieve a single IMAP account by id."""
        result = await self.db_session.execute(
            select(IMAPAccount).where(IMAPAccount.id == account_id)
        )
        return result.scalar_one_or_none()

    async def get_account_by_id(
        self, account_id: str
    ) -> IMAPAccount | None:
        """Backward compatible alias for get_account."""
        return await self.get_account(account_id)

    async def create_account(self, account_data) -> IMAPAccount:
        """Create a new IMAP account."""
        if not getattr(account_data, "session_id", None):
            raise ValueError("session_id is required")
        try:
            session_uuid = getattr(account_data, "session_id", None)
            if isinstance(session_uuid, str):
                session_uuid = UUID(session_uuid)
            account = IMAPAccount(
                id=str(uuid.uuid4()),
                session_id=session_uuid,
                email=account_data.email,
                password=account_data.password,
                imap_server=account_data.server,
                imap_port=account_data.port,
                use_ssl=True,
                status="pending",
            )
            self.db_session.add(account)
            await self.db_session.commit()
            await self.db_session.refresh(account)
            return account
        except Exception as e:
            await self.db_session.rollback()
            logger.error(f"Failed to create IMAP account: {e}")
            raise

    async def update_account(
        self, account_id: str, account_data
    ) -> IMAPAccount | None:
        """Update existing IMAP account."""
        account = await self.get_account(account_id)
        if not account:
            return None
        data = account_data.model_dump(exclude_unset=True)
        mapping = {"server": "imap_server", "port": "imap_port"}
        for key, value in data.items():
            attr = mapping.get(key, key)
            setattr(account, attr, value)
        try:
            self.db_session.add(account)
            await self.db_session.commit()
            await self.db_session.refresh(account)
            return account
        except Exception as e:
            await self.db_session.rollback()
            logger.error(f"Failed to update IMAP account {account_id}: {e}")
            raise

    async def delete_account(self, account_id: str) -> bool:
        """Delete IMAP account by id."""
        account = await self.get_account(account_id)
        if not account:
            return False
        try:
            stmt_messages = delete(IMAPMessage).where(
                IMAPMessage.folder_id.in_(
                    select(IMAPFolder.id).where(
                        IMAPFolder.imap_account_id == account_id
                    )
                )
            )
            await self.db_session.execute(stmt_messages)
            stmt_folders = delete(IMAPFolder).where(
                IMAPFolder.imap_account_id == account_id
            )
            await self.db_session.execute(stmt_folders)
            await self.db_session.delete(account)
            await self.db_session.commit()
            return True
        except Exception as e:
            await self.db_session.rollback()
            logger.error(f"Failed to delete IMAP account {account_id}: {e}")
            return False

    async def test_connection(self, account_id: str) -> dict[str, Any]:
        """Test connection to the IMAP account and return status."""
        account = await self.get_account(account_id)
        if not account:
            return {"status": "error", "message": "Account not found"}
        imap = None
        try:
            imap = await self.connect_imap(account)
            return {"status": "active", "message": "Login successful"}
        except Exception as e:
            logger.error(f"Connection test failed for {account.email}: {e}")
            return {"status": "invalid", "message": str(e)}
        finally:
            if imap:
                await self._cleanup(imap)

    async def connect_imap(
        self, imap_account: IMAPAccount, timeout: int = 30
    ) -> aioimaplib.IMAP4_SSL:
        """Connect to IMAP server through proxy and optionally fetch data."""
        proxy: ProxyServer | None = None
        if settings.IMAP_PROXY_FORCE:
            proxy = await self.proxy_service.get_working_proxy(
                str(imap_account.session_id)
            )
            if not proxy:
                raise ProxyUnavailableError(
                    "No working proxy available and IMAP_PROXY_FORCE is enabled"
                )
        print("Using proxy:", proxy)
        domain = imap_account.email.split("@")[-1]
        host, port = await discover_imap_host(imap_account)
        hosts = [host]
        imap_port = port
        try:
            extra = await get_fallback_hosts(domain)
            hosts.extend(h for h in extra if h not in hosts)
        except Exception as e:
            logger.warning(f"Failed to get fallback hosts for {domain}: {e}")
        first_exc: Exception | None = None
        for host_attempt in hosts:
            attempts = 0
            while attempts < 2:
                try:
                    if imap_account.use_oauth:
                        access_token = (
                            await self.oauth_service.get_valid_access_token(
                                imap_account.client_id,
                                imap_account.refresh_token,
                            )
                        )
                        if not access_token:
                            raise ValueError("OAuth authentication failed")
                    if proxy:
                        proxy_type_str = (
                            proxy.proxy_type.lower()
                            if proxy.proxy_type
                            else "socks5"
                        )
                        if proxy_type_str == "socks5":
                            proxy_type_enum = python_socks.ProxyType.SOCKS5
                        elif proxy_type_str == "socks4":
                            proxy_type_enum = python_socks.ProxyType.SOCKS4
                        else:
                            proxy_type_enum = python_socks.ProxyType.HTTP
                        if proxy.username or proxy.password:
                            sock = await python_socks.proxy_connect(
                                proxy_type=proxy_type_enum,
                                host=proxy.host,
                                port=proxy.port,
                                username=proxy.username,
                                password=proxy.password,
                                dest_host=host_attempt,
                                dest_port=imap_port,
                                timeout=timeout,
                            )
                        else:
                            sock = await python_socks.proxy_connect(
                                proxy_type=proxy_type_enum,
                                host=proxy.host,
                                port=proxy.port,
                                dest_host=host_attempt,
                                dest_port=imap_port,
                                timeout=timeout,
                            )
                        imap = aioimaplib.IMAP4_SSL(sock=sock)
                    else:
                        imap = aioimaplib.IMAP4_SSL(
                            host=host_attempt, port=imap_port
                        )
                    imap.timeout = timeout
                    await imap.wait_hello_from_server()
                    if imap_account.use_oauth:
                        auth_string = f"user={imap_account.email}\x01auth=Bearer {access_token}\x01\x01"
                        auth_string_b64 = base64.b64encode(
                            auth_string.encode()
                        ).decode()
                        login_resp = await imap.authenticate(
                            "XOAUTH2", auth_string_b64
                        )
                    else:
                        login_resp = await imap.login(
                            imap_account.email, imap_account.password
                        )
                    if getattr(login_resp, "result", "OK") != "OK":
                        raise IMAPConnectionError(
                            f"Login failed for {imap_account.email}: {getattr(login_resp, 'lines', '')}"
                        )
                    imap._path_prefix = settings.IMAP_PATH_PREFIX_DEFAULT
                    self._imap = imap
                    return imap
                except socket.gaierror as exc:
                    first_exc = first_exc or exc
                    logger.error(
                        f"IMAP connect error to {host_attempt}:{imap_port} for {imap_account.email}: {exc}"
                    )
                    break
                except (TimeoutError, ConnectionRefusedError) as exc:
                    first_exc = first_exc or exc
                    logger.error(
                        f"IMAP connect error to {host_attempt}:{imap_port} for {imap_account.email}: {exc}"
                    )
                    attempts += 1
                    await asyncio.sleep(1)
                    continue
                except Exception as e:
                    first_exc = first_exc or e
                    logger.error(
                        f"IMAP connection failed for {imap_account.email} via {host_attempt}: {e}"
                    )
                    attempts += 1
                    await asyncio.sleep(1)
            if first_exc and isinstance(first_exc, socket.gaierror):
                continue
        if first_exc:
            logger.error(
                f"IMAP connection failed for {imap_account.email}: {first_exc}"
            )
            raise IMAPConnectionError(str(first_exc)) from first_exc
        raise IMAPConnectionError(
            "Failed to connect to IMAP server after all attempts."
        )

    async def list_imap_folders(self, account_id: str) -> list[str]:
        """Return decoded folder names for an IMAP account."""
        account = await self.get_account(account_id)
        if not account:
            raise ValueError("IMAP account not found")
        imap_conn = None
        try:
            imap_conn = await self.connect_imap(account)
            folder_lines = await self._list_folders_smart()
            folders: list[str] = []
            for line in folder_lines:
                name, flags = self._parse_list_line(line)
                if name and "\\Noselect" not in flags:
                    folders.append(name)
            return folders
        except Exception as e:
            logger.error(f"IMAP error: {e}")
            raise
            logger.error(
                f"Failed to list folders for account {account_id}: {e}"
            )
            raise IMAPConnectionError(f"Failed to list folders: {e}") from e
        finally:
            if imap_conn:
                await self._cleanup(imap_conn)

    async def _get_folders_from_connection(
        self, imap: aioimaplib.IMAP4_SSL, imap_account: IMAPAccount
    ) -> list[dict[str, Any]]:
        """Return folders using an existing IMAP connection."""
        self._imap = imap
        try:
            folder_lines = await self._list_folders_smart()
            logger.debug(f"Raw folder lines from IMAP: {folder_lines!r}")
        except (TimeoutError, ConnectionRefusedError, socket.gaierror) as exc:
            logger.error(f"Folder list failed for {imap_account.email}: {exc}")
            raise IMAPConnectionError(str(exc)) from exc
        except Exception as exc:
            logger.error(
                f"Unexpected error listing folders for {imap_account.email}: {exc}"
            )
            # Fallback: try basic LIST command
            try:
                basic_resp = await imap.list("", "*")
                folder_lines = basic_resp.lines or []
                logger.debug(f"Fallback folder lines: {folder_lines!r}")
            except Exception as fallback_exc:
                logger.error(
                    f"Fallback folder listing also failed: {fallback_exc}"
                )
                # Return at least INBOX if everything fails
                folder_lines = [b'() "/" "INBOX"']

        folders: list[dict[str, Any]] = []
        processed_folders = set()  # Avoid duplicates

        for folder_line in folder_lines:
            try:
                folder_name, flags = self._parse_list_line(folder_line)
                if not folder_name or "\\Noselect" in flags:
                    logger.debug(
                        f"Skipping folder '{folder_name}' (empty name or \\Noselect flag)."
                    )
                    continue

                # Avoid duplicates
                if folder_name in processed_folders:
                    continue
                processed_folders.add(folder_name)

                # Try to get folder status
                total_count = unread_count = 0
                try:
                    if not await self._safe_select(imap, folder_name):
                        logger.warning(
                            f"Could not select folder '{folder_name}', using default counts."
                        )
                    else:
                        status_response = await imap.status(
                            self._quote_folder(imap_utf7.encode(folder_name)),
                            "(MESSAGES UNSEEN)",
                        )
                        logger.debug(
                            f"Status response for '{folder_name}': {status_response.lines!r}"
                        )

                        if status_response.lines:
                            status_line = status_response.lines[0].decode()
                            if "MESSAGES" in status_line:
                                try:
                                    total_count = int(
                                        status_line.split("MESSAGES ")[
                                            1
                                        ].split()[0]
                                    )
                                except (IndexError, ValueError):
                                    logger.warning(
                                        f"Could not parse MESSAGES count from status line: {status_line}"
                                    )
                            if "UNSEEN" in status_line:
                                try:
                                    unread_count = int(
                                        status_line.split("UNSEEN ")[
                                            1
                                        ].split()[0]
                                    )
                                except (IndexError, ValueError):
                                    logger.warning(
                                        f"Could not parse UNSEEN count from status line: {status_line}"
                                    )
                except Exception as folder_exc:
                    logger.warning(
                        f"Status failed for {folder_name}: {folder_exc}"
                    )

                folders.append(
                    {
                        "name": folder_name,
                        "messages_count": total_count,
                        "unseen_count": unread_count,
                        "flags": flags,
                    }
                )
                logger.debug(
                    f"Added folder: {folder_name}, Total: {total_count}, Unread: {unread_count}"
                )

                # Update database
                try:
                    await self._update_folder_in_db(
                        imap_account.id, folder_name, total_count, unread_count
                    )
                except Exception as db_exc:
                    logger.warning(f"Failed to update folder in DB: {db_exc}")

            except Exception as parse_exc:
                logger.warning(
                    f"Failed to parse folder line {folder_line!r}: {parse_exc}"
                )
                continue

        # If no folders found, try to ensure system folders and retry
        if not folders:
            logger.warning(
                f"No folders found for {imap_account.email}, ensuring system folders"
            )
            try:
                await self.ensure_system_folders(imap)
                # Retry with a simpler approach
                try:
                    basic_resp = await imap.list("", "*")
                    fallback_lines = basic_resp.lines or []
                except Exception:
                    # Last resort: add INBOX manually
                    fallback_lines = [b'() "/" "INBOX"']

                for line in fallback_lines:
                    try:
                        folder_name, flags = self._parse_list_line(line)
                        if (
                            not folder_name
                            or "\\Noselect" in flags
                            or folder_name in processed_folders
                        ):
                            continue

                        # Simple folder entry without status check for fallback
                        folders.append(
                            {
                                "name": folder_name,
                                "messages_count": 0,
                                "unseen_count": 0,
                                "flags": flags,
                            }
                        )
                        logger.debug(f"Added fallback folder: {folder_name}")

                        try:
                            await self._update_folder_in_db(
                                imap_account.id, folder_name, 0, 0
                            )
                        except Exception as db_exc:
                            logger.warning(
                                f"Failed to update fallback folder in DB: {db_exc}"
                            )

                    except Exception as fallback_exc:
                        logger.warning(
                            f"Failed to process fallback folder line {line!r}: {fallback_exc}"
                        )

            except Exception as ensure_exc:
                logger.error(f"Failed to ensure system folders: {ensure_exc}")
                # Absolute fallback: add INBOX
                if not folders:
                    folders.append(
                        {
                            "name": "INBOX",
                            "messages_count": 0,
                            "unseen_count": 0,
                            "flags": [],
                        }
                    )
                    logger.info("Added INBOX as absolute fallback")

        logger.info(f"Found {len(folders)} folders for {imap_account.email}")
        return folders

    async def _get_messages_from_connection(
        self,
        imap: aioimaplib.IMAP4_SSL,
        imap_account: IMAPAccount,
        folder_name: str,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Return messages from a folder using an existing connection."""
        folder = folder_name.strip().strip('"') if folder_name else ""
        if not folder:
            logger.warning("Unknown folder name '%s'", folder_name)
            return []
        if not await self._safe_select(imap, folder):
            return []
        try:
            search_response = await imap.search(None, "ALL")
            print(
                "IMAP RAW SEARCH:",
                repr(getattr(search_response, "lines", None)),
            )
        except (TimeoutError, ConnectionRefusedError, socket.gaierror) as exc:
            logger.error(f"IMAP search failed in {folder}: {exc}")
            raise IMAPConnectionError(str(exc)) from exc
        if not search_response.lines:
            message_ids = []
        else:
            tokens = search_response.lines[0].decode().split()
            message_ids = [int(t) for t in tokens if t.isdigit()]
        message_ids.sort(reverse=True)
        paginated_ids = message_ids[offset : offset + limit]
        logger.debug(
            f"Fetching {len(paginated_ids)} messages from folder '{folder}' (UIDs: {paginated_ids})"
        )
        messages: list[dict[str, Any]] = []
        for msg_id in paginated_ids:
            try:
                fetch_response = result = await imap.execute(
                    str(msg_id), "(UID FLAGS ENVELOPE BODYSTRUCTURE)"
                )
                logger.debug(
                    f"Fetch response for UID {msg_id}: {fetch_response.parsed!r}"
                )
                if fetch_response.parsed and fetch_response.parsed[0]:
                    parsed_data = fetch_response.parsed[0]
                    message_data = self._parse_message_summary(parsed_data)
                    message_data["uid"] = int(parsed_data.get(b"UID", msg_id))
                    message_data["folder"] = folder
                    messages.append(message_data)
                    await self._store_message_in_db(
                        imap_account.id, folder, message_data
                    )
            except (TimeoutError, ConnectionRefusedError, socket.gaierror) as exc:
                logger.error(f"Fetch failed for {msg_id} in {folder}: {exc}")
                continue
            except Exception as e:
                logger.warning(f"Failed to fetch message {msg_id}: {e}")
                continue
        return messages

    async def _retrieve_messages_from_connection(
        self,
        imap: aioimaplib.IMAP4_SSL,
        imap_account: IMAPAccount,
        limit: int = 10,
        *,
        record_metrics: bool = True,
    ) -> list[dict[str, Any]]:
        """Fetch recent messages from all folders using an open connection."""
        start = time.perf_counter()
        success = True
        emails_rx = 0
        try:
            folder_resp = await imap.list("NIL", "*")
            raw_lines = self._lines(folder_resp)
            print("RAW LIST RESPONSE:", repr(raw_lines))
            if getattr(folder_resp, "result", "OK") != "OK":
                raise IMAPConnectionError(
                    f"LIST returned {getattr(folder_resp, 'result', '')}"
                )
        except Exception as exc:
            success = False
            logger.error(
                f"Failed to list folders for {imap_account.email}: {exc}"
            )
            raise IMAPConnectionError(str(exc)) from exc
        try:
            folder_names: list[str] = []
            for entry in raw_lines or []:
                if isinstance(entry, bytes):
                    name, flags = self._parse_list_line(entry)
                    if name and "\\Noselect" not in flags:
                        folder_names.append(name)
            folder_names = [f for f in folder_names if f.strip()]
            logger.debug(f"Folders to retrieve messages from: {folder_names}")
            all_messages: list[dict[str, Any]] = []
            seen: set[tuple[str, int]] = set()
            for name in folder_names:
                if not name or not name.strip():
                    continue
                try:
                    msgs = await self._get_messages_from_connection(
                        imap, imap_account, name, limit
                    )
                except Exception as exc:
                    logger.warning(
                        f"Failed to get messages from {name}: {exc}"
                    )
                    continue
                for m in msgs:
                    key = (name, m.get("uid"))
                    if key not in seen:
                        seen.add(key)
                        m["folder"] = name
                        all_messages.append(m)
            sorted_msgs = sorted(
                all_messages,
                key=lambda m: m.get("received_at", ""),
                reverse=True,
            )
            result = sorted_msgs[:limit]
            emails_rx = len(result)
            return result
        except Exception:
            success = False
            raise
        finally:
            if record_metrics:
                elapsed_ms = (time.perf_counter() - start) * 1000
                imap_metrics.IMAP_METRICS.record(
                    success, elapsed_ms, emails_rx if success else 0
                )
                await imap_metrics.publish_metrics()

    async def get_folders(
        self, imap_account: IMAPAccount | str
    ) -> list[dict[str, Any]]:
        """Get list of IMAP folders with unread counts"""
        if isinstance(imap_account, str):
            account_obj = await self.get_account(imap_account)
            if not account_obj:
                raise ValueError("IMAP account not found")
            imap_account = account_obj
        imap = None
        try:
            imap = await self.connect_imap(imap_account)
            folders = await self._get_folders_from_connection(
                imap, imap_account
            )
            return folders
        except Exception as e:
            logger.error(
                f"Failed to get folders for {imap_account.email}: {e}"
            )
            raise
        finally:
            if imap:
                await self._cleanup(imap)

    async def get_messages(
        self,
        imap_account: IMAPAccount | str,
        folder_name: str,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Get messages from a folder"""
        if isinstance(imap_account, str):
            account_obj = await self.get_account(imap_account)
            if not account_obj:
                raise ValueError("IMAP account not found")
            imap_account = account_obj
        folder = folder_name.strip().strip('"') if folder_name else ""
        if not folder:
            logger.warning("Unknown folder name '%s'", folder_name)
            return []
        imap = None
        try:
            imap = await self.connect_imap(imap_account)
            messages = await self._get_messages_from_connection(
                imap, imap_account, folder, limit, offset
            )
            return messages
        except Exception as e:
            logger.error(f"Failed to get messages from {folder}: {e}")
            raise
        finally:
            if imap:
                await self._cleanup(imap)

    async def get_message_content(
        self, imap_account: IMAPAccount, folder_name: str, uid: int
    ) -> dict[str, Any]:
        """Get full message content"""
        folder = folder_name.strip().strip('"') if folder_name else ""
        imap = None
        try:
            imap = await self.connect_imap(imap_account)
            if not await self._safe_select(imap, folder):
                raise IMAPConnectionError(f"unable to select {folder}")
            fetch_response = result = await imap.execute(
                str(uid), "(UID FLAGS BODY[])"
            )
            if not fetch_response.parsed or not fetch_response.parsed[0]:
                raise ValueError("Message not found or parsed data is empty")
            raw_email_bytes = fetch_response.parsed[0].get(b"BODY[]")
            if not raw_email_bytes:
                logger.warning(
                    f"Could not extract raw email body for UID {uid} from parsed data."
                )
                raw_line = (
                    fetch_response.lines[0] if fetch_response.lines else b""
                )
                match = re.search(
                    b"BODY\\[\\]\\s+\\{\\d+\\}\\r\\n(.*)\\r\\n\\)",
                    raw_line,
                    re.DOTALL,
                )
                if match:
                    raw_email_bytes = match.group(1)
                else:
                    logger.error(
                        f"Failed to extract raw email body for UID {uid} from both parsed data and raw line."
                    )
                    raise ValueError("Could not extract raw email body")
            msg = email.message_from_bytes(raw_email_bytes)
            html_content = ""
            text_content = ""
            attachments = []
            if msg.is_multipart():
                for part in msg.walk():
                    content_type = part.get_content_type()
                    content_disposition = str(part.get("Content-Disposition"))
                    if "attachment" in content_disposition:
                        filename = part.get_filename()
                        if filename:
                            attachments.append(
                                {
                                    "filename": filename,
                                    "content_type": content_type,
                                    "size": len(
                                        part.get_payload(decode=True) or b""
                                    ),
                                }
                            )
                    elif content_type == "text/plain":
                        text_content = part.get_payload(decode=True).decode(
                            "utf-8", errors="ignore"
                        )
                    elif content_type == "text/html":
                        html_content = part.get_payload(decode=True).decode(
                            "utf-8", errors="ignore"
                        )
            elif msg.get_content_type() == "text/plain":
                text_content = msg.get_payload(decode=True).decode(
                    "utf-8", errors="ignore"
                )
            elif msg.get_content_type() == "text/html":
                html_content = msg.get_payload(decode=True).decode(
                    "utf-8", errors="ignore"
                )
            result = {
                "uid": uid,
                "subject": self._decode_header(msg.get("Subject", "")),
                "sender": msg.get("From", ""),
                "html_content": html_content,
                "text_content": text_content,
                "attachments": attachments,
                "received_at": (
                    parsedate_to_datetime(msg.get("Date", "")).isoformat()
                    if msg.get("Date")
                    else None
                ),
                "folder": folder,
            }
            return result
        except Exception as e:
            logger.error(f"Failed to get message content for UID {uid}: {e}")
            raise
        finally:
            if imap:
                await self._cleanup(imap)

    async def mark_as_read(
        self,
        imap_account: IMAPAccount | str,
        folder_name: str,
        uid: int,
        read: bool = True,
    ) -> bool:
        """Mark or unmark a message as read."""
        if isinstance(imap_account, str):
            account_obj = await self.get_account(imap_account)
            if not account_obj:
                return False
            imap_account = account_obj
        folder = folder_name.strip().strip('"') if folder_name else ""
        imap = None
        try:
            imap = await self.connect_imap(imap_account)
            if not await self._safe_select(imap, folder):
                return False
            flag_op = "+FLAGS" if read else "-FLAGS"
            await imap.store(str(uid), flag_op, "\\Seen")
            state = "read" if read else "unread"
            logger.info(
                f"Marked message {uid} in folder '{folder}' as {state}."
            )
            return True
        except Exception as e:
            logger.error(f"Failed to mark message {uid} as read: {e}")
            return False
        finally:
            if imap:
                await self._cleanup(imap)

    async def delete_message(
        self, imap_account: IMAPAccount, folder_name: str, uid: int
    ) -> bool:
        """Delete message"""
        folder = folder_name.strip().strip('"') if folder_name else ""
        imap = None
        try:
            imap = await self.connect_imap(imap_account)
            if not await self._safe_select(imap, folder):
                return False
            await imap.store(str(uid), "+FLAGS", "\\Deleted")
            await imap.expunge()
            logger.info(f"Deleted message {uid} from folder '{folder}'.")
            return True
        except Exception as e:
            logger.error(f"Failed to delete message {uid}: {e}")
            return False
        finally:
            if imap:
                await self._cleanup(imap)

    @staticmethod
    def _decode_header(header: str) -> str:
        try:
            decoded_parts = decode_header(header)
            decoded_header = ""
            for part, encoding in decoded_parts:
                if isinstance(part, bytes):
                    decoded_header += part.decode(
                        encoding or "utf-8", errors="ignore"
                    )
                else:
                    decoded_header += part
            return decoded_header
        except Exception:
            logger.warning(f"Failed to decode header: '{header}'")
            return header

    @staticmethod
    def _parse_message_summary(
        parsed_data: dict[bytes, Any],
    ) -> dict[str, Any]:
        """Parse IMAP FETCH response for message summary (headers, flags, preview)."""
        envelope = parsed_data.get(b"ENVELOPE")
        flags = parsed_data.get(b"FLAGS", ())
        bodystructure = parsed_data.get(b"BODYSTRUCTURE")
        uid = int(parsed_data.get(b"UID", 0))
        subject = ""
        sender = ""
        sender_name = ""
        received_at = None
        preview = "No preview available (body not fetched for summary)"
        is_read = b"\\Seen" in flags
        is_starred = b"\\Flagged" in flags
        if envelope:
            try:
                if len(envelope) > 1 and envelope[1]:
                    subject = IMAPService._decode_header(
                        envelope[1].decode("utf-8", errors="ignore")
                    )
                if len(envelope) > 2 and envelope[2] and envelope[2][0]:
                    sender_part = envelope[2][0]
                    if sender_part[0]:
                        sender_name = IMAPService._decode_header(
                            sender_part[0].decode("utf-8", errors="ignore")
                        )
                    if (
                        len(sender_part) > 3
                        and sender_part[2]
                        and sender_part[3]
                    ):
                        sender = f"{sender_part[2].decode('utf-8', errors='ignore')}@{sender_part[3].decode('utf-8', errors='ignore')}"
                if len(envelope) > 0 and envelope[0]:
                    try:
                        received_at = parsedate_to_datetime(
                            envelope[0].decode("utf-8", errors="ignore")
                        ).isoformat()
                    except Exception:
                        received_at = None
            except IndexError as e:
                logger.warning(
                    f"Error parsing ENVELOPE: {e}, Envelope data: {envelope}"
                )
            except UnicodeDecodeError as e:
                logger.warning(
                    f"UnicodeDecodeError in ENVELOPE parsing: {e}, Envelope data: {envelope}"
                )
            except Exception as e:
                logger.warning(
                    f"General error parsing ENVELOPE: {e}, Envelope data: {envelope}"
                )
        if bodystructure:

            def find_text_part_type(bs):
                if isinstance(bs, tuple) and len(bs) > 0:
                    if bs[0].lower() == b"text":
                        if bs[1].lower() == b"plain":
                            return "Text content available."
                        elif bs[1].lower() == b"html":
                            return "HTML content available."
                    if len(bs) > 0 and isinstance(bs[0], tuple):
                        for part in bs:
                            if isinstance(part, tuple):
                                found = find_text_part_type(part)
                                if found:
                                    return found
                return None

            content_type_hint = find_text_part_type(bodystructure)
            if content_type_hint:
                preview = content_type_hint
        return {
            "uid": uid,
            "sender": sender,
            "sender_name": sender_name,
            "subject": subject,
            "preview": preview,
            "is_read": is_read,
            "is_starred": is_starred,
            "priority": "normal",
            "received_at": received_at,
        }

    async def _update_folder_in_db(
        self,
        imap_account_id: str,
        folder_name: str,
        total_count: int,
        unread_count: int,
    ):
        """Update folder information in database"""
        try:
            query = select(IMAPFolder).where(
                IMAPFolder.imap_account_id == imap_account_id,
                IMAPFolder.name == folder_name,
            )
            result = await self.db_session.execute(query)
            folder = result.scalar_one_or_none()
            if folder:
                folder.total_count = total_count
                folder.unread_count = unread_count
                folder.last_sync = datetime.utcnow()
                logger.debug(
                    f"Updated folder '{folder_name}' in DB for account {imap_account_id}"
                )
            else:
                folder = IMAPFolder(
                    imap_account_id=imap_account_id,
                    name=folder_name,
                    total_count=total_count,
                    unread_count=unread_count,
                    last_sync=datetime.utcnow(),
                )
                self.db_session.add(folder)
                logger.debug(
                    f"Created folder '{folder_name}' in DB for account {imap_account_id}"
                )
            await self.db_session.commit()
        except Exception as e:
            logger.error(f"Failed to update folder in DB: {e}")
            await self.db_session.rollback()

    async def _store_message_in_db(
        self,
        imap_account_id: str,
        folder_name: str,
        message_data: dict[str, Any],
    ):
        """Store message in database"""
        try:
            query = select(IMAPFolder).where(
                IMAPFolder.imap_account_id == imap_account_id,
                IMAPFolder.name == folder_name,
            )
            result = await self.db_session.execute(query)
            folder = result.scalar_one_or_none()
            if not folder:
                logger.warning(
                    f"Folder '{folder_name}' not found in DB for account {imap_account_id}, skipping message store."
                )
                return
            query = select(IMAPMessage).where(
                IMAPMessage.folder_id == folder.id,
                IMAPMessage.uid == message_data["uid"],
            )
            result = await self.db_session.execute(query)
            existing_message = result.scalar_one_or_none()
            if not existing_message:
                message = IMAPMessage(
                    folder_id=folder.id,
                    uid=message_data["uid"],
                    message_id=f"msg_{message_data['uid']}",
                    sender=message_data.get("sender", ""),
                    sender_name=message_data.get("sender_name", ""),
                    subject=message_data.get("subject", ""),
                    preview=message_data.get("preview", ""),
                    is_read=message_data.get("is_read", False),
                    is_starred=message_data.get("is_starred", False),
                    priority=message_data.get("priority", "normal"),
                    received_at=(
                        datetime.fromisoformat(message_data["received_at"])
                        if message_data.get("received_at")
                        else datetime.utcnow()
                    ),
                )
                self.db_session.add(message)
                await self.db_session.commit()
                logger.debug(
                    f"Stored message UID {message_data['uid']} in DB for folder '{folder_name}'."
                )
            else:
                logger.debug(
                    f"Message UID {message_data['uid']} already exists in DB for folder '{folder_name}', skipping store."
                )
        except Exception as e:
            logger.error(f"Failed to store message in DB: {e}")
            await self.db_session.rollback()

        # async def get_message(self, message_id: UUID) -> Optional[IMAPMessage]:
        """Retrieve a single stored message"""
        result = await self.db_session.execute(
            select(IMAPMessage).where(IMAPMessage.id == message_id)
        )
        return result.scalar_one_or_none()

    async def update_settings(
        self, account_id: str, settings_data
    ) -> IMAPAccount | None:
        """Update IMAP server settings"""
        return await self.update_account(account_id, settings_data)

    async def sync_account(self, account_id: str) -> None:
        """Synchronize folders and messages for an account."""
        account = await self.get_account(account_id)
        if not account:
            logger.error(f"Account {account_id} not found for sync")
            return
        imap = None
        try:
            imap = await self.connect_imap(account)
            folders = await self._get_folders_from_connection(imap, account)
            for folder in folders:
                await self._get_messages_from_connection(
                    imap, account, folder["name"]
                )
            logger.info(f"IMAP account {account.email} synchronized")
        except Exception as e:
            logger.error(f"Failed to sync account {account.email}: {e}")
        finally:
            if imap:
                await self._cleanup(imap)

    async def check_and_fix_folders(self, account_id: str) -> list[str]:
        """Return existing folders and update DB info."""
        account = await self.get_account(account_id)
        if not account:
            raise ValueError("IMAP account not found")
        imap = None
        try:
            imap = await self.connect_imap(account)
            infos = await self._get_folders_from_connection(imap, account)
            folders = sorted(f["name"] for f in infos)
            return folders
        except Exception as e:
            logger.error(
                f"Failed to check and fix folders for {account.email}: {e}"
            )
            raise
        finally:
            if imap:
                await self._cleanup(imap)

    async def retrieve_messages(
        self, account_id: str, limit: int = 10
    ) -> list[dict[str, Any]]:
        """Fetch recent messages from all folders."""
        start = time.perf_counter()
        success = True
        emails_rx = 0
        account = await self.get_account(account_id)
        if not account:
            raise ValueError("Account not found")
        imap = None
        try:
            imap = await self.connect_imap(account)
            result = await self._retrieve_messages_from_connection(
                imap, account, limit, record_metrics=False
            )
            emails_rx = len(result)
            return result
        except Exception:
            success = False
            raise
        finally:
            if imap:
                await self._cleanup(imap)
            elapsed_ms = (time.perf_counter() - start) * 1000
            imap_metrics.IMAP_METRICS.record(
                success, elapsed_ms, emails_rx if success else 0
            )
            await imap_metrics.publish_metrics()

    async def start_auto_retrieval(
        self,
        account_id: str,
        interval: int = 60,
        app: FastAPI | None = None,
    ) -> None:
        """Start periodic retrieval for the given account."""
        if not 60 <= interval <= 3600:
            raise ValueError("interval must be between 60 and 3600 seconds")
        if app is None:
            from main import app as _app

            app = _app
        tasks: dict[str, asyncio.Task] = getattr(
            app.state, "auto_retrieve_tasks", {}
        )
        scheduler: asyncio.TaskGroup | None = getattr(
            app.state, "scheduler", None
        )
        if scheduler is None:
            raise RuntimeError("scheduler not initialized")
        if account_id in tasks:
            raise RuntimeError("already running")

        async def _loop() -> None:
            while True:
                try:
                    await self.retrieve_messages(account_id)
                except (TimeoutError, ConnectionRefusedError, socket.gaierror) as exc:
                    logger.error(
                        f"Auto retrieval network error for {account_id}: {exc}"
                    )
                    await asyncio.sleep(min(5, interval))
                    continue
                except Exception as exc:
                    logger.error(
                        f"Auto retrieval failed for {account_id}: {exc}"
                    )
                await asyncio.sleep(interval)

        task = scheduler.create_task(_loop())
        tasks[account_id] = task

    async def stop_auto_retrieval(
        self, account_id: str, app: FastAPI | None = None
    ) -> bool:
        """Stop periodic retrieval for the given account."""
        if app is None:
            from main import app as _app

            app = _app
        tasks: dict[str, asyncio.Task] = getattr(
            app.state, "auto_retrieve_tasks", {}
        )
        task = tasks.pop(account_id, None)
        if task:
            task.cancel()
            with suppress(asyncio.CancelledError):
                await task
            return True
        return False

    def is_auto_retrieving(
        self, account_id: str, app: FastAPI | None = None
    ) -> bool:
        """Return True if auto retrieval is active for account."""
        if app is None:
            from main import app as _app

            app = _app
        tasks: dict[str, asyncio.Task] = getattr(
            app.state, "auto_retrieve_tasks", {}
        )
        return account_id in tasks

    async def _get_imap_connection(
        self, account: IMAPAccount, timeout: int, retries: int
    ) -> aioimaplib.IMAP4_SSL:
        proxy: ProxyServer | None = None
        if settings.IMAP_PROXY_FORCE:
            proxy = await self.proxy_service.get_working_proxy(
                str(account.session_id)
            )
            if not proxy:
                raise ProxyUnavailableError(
                    "No working proxy available and IMAP_PROXY_FORCE is enabled"
                )
        print("Using proxy:", proxy)
        domain = account.email.split("@")[-1]
        host, port = await discover_imap_host(account)
        hosts = [host]
        try:
            extra = await get_fallback_hosts(domain)
            hosts.extend(h for h in extra if h not in hosts)
        except Exception:
            pass
        last_exc: Exception | None = None
        for h in hosts:
            attempt = 0
            while attempt < retries:
                try:
                    if proxy:
                        proxy_type_str = (proxy.proxy_type or "socks5").lower()
                        if proxy_type_str == "socks5":
                            proxy_enum = python_socks.ProxyType.SOCKS5
                        elif proxy_type_str == "socks4":
                            proxy_enum = python_socks.ProxyType.SOCKS4
                        else:
                            proxy_enum = python_socks.ProxyType.HTTP
                        sock = await python_socks.proxy_connect(
                            proxy_type=proxy_enum,
                            host=proxy.host,
                            port=proxy.port,
                            username=proxy.username,
                            password=proxy.password,
                            dest_host=h,
                            dest_port=port,
                            timeout=timeout,
                        )
                        imap = aioimaplib.IMAP4_SSL(sock=sock)
                    else:
                        imap = aioimaplib.IMAP4_SSL(host=h, port=port)
                    await imap.wait_hello_from_server(timeout=timeout)
                    resp = await imap.login(account.email, account.password)
                    if getattr(resp, "result", "OK") != "OK":
                        raise IMAPConnectionError(
                            f"Login failed for {account.email}: {getattr(resp, 'lines', '')}"
                        )
                    self._imap = imap
                    return imap
                except Exception as exc:
                    last_exc = exc
                    attempt += 1
                    await asyncio.sleep(1)
            if last_exc and isinstance(last_exc, socket.gaierror):
                continue
        raise RawDumpError(str(last_exc))

    async def _get_imap_connection_sync(
        self, account: IMAPAccount, timeout: int, retries: int
    ) -> imaplib.IMAP4_SSL:
        """Return a blocking imaplib connection executed in a thread."""
        host, port = await discover_imap_host(account)
        domain = account.email.split("@")[-1]
        hosts = [host]
        try:
            extra = await get_fallback_hosts(domain)
            hosts.extend(h for h in extra if h not in hosts)
        except Exception:
            pass

        def _connect(h: str) -> imaplib.IMAP4_SSL:
            im = imaplib.IMAP4_SSL(host=h, port=port)
            im.sock.settimeout(timeout)
            self._raw_command_sync(
                im, "LOGIN", account.email, account.password
            )
            return im

        last_exc: Exception | None = None
        for h in hosts:
            for _ in range(retries):
                try:
                    return await asyncio.to_thread(_connect, h)
                except Exception as exc:
                    last_exc = exc
                    await asyncio.sleep(1)
            if last_exc and isinstance(last_exc, OSError):
                continue
        raise RawDumpError(str(last_exc))

    async def raw_dump(
        self,
        account_id: UUID,
        limit_per_folder: int = 50,
        output_dir: Path | str = "imap_dump",
    ) -> dict:
        account = await self.get_account(str(account_id))
        if not account:
            raise RawDumpError("Account not found")
        timeout = getattr(settings, "IMAP_RAW_TIMEOUT", 30)
        retries = getattr(settings, "IMAP_RAW_RETRIES", 3)
        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)
        imap = None
        async_mode = True
        try:
            imap = await self._get_imap_connection(account, timeout, retries)
        except Exception as exc:
            logger.warning(
                f"Async IMAP connection failed for {account.email}: {exc}; falling back to sync"
            )
            try:
                imap = await self._get_imap_connection_sync(
                    account, timeout, retries
                )
                async_mode = False
            except Exception as sync_exc:
                logger.error(f"Sync IMAP connection also failed: {sync_exc}")
                raise RawDumpError(
                    f"Failed to establish IMAP connection: {sync_exc}"
                ) from sync_exc
        result: dict[str, Any] = {"account": account.email, "folders": {}}
        try:
            if async_mode:
                self._imap = imap
                resp = await imap.list("", "*")
                lines = resp.lines or []
            else:
                status, lines = self._raw_command_sync(imap, "LIST", "", "*")
                lines = lines if status == "OK" else []
            for line in lines:
                if not line:
                    continue
                if not isinstance(line, bytes):
                    line_b = line.encode()
                else:
                    line_b = line
                name, flags = self._parse_list_line(line_b)
                if not name or "\\Noselect" in flags:
                    continue
                folder_entries: list[dict] = []
                result["folders"][name] = folder_entries
                folder_dir = out_path / name
                folder_dir.mkdir(parents=True, exist_ok=True)
                if async_mode:
                    if not await self._safe_select(imap, name):
                        continue
                    search = await self._raw_command("UID", "SEARCH", "ALL")
                    search_lines = self._lines(search)
                    tokens = (
                        search_lines[0].decode().split()
                        if search_lines
                        else []
                    )
                    uids = [int(t) for t in tokens if t.isdigit()]
                else:
                    typ, _ = self._raw_command_sync(
                        imap, "SELECT", imap_utf7.encode(name), readonly=True
                    )
                    if typ != "OK":
                        continue
                    typ, data = self._raw_command_sync(
                        imap, "UID", "SEARCH", None, "ALL"
                    )
                    uids = (
                        [int(t) for t in data[0].split()]
                        if typ == "OK" and data
                        else []
                    )
                for uid in sorted(uids)[-limit_per_folder:]:
                    if async_mode:
                        fetch = await self._raw_command(
                            "UID", "FETCH", str(uid), "(RFC822)"
                        )
                        raw_bytes = None
                        if fetch.parsed and fetch.parsed[0]:
                            raw_bytes = fetch.parsed[0].get(b"RFC822")
                        if raw_bytes is None and self._lines(fetch):
                            m = re.search(
                                b"RFC822 \\{\\d+\\}\\r\\n(.*)\\r\\n\\)",
                                self._lines(fetch)[0],
                                re.DOTALL,
                            )
                            if m:
                                raw_bytes = m.group(1)
                    else:
                        typ, data = self._raw_command_sync(
                            imap, "UID", "FETCH", str(uid), "(RFC822)"
                        )
                        raw_bytes = data[0][1] if typ == "OK" else None
                    if raw_bytes is None:
                        continue
                    file_path = folder_dir / f"{uid}.eml"
                    file_path.write_bytes(raw_bytes)
                    msg = email.message_from_bytes(raw_bytes)
                    subject = self._decode_header(msg.get("Subject", ""))
                    date = msg.get("Date", "")
                    folder_entries.append(
                        {
                            "uid": uid,
                            "subject": subject,
                            "date": date,
                            "file": str(Path(name) / f"{uid}.eml"),
                        }
                    )
        except Exception as exc:
            logger.error(f"Raw dump failed for {account.email}: {exc}")
            raise RawDumpError(str(exc)) from exc
        finally:
            if imap:
                if async_mode:
                    await self._cleanup(imap)
                else:
                    self._cleanup_sync(imap)
        return result
