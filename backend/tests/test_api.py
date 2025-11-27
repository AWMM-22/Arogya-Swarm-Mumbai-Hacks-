# ============================================
# FILE: backend/tests/test_api.py
# API Endpoint Tests
# ============================================

import pytest
from uuid import uuid4

def test_health_check(client):
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_root_endpoint(client):
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert "Arogya-Swarm API" in response.json()["message"]

# Bed Endpoints
def test_get_beds_all(client, sample_beds):
    """Test getting all beds"""
    response = client.get("/api/v1/beds")
    assert response.status_code == 200
    data = response.json()
    assert "ER" in data
    assert "ICU" in data
    assert data["ER"]["total"] == 2

def test_get_beds_by_department(client, sample_beds):
    """Test getting beds filtered by department"""
    response = client.get("/api/v1/beds?department=ER")
    assert response.status_code == 200
    data = response.json()
    assert "ER" in data
    assert "ICU" not in data

# Staff Endpoints
def test_get_staff_availability(client, sample_staff):
    """Test getting staff availability"""
    response = client.get("/api/v1/staff")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert data["available"] == 1
    assert data["on_duty"] == 1
    assert "avg_fatigue" in data

def test_get_staff_by_shift(client, sample_staff):
    """Test getting staff filtered by shift"""
    response = client.get("/api/v1/staff?shift=morning")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1

# Inventory Endpoints
def test_get_inventory_all(client, sample_inventory):
    """Test getting all inventory"""
    response = client.get("/api/v1/inventory")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

def test_get_inventory_critical_only(client, sample_inventory):
    """Test getting critical inventory only"""
    response = client.get("/api/v1/inventory?critical_only=true")
    assert response.status_code == 200
    data = response.json()
    # O2 Cylinders should be critical (45 < 50)
    assert len(data) == 1
    assert data[0]["item"] == "O2 Cylinders"
    assert data[0]["status"] == "critical"

# Prediction Endpoints
def test_get_latest_prediction(client, sample_prediction):
    """Test getting latest prediction"""
    response = client.get("/api/v1/predictions/latest")
    assert response.status_code == 200
    data = response.json()
    assert data["department"] == "ER"
    assert data["confidence_score"] == 85

def test_get_latest_prediction_not_found(client):
    """Test getting latest prediction when none exists"""
    response = client.get("/api/v1/predictions/latest")
    assert response.status_code == 404

def test_get_prediction_history(client, sample_prediction):
    """Test getting prediction history"""
    response = client.get("/api/v1/predictions/history?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1

# Recommendation Endpoints
def test_get_recommendations_all(client, sample_recommendation):
    """Test getting all recommendations"""
    response = client.get("/api/v1/recommendations")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Move nurses to ER"

def test_get_recommendations_by_status(client, sample_recommendation):
    """Test getting recommendations filtered by status"""
    response = client.get("/api/v1/recommendations?status=pending")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["status"] == "pending"

def test_approve_recommendation(client, sample_recommendation):
    """Test approving a recommendation"""
    rec_id = str(sample_recommendation.id)
    response = client.post(f"/api/v1/recommendations/{rec_id}/approve")
    assert response.status_code == 200
    data = response.json()
    assert data["recommendation"]["status"] == "approved"

def test_reject_recommendation(client, sample_recommendation):
    """Test rejecting a recommendation"""
    rec_id = str(sample_recommendation.id)
    response = client.post(
        f"/api/v1/recommendations/{rec_id}/reject",
        json={"reason": "Not needed"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "rejected" in data["message"].lower()

def test_approve_nonexistent_recommendation(client):
    """Test approving non-existent recommendation"""
    fake_id = str(uuid4())
    response = client.post(f"/api/v1/recommendations/{fake_id}/approve")
    assert response.status_code == 404

# Cost Savings Endpoint
def test_get_cost_savings_empty(client):
    """Test cost savings with no approved recommendations"""
    response = client.get("/api/v1/analytics/cost-savings")
    assert response.status_code == 200
    data = response.json()
    assert data["net_savings"] == 0
    assert data["recommendations_count"] == 0

def test_get_cost_savings_with_data(client, sample_recommendation):
    """Test cost savings with approved recommendations"""
    # Approve recommendation first
    rec_id = str(sample_recommendation.id)
    client.post(f"/api/v1/recommendations/{rec_id}/approve")
    
    response = client.get("/api/v1/analytics/cost-savings")
    assert response.status_code == 200
    data = response.json()
    assert data["recommendations_count"] == 1
    assert data["total_costs"] > 0
