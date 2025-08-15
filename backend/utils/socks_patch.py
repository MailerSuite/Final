def patch_python_socks():
    """Ensure :mod:`python_socks` provides ``proxy_connect``."""
    try:
        import python_socks
    except Exception:
        return None
    if not hasattr(python_socks, "proxy_connect"):
        from python_socks.async_.asyncio import Proxy

        async def _proxy_connect(
            *,
            proxy_type,
            host,
            port,
            dest_host,
            dest_port,
            username=None,
            password=None,
            timeout=None,
        ):
            proxy = Proxy(
                proxy_type=proxy_type,
                host=host,
                port=port,
                username=username,
                password=password,
            )
            return await proxy.connect(dest_host, dest_port, timeout=timeout)

        python_socks.proxy_connect = _proxy_connect
    return python_socks
