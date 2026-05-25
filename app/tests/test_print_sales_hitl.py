"""Print Sales HITL — approve writes print_sales collection."""

from unittest.mock import MagicMock, patch

from memory.pending_approvals import _execute_approved


def test_list_on_marketplace_approve_inserts_print_sale() -> None:
    mock_db = MagicMock()
    mock_print = MagicMock()
    mock_db.print_sales = mock_print

    doc = {
        "_id": "approval123",
        "user_id": "user1",
        "proposed_action": {
            "type": "list_on_marketplace",
            "target_id": "entry456",
            "payload": {
                "marketplace": "etsy",
                "title": "Sunset print",
                "description": "Archival",
                "suggestedListPrice": 52.5,
                "currency": "USD",
                "tags": ["landscape"],
            },
        },
    }

    with patch("memory.pending_approvals.get_db", return_value=mock_db):
        _execute_approved(doc, {"suggestedListPrice": 60.0})

    mock_print.insert_one.assert_called_once()
    inserted = mock_print.insert_one.call_args[0][0]
    assert inserted["portfolio_entry_id"] == "entry456"
    assert inserted["marketplace"] == "etsy"
    assert inserted["list_price"] == 60.0
    assert inserted["status"] == "listed"
