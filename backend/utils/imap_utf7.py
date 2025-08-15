import base64


def decode(value: str) -> str:
    """Decode IMAP modified UTF-7 string to Unicode."""
    if not value:
        return ""
    result = []
    i = 0
    while i < len(value):
        c = value[i]
        if c == "&":
            j = value.find("-", i)
            if j == -1:
                j = len(value)
            chunk = value[i + 1 : j]
            if not chunk:
                result.append("&")
            else:
                chunk = chunk.replace(",", "/")
                padding = "=" * (-len(chunk) % 4)
                b = base64.b64decode(chunk + padding)
                result.append(b.decode("utf-16-be"))
            i = j + 1
        else:
            result.append(c)
            i += 1
    return "".join(result)


def encode(value: str) -> str:
    """Encode Unicode string to IMAP modified UTF-7."""
    if not value:
        return ""
    out = []
    buf = []

    def flush() -> None:
        if buf:
            b = "".join(buf).encode("utf-16-be")
            encoded = base64.b64encode(b).decode("ascii").rstrip("=")
            encoded = encoded.replace("/", ",")
            out.append("&" + encoded + "-")
            buf.clear()

    for ch in value:
        o = ord(ch)
        if 32 <= o <= 126:
            flush()
            if ch == "&":
                out.append("&-")
            else:
                out.append(ch)
        else:
            buf.append(ch)
    flush()
    return "".join(out)
