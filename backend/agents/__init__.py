from langgraph.graph import StateGraph, END
from .agent_state import AgentState
from .sentinel_agent import SentinelAgent
from .orchestrator_agent import OrchestratorAgent
from .logistics_agent import LogisticsAgent
from .action_agents import ActionAgentOrchestrator

class ArogyaSwarmGraph:
    """Main LangGraph workflow coordinating all agents"""
    
    def __init__(self, config: dict):
        self.sentinel = SentinelAgent(config['gemini_api_key'])
        self.orchestrator = OrchestratorAgent(config['gemini_api_key'])
        self.logistics = LogisticsAgent(config['db_session'])
        self.action_agents = ActionAgentOrchestrator(
            config['gemini_api_key'],
            config['db_session'],
            config.get('twilio_client')
        )
        
        # Build the graph
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Define agent execution flow"""
        
        workflow = StateGraph(AgentState)
        
        # Add nodes (agents)
        workflow.add_node("sentinel", self._sentinel_node)
        workflow.add_node("orchestrator", self._orchestrator_node)
        workflow.add_node("action_agents", self._action_node)
        workflow.add_node("monitor", self._monitor_node)
        
        # Define edges (flow)
        workflow.set_entry_point("sentinel")
        
        workflow.add_conditional_edges(
            "sentinel",
            self._should_escalate,
            {
                "escalate": "orchestrator",
                "monitor": "monitor"
            }
        )
        
        workflow.add_edge("orchestrator", "action_agents")
        workflow.add_edge("action_agents", END)
        workflow.add_edge("monitor", END)
        
        return workflow.compile()
    
    async def _sentinel_node(self, state: AgentState) -> AgentState:
        """Execute Sentinel Agent"""
        result = await self.sentinel.monitor_and_predict(state)
        state.update(result)
        return state
    
    async def _orchestrator_node(self, state: AgentState) -> AgentState:
        """Execute Orchestrator Agent"""
        result = await self.orchestrator.orchestrate(state)
        state.update(result)
        return state
    
    async def _action_node(self, state: AgentState) -> AgentState:
        """Execute Action Agents"""
        results = await self.action_agents.execute_recommendations(state['recommendations'])
        state['messages'].append(f"[ActionAgents] Executed {len(results)} actions")
        state['action_results'] = results
        return state
    
    async def _monitor_node(self, state: AgentState) -> AgentState:
        """Continue monitoring without action"""
        state['messages'].append("[System] Continuing normal monitoring")
        return state
    
    def _should_escalate(self, state: AgentState) -> str:
        """Decide whether to escalate to Orchestrator"""
        surge_likelihood = state['surge_prediction'].get('surge_likelihood', 'low')
        return "escalate" if surge_likelihood in ['high', 'critical'] else "monitor"
    
    async def run(self, initial_state: AgentState) -> AgentState:
        """Execute the full agent workflow"""
        final_state = await self.graph.ainvoke(initial_state)
        return final_state
