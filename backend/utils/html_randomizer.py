import random
import re
from collections.abc import Callable

import rstr

CHOICE_PATTERN = re.compile("\\{([^{}]+)\\}")
REGEX_PATTERN = re.compile("\\[([^\\]]+)\\](\\{\\d+(,\\d+)?\\}|\\+|\\*)?")


def _replace_choice(match: re.Match[str]) -> str:
    options = match.group(1).split("|")
    return random.choice(options)


def _replace_regex(match: re.Match[str]) -> str:
    pattern = f"[{match.group(1)}]{match.group(2) or ''}"
    try:
        return rstr.xeger(pattern)
    except Exception as exc:
        raise ValueError(f"Invalid regex pattern: {pattern}") from exc


def randomize_html(content: str) -> str:
    """Randomize HTML content using choice and regex placeholders."""

    def apply(
        pattern: re.Pattern[str],
        repl: Callable[[re.Match[str]], str],
        text: str,
    ) -> str:
        while True:
            new_text, count = pattern.subn(repl, text)
            if count == 0:
                return text
            text = new_text

    content = apply(REGEX_PATTERN, _replace_regex, content)
    content = apply(CHOICE_PATTERN, _replace_choice, content)
    return content
