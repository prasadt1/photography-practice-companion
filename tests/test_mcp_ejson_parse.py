"""Parse mongodb-mcp-server untrusted-user-data EJSON payloads."""

from bson import ObjectId

from memory.mcp_ejson import extract_ejson_array_text, parse_ejson_documents, to_ejson


def test_to_ejson_objectid_is_extended_json():
    out = to_ejson({"user_id": ObjectId("6577a1f2b3c4d5e6f7a8b9c0")})
    assert out["user_id"] == {"$oid": "6577a1f2b3c4d5e6f7a8b9c0"}


def test_extract_ejson_from_untrusted_wrapper():
    text = (
        'Query returned docs.\n<untrusted-user-data-abc>'
        '[{"_id":{"$oid":"6577a1f2b3c4d5e6f7a8b9c0"}}]'
        '</untrusted-user-data-abc>'
    )
    payload = extract_ejson_array_text(text)
    assert payload is not None
    docs = parse_ejson_documents(payload)
    assert len(docs) == 1
