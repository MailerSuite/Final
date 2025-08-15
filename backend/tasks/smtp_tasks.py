from services.smtp_test_service import smtp_test_service


async def run_smtp_test(server: str, port: int) -> None:
    await smtp_test_service.start(server, port)
    await smtp_test_service._task
