"""Tests for authentication endpoints"""
import pytest
from fastapi import status

def test_register_student_success(client):
    """Test successful student registration"""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "newstudent@test.com",
            "password": "password123",
            "full_name": "New Student",
            "role": "STUDENT"
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == "newstudent@test.com"
    assert data["role"] == "STUDENT"
    assert data["is_pending"] == False  # Students don't need validation

def test_register_trainer_pending(client):
    """Test trainer registration creates pending user"""
    response = client.post(
        "/api/auth/register",
        json={
            "email": "newtrainer@test.com",
            "password": "password123",
            "full_name": "New Trainer",
            "role": "TRAINER"
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == "newtrainer@test.com"
    assert data["role"] == "TRAINER"
    assert data["is_pending"] == True  # Trainers need validation

def test_register_duplicate_email(client, db):
    """Test registration with existing email"""
    from app.models import User
    from app.auth import get_password_hash
    
    # Create existing user
    user = User(
        email="existing@test.com",
        full_name="Existing User",
        hashed_password=get_password_hash("password123"),
        role="STUDENT"
    )
    db.add(user)
    db.commit()
    
    # Try to register with same email
    response = client.post(
        "/api/auth/register",
        json={
            "email": "existing@test.com",
            "password": "newpassword123",
            "full_name": "Another User",
            "role": "STUDENT"
        }
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already registered" in response.json()["detail"].lower()

def test_login_success(client, db):
    """Test successful login"""
    from app.models import User
    from app.auth import get_password_hash
    
    user = User(
        email="user@test.com",
        full_name="Test User",
        hashed_password=get_password_hash("password123"),
        role="STUDENT",
        is_active=True
    )
    db.add(user)
    db.commit()
    
    response = client.post(
        "/api/auth/login",
        data={"username": "user@test.com", "password": "password123"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "user@test.com"

def test_login_wrong_password(client, db):
    """Test login with wrong password"""
    from app.models import User
    from app.auth import get_password_hash
    
    user = User(
        email="user@test.com",
        full_name="Test User",
        hashed_password=get_password_hash("correctpassword"),
        role="STUDENT",
        is_active=True
    )
    db.add(user)
    db.commit()
    
    response = client.post(
        "/api/auth/login",
        data={"username": "user@test.com", "password": "wrongpassword"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_login_nonexistent_user(client):
    """Test login with non-existent user"""
    response = client.post(
        "/api/auth/login",
        data={"username": "nonexistent@test.com", "password": "password123"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_get_current_user(client, admin_token):
    """Test getting current user info"""
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == "admin@test.com"
    assert data["role"] == "ADMIN"

def test_get_current_user_unauthorized(client):
    """Test getting current user without token"""
    response = client.get("/api/auth/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
