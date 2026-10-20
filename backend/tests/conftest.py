import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models
from app.database import Base, get_db
from app.main import app


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture()
def create_user(client):
    def _create_user(username="tester", email="tester@example.com", password="password123"):
        response = client.post(
            "/auth/register",
            json={"username": username, "email": email, "password": password},
        )
        assert response.status_code == 201, response.text
        return response.json()

    return _create_user


@pytest.fixture()
def auth_headers(client, create_user):
    def _auth_headers(username="tester", email="tester@example.com", password="password123"):
        create_user(username=username, email=email, password=password)
        response = client.post(
            "/auth/login",
            data={"username": username, "password": password},
        )
        assert response.status_code == 200, response.text
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    return _auth_headers


@pytest.fixture()
def agent_payload():
    return {
        "name": "Test Agent",
        "description": "An agent used by API tests",
        "system_prompt": "You are a test assistant.",
        "status": "active",
        "model_id": None,
        "rag_ids": [],
        "mcp_ids": [],
    }
