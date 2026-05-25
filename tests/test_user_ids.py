from memory.user_ids import to_mongo_user_id


def test_demo_hex_object_id_passthrough():
    demo = "6577a1f2b3c4d5e6f7a8b9c0"
    assert str(to_mongo_user_id(demo)) == demo


def test_firebase_uid_stable_hash():
    uid = "N7xK2wQ8mZaBcDeFgHiJkLmNoPq"
    a = to_mongo_user_id(uid)
    b = to_mongo_user_id(uid)
    assert a == b
    assert str(a) != uid
