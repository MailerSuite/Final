import random
import re
import time
from pathlib import Path
from uuid import uuid4

import httpx
from bs4 import BeautifulSoup
from nltk.corpus import wordnet

from config.settings import get_settings
from core.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()
TREND_CACHE = {"ts": 0.0, "words": []}


async def refresh_trends() -> list[str]:
    """Fetch trending words and cache them for 24h."""
    now = time.time()
    if TREND_CACHE["words"] and now - TREND_CACHE["ts"] < 86400:
        return TREND_CACHE["words"]
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://api.datamuse.com/words",
                params={"ml": "trending", "max": 20},
            )
        if resp.status_code == 200:
            TREND_CACHE["words"] = [w["word"] for w in resp.json()]
            TREND_CACHE["ts"] = now
    except Exception as exc:
        logger.warning(f"trend fetch failed: {exc}")
    return TREND_CACHE["words"]


def table_layout_randomization(soup: BeautifulSoup) -> BeautifulSoup:
    for table in soup.find_all("table"):
        if random.random() < 0.5:
            table["border"] = "1"
        if random.random() < 0.5:
            table["cellpadding"] = str(random.randint(0, 5))
    return soup


def split_invert_text(soup: BeautifulSoup) -> BeautifulSoup:
    for text in list(soup.strings):
        if not text.strip():
            continue
        words = [w[::-1] if random.random() < 0.5 else w for w in text.split()]
        text.replace_with(" ".join(words))
    return soup


def wrap_in_spans(soup: BeautifulSoup) -> BeautifulSoup:
    for text in list(soup.strings):
        if not text.strip():
            continue
        span = soup.new_tag("span")
        span.string = text
        text.replace_with(span)
    return soup


def synonym_replacement(soup: BeautifulSoup) -> BeautifulSoup:
    for text in list(soup.strings):
        if not text.strip():
            continue
        words = []
        for w in text.split():
            syns = wordnet.synsets(w)
            if syns:
                lemmas = {
                    l.name().replace("_", " ")
                    for s in syns
                    for l in s.lemmas()
                }
                lemmas.discard(w)
                if lemmas:
                    w = random.choice(list(lemmas))
            words.append(w)
        text.replace_with(" ".join(words))
    return soup


def zero_width_and_trending_insertion(
    soup: BeautifulSoup, trends: list[str]
) -> BeautifulSoup:
    for text in list(soup.strings):
        if not text.strip():
            continue
        new = "".join(
            ch + ("\u200b" if random.random() < 0.1 else "") for ch in text
        )
        if trends and random.random() < 0.3:
            new += " " + random.choice(trends)
        text.replace_with(new)
    return soup


def garbage_code_injection(soup: BeautifulSoup) -> BeautifulSoup:
    garbage = soup.new_tag("div", style="display:none")
    garbage.string = uuid4().hex
    if soup.body:
        soup.body.append(garbage)
    else:
        soup.append(garbage)
    return soup


def tag_swaps(soup: BeautifulSoup) -> BeautifulSoup:
    for b in soup.find_all("b"):
        b.name = "strong"
    for i in soup.find_all("i"):
        i.name = "em"
    return soup


def font_randomization(soup: BeautifulSoup) -> BeautifulSoup:
    fonts = ["Arial", "Helvetica", "Times New Roman", "Courier New"]
    for tag in soup.find_all(True):
        style = tag.get("style", "")
        if "font-family" not in style:
            tag["style"] = style + f" font-family:{random.choice(fonts)};"
    return soup


def color_tweaks(soup: BeautifulSoup) -> BeautifulSoup:
    def rand():
        return f"#{random.randint(0, 16777215):06x}"

    for tag in soup.find_all(True):
        style = tag.get("style", "")
        if "color:" in style:
            style = re.sub("color:[^;]+", f"color:{rand()}", style)
        if "background-color:" in style:
            style = re.sub(
                "background-color:[^;]+", f"background-color:{rand()}", style
            )
        tag["style"] = style
    return soup


def rename_classes_ids(soup: BeautifulSoup) -> BeautifulSoup:
    for tag in soup.find_all(True):
        if tag.has_attr("class"):
            tag["class"] = ["c" + uuid4().hex[:8]]
        if tag.has_attr("id"):
            tag["id"] = "i" + uuid4().hex[:8]
    return soup


TRUSTED_LINKS = [
    "https://www.wikipedia.org",
    "https://www.gnu.org",
    "https://www.python.org",
]


def trusted_link_insertion(
    soup: BeautifulSoup, trends: list[str]
) -> BeautifulSoup:
    word = random.choice(trends) if trends else "Python"
    link = soup.new_tag("a", href=f"https://en.wikipedia.org/wiki/{word}")
    link.string = word
    if soup.body:
        soup.body.append(link)
    else:
        soup.append(link)
    return soup


def convert_to_image(html: str, output_dir: Path) -> str | None:
    try:
        from weasyprint import HTML
    except Exception as exc:
        logger.warning(f"weasyprint missing: {exc}")
        return None
    try:
        output_dir.mkdir(parents=True, exist_ok=True)
        path = output_dir / f"{uuid4().hex}.png"
        HTML(string=html).write_png(str(path))
        return str(path)
    except Exception as exc:
        logger.warning(f"html to image failed: {exc}")
        return None


def rehost_content_images(
    soup: BeautifulSoup, upload_dir: Path
) -> BeautifulSoup:
    upload_dir.mkdir(parents=True, exist_ok=True)
    for img in soup.find_all("img"):
        src = img.get("src")
        if not src or not src.startswith("http"):
            continue
        try:
            r = httpx.get(src, timeout=5)
            if r.status_code == 200:
                ext = Path(src).suffix or ".jpg"
                dest = upload_dir / f"{uuid4().hex}{ext}"
                dest.write_bytes(r.content)
                img["src"] = str(dest)
        except Exception as exc:
            logger.warning(f"rehost failed for {src}: {exc}")
    return soup


def generate_variant(html: str, options, trends: list[str]) -> str:
    soup = BeautifulSoup(html, "html5lib")
    if options.table_layout:
        soup = table_layout_randomization(soup)
    if options.split_invert:
        soup = split_invert_text(soup)
    if options.wrap_spans:
        soup = wrap_in_spans(soup)
    if options.synonyms:
        soup = synonym_replacement(soup)
    if options.insert_zero_width or options.trending_insert:
        soup = zero_width_and_trending_insertion(
            soup, trends if options.trending_insert else []
        )
    if options.garbage_inject:
        soup = garbage_code_injection(soup)
    if options.tag_swap:
        soup = tag_swaps(soup)
    if options.random_fonts:
        soup = font_randomization(soup)
    if options.tweak_colors:
        soup = color_tweaks(soup)
    if options.rename_classes:
        soup = rename_classes_ids(soup)
    if options.trusted_links:
        soup = trusted_link_insertion(soup, trends)
    if options.rehost_images:
        soup = rehost_content_images(
            soup, Path(settings.UPLOAD_DIR) / "rehost"
        )
    html_out = str(soup)
    if options.to_image:
        img_path = convert_to_image(
            html_out, Path(settings.UPLOAD_DIR) / "images"
        )
        if img_path:
            html_out = f'<img src="{img_path}" />'
    return html_out
