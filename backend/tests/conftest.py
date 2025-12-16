"""Test configuration and fixtures"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app
import os

# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    """Create a test client with database"""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def admin_token(client, db):
    """Create admin user and return auth token"""
    from app.models import User
    from app.auth import get_password_hash
    
    admin = User(
        email="admin@test.com",
        full_name="Test Admin",
        hashed_password=get_password_hash("testpass123"),
        role="ADMIN",
        is_active=True,
        is_pending=False
    )
    db.add(admin)
    db.commit()
    
    response = client.post(
        "/api/auth/login",
        data={"username": "admin@test.com", "password": "testpass123"}
    )
    return response.json()["access_token"]

@pytest.fixture
def trainer_token(client, db):
    """Create trainer user and return auth token"""
    from app.models import User
    from app.auth import get_password_hash
    
    trainer = User(
        email="trainer@test.com",
        full_name="Test Trainer",
        hashed_password=get_password_hash("testpass123"),
        role="TRAINER",
        is_active=True,
        is_pending=False
    )
    db.add(trainer)
    db.commit()
    
    response = client.post(
        "/api/auth/login",
        data={"username": "trainer@test.com", "password": "testpass123"}
    )
    return response.json()["access_token"]

@pytest.fixture
def student_token(client, db):
    """Create student user and return auth token"""
    from app.models import User
    from app.auth import get_password_hash
    
    student = User(
        email="student@test.com",
        full_name="Test Student",
        hashed_password=get_password_hash("testpass123"),
        role="STUDENT",
        is_active=True,
        is_pending=False
    )
    db.add(student)
    db.commit()
    
    response = client.post(
        "/api/auth/login",
        data={"username": "student@test.com", "password": "testpass123"}
    )
    return response.json()["access_token"]
