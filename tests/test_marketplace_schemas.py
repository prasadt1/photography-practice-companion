"""Consolidation item 12 — per-marketplace listing metadata."""

from __future__ import annotations

from sub_agents.print_sales_marketplace_schemas import (
    generate_etsy_listing,
    generate_society6_listing,
)


def test_etsy_listing_has_required_fields():
    doc = generate_etsy_listing(portfolio_entry_id="test")
    meta = doc["marketplace_listing_metadata"]
    assert "tags" in meta
    assert "materials" in meta
    assert "who_made" in meta


def test_society6_listing_has_different_shape():
    doc = generate_society6_listing(portfolio_entry_id="test")
    meta = doc["marketplace_listing_metadata"]
    assert "product_types" in meta
    assert "tags" not in meta
