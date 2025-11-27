from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from core.database import get_db
from models.hospital import Bed, Staff, Inventory
from models.predictions import SurgePrediction
from models.actions import Recommendation
from agents import ArogyaSwarmGraph
from services.cost_calculator import CostCalculator

router = APIRouter()

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
    
    return {
        "total": len(staff),
        "available": len([s for s in staff if s.status == "available"]),
        "on_duty": len([s for s in staff if s.status == "on_duty"]),
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
    crisis_type: str,  # 'pollution', 'dengue', 'trauma'
    db: Session = Depends(get_db)
):
    """Trigger a crisis scenario for demo"""
    from simulation.scenarios import load_scenario
    scenario_data = load_scenario(crisis_type)
    
    # Inject scenario data into system
    # Update external data cache, trigger agent run
    
    return {
        "message": f"Crisis simulation '{crisis_type}' triggered",
        "scenario": scenario_data
    }
