"""Tests for user management endpoints"""
import pytest
from fastapi import status

def test_admin_list_users_paginated(client, admin_token, db):
    """Test admin can list users with pagination"""
    from app.models import User
    from app.auth import get_password_hash
    
    # Create multiple users
    for i in range(15):
        user = User(
            email=f"user{i}@test.com",
            full_name=f"User {i}",
            hashed_password=get_password_hash("password123"),
            role="STUDENT"
        )
        db.add(user)
    db.commit()
    
    # Test first page
    response = client.get(
        "/api/admin/users?page=1&page_size=10",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["page"] == 1
    assert data["page_size"] == 10
    assert len(data["items"]) == 10
    assert data["total"] >= 15

def test_admin_create_user(client, admin_token):
    """Test admin can create new user"""
    response = client.post(
        "/api/admin/users",
        json={
            "email": "newuser@test.com",
            "full_name": "New User",
            "password": "password123",
            "role": "STUDENT"
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == "newuser@test.com"

def test_admin_delete_user(client, admin_token, db):
    """Test admin can delete user"""
    from app.models import User
    from app.auth import get_password_hash
    
    user = User(
        email="todelete@test.com",
        full_name="To Delete",
        hashed_password=get_password_hash("password123"),
        role="STUDENT"
    )
    db.add(user)
    db.commit()
    user_id = user.id
    
    response = client.delete(
        f"/api/admin/users/{user_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify user was deleted
    deleted_user = db.query(User).filter(User.id == user_id).first()
    assert deleted_user is None

def test_trainer_cannot_delete_user(client, trainer_token, db):
    """Test trainer cannot delete users"""
    from app.models import User
    from app.auth import get_password_hash
    
    user = User(
        email="someuser@test.com",
        full_name="Some User",
        hashed_password=get_password_hash("password123"),
        role="STUDENT"
    )
    db.add(user)
    db.commit()
    
    response = client.delete(
        f"/api/admin/users/{user.id}",
        headers={"Authorization": f"Bearer {trainer_token}"}
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN

def test_admin_validate_trainer(client, admin_token, db):
    """Test admin can validate pending trainer"""
    from app.models import User
    from app.auth import get_password_hash
    
    trainer = User(
        email="pendingtrainer@test.com",
        full_name="Pending Trainer",
        hashed_password=get_password_hash("password123"),
        role="TRAINER",
        is_pending=True
    )
    db.add(trainer)
    db.commit()
    trainer_id = trainer.id
    
    response = client.post(
        f"/api/admin/validate-trainer/{trainer_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["is_pending"] == False
