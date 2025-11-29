from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from core.database import get_db
from models.hospital import Bed, Staff, Inventory
from models.predictions import SurgePrediction
from models.actions import Recommendation
from agents import ArogyaSwarmGraph
from services.cost_calculator import CostCalculator

router = APIRouter()

# ============================================
# REQUEST MODELS
# ============================================

class CrisisSimulationRequest(BaseModel):
    crisis_type: str  # 'pollution', 'dengue', 'trauma'

# ============================================
# HOSPITAL STATE ENDPOINTS
# ============================================

@router.get("/beds")
async def get_bed_availability(
    department: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get current bed availability"""
    query = db.query(Bed)
    if department:
        query = query.filter(Bed.department == department)
    beds = query.all()
    
    # Aggregate by department
    availability = {}
    for bed in beds:
        if bed.department not in availability:
            availability[bed.department] = {"total": 0, "available": 0, "occupied": 0}
        availability[bed.department]["total"] += 1
        if bed.status == "available":
            availability[bed.department]["available"] += 1
        elif bed.status == "occupied":
            availability[bed.department]["occupied"] += 1
    
    return availability

@router.get("/staff")
async def get_staff_availability(
    shift: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get staff availability"""
    query = db.query(Staff)
    if shift:
        query = query.filter(Staff.shift == shift)
    staff = query.all()
    
    # Calculate medical staff metrics (doctors + nurses only)
    doctors_count = len([s for s in staff if s.role == "doctor"])
    nurses_count = len([s for s in staff if s.role == "nurse"])
    doctors_available = len([s for s in staff if s.role == "doctor" and s.status == "available"])
    nurses_available = len([s for s in staff if s.role == "nurse" and s.status == "available"])
    
    total_medical_staff = doctors_count + nurses_count
    total_available = doctors_available + nurses_available
    on_duty_count = total_medical_staff - total_available
    
    return {
        "total": len(staff),
        "available": len([s for s in staff if s.status == "available"]),
        "on_duty": on_duty_count,
        "doctors": doctors_count,
        "nurses": nurses_count,
        "doctors_available": doctors_available,
        "nurses_available": nurses_available,
        "avg_fatigue": sum([s.fatigue_score for s in staff]) / len(staff) if staff else 0
    }

@router.get("/inventory")
async def get_inventory_status(
    critical_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get inventory levels"""
    query = db.query(Inventory)
    if critical_only:
        query = query.filter(Inventory.current_stock < Inventory.minimum_threshold)
    inventory = query.all()
    
    return [
        {
            "item": item.item_name,
            "current": item.current_stock,
            "threshold": item.minimum_threshold,
            "status": "critical" if item.current_stock < item.minimum_threshold else "ok"
        }
        for item in inventory
    ]

# ============================================
# AGENT & PREDICTION ENDPOINTS
# ============================================

@router.get("/predictions/latest")
async def get_latest_prediction(db: Session = Depends(get_db)):
    """Get most recent surge prediction"""
    prediction = db.query(SurgePrediction).order_by(SurgePrediction.prediction_time.desc()).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="No predictions available")
    return prediction

@router.get("/predictions/history")
async def get_prediction_history(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get historical predictions"""
    predictions = db.query(SurgePrediction).order_by(SurgePrediction.prediction_time.desc()).limit(limit).all()
    return predictions

@router.post("/agent/run")
async def trigger_agent_run(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Manually trigger agent workflow"""
    # Add to background tasks to avoid timeout
    background_tasks.add_task(run_agent_workflow, db)
    return {"message": "Agent workflow started", "status": "processing"}

async def run_agent_workflow(db: Session):
    """Execute agent workflow (called as background task)"""
    # Similar to monitoring loop in main.py
    pass

# ============================================
# RECOMMENDATIONS ENDPOINTS
# ============================================

@router.get("/recommendations")
async def get_recommendations(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get recommendations"""
    query = db.query(Recommendation)
    if status:
        query = query.filter(Recommendation.status == status)
    recommendations = query.order_by(Recommendation.created_at.desc()).all()
    return recommendations

@router.post("/recommendations/{rec_id}/approve")
async def approve_recommendation(
    rec_id: str,
    db: Session = Depends(get_db)
):
    """Approve a pending recommendation"""
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    
    rec.status = "approved"
    rec.executed_at = datetime.now()
    db.commit()
    
    return {"message": "Recommendation approved", "recommendation": rec}

@router.post("/recommendations/{rec_id}/reject")
async def reject_recommendation(
    rec_id: str,
    reason: str,
    db: Session = Depends(get_db)
):
    """Reject a recommendation"""
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    
    rec.status = "rejected"
    rec.outcome = f"Rejected: {reason}"
    db.commit()
    
    return {"message": "Recommendation rejected"}

# ============================================
# COST CALCULATOR ENDPOINT
# ============================================

@router.get("/analytics/cost-savings")
async def get_cost_savings(db: Session = Depends(get_db)):
    """Calculate total cost savings from approved recommendations"""
    calculator = CostCalculator(db)
    savings = calculator.calculate_total_savings()
    return savings

# ============================================
# SIMULATION ENDPOINTS (for demo)
# ============================================

@router.post("/simulation/trigger-crisis")
async def trigger_crisis_simulation(
    request: CrisisSimulationRequest,
    db: Session = Depends(get_db)
):
    """Trigger a crisis scenario for demo"""
    from simulation.scenarios import load_scenario
    scenario_data = load_scenario(request.crisis_type)
    
    # Inject scenario data into system
    # Update external data cache, trigger agent run
    
    return {
        "message": f"Crisis simulation '{request.crisis_type}' triggered",
        "scenario": scenario_data
    }

@router.get("/agents/test-reasoning")
async def test_agent_reasoning():
    """Generate sample agent reasoning chain for testing"""
    from datetime import datetime
    
    reasoning_chain = [
        {
            "agent": "Sentinel",
            "message": "Analyzing environmental data from OpenWeatherMap API...",
            "timestamp": datetime.now().isoformat(),
            "level": "info"
        },
        {
            "agent": "Sentinel",
            "message": "AQI levels detected at 187 (Unhealthy). PM2.5 concentration: 92 µg/m³",
            "timestamp": datetime.now().isoformat(),
            "level": "warning"
        },
        {
            "agent": "Sentinel",
            "message": "Historical correlation analysis: 68% increase in respiratory admissions during high AQI periods",
            "timestamp": datetime.now().isoformat(),
            "level": "info"
        },
        {
            "agent": "Orchestrator",
            "message": "Received alert from Sentinel. Initiating coordinated response protocol.",
            "timestamp": datetime.now().isoformat(),
            "level": "info"
        },
        {
            "agent": "Orchestrator",
            "message": "Predicted surge: +45 respiratory patients in next 6 hours. Current ICU capacity: 78%",
            "timestamp": datetime.now().isoformat(),
            "level": "warning"
        },
        {
            "agent": "Logistics",
            "message": "Inventory check: Nebulizers at 67%, Oxygen tanks at 82%, Bronchodilators at 71%",
            "timestamp": datetime.now().isoformat(),
            "level": "info"
        },
        {
            "agent": "Logistics",
            "message": "Calculating optimal resource allocation using dynamic programming...",
            "timestamp": datetime.now().isoformat(),
            "level": "info"
        },
        {
            "agent": "Action",
            "message": "Recommendation: Increase respiratory ward staffing by 30% for next shift",
            "timestamp": datetime.now().isoformat(),
            "level": "success"
        },
        {
            "agent": "Action",
            "message": "Recommendation: Pre-allocate 12 ICU beds for respiratory cases",
            "timestamp": datetime.now().isoformat(),
            "level": "success"
        },
        {
            "agent": "Orchestrator",
            "message": "Response plan finalized. Estimated cost savings: ₹2.4L vs reactive approach",
            "timestamp": datetime.now().isoformat(),
            "level": "success"
        }
    ]
    
    messages = [
        "High AQI alert detected",
        "Surge prediction: +45 respiratory cases",
        "Resource allocation optimized",
        "Staff scheduling updated"
    ]
    
    return {
        "reasoning_chain": reasoning_chain,
        "messages": messages,
        "surge_prediction": {
            "predicted_surge": 45,
            "confidence": 0.87,
            "timeline_hours": 6,
            "trigger": "environmental"
        },
        "recommendations": [
            {
                "priority": "high",
                "action": "Increase respiratory ward staffing by 30%",
                "estimated_cost": 15000,
                "department": "respiratory"
            },
            {
                "priority": "high", 
                "action": "Pre-allocate 12 ICU beds for respiratory cases",
                "estimated_cost": 0,
                "department": "icu"
            }
        ],
        "timestamp": datetime.now().isoformat()
    }

@router.get("/environment/weather")
async def get_current_weather(lat: Optional[float] = None, lon: Optional[float] = None):
    """Get real-time weather from OpenWeatherMap API for current location or Mumbai"""
    from services.weather_service import WeatherService
    import os
    
    weather_service = WeatherService(os.getenv("OPENWEATHERMAP_API_KEY"))
    
    if lat is not None and lon is not None:
        # Use coordinates
        import httpx
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    "https://api.openweathermap.org/data/2.5/weather",
                    params={
                        "lat": lat,
                        "lon": lon,
                        "appid": os.getenv("OPENWEATHERMAP_API_KEY"),
                        "units": "metric"
                    },
                    timeout=10.0
                )
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "temperature": data["main"]["temp"],
                        "description": data["weather"][0]["description"],
                        "humidity": data["main"]["humidity"],
                        "wind_speed": data["wind"]["speed"],
                        "timestamp": datetime.now().isoformat()
                    }
            except Exception as e:
                print(f"Weather API error: {e}")
    
    # Fall back to city name
    weather_data = await weather_service.get_current_weather("Mumbai")
    return weather_data

@router.get("/environment/aqi")
async def get_current_aqi(lat: Optional[float] = None, lon: Optional[float] = None):
    """Get real-time AQI from OpenWeatherMap API for current location or Mumbai"""
    from services.aqi_service import AQIService
    
    aqi_service = AQIService()
    aqi = await aqi_service.get_current_aqi("Mumbai", lat=lat, lon=lon)
    
    # Determine quality level
    if aqi <= 50:
        quality = "Good"
        color = "green"
    elif aqi <= 100:
        quality = "Moderate"
        color = "yellow"
    elif aqi <= 150:
        quality = "Unhealthy for Sensitive Groups"
        color = "orange"
    elif aqi <= 200:
        quality = "Unhealthy"
        color = "red"
    elif aqi <= 300:
        quality = "Very Unhealthy"
        color = "purple"
    else:
        quality = "Hazardous"
        color = "maroon"
    
    return {
        "aqi": aqi,
        "quality": quality,
        "color": color,
        "city": "Mumbai" if not lat else f"Lat: {lat}, Lon: {lon}",
        "timestamp": datetime.now().isoformat()
    }
