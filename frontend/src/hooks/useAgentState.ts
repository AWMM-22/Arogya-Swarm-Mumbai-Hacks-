import { useState, useEffect } from 'react';
import { fetchBeds, fetchStaff, fetchInventory, fetchLatestPrediction, fetchRecommendations } from '../lib/api';

export function useAgentState(latestUpdate?: any) {
  const [agentState, setAgentState] = useState<any>({
    messages: [],
    current_agent: 'system'
  });
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [surgePrediction, setSurgePrediction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [beds, staff, inventory, prediction, recs] = await Promise.all([
          fetchBeds().catch(() => []),
          fetchStaff().catch(() => []),
          fetchInventory(true).catch(() => []),
          fetchLatestPrediction().catch(() => null),
          fetchRecommendations().catch(() => [])
        ]);
        
        // Create activity messages from recommendations and prediction
        const messages = [];
        
        // Sentinel Agent message
        if (prediction) {
          messages.push({
            agent: 'sentinel',
            message: `Detected ${prediction.surge_likelihood} surge likelihood with ${prediction.confidence_score}% confidence`,
            confidence: prediction.confidence_score,
            timestamp: new Date(prediction.prediction_time).toISOString()
          });
        }
        
        // Orchestrator coordination message
        messages.push({
          agent: 'orchestrator',
          message: `Coordinating ${recs.length || 0} recommendations across departments`,
          timestamp: new Date().toISOString()
        });
        
        // Group recommendations by agent type
        const agentGroups: Record<string, any[]> = {};
        recs.forEach((rec: any) => {
          if (!agentGroups[rec.created_by_agent]) {
            agentGroups[rec.created_by_agent] = [];
          }
          agentGroups[rec.created_by_agent].push(rec);
        });
        
        // Create one message per agent type
        Object.entries(agentGroups).forEach(([agentName, agentRecs]) => {
          const latestRec = agentRecs[0];
          
          if (agentName === 'StaffReallocationAgent') {
            messages.push({
              agent: 'action',
              message: `Generated ${agentRecs.length} staff reallocation recommendation${agentRecs.length > 1 ? 's' : ''}`,
              confidence: 85,
              timestamp: new Date(latestRec.created_at).toISOString()
            });
          } else if (agentName === 'SupplyChainAgent') {
            messages.push({
              agent: 'logistics',
              message: `Generated ${agentRecs.length} supply chain recommendation${agentRecs.length > 1 ? 's' : ''}`,
              confidence: 80,
              timestamp: new Date(latestRec.created_at).toISOString()
            });
          } else if (agentName === 'PatientAdvisoryAgent') {
            messages.push({
              agent: 'action',
              message: `Generated ${agentRecs.length} patient advisory recommendation${agentRecs.length > 1 ? 's' : ''}`,
              confidence: 90,
              timestamp: new Date(latestRec.created_at).toISOString()
            });
          }
        });
        
        // Sort messages by timestamp (newest first)
        messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setAgentState({
          bed_availability: beds,
          staff_availability: staff,
          inventory_levels: inventory,
          surge_prediction: prediction,
          messages: messages,
          current_agent: messages.length > 0 ? messages[0].agent : 'orchestrator',
          reasoning_chain: [],
          recommendations: recs
        });
        setSurgePrediction(prediction);
        setRecommendations(recs);
      } catch (error) {
        console.error('Error fetching agent state:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    
    return () => clearInterval(interval);
  }, []);
  
  // Update from WebSocket if available
  useEffect(() => {
    if (latestUpdate) {
      if (latestUpdate.recommendations) setRecommendations(latestUpdate.recommendations);
      if (latestUpdate.surge_prediction) setSurgePrediction(latestUpdate.surge_prediction);
      if (latestUpdate.messages) {
        setAgentState((prev: any) => ({
          ...prev,
          messages: latestUpdate.messages
        }));
      }
    }
  }, [latestUpdate]);
  
  return { agentState, recommendations, surgePrediction, loading };
}
