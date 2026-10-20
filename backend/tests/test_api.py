def test_register_user(client):
    response = client.post(
        "/auth/register",
        json={"username": "uname", "email": "uname@example.com", "password": "password123"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "uname"
    assert data["email"] == "uname@example.com"
    assert "hashed_password" not in data


def test_login_returns_jwt(client, create_user):
    create_user()

    response = client.post(
        "/auth/login",
        data={"username": "tester", "password": "password123"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["access_token"]
    assert data["token_type"] == "bearer"


def test_agents_require_authentication(client):
    response = client.get("/agents")

    assert response.status_code == 401


def test_create_agent(client, auth_headers, agent_payload):
    response = client.post("/agents", json=agent_payload, headers=auth_headers())

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == agent_payload["name"]
    assert data["system_prompt"] == agent_payload["system_prompt"]
    assert data["model"] is None
    assert data["rags"] == []
    assert data["mcps"] == []
    assert data["owner"]["username"] == "tester"


def test_list_agents(client, auth_headers, agent_payload):
    headers = auth_headers()
    created = client.post("/agents", json=agent_payload, headers=headers)
    assert created.status_code == 201

    response = client.get("/agents", headers=headers)

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["name"] == agent_payload["name"]


def test_update_own_agent(client, auth_headers, agent_payload):
    headers = auth_headers()
    created = client.post("/agents", json=agent_payload, headers=headers)
    agent_id = created.json()["id"]
    updated_payload = {**agent_payload, "name": "Updated Agent"}

    response = client.put(f"/agents/{agent_id}", json=updated_payload, headers=headers)

    assert response.status_code == 200
    assert response.json()["name"] == "Updated Agent"


def test_delete_own_agent(client, auth_headers, agent_payload):
    headers = auth_headers()
    created = client.post("/agents", json=agent_payload, headers=headers)
    agent_id = created.json()["id"]

    response = client.delete(f"/agents/{agent_id}", headers=headers)

    assert response.status_code == 204
    assert client.get(f"/agents/{agent_id}", headers=headers).status_code == 404


def test_cannot_update_another_users_agent(client, auth_headers, agent_payload):
    owner_headers = auth_headers()
    created = client.post("/agents", json=agent_payload, headers=owner_headers)
    agent_id = created.json()["id"]
    other_headers = auth_headers(
        username="other",
        email="other@example.com",
        password="password456",
    )

    response = client.put(
        f"/agents/{agent_id}",
        json={**agent_payload, "name": "Stolen Agent"},
        headers=other_headers,
    )

    assert response.status_code == 403


def test_create_model(client, auth_headers):
    payload = {
        "name": "Test Model",
        "description": "Model for API tests",
        "provider": "OpenAI",
        "model_name": "test-model",
        "base_url": None,
        "api_key": "test-secret-key",
        "status": "active",
    }

    response = client.post("/models", json=payload, headers=auth_headers())

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["model_name"] == payload["model_name"]
    assert "api_key" not in data


def test_list_models(client, auth_headers):
    headers = auth_headers()
    payload = {
        "name": "Test Model",
        "description": None,
        "provider": "OpenAI",
        "model_name": "test-model",
        "base_url": None,
        "api_key": "test-secret-key",
        "status": "active",
    }
    created = client.post("/models", json=payload, headers=headers)
    assert created.status_code == 201

    response = client.get("/models", headers=headers)

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["name"] == payload["name"]
    assert "api_key" not in response.json()[0]
