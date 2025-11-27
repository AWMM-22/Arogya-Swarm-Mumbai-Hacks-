from typing import TypedDict, Annotated, Sequence
from langgraph.graph import StateGraph, END
import operator

class AgentState(TypedDict):
    """Shared state between all agents"""
    # External data
    current_weather: dict
    current_aqi: int
    upcoming_events: list
    social_media_sentiment: dict
    
    # Hospital state
    bed_availability: dict
    staff_availability: dict
    inventory_levels: dict
    current_patient_queue: list
    
    # Predictions
    surge_prediction: dict
    confidence_score: int  # 0-100
    
    # Recommendations
    recommendations: Annotated[list, operator.add]  # Accumulate recommendations
    
    # Agent communication
    messages: Annotated[Sequence[str], operator.add]
    reasoning_chain: Annotated[list, operator.add]
    
    # Execution state
    current_agent: str
    next_action: str
