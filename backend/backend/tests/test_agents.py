# ============================================
# FILE: backend/tests/test_agents.py
# Agent Logic Tests
# ============================================

import pytest
from unittest.mock import Mock, AsyncMock, patch
from agents.sentinel_agent import SentinelAgent
from agents.orchestrator_agent import OrchestratorAgent
from agents.logistics_agent import LogisticsAgent
from services.cost_calculator import CostCalculator

@pytest.mark.asyncio
async def test_sentinel_agent_low_risk():
    """Test Sentinel agent with low risk conditions"""
    sentinel = SentinelAgent(gemini_api_key="test_key")
    
    state = {
        "current_aqi": 80,
        "current_weather": {"temperature": 25, "humidity": 60},
        "upcoming_events": [],
        "social_media_sentiment": {}
    }
    
    # Mock the LLM response
    with patch.object(sentinel.llm, 'ainvoke', new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = Mock(
            content='{"surge_likelihood": "low", "confidence_score": 65, "reasoning": "Normal conditions"}'
        )
        
        result = await sentinel.monitor_and_predict(state)
        
        assert "surge_prediction" in result
        assert result["surge_prediction"]["surge_likelihood"] == "low"
        assert result["confidence_score"] >= 0

@pytest.mark.asyncio
async def test_sentinel_agent_high_risk():
    """Test Sentinel agent with high risk conditions"""
    sentinel = SentinelAgent(gemini_api_key="test_key")
    
    state = {
        "current_aqi": 350,  # Very high pollution
        "current_weather": {"temperature": 42, "humidity": 20},
        "upcoming_events": ["Diwali", "Festival"],
        "social_media_sentiment": {"health_complaints": 200}
    }
    
    with patch.object(sentinel.llm, 'ainvoke', new_callable=AsyncMock) as mock_llm:
        mock_llm.return_value = Mock(
            content='{"surge_likelihood": "high", "confidence_score": 85, "reasoning": "High pollution + festival"}'
        )
        
        result = await sentinel.monitor_and_predict(state)
        
        assert result["surge_prediction"]["surge_likelihood"] in ["high", "critical"]
        assert result["next_action"] == "escalate_to_orchestrator"

@pytest.mark.asyncio
async def test_orchestrator_agent_with_low_surge():
    """Test Orchestrator agent with low surge prediction"""
    orchestrator = OrchestratorAgent(
        gemini_api_key="test_key",
        logistics_agent=None,
        cost_calculator=None
    )
    
    state = {
        "surge_prediction": {
            "surge_likelihood": "low",
            "confidence_score": 60
        }
    }
    
    result = await orchestrator.orchestrate(state)
    
    assert result["next_action"] == "continue_monitoring"
    assert len(result["recommendations"]) == 0

@pytest.mark.asyncio
async def test_orchestrator_agent_with_high_surge():
    """Test Orchestrator agent with high surge prediction"""
    orchestrator = OrchestratorAgent(
        gemini_api_key="test_key",
        logistics_agent=None,
        cost_calculator=None
    )
    
    state = {
        "surge_prediction": {
            "surge_likelihood": "high",
            "confidence_score": 85,
            "departments_affected": ["ER", "Respiratory"],
            "time_horizon": "24h"
        }
    }
    
    # Mock the agent executor
    with patch('agents.orchestrator_agent.AgentExecutor') as mock_executor:
        mock_instance = mock_executor.return_value
        mock_instance.ainvoke = AsyncMock(return_value={
            "output": "Recommendations generated",
            "intermediate_steps": []
        })
        
        result = await orchestrator.orchestrate(state)
        
        assert "recommendations" in result
        assert len(result["recommendations"]) > 0
        assert result["next_action"] == "dispatch_action_agents"

def test_orchestrator_query_logistics_tool():
    """Test Orchestrator's logistics query tool"""
    orchestrator = OrchestratorAgent(
        gemini_api_key="test_key",
        logistics_agent=None,
        cost_calculator=None
    )
    
    result = orchestrator._query_logistics_tool("beds")
    assert "ER" in result
    assert "ICU" in result

def test_orchestrator_cost_calculation_tool():
    """Test Orchestrator's cost calculation tool"""
    orchestrator = OrchestratorAgent(
        gemini_api_key="test_key",
        logistics_agent=None,
        cost_calculator=None
    )
    
    result = orchestrator._calculate_cost_tool("overtime_staff")
    assert "₹" in result
    assert "24,000" in result or "24000" in result

def test_orchestrator_historical_data_tool():
    """Test Orchestrator's historical data tool"""
    orchestrator = OrchestratorAgent(
        gemini_api_key="test_key",
        logistics_agent=None,
        cost_calculator=None
    )
    
    result = orchestrator._check_historical_tool("pollution")
    assert "35-50%" in result
    assert "ER" in result or "Respiratory" in result

def test_logistics_agent_bed_availability(db_session, sample_beds):
    """Test Logistics agent bed availability query"""
    logistics = LogisticsAgent(db_session)
    
    result = logistics.get_bed_availability()
    
    assert "ER" in result
    assert "ICU" in result
    assert result["ER"]["total"] == 2
    assert result["ER"]["available"] == 1

def test_logistics_agent_staff_availability(db_session, sample_staff):
    """Test Logistics agent staff availability query"""
    logistics = LogisticsAgent(db_session)
    
    result = logistics.get_staff_availability()
    
    assert len(result) > 0
    # Check that staff data is properly aggregated

def test_logistics_agent_critical_inventory(db_session, sample_inventory):
    """Test Logistics agent critical inventory query"""
    logistics = LogisticsAgent(db_session)
    
    result = logistics.get_inventory_status(critical_only=True)
    
    # O2 Cylinders should be critical (45 < 50)
    critical_items = [item for item in result if item["status"] == "critical"]
    assert len(critical_items) == 1
    assert critical_items[0]["item"] == "O2 Cylinders"

def test_cost_calculator_overtime(db_session):
    """Test cost calculator overtime calculation"""
    calculator = CostCalculator(db_session)
    
    cost = calculator.calculate_overtime_cost(10, "nurse")
    
    assert cost > 0
    assert cost == 10 * 800 * 1.5  # hours * hourly_rate * overtime_multiplier

def test_cost_calculator_emergency_procurement(db_session):
    """Test cost calculator emergency procurement"""
    calculator = CostCalculator(db_session)
    
    cost = calculator.calculate_emergency_procurement_cost("O2 Cylinders", 20)
    
    assert cost > 0
    # Should include emergency markup

def test_cost_calculator_total_savings(db_session, sample_recommendation):
    """Test cost calculator total savings"""
    # Approve the recommendation
    sample_recommendation.status = "approved"
    db_session.commit()
    
    calculator = CostCalculator(db_session)
    result = calculator.calculate_total_savings()
    
    assert "total_savings" in result
    assert "total_costs" in result
    assert "net_savings" in result
    assert result["recommendations_count"] == 1
