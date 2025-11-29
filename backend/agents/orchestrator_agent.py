from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
from langchain.agents import AgentExecutor, create_react_agent
from langchain.tools import Tool

class OrchestratorAgent:
    """
    Main reasoning engine using ReAct (Reasoning + Acting) framework.
    Decides what actions to take based on Sentinel's predictions.
    """
    
    def __init__(self, gemini_api_key: str):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash-lite",
            google_api_key=gemini_api_key,
            temperature=0.5  # Balanced creativity and consistency
        )
        
        # Define available tools for ReAct agent
        self.tools = [
            Tool(
                name="QueryLogistics",
                func=self._query_logistics_tool,
                description="Get current hospital resource levels (beds, staff, inventory)"
            ),
            Tool(
                name="CalculateCostImpact",
                func=self._calculate_cost_tool,
                description="Calculate financial impact of a recommendation (savings or cost)"
            ),
            Tool(
                name="CheckHistoricalData",
                func=self._check_historical_tool,
                description="Look up similar past surge events and outcomes"
            )
        ]
        
        self.react_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an Orchestrator Agent coordinating hospital surge response.

You have access to these tools:
{tools}

Use ReAct framework:
Thought: Analyze the situation
Action: Use a tool if needed
Action Input: Parameters for the tool
Observation: Result from tool
... (repeat Thought/Action/Observation as needed)
Thought: I now have enough information
Final Answer: Structured recommendation

Current Situation:
{surge_prediction}

Your goal: Create a comprehensive action plan with:
1. Staff reallocation recommendations
2. Supply chain alerts
3. Patient advisory messages

Be specific with numbers and priorities."""),
            ("human", "{input}"),
            ("assistant", "{agent_scratchpad}")
        ])
        
    async def orchestrate(self, state: dict) -> dict:
        """Main orchestration function using ReAct reasoning"""
        
        surge_pred = state["surge_prediction"]
        
        # If surge likelihood is low, no action needed
        if surge_pred["surge_likelihood"] == "low":
            return {
                "messages": ["[Orchestrator] Situation normal, no action required"],
                "next_action": "continue_monitoring"
            }
        
        # Create ReAct agent
        agent = create_react_agent(self.llm, self.tools, self.react_prompt)
        agent_executor = AgentExecutor(
            agent=agent,
            tools=self.tools,
            verbose=True,
            max_iterations=5
        )
        
        # Execute reasoning chain
        input_text = f"""
        Surge Prediction: {surge_pred['surge_likelihood']}
        Confidence: {surge_pred['confidence_score']}%
        Affected Departments: {surge_pred.get('departments_affected', [])}
        Time Horizon: {surge_pred.get('time_horizon', '24h')}
        
        Create an action plan to handle this surge.
        """
        
        result = await agent_executor.ainvoke({
            "input": input_text,
            "surge_prediction": surge_pred,
            "tools": self.tools,
            "agent_scratchpad": ""
        })
        
        # Parse recommendations from result
        recommendations = self._parse_recommendations(result["output"])
        
        return {
            "recommendations": recommendations,
            "messages": [f"[Orchestrator] Generated {len(recommendations)} recommendations"],
            "reasoning_chain": [result["output"]],
            "current_agent": "orchestrator",
            "next_action": "dispatch_action_agents"
        }
    
    def _query_logistics_tool(self, query: str) -> str:
        """Tool: Query current hospital resources"""
        # In production, this queries PostgreSQL via LogisticsAgent
        return """
        Current Resources:
        - ER Beds: 12/50 available (24% capacity)
        - ICU Beds: 5/40 available (12.5% capacity)
        - Nurses on duty: 45 (Morning shift)
        - Critical Inventory: O2 Cylinders at 45/50 (90%)
        """
    
    def _calculate_cost_tool(self, action: str) -> str:
        """Tool: Calculate financial impact"""
        # Simplified cost calculator
        cost_map = {
            "overtime_staff": -15000,  # Cost of overtime
            "emergency_procurement": -25000,  # Cost of rush orders
            "prevent_diversion": 50000,  # Savings from keeping patients
            "avoid_overtime": 15000  # Savings from proactive scheduling
        }
        return f"Estimated impact: ₹{cost_map.get(action, 0)}"
    
    def _check_historical_tool(self, event_type: str) -> str:
        """Tool: Retrieve historical patterns"""
        return f"Historical data for {event_type}: Average 35% surge, lasted 48 hours, resolved with +30% staff allocation"
    
    def _parse_recommendations(self, output: str) -> list:
        """Parse LLM output into structured recommendations"""
        # In production, use structured output or JSON parsing
        return [
            {
                "type": "staff_reallocation",
                "title": "Move 5 nurses from OPD to ER",
                "priority": "high",
                "estimated_cost": -5000,
                "reasoning": "ER surge predicted in 12 hours"
            },
            {
                "type": "supply_order",
                "title": "Order 20 O2 cylinders (emergency)",
                "priority": "critical",
                "estimated_cost": -16000,
                "reasoning": "Current stock at 90%, surge will deplete quickly"
            },
            {
                "type": "patient_advisory",
                "title": "SMS Alert: High wait times expected",
                "priority": "medium",
                "estimated_cost": 0,
                "reasoning": "Inform patients to consider teleconsult alternatives"
            }
        ]
