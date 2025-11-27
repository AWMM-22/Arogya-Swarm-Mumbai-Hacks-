from langchain_google_genai import ChatGoogleGenerativeAI
from typing import Dict, List
from twilio.rest import Client
import json
import random

class StaffReallocationAgent:
    """Handles staff scheduling and reallocation"""
    
    def __init__(self, gemini_api_key: str):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-lite",
            google_api_key=gemini_api_key
        )
    
    async def draft_reallocation_plan(self, recommendation: Dict, current_staff: Dict) -> Dict:
        """Generate detailed staff reallocation plan"""
        
        prompt = f"""
        You are a Staff Reallocation Agent. Create a specific, actionable staff reallocation plan.
        
        Recommendation: {recommendation['title']}
        Reasoning: {recommendation['reasoning']}
        
        Current Staff Status:
        {json.dumps(current_staff, indent=2)}
        
        Rules:
        1. Do not assign staff with fatigue_score > 70
        2. Maintain minimum staffing ratios (1 nurse : 4 patients in ER)
        3. Consider staff specializations
        4. Calculate overtime costs
        
        Output JSON format:
        {{
            "staff_to_move": [
                {{"name": "Nurse X", "from": "OPD", "to": "ER", "shift": "evening"}}
            ],
            "estimated_overtime_hours": 10,
            "cost_impact": -5000,
            "implementation_notes": "Contact nursing supervisor for approval"
        }}
        """
        
        result = await self.llm.ainvoke(prompt)
        # Parse and return structured plan
        return json.loads(result.content)
    
    def calculate_fatigue_score(self, staff_id: str, hours_worked: int) -> int:
        """Calculate staff burnout risk"""
        base_fatigue = (hours_worked / 48) * 100  # 48 hours/week is max safe limit
        # Add randomness for realism
        return min(100, int(base_fatigue + random.randint(-10, 10)))


class SupplyChainAgent:
    """Handles inventory and procurement"""
    
    def __init__(self, gemini_api_key: str):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-lite",
            google_api_key=gemini_api_key
        )
    
    async def draft_purchase_order(self, recommendation: Dict, inventory: List[Dict]) -> Dict:
        """Generate purchase order draft"""
        
        critical_items = [item for item in inventory if item['status'] == 'critical']
        
        prompt = f"""
        You are a Supply Chain Agent. Draft a purchase order for critical supplies.
        
        Recommendation: {recommendation['title']}
        
        Critical Inventory:
        {json.dumps(critical_items, indent=2)}
        
        For each item:
        1. Calculate order quantity (threshold + 20% buffer)
        2. Identify fastest supplier
        3. Estimate delivery time
        4. Calculate total cost
        
        Output JSON format:
        {{
            "order_items": [
                {{"item": "O2 Cylinders", "quantity": 25, "supplier": "MedSupply India", "unit_cost": 800, "delivery_eta": "6 hours"}}
            ],
            "total_cost": 20000,
            "priority": "emergency|normal",
            "approval_required": true|false
        }}
        """
        
        result = await self.llm.ainvoke(prompt)
        return json.loads(result.content)


class PatientAdvisoryAgent:
    """Handles patient communication"""
    
    def __init__(self, gemini_api_key: str, twilio_client: Client = None):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-lite",
            google_api_key=gemini_api_key
        )
        self.twilio = twilio_client
    
    async def generate_advisory_message(self, recommendation: Dict, queue_data: Dict) -> Dict:
        """Generate patient advisory SMS/notification"""
        
        prompt = f"""
        You are a Patient Advisory Agent. Create a helpful, empathetic message for patients.
        
        Situation: {recommendation['reasoning']}
        Current Wait Times: {json.dumps(queue_data, indent=2)}
        
        Generate messages in:
        1. English
        2. Hindi
        3. Marathi
        
        Include:
        - Current wait time estimate
        - Alternative options (teleconsult, nearby hospitals)
        - Urgency assessment (when to come immediately vs. when to wait)
        
        Output JSON format:
        {{
            "messages": {{
                "en": "SMS text in English",
                "hi": "SMS text in Hindi",
                "mr": "SMS text in Marathi"
            }},
            "alternative_hospitals": ["Hospital A - 2km", "Hospital B - 5km"],
            "teleconsult_link": "https://hospital.com/teleconsult"
        }}
        """
        
        result = await self.llm.ainvoke(prompt)
        advisory = json.loads(result.content)
        
        # Send SMS if Twilio is configured
        if self.twilio and recommendation.get('send_sms', False):
            self._send_sms_alerts(advisory['messages']['en'])
        
        return advisory
    
    def _send_sms_alerts(self, message: str):
        """Send SMS via Twilio"""
        # In production, get patient phone numbers from queue
        # For demo, just log
        print(f"[SMS Sent]: {message}")


class ActionAgentOrchestrator:
    """Coordinates all action agents"""
    
    def __init__(self, gemini_api_key: str, db_session, twilio_client=None):
        self.staff_agent = StaffReallocationAgent(gemini_api_key)
        self.supply_agent = SupplyChainAgent(gemini_api_key)
        self.patient_agent = PatientAdvisoryAgent(gemini_api_key, twilio_client)
        from .logistics_agent import LogisticsAgent
        self.logistics = LogisticsAgent(db_session)
    
    async def execute_recommendations(self, recommendations: List[Dict]) -> List[Dict]:
        """Execute all recommendations through appropriate agents"""
        
        results = []
        
        for rec in recommendations:
            if rec['type'] == 'staff_reallocation':
                current_staff = self.logistics.get_staff_availability()
                plan = await self.staff_agent.draft_reallocation_plan(rec, current_staff)
                results.append({"recommendation": rec, "action_plan": plan})
            
            elif rec['type'] == 'supply_order':
                inventory = self.logistics.get_inventory_status(critical_only=True)
                po = await self.supply_agent.draft_purchase_order(rec, inventory)
                results.append({"recommendation": rec, "purchase_order": po})
            
            elif rec['type'] == 'patient_advisory':
                queue = self.logistics.get_patient_queue_length()
                advisory = await self.patient_agent.generate_advisory_message(rec, queue)
                results.append({"recommendation": rec, "advisory": advisory})
        
        return results
