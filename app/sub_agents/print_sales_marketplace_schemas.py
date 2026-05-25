"""Per-marketplace listing metadata shapes (§7.7, consolidation item 12)."""

from __future__ import annotations

from typing import Any, Literal

Marketplace = Literal["etsy", "society6", "redbubble", "saatchi_art"]


def etsy_listing_metadata(
    *,
    tags: list[str] | None = None,
    sections: str = "Photography",
    materials: list[str] | None = None,
    when_made: str = "2020_2026",
    who_made: str = "i_did",
) -> dict[str, Any]:
    return {
        "tags": tags or ["fine art print", "photography"],
        "sections": sections,
        "materials": materials or ["archival paper", "ink"],
        "when_made": when_made,
        "who_made": who_made,
    }


def society6_listing_metadata(
    *,
    product_types: list[str] | None = None,
    tagline: str = "Museum-quality print",
    description_format: str = "short_paragraph",
) -> dict[str, Any]:
    return {
        "product_types": product_types or ["art_print", "framed_print"],
        "tagline": tagline,
        "description_format": description_format,
    }


def saatchi_listing_metadata(
    *,
    medium: str = "Photography",
    support: str = "Paper",
    edition_info: str = "Open edition",
) -> dict[str, Any]:
    return {
        "medium": medium,
        "support": support,
        "edition_info": edition_info,
    }


def redbubble_listing_metadata(
    *,
    department: str = "photography",
    product_selection: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "department_mapping": department,
        "product_selection": product_selection or ["poster", "art_print"],
    }


def generate_listing_document(
    marketplace: Marketplace,
    *,
    portfolio_entry_id: str,
    title: str = "Fine art print",
    description: str = "",
    list_price: float = 45.0,
) -> dict[str, Any]:
    builders = {
        "etsy": etsy_listing_metadata,
        "society6": society6_listing_metadata,
        "saatchi_art": saatchi_listing_metadata,
        "redbubble": redbubble_listing_metadata,
    }
    meta_builder = builders.get(marketplace, etsy_listing_metadata)
    return {
        "portfolio_entry_id": portfolio_entry_id,
        "marketplace": marketplace,
        "title": title,
        "description": description,
        "list_price": list_price,
        "marketplace_listing_metadata": meta_builder(),
    }


def generate_etsy_listing(portfolio_entry_id: str, **kwargs: Any) -> dict[str, Any]:
    return generate_listing_document("etsy", portfolio_entry_id=portfolio_entry_id, **kwargs)


def generate_society6_listing(portfolio_entry_id: str, **kwargs: Any) -> dict[str, Any]:
    return generate_listing_document("society6", portfolio_entry_id=portfolio_entry_id, **kwargs)


def generate_saatchi_listing(portfolio_entry_id: str, **kwargs: Any) -> dict[str, Any]:
    return generate_listing_document(
        "saatchi_art", portfolio_entry_id=portfolio_entry_id, **kwargs
    )


def generate_redbubble_listing(portfolio_entry_id: str, **kwargs: Any) -> dict[str, Any]:
    return generate_listing_document(
        "redbubble", portfolio_entry_id=portfolio_entry_id, **kwargs
    )
