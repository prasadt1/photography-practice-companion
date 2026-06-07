"""Portfolio delete API — user-initiated library removal."""

from unittest.mock import MagicMock, patch

import pytest

from memory.portfolio import delete_portfolio_entry, delete_portfolio_entries, LISTED_FOR_SALE_TAG


@patch("memory.portfolio._reject_pending_for_entry")
@patch("memory.portfolio.get_db")
@patch("memory.portfolio._resolve_portfolio_user_id")
def test_delete_portfolio_entry_success(mock_uid, mock_db, mock_reject) -> None:
    from bson import ObjectId

    uid = ObjectId("6577a1f2b3c4d5e6f7a8b9c0")
    eid = ObjectId("6577a1f2b3c4d5e6f7a8b9c1")
    mock_uid.return_value = uid
    mock_reject.return_value = 1

    coll = MagicMock()
    mock_db.return_value.portfolio_entries = coll
    coll.find_one.return_value = {
        "_id": eid,
        "user_id": uid,
        "user_tags": [],
    }

    out = delete_portfolio_entry(str(eid))

    assert out["deleted"] is True
    assert out["cancelledPending"] == 1
    coll.delete_one.assert_called_once()


@patch("memory.portfolio.get_db")
@patch("memory.portfolio._resolve_portfolio_user_id")
def test_delete_blocks_listed_for_sale(mock_uid, mock_db) -> None:
    from bson import ObjectId

    uid = ObjectId("6577a1f2b3c4d5e6f7a8b9c0")
    eid = ObjectId("6577a1f2b3c4d5e6f7a8b9c1")
    mock_uid.return_value = uid
    coll = MagicMock()
    mock_db.return_value.portfolio_entries = coll
    coll.find_one.return_value = {
        "_id": eid,
        "user_id": uid,
        "user_tags": [LISTED_FOR_SALE_TAG],
    }

    with pytest.raises(ValueError, match="listed for sale"):
        delete_portfolio_entry(str(eid))


@patch("memory.portfolio._reject_pending_for_entry")
@patch("memory.portfolio.get_db")
@patch("memory.portfolio._resolve_portfolio_user_id")
def test_delete_listed_with_remove_listing(mock_uid, mock_db, mock_reject) -> None:
    from bson import ObjectId

    uid = ObjectId("6577a1f2b3c4d5e6f7a8b9c0")
    eid = ObjectId("6577a1f2b3c4d5e6f7a8b9c1")
    mock_uid.return_value = uid
    mock_reject.return_value = 0

    coll = MagicMock()
    print_coll = MagicMock()
    mock_db.return_value.portfolio_entries = coll
    mock_db.return_value.print_sales = print_coll
    coll.find_one.return_value = {
        "_id": eid,
        "user_id": uid,
        "user_tags": [LISTED_FOR_SALE_TAG],
    }
    coll.update_one.return_value = MagicMock(modified_count=1)

    out = delete_portfolio_entry(str(eid), remove_listing=True)

    assert out["deleted"] is True
    assert out["unlisted"] is True
    print_coll.update_many.assert_called_once()
    coll.update_one.assert_called_once()
    coll.delete_one.assert_called_once()


@patch("memory.portfolio.delete_portfolio_entry")
def test_bulk_delete_aggregates(mock_delete) -> None:
    mock_delete.side_effect = [{"deleted": True, "id": "a"}, ValueError("not found")]

    out = delete_portfolio_entries(["a", "b"])

    assert out["deletedCount"] == 1
    assert len(out["skipped"]) == 1
