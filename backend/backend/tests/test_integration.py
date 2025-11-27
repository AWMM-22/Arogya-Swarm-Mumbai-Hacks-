# ============================================
# FILE: backend/tests/test_integration.py
# Integration Tests (End-to-End)
# ============================================

import pytest
import asyncio
from unittest.mock import patch, AsyncMock, Mock

@pytest.mark.asyncio
async def test_full_agent_workflow():
    """Test complete agent workflow from Sentinel to Action agents"""
    from agents import ArogyaSwarmGraph
    from agents.agent_state import AgentState
    
    # Mock configuration
    config = {
        'gemini_api_key': 'test_key',
        'db_session': None,
        'twilio_client': None
    }
    
    # Create agent system
    with patch('agents.sentinel_agent.ChatGoogleGenerativeAI') as mock_llm:
        mock_llm.return_value.ainvoke = AsyncMock(return_value=Mock(
            content='{"surge_likelihood": "high", "confidence_score": 85}'
        ))
        
        swarm = ArogyaSwarmGraph(config)
        
        # Initial state
        initial_state: AgentState = {
            "current_weather": {"temperature": 35},
            "current_aqi": 300,
            "upcoming_events": ["Festival"],
            "social_media_sentiment": {},
            "bed_availability": {},
            "staff_availability": {},
            "inventory_levels": {},
            "current_patient_queue": [],
            "surge_prediction": {},
            "confidence_score": 0,
            "recommendations": [],
            "messages": [],
            "reasoning_chain": [],
            "current_agent": "",
            "next_action": ""
        }
        
        # Run workflow
        final_state = await swarm.run(initial_state)
        
        # Assertions
        assert "surge_prediction" in final_state
        assert len(final_state["messages"]) > 0
        # With high surge, recommendations should be generated
        # Note: Exact behavior depends on agent implementation

@pytest.mark.asyncio
async def test_websocket_connection(client):
    """Test WebSocket connection"""
    from fastapi.testclient import TestClient
    
    with client.websocket_connect("/ws") as websocket:
        # Connection should be established
        # Send a test message
        websocket.send_text("ping")
        # In real implementation, would receive updates

def test_simulation_trigger(client):
    """Test triggering crisis simulation"""
    response = client.post(
        "/api/v1/simulation/trigger-crisis",
        json={"crisis_type": "pollution"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "simulation" in data["message"].lower() or "crisis" in data["message"].lower()

def test_agent_run_trigger(client):
    """Test manually triggering agent run"""
    response = client.post("/api/v1/agent/run")
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "processing"

@pytest.mark.asyncio
async def test_recommendation_workflow(client, sample_recommendation):
    """Test complete recommendation workflow"""
    rec_id = str(sample_recommendation.id)
    
    # 1. Get pending recommendations
    response = client.get("/api/v1/recommendations?status=pending")
    assert response.status_code == 200
    assert len(response.json()) == 1
    
    # 2. Approve recommendation
    response = client.post(f"/api/v1/recommendations/{rec_id}/approve")
    assert response.status_code == 200
    
    # 3. Verify it's no longer pending
    response = client.get("/api/v1/recommendations?status=pending")
    assert len(response.json()) == 0
    
    # 4. Check cost savings updated
    response = client.get("/api/v1/analytics/cost-savings")
    data = response.json()
    assert data["recommendations_count"] == 1

def test_cors_headers(client):
    """Test CORS headers are set correctly"""
    response = client.options("/api/v1/beds")
    # In production, would check for Access-Control-Allow-Origin headers

@pytest.mark.asyncio
async def test_error_handling_invalid_recommendation_id(client):
    """Test error handling for invalid recommendation ID"""
    from uuid import uuid4
    fake_id = str(uuid4())
    
    response = client.post(f"/api/v1/recommendations/{fake_id}/approve")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_rate_limiting_simulation():
    """Test that rapid requests don't crash the system"""
    # This would test rate limiting if implemented
    pass  # Placeholder for rate limiting tests
