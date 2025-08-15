from uuid import UUID, uuid4

import aiosmtplib

from schemas.handshake import Handshake, HandshakeCreate, HandshakeUpdate


class HandshakeService:
    """In-memory storage of handshake configurations."""

    def __init__(self) -> None:
        self.store: dict[UUID, Handshake] = {}

    def list(self) -> list[Handshake]:
        return list(self.store.values())

    def get(self, handshake_id: UUID) -> Handshake:
        if handshake_id not in self.store:
            raise KeyError(handshake_id)
        return self.store[handshake_id]

    def create(self, data: HandshakeCreate) -> Handshake:
        obj = Handshake(id=uuid4(), **data.model_dump())
        self.store[obj.id] = obj
        return obj

    def update(self, handshake_id: UUID, data: HandshakeUpdate) -> Handshake:
        if handshake_id not in self.store:
            raise KeyError(handshake_id)
        current = self.store[handshake_id]
        updates = data.model_dump(exclude_unset=True, exclude_none=True)
        updated = current.model_copy(update=updates)
        self.store[handshake_id] = updated
        return updated

    def delete(self, handshake_id: UUID) -> None:
        if handshake_id not in self.store:
            raise KeyError(handshake_id)
        del self.store[handshake_id]

    async def test_smtp(self, obj: Handshake) -> tuple[int, str]:
        """Execute a single SMTP handshake.

        Parameters
        ----------
        obj: Handshake
            Handshake configuration with hostname, port and message.
        """
        host = obj.hostname
        port = 25
        if ":" in host:
            host, port_str = host.rsplit(":", 1)
            try:
                port = int(port_str)
            except ValueError:
                raise ValueError("invalid hostname")
        smtp = aiosmtplib.SMTP(
            hostname=host, port=port, timeout=obj.timeout / 1000
        )
        await smtp.connect()
        code, message = await smtp.execute_command(obj.message.encode())
        await smtp.quit()
        return (code, message)


handshake_service = HandshakeService()
