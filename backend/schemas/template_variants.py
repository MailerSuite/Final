
from pydantic import BaseModel, Field


class TemplateOptions(BaseModel):
    """Options controlling HTML randomization."""

    variants_count: int = Field(1, alias="variantsCount", ge=1, le=10)
    table_layout: bool = Field(False, alias="tableLayout")
    split_invert: bool = Field(False, alias="splitInvertText")
    wrap_spans: bool = Field(False, alias="wrapSpans")
    synonyms: bool = Field(False, alias="synonymReplace")
    insert_zero_width: bool = Field(False, alias="insertZeroWidth")
    trending_insert: bool = Field(False, alias="trendingInsert")
    garbage_inject: bool = Field(False, alias="garbageInject")
    tag_swap: bool = Field(False, alias="tagSwap")
    random_fonts: bool = Field(False, alias="randomFonts")
    tweak_colors: bool = Field(False, alias="tweakColors")
    rename_classes: bool = Field(False, alias="renameClasses")
    trusted_links: bool = Field(False, alias="trustedLinks")
    to_image: bool = Field(False, alias="toImage")
    rehost_images: bool = Field(False, alias="rehostImages")
    model_config = dict(populate_by_name=True)


class TemplateVariantsRequest(BaseModel):
    """Request model for the /templates/variants endpoint."""

    html: str
    options: TemplateOptions


class TemplateVariantsResponse(BaseModel):
    status: str
    variants: list[str]
