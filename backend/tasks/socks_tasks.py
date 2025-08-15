from services.socks_test_service import socks_test_service


async def run_socks_test(
    host: str,
    port: int,
    proxy_type: str = "socks5",
    target_host: str = "google.com",
    target_port: int = 80,
) -> None:
    await socks_test_service.start(
        host, port, proxy_type, target_host, target_port
    )
    await socks_test_service._task
