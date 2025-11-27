from sqlalchemy.orm import Session
from models.actions import Recommendation
from typing import Dict

class CostCalculator:
    """Calculate financial impact and ROI of recommendations"""
    
    def __init__(self, db_session: Session):
        self.db = db_session
    
    def calculate_total_savings(self) -> Dict:
        """Calculate total cost savings from approved recommendations"""
        approved_recs = self.db.query(Recommendation).filter(
            Recommendation.status == "approved"
        ).all()
        
        total_savings = sum([
            float(rec.estimated_cost_impact) for rec in approved_recs 
            if rec.estimated_cost_impact and float(rec.estimated_cost_impact) > 0
        ])
        
        total_costs = sum([
            abs(float(rec.estimated_cost_impact)) for rec in approved_recs 
            if rec.estimated_cost_impact and float(rec.estimated_cost_impact) < 0
        ])
        
        return {
            "total_savings": round(total_savings, 2),
            "total_costs": round(total_costs, 2),
            "net_savings": round(total_savings - total_costs, 2),
            "recommendations_approved": len(approved_recs),
            "roi_percentage": round((total_savings / total_costs * 100) if total_costs > 0 else 0, 1)
        }
