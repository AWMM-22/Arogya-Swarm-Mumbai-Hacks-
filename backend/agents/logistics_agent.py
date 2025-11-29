from sqlalchemy.orm import Session
from typing import Dict, List
import json
from datetime import datetime

class LogisticsAgent:
    """
    Tool agent that queries hospital database for real-time resource status.
    Acts as the data layer for other agents.
    """
    
    def __init__(self, db_session: Session):
        self.db = db_session
    
    def get_bed_availability(self, department: str = None) -> Dict:
        """Query current bed status"""
        query = "SELECT department, status, COUNT(*) as count FROM beds"
        if department:
            query += f" WHERE department = '{department}'"
        query += " GROUP BY department, status"
        
        result = self.db.execute(query).fetchall()
        
        availability = {}
        for row in result:
            dept = row[0]
            if dept not in availability:
                availability[dept] = {"total": 0, "available": 0, "occupied": 0}
            availability[dept]["total"] += row[2]
            if row[1] == "available":
                availability[dept]["available"] = row[2]
            elif row[1] == "occupied":
                availability[dept]["occupied"] = row[2]
        
        return availability
    
    def get_staff_availability(self, shift: str = None) -> Dict:
        """Query staff availability by shift and role"""
        query = """
        SELECT shift, role, status, COUNT(*) as count, AVG(fatigue_score) as avg_fatigue
        FROM staff
        """
        if shift:
            query += f" WHERE shift = '{shift}'"
        query += " GROUP BY shift, role, status"
        
        result = self.db.execute(query).fetchall()
        
        staff_data = {}
        for row in result:
            key = f"{row[0]}_{row[1]}"
            if key not in staff_data:
                staff_data[key] = {
                    "shift": row[0],
                    "role": row[1],
                    "available": 0,
                    "total": 0,
                    "avg_fatigue": 0
                }
            staff_data[key]["total"] += row[3]
            if row[2] == "available":
                staff_data[key]["available"] = row[3]
            staff_data[key]["avg_fatigue"] = round(row[4], 1)
        
        return staff_data
    
    def get_inventory_status(self, critical_only: bool = False) -> List[Dict]:
        """Query inventory levels"""
        query = """
        SELECT item_name, current_stock, minimum_threshold, unit, supplier
        FROM inventory
        """
        if critical_only:
            query += " WHERE current_stock < minimum_threshold"
        
        result = self.db.execute(query).fetchall()
        
        inventory = []
        for row in result:
            inventory.append({
                "item": row[0],
                "current": row[1],
                "threshold": row[2],
                "unit": row[3],
                "supplier": row[4],
                "status": "critical" if row[1] < row[2] else "ok",
                "shortage": max(0, row[2] - row[1])
            })
        
        return inventory
    
    def get_patient_queue_length(self, department: str = None) -> Dict:
        """Query current patient waiting queue"""
        query = """
        SELECT department, priority, COUNT(*) as count, AVG(estimated_wait_time) as avg_wait
        FROM patient_queue
        WHERE status = 'waiting'
        """
        if department:
            query += f" AND department = '{department}'"
        query += " GROUP BY department, priority"
        
        result = self.db.execute(query).fetchall()
        
        queue_data = {}
        for row in result:
            dept = row[0]
            if dept not in queue_data:
                queue_data[dept] = {"total": 0, "by_priority": {}, "avg_wait": 0}
            queue_data[dept]["total"] += row[2]
            queue_data[dept]["by_priority"][row[1]] = row[2]
            queue_data[dept]["avg_wait"] = round(row[3], 0)
        
        return queue_data
    
    def get_equipment_status(self) -> List[Dict]:
        """Query equipment operational status"""
        query = """
        SELECT equipment_name, equipment_type, status, location
        FROM equipment
        """
        result = self.db.execute(query).fetchall()
        
        equipment = []
        for row in result:
            equipment.append({
                "name": row[0],
                "type": row[1],
                "status": row[2],
                "location": row[3]
            })
        
        return equipment
    
    def get_full_hospital_state(self) -> Dict:
        """Get complete hospital state snapshot"""
        return {
            "beds": self.get_bed_availability(),
            "staff": self.get_staff_availability(),
            "inventory": self.get_inventory_status(),
            "queue": self.get_patient_queue_length(),
            "equipment": self.get_equipment_status(),
            "timestamp": datetime.now().isoformat()
        }
