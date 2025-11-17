import typing as t

from app.models.tag import Tag
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def test_list_tags_empty(client: TestClient, auth_headers: dict[str, str]) -> None:
    headers = auth_headers

    res = client.get("/tags/", headers=headers)
    assert res.status_code == 200
    assert res.json() == []


def test_create_tag(client: TestClient, auth_headers: dict[str, str]) -> None:
    headers = auth_headers

    res = client.post("/tags/", json={"name": "fruit"}, headers=headers)
    assert res.status_code == 200

    tag = res.json()
    assert tag["name"] == "fruit"


def test_create_tag_duplicate(
    client: TestClient,
    auth_headers: dict[str, str],
    tag_factory: t.Callable[..., list[Tag]],
) -> None:
    tag_factory("fruit")

    res = client.post("/tags/", json={"name": "fruit"}, headers=auth_headers)

    assert res.status_code == 400
    assert "exists" in res.json()["detail"]


def test_rename_tag(
    client: TestClient,
    auth_headers: dict[str, str],
    tag_factory: t.Callable[..., list[Tag]],
) -> None:
    (tag,) = tag_factory("fruit")

    res = client.put(
        f"/tags/{tag.id}",
        json={"name": "fresh"},
        headers=auth_headers,
    )

    assert res.status_code == 200
    body = res.json()
    assert body["name"] == "fresh"


def test_rename_to_existing_name_fails(
    client: TestClient,
    auth_headers: dict[str, str],
    tag_factory: t.Callable[..., list[Tag]],
) -> None:
    t1, t2 = tag_factory("fruit", "veg")

    res = client.put(
        f"/tags/{t2.id}",
        json={"name": "fruit"},
        headers=auth_headers,
    )

    assert res.status_code == 400


def test_delete_tag(
    client: TestClient,
    auth_headers: dict[str, str],
    tag_factory: t.Callable[..., list[Tag]],
    db_session: Session,
) -> None:
    (tag,) = tag_factory("fruit")

    res = client.delete(f"/tags/{tag.id}", headers=auth_headers)

    assert res.status_code == 204

    deleted = db_session.query(Tag).filter_by(id=tag.id).first()
    assert deleted is None


def test_delete_missing_tag_404(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    res = client.delete(
        "/tags/00000000-0000-0000-0000-000000000000",
        headers=auth_headers,
    )
    assert res.status_code == 404
