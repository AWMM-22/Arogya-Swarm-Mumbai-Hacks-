# ============================================
# FILE: backend/tests/conftest.py
# Pytest Fixtures and Configuration
# ============================================

import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from core.database import Base, get_db
from models.hospital import Bed, Staff, Inventory
from models.predictions import SurgePrediction
from models.actions import Recommendation

# Test database (in-memory SQLite)
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    """Create test client with database override"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def sample_beds(db_session):
    """Create sample bed data"""
    beds = [
        Bed(bed_number="ER-001", department="ER", status="available"),
        Bed(bed_number="ER-002", department="ER", status="occupied"),
        Bed(bed_number="ICU-001", department="ICU", status="available"),
        Bed(bed_number="ICU-002", department="ICU", status="occupied"),
    ]
    for bed in beds:
        db_session.add(bed)
    db_session.commit()
    return beds

@pytest.fixture
def sample_staff(db_session):
    """Create sample staff data"""
    staff = [
        Staff(name="Dr. Test", role="doctor", shift="morning", status="available", fatigue_score=30),
        Staff(name="Nurse Test", role="nurse", shift="evening", status="on_duty", fatigue_score=50),
    ]
    for s in staff:
        db_session.add(s)
    db_session.commit()
    return staff

@pytest.fixture
def sample_inventory(db_session):
    """Create sample inventory data"""
    items = [
        Inventory(item_name="O2 Cylinders", category="consumable", current_stock=45, minimum_threshold=50, unit="units", supplier="Test Supplier", unit_cost=800),
        Inventory(item_name="IV Fluids", category="medicine", current_stock=300, minimum_threshold=250, unit="units", supplier="Test Supplier", unit_cost=80),
    ]
    for item in items:
        db_session.add(item)
    db_session.commit()
    return items

@pytest.fixture
def sample_prediction(db_session):
    """Create sample surge prediction"""
    prediction = SurgePrediction(
        forecast_horizon="24h",
        department="ER",
        predicted_patient_count=150,
        confidence_score=85,
        contributing_factors={"aqi": 300, "weather": "poor"},
        status="active"
    )
    db_session.add(prediction)
    db_session.commit()
    return prediction

@pytest.fixture
def sample_recommendation(db_session):
    """Create sample recommendation"""
    rec = Recommendation(
        recommendation_type="staff_reallocation",
        title="Move nurses to ER",
        description="Reallocate 5 nurses from OPD to ER",
        priority="high",
        estimated_cost_impact=-15000,
        status="pending",
        created_by_agent="orchestrator"
    )
    db_session.add(rec)
    db_session.commit()
    return rec
