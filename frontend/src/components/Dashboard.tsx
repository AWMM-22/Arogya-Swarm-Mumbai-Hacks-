import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { Icons } from './ui/Icons';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates';
import { useAgentState } from '../hooks/useAgentState';
import { fetchLatestPrediction, triggerCrisisSimulation, fetchCurrentAQI, fetchBeds, fetchStaff, fetchInventory } from '../lib/api';

// --- Types ---
type Scenario = 'Normal' | 'Pollution' | 'Festival' | 'Outbreak';
type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
type TabId = 'overview' | 'resources' | 'decisions' | 'advisory' | 'settings';

interface Log {
  id: number;
  agent: 'Sentinel' | 'Orchestrator' | 'Logistics' | 'Action';
  message: string;
  time: string;
  isImportant?: boolean;
}

interface Alert {
  id: number;
  title: string;
  desc: string;
  type: 'warning' | 'critical' | 'info';
  timestamp: string;
}

interface Recommendation {
  id: number;
  agent: string;
  action: string;
  reason: string;
  impact: string;
}

// --- Mock Data Generators ---
const generateChartData = (scenario: Scenario, predictionData?: any, resources?: any) => {
  // Use real prediction data if available
  if (predictionData && predictionData.predicted_surge) {
    const surgeValue = predictionData.predicted_surge;
    const capacity = resources?.beds?.total || 200;
    
    // Generate 48-hour forecast based on prediction
    return Array.from({ length: 48 }, (_, i) => {
      const time = `${i % 24}:00`;
      const hourOffset = (i - 24) / 24; // -1 to +1 range
      const surgeTrend = surgeValue * (1 + Math.sin(hourOffset * Math.PI) * 0.3);
      return { 
        time, 
        surge: Math.floor(Math.max(10, Math.min(100, surgeTrend))), 
        capacity: Math.floor(capacity * 0.8)
      };
    });
  }
  
  // Fallback to synthetic data
  const base = scenario === 'Normal' ? 40 : scenario === 'Pollution' ? 65 : scenario === 'Festival' ? 85 : 95;
  const volatility = scenario === 'Normal' ? 10 : 25;
  const capacity = resources?.beds?.total || 200;
  
  return Array.from({ length: 48 }, (_, i) => {
    const time = `${i % 24}:00`;
    const surge = Math.min(100, Math.max(10, base + Math.sin(i / 8) * volatility + (Math.random() * 10 - 5)));
    return { time, surge: Math.floor(surge), capacity: Math.floor(capacity * 0.8) };
  });
};

const SCENARIO_CONFIG: Record<Scenario, { aqi: number; risk: RiskLevel; weather: string; beds: {free: number, total: number}; oxygen: number; staff: {active: number, idle: number, doctors?: number, nurses?: number, total?: number}; ppe: number }> = {
  Normal: { aqi: 45, risk: 'Low', weather: 'Clear Sky', beds: {free: 85, total: 200}, oxygen: 98, staff: {active: 45, idle: 12, doctors: 32, nurses: 45, total: 77}, ppe: 1200 },
  Pollution: { aqi: 412, risk: 'High', weather: 'Haze / Smog', beds: {free: 25, total: 200}, oxygen: 34, staff: {active: 58, idle: 2, doctors: 38, nurses: 52, total: 90}, ppe: 950 },
  Festival: { aqi: 180, risk: 'Medium', weather: 'Clear Sky', beds: {free: 40, total: 200}, oxygen: 85, staff: {active: 55, idle: 5, doctors: 35, nurses: 48, total: 83}, ppe: 1050 },
  Outbreak: { aqi: 90, risk: 'Critical', weather: 'Rainy', beds: {free: 5, total: 200}, oxygen: 60, staff: {active: 68, idle: 0, doctors: 42, nurses: 60, total: 102}, ppe: 200 },
};

const Dashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [activeScenario, setActiveScenario] = useState<Scenario>('Normal');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [logs, setLogs] = useState<Log[]>([
    {
      id: 1,
      agent: 'Orchestrator',
      message: 'System initialized. Monitoring all departments.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isImportant: false
    }
  ]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isFeedPaused, setIsFeedPaused] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [realtimeAQI, setRealtimeAQI] = useState<number | null>(null);
  const [realtimeResources, setRealtimeResources] = useState<any>(null);
  const [ambulanceData, setAmbulanceData] = useState<any>(null);
  const [latestPrediction, setLatestPrediction] = useState<any>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Real-time data integration
  const { isConnected, latestUpdate } = useRealtimeUpdates();
  const { agentState, recommendations: apiRecommendations, surgePrediction } = useAgentState(latestUpdate);

  // Use real-time data when available, fallback to scenario config
  const statsBase = SCENARIO_CONFIG[activeScenario];
  
  // Calculate current AQI
  const currentAQI = activeScenario === 'Normal' && realtimeAQI !== null ? realtimeAQI : statsBase.aqi;
  
  // Calculate risk level based on AQI for Normal scenario
  const getRiskLevel = (aqi: number, scenario: Scenario): RiskLevel => {
    if (scenario !== 'Normal') return statsBase.risk;
    if (aqi >= 300) return 'Critical';
    if (aqi >= 200) return 'High';
    if (aqi >= 100) return 'Medium';
    return 'Low';
  };
  
  const stats = {
    ...statsBase,
    aqi: currentAQI,
    risk: activeScenario === 'Normal' ? getRiskLevel(currentAQI, activeScenario) : statsBase.risk,
    beds: realtimeResources?.beds ? {
      free: Object.values(realtimeResources.beds as Record<string, {available: number}>).reduce((sum: number, dept: any) => sum + (dept.available || 0), 0),
      total: Object.values(realtimeResources.beds as Record<string, {total: number}>).reduce((sum: number, dept: any) => sum + (dept.total || 0), 0)
    } : statsBase.beds,
    staff: realtimeResources?.staff ? (() => {
      const doctors = realtimeResources.staff.doctors !== undefined ? realtimeResources.staff.doctors : (statsBase.staff.doctors || 0);
      const nurses = realtimeResources.staff.nurses !== undefined ? realtimeResources.staff.nurses : (statsBase.staff.nurses || 0);
      const doctorsAvailable = realtimeResources.staff.doctors_available !== undefined ? realtimeResources.staff.doctors_available : 0;
      const nursesAvailable = realtimeResources.staff.nurses_available !== undefined ? realtimeResources.staff.nurses_available : 0;
      
      const totalMedicalStaff = doctors + nurses;
      const totalAvailable = doctorsAvailable + nursesAvailable;
      const onDuty = totalMedicalStaff - totalAvailable;
      
      return {
        active: onDuty,
        idle: totalAvailable,
        doctors: doctors,
        nurses: nurses,
        total: totalMedicalStaff
      };
    })() : statsBase.staff,
    oxygen: realtimeResources?.inventory?.items ? 
      (realtimeResources.inventory.items.find((item: any) => item.name?.toLowerCase().includes('oxygen'))?.quantity ?? statsBase.oxygen) 
      : statsBase.oxygen,
    ppe: realtimeResources?.inventory?.items ? 
      (realtimeResources.inventory.items.find((item: any) => item.name?.toLowerCase().includes('ppe'))?.quantity ?? statsBase.ppe) 
      : statsBase.ppe
  };
  
  // Calculate medicine stock percentage
  const medicineStockPercentage = realtimeResources?.inventory?.items ? 
    (() => {
      const medicines = realtimeResources.inventory.items.filter((item: any) => 
        item.name && !item.name.toLowerCase().includes('oxygen') && !item.name.toLowerCase().includes('ppe')
      );
      if (medicines.length === 0) return 98;
      const totalStock = medicines.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
      const avgStock = totalStock / medicines.length;
      return Math.min(100, Math.floor(avgStock));
    })()
    : 98;
  
  // Calculate bed type breakdown
  const bedDetails = realtimeResources?.beds ? 
    (() => {
      const departments = Object.entries(realtimeResources.beds as Record<string, {available: number, total: number}>);
      const icuDepts = departments.filter(([name]) => name.toLowerCase().includes('icu') || name.toLowerCase().includes('critical'));
      const generalDepts = departments.filter(([name]) => !name.toLowerCase().includes('icu') && !name.toLowerCase().includes('critical'));
      
      const icuAvailable = icuDepts.reduce((sum, [_, dept]) => sum + (dept.available || 0), 0);
      const icuTotal = icuDepts.reduce((sum, [_, dept]) => sum + (dept.total || 0), 0);
      const generalAvailable = generalDepts.reduce((sum, [_, dept]) => sum + (dept.available || 0), 0);
      const generalTotal = generalDepts.reduce((sum, [_, dept]) => sum + (dept.total || 0), 0);
      
      const icuStatus = icuTotal > 0 ? (icuAvailable / icuTotal < 0.2 ? 'Critical' : icuAvailable / icuTotal < 0.5 ? 'Low' : 'Available') : 'N/A';
      const generalStatus = generalTotal > 0 ? (generalAvailable / generalTotal < 0.2 ? 'Critical' : generalAvailable / generalTotal < 0.5 ? 'Low' : 'Available') : 'N/A';
      
      return [
        { label: 'ICU', val: icuStatus },
        { label: 'General', val: generalStatus }
      ];
    })()
    : [
      { label: 'ICU', val: 'Critical' },
      { label: 'General', val: 'Available' }
    ];
  
  const chartData = generateChartData(activeScenario, latestPrediction, realtimeResources);

  // --- Dynamic CSS Variables based on Theme ---
  const cssVariables = {
    '--bg-main': theme === 'dark' ? '#050505' : '#F8FAFC',
    '--bg-surface': theme === 'dark' ? '#0F1115' : '#FFFFFF',
    '--bg-surface-2': theme === 'dark' ? '#1A1D24' : '#F1F5F9',
    '--bg-sidebar': theme === 'dark' ? '#0F1115' : '#FFFFFF',
    '--text-primary': theme === 'dark' ? '#ffffff' : '#0F172A',
    '--text-secondary': theme === 'dark' ? '#9ca3af' : '#64748B',
    '--text-muted': theme === 'dark' ? '#6b7280' : '#94A3B8',
    '--border-main': theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    '--border-subtle': theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    '--element-bg': theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    // Charts
    '--chart-grid': theme === 'dark' ? '#222' : '#e2e8f0',
    '--chart-axis': theme === 'dark' ? '#555' : '#94a3b8',
    '--chart-tooltip': theme === 'dark' ? '#1A1D24' : '#FFFFFF',
    // Header
    '--header-bg': theme === 'dark' ? 'rgba(5, 5, 5, 0.5)' : 'rgba(255, 255, 255, 0.8)',
  } as React.CSSProperties;

  // --- Live Clock ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Fetch real-time AQI from WebSocket and fallback API ---
  useEffect(() => {
    const loadAQI = async () => {
      if (activeScenario === 'Normal') {
        try {
          const data = await fetchCurrentAQI();
          setRealtimeAQI(data.aqi);
        } catch (err) {
          console.error('Failed to load real-time AQI:', err);
        }
      }
    };
    // Initial load
    loadAQI();
    // Fallback polling every 5 minutes (WebSocket provides updates every 30 seconds)
    const interval = setInterval(loadAQI, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [activeScenario]);

  // --- Real-time AQI updates from WebSocket ---
  useEffect(() => {
    if (latestUpdate?.type === 'aqi_update' && activeScenario === 'Normal') {
      const aqiValue = typeof latestUpdate.aqi === 'object' ? latestUpdate.aqi.aqi : latestUpdate.aqi;
      setRealtimeAQI(aqiValue);
      console.log('Real-time AQI update:', aqiValue, 'Full data:', latestUpdate);
    }
  }, [latestUpdate, activeScenario]);

  // --- Fetch real-time resources data ---
  useEffect(() => {
    const loadResources = async () => {
      try {
        const [bedsData, staffData, inventoryData] = await Promise.all([
          fetchBeds(),
          fetchStaff(),
          fetchInventory(false)
        ]);
        console.log('Real-time resources loaded:', { bedsData, staffData, inventoryData });
        setRealtimeResources({
          beds: bedsData,
          staff: staffData,
          inventory: inventoryData
        });
      } catch (err) {
        console.error('Failed to load real-time resources:', err);
      }
    };
    loadResources();
    const interval = setInterval(loadResources, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // --- Fetch latest prediction data ---
  useEffect(() => {
    const loadPrediction = async () => {
      try {
        const predictionData = await fetchLatestPrediction();
        console.log('Latest prediction loaded:', predictionData);
        setLatestPrediction(predictionData);
      } catch (err) {
        console.error('Failed to load prediction:', err);
      }
    };
    loadPrediction();
    const interval = setInterval(loadPrediction, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // --- Log Simulator --- DISABLED to show real agent data
  // useEffect(() => {
  //   if (isFeedPaused) return;

  //   const interval = setInterval(() => {
  //     const agents = ['Sentinel', 'Orchestrator', 'Logistics', 'Action'] as const;
  //     const agent = agents[Math.floor(Math.random() * agents.length)];
      
  //     let msg = "";
  //     let important = false;
  //     if (agent === 'Sentinel') msg = `AQI signal stable at ${stats.aqi + Math.floor(Math.random() * 10)}.`;
  //     if (agent === 'Orchestrator') msg = `Analyzing inflow patterns for ${activeScenario} protocols.`;
  //     if (agent === 'Logistics') msg = `Bed capacity check: ${stats.beds.free} beds available.`;
  //     if (agent === 'Action') msg = `Routine check active. No critical anomalies.`;

  //     if (activeScenario !== 'Normal') {
  //        important = Math.random() > 0.7;
  //        if (agent === 'Sentinel') { msg = `CRITICAL: Detected rapid spike in respiratory cases in Ward B.`; important = true; }
  //        if (agent === 'Logistics') { msg = `WARNING: Oxygen pressure dropping in ICU 2.`; important = true; }
  //        if (agent === 'Action') { msg = `Drafting emergency staff reallocation order #9921.`; important = true; }
  //        if (agent === 'Orchestrator') msg = `Re-calibrating surge prediction model. Confidence: 98%.`;
  //     }

  //     const newLog: Log = {
  //       id: Date.now(),
  //       agent,
  //       message: msg,
  //       time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  //       isImportant: important
  //     };

  //     setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50
  //   }, 2000);

  //   return () => clearInterval(interval);
  // }, [activeScenario, stats, isFeedPaused]);

  // --- Load Test Agent Reasoning on Mount and Periodically ---
  useEffect(() => {
    const loadTestReasoning = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/agents/test-reasoning');
        const data = await response.json();
        
        console.log('Test reasoning response:', data); // Debug log
        
        if (data.reasoning_chain && data.reasoning_chain.length > 0) {
          const chainLogs: Log[] = data.reasoning_chain.map((step: any, idx: number) => {
            // Ensure agent type matches our union type
            const agentType = (step.agent as 'Sentinel' | 'Orchestrator' | 'Logistics' | 'Action') || 'Orchestrator';
            
            return {
              id: Date.now() + idx + Math.random() * 1000,
              agent: agentType,
              message: step.thought || step.observation || step.message || 'Processing...',
              time: step.timestamp ? new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              isImportant: step.level === 'warning' || step.level === 'critical' || step.type === 'critical'
            };
          });
          
          console.log('Setting logs from test reasoning:', chainLogs); // Debug log
          // Prepend new logs to existing ones
          setLogs(prev => [...chainLogs, ...prev].slice(0, 50));
        }
        
        // Load recommendations from test-reasoning endpoint
        if (data.recommendations && data.recommendations.length > 0) {
          const testRecs: Recommendation[] = data.recommendations.map((rec: any, idx: number) => ({
            id: Date.now() + idx + 1000,
            agent: rec.department === 'respiratory' ? 'Action' : rec.department === 'icu' ? 'Orchestrator' : 'Logistics',
            action: rec.action || 'Recommendation pending',
            reason: rec.priority === 'high' ? 'High priority action required to prevent surge impact' : 'Optimization recommendation based on predictive analysis',
            impact: rec.estimated_cost ? `Estimated cost: ₹${(rec.estimated_cost / 1000).toFixed(1)}K` : 'Improved patient outcomes and resource efficiency'
          }));
          
          console.log('Setting recommendations from test reasoning:', testRecs);
          // Prepend test recommendations to existing ones
          setRecommendations(prev => {
            // Remove duplicates and keep only latest test recommendations
            const filtered = prev.filter(r => r.id < 1000);
            return [...testRecs, ...filtered].slice(0, 10);
          });
        }
      } catch (err) {
        console.error('Failed to load test reasoning:', err);
      }
    };
    
    // Load immediately
    loadTestReasoning();
    
    // Refresh every 30 seconds to show updated test data
    const interval = setInterval(loadTestReasoning, 30000);
    return () => clearInterval(interval);
  }, []);

  // --- Integrate Real Agent Messages ---
  useEffect(() => {
    if (agentState?.messages && agentState.messages.length > 0) {
      const realLogs: Log[] = agentState.messages.map((msg: any) => {
        let agentType: 'Sentinel' | 'Orchestrator' | 'Logistics' | 'Action' = 'Orchestrator';
        if (msg.agent === 'sentinel') agentType = 'Sentinel';
        else if (msg.agent === 'logistics') agentType = 'Logistics';
        else if (msg.agent === 'action') agentType = 'Action';
        
        return {
          id: Date.now() + Math.random(),
          agent: agentType,
          message: msg.message,
          time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          isImportant: msg.confidence && msg.confidence > 85
        };
      });
      
      // Append to existing logs instead of replacing
      setLogs(prev => [...prev, ...realLogs].slice(-50));
    }
  }, [agentState?.messages]);

  // Add reasoning chain from WebSocket (agent_update type)
  useEffect(() => {
    if (latestUpdate?.type === 'agent_update') {
      console.log('Agent update received:', latestUpdate);
      
      // Extract reasoning chain (thought-chain) from agent update
      const reasoningChain = latestUpdate.reasoning_chain || [];
      
      if (reasoningChain.length > 0) {
        const chainLogs: Log[] = reasoningChain.map((step: any, idx: number) => {
          // Ensure agent type matches our union type
          const agentType = (step.agent as 'Sentinel' | 'Orchestrator' | 'Logistics' | 'Action') || 'Orchestrator';
          
          return {
            id: Date.now() + idx + Math.random() * 1000,
            agent: agentType,
            message: step.thought || step.observation || step.message || 'Processing...',
            time: step.timestamp ? new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            isImportant: step.level === 'warning' || step.level === 'critical' || step.type === 'critical' || step.priority === 'high'
          };
        });
        
        console.log('Setting reasoning chain logs:', chainLogs);
        // Prepend new logs to existing ones
        setLogs(prev => [...chainLogs, ...prev].slice(0, 50));
      }
    }
  }, [latestUpdate]);

  // --- Generate Alerts from Agent Logs ---
  useEffect(() => {
    // Extract critical/important messages from logs as alerts
    const criticalLogs = logs.filter(log => log.isImportant);
    
    if (criticalLogs.length > 0) {
      const agentAlerts: Alert[] = criticalLogs.slice(0, 10).map((log, idx) => ({
        id: Date.now() + idx,
        title: `${log.agent} Agent Alert`,
        desc: log.message,
        type: log.message.toLowerCase().includes('critical') ? 'critical' : 'warning',
        timestamp: log.time
      }));
      
      // Merge with existing scenario alerts
      setAlerts(prev => {
        const scenarioAlerts = prev.filter(alert => alert.id < 100); // Keep scenario alerts (low IDs)
        return [...scenarioAlerts, ...agentAlerts];
      });
    }
  }, [logs]);

  // --- Integrate Real Recommendations ---
  useEffect(() => {
    if (apiRecommendations && apiRecommendations.length > 0) {
      const formattedRecs: Recommendation[] = apiRecommendations.slice(0, 5).map((rec: any, idx: number) => ({
        id: idx + 1,
        agent: rec.created_by_agent || 'System',
        action: rec.title || 'Recommendation',
        reason: rec.reasoning || '',
        impact: rec.expected_impact || ''
      }));
      setRecommendations(formattedRecs);
    }
  }, [apiRecommendations]);

  // Auto-scroll logs
  useEffect(() => {
    if (!isFeedPaused && logsContainerRef.current) {
      logsContainerRef.current.scrollTo({
        top: logsContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [logs, isFeedPaused, activeTab]);

  // --- Scenario Effects ---
  useEffect(() => {
    // Trigger backend simulation when scenario changes
    const triggerScenario = async () => {
      try {
        let crisisType = 'normal';
        if (activeScenario === 'Pollution') crisisType = 'air_pollution';
        else if (activeScenario === 'Festival') crisisType = 'mass_gathering';
        else if (activeScenario === 'Outbreak') crisisType = 'disease_outbreak';
        
        await triggerCrisisSimulation(crisisType);
      } catch (error) {
        console.error('Failed to trigger crisis simulation:', error);
      }
    };
    
    triggerScenario();
    
    // Set default mock data (will be overridden by real data when available)
    if (activeScenario === 'Pollution') {
        setAlerts([
            { id: 1, title: 'Severe Smog Alert', desc: 'Prepare for respiratory surge', type: 'critical', timestamp: 'Now' }
        ]);
    } else if (activeScenario === 'Festival') {
        setAlerts([
            { id: 2, title: 'Crowd Surge Warning', desc: 'Local density > 5/sqm', type: 'warning', timestamp: 'Now' }
        ]);
    } else if (activeScenario === 'Outbreak') {
         setAlerts([
            { id: 3, title: 'Bio-Hazard Detected', desc: 'Isolate Sector 4 immediately', type: 'critical', timestamp: 'Now' }
        ]);
    } else {
        // Keep agent alerts even in Normal mode
        setAlerts(prev => prev.filter(alert => alert.id >= 100));
    }
  }, [activeScenario]);

  // --- Render Helpers ---

  const renderOverview = () => (
    <div className="space-y-6 animate-slideIn pb-20">
      {/* Top Status Bar Content */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-6 shadow-lg transition-colors">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             <div className="flex flex-col">
                <span className="text-xs uppercase text-gray-500 font-bold tracking-wider mb-1">Surge Risk</span>
                <span className={`font-display font-bold text-2xl ${
                    stats.risk === 'Critical' ? 'text-red-500 animate-pulse' : 
                    stats.risk === 'High' ? 'text-orange-500' : 
                    stats.risk === 'Medium' ? 'text-yellow-500' : 
                    'text-green-500'
                }`}>
                    {stats.risk}
                </span>
             </div>
             <div className="flex flex-col">
                <span className="text-xs uppercase text-gray-500 font-bold tracking-wider mb-1">Live AQI</span>
                <span className={`font-display font-bold text-2xl ${
                    stats.aqi >= 300 ? 'text-red-500 animate-pulse' : 
                    stats.aqi >= 200 ? 'text-orange-500' : 
                    stats.aqi >= 100 ? 'text-yellow-500' : 
                    'text-green-500'
                }`}>
                    {stats.aqi}
                </span>
             </div>
             <div className="flex flex-col">
                <span className="text-xs uppercase text-gray-500 font-bold tracking-wider mb-1">Weather</span>
                <span className="font-display font-bold text-2xl text-[var(--text-primary)]">{stats.weather}</span>
             </div>
             <div className="flex flex-col">
                <span className="text-xs uppercase text-gray-500 font-bold tracking-wider mb-1">Sync Status</span>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                   <span className="font-display font-bold text-xl text-[var(--text-primary)]">Active</span>
                </div>
             </div>
          </div>
      </div>

      {/* Embedded Simulation Controls */}
      <div className="animate-slideIn">
        <h3 className="text-lg font-display font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Icons.ShieldCheck className="w-5 h-5 text-[#00C2FF]" />
            Simulation & Crisis Mode
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['Normal', 'Pollution', 'Festival', 'Outbreak'] as Scenario[]).map((s) => (
                <button
                    key={s}
                    onClick={() => setActiveScenario(s)}
                    className={`relative p-4 rounded-xl border text-left transition-all duration-300 group overflow-hidden ${
                    activeScenario === s 
                    ? 'bg-[#00C2FF]/10 border-[#00C2FF] shadow-[0_0_20px_rgba(0,194,255,0.2)]' 
                    : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-main)]'
                    }`}
                >
                    <div className="flex items-center gap-3 mb-2">
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${activeScenario === s ? 'bg-[#00C2FF] text-black' : 'bg-[var(--element-bg)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                            <ScenarioIcon type={s} className="w-4 h-4" />
                        </div>
                        <span className={`font-bold text-sm ${activeScenario === s ? 'text-[#00C2FF]' : 'text-[var(--text-primary)]'}`}>{s}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed">
                        {s === 'Normal' && "Baseline operations."}
                        {s === 'Pollution' && "AQI > 400. High respiratory load."}
                        {s === 'Festival' && "Crowd surge. High trauma risk."}
                        {s === 'Outbreak' && "Viral vector. Bio-threat high."}
                    </p>
                    {activeScenario === s && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#00C2FF] animate-pulse"></div>
                    )}
                </button>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[500px]">
          {/* Agent Feed */}
          <div className="lg:col-span-4 bg-[var(--bg-surface)] border border-[#00C2FF]/20 rounded-2xl flex flex-col h-[400px] lg:h-full overflow-hidden shadow-[0_0_30px_rgba(0,194,255,0.05)] relative transition-colors">
              <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--element-bg)] flex items-center justify-between shrink-0">
                  <h3 className="font-display font-bold text-[var(--text-primary)] flex items-center gap-2 text-sm uppercase tracking-wider">
                      <Icons.Radio className="w-4 h-4 text-[#00C2FF] animate-pulse" />
                      Agent Neural Feed
                  </h3>
                  <button 
                    onClick={() => setIsFeedPaused(!isFeedPaused)} 
                    className="text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-[var(--text-primary)] transition-colors"
                  >
                    {isFeedPaused ? 'Resume' : 'Pause'}
                  </button>
              </div>
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs no-scrollbar relative scroll-smooth" 
                ref={logsContainerRef}
              >
                  <div className="absolute left-[19px] top-0 bottom-0 w-px bg-[var(--border-subtle)] h-full"></div>
                  {logs.map((log) => (
                      <div key={log.id} className={`flex gap-3 relative z-10 ${log.isImportant ? 'bg-red-500/5 -mx-2 px-2 py-2 rounded border-l-2 border-red-500' : ''}`}>
                          <div className="flex flex-col items-center shrink-0 w-4">
                              <div className={`w-2 h-2 rounded-full mt-1.5 shadow-[0_0_8px_currentColor] ${
                                  log.agent === 'Sentinel' ? 'bg-blue-400 text-blue-400' : 
                                  log.agent === 'Action' ? 'bg-green-400 text-green-400' : 
                                  log.agent === 'Orchestrator' ? 'bg-purple-400 text-purple-400' : 'bg-orange-400 text-orange-400'
                              }`}></div>
                          </div>
                          <div className="pb-1 w-full">
                              <div className="flex items-center justify-between mb-1">
                                  <span className={`font-bold uppercase tracking-wider text-[10px] ${
                                      log.agent === 'Sentinel' ? 'text-blue-400' : 
                                      log.agent === 'Action' ? 'text-green-400' : 
                                      log.agent === 'Orchestrator' ? 'text-purple-400' : 'text-orange-400'
                                  }`}>
                                      {log.agent}
                                  </span>
                                  <span className="text-[var(--text-muted)] text-[9px]">{log.time}</span>
                              </div>
                              <p className={`leading-relaxed text-xs ${log.isImportant ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>{log.message}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Surge Graph */}
          <div className="lg:col-span-8 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-6 relative overflow-hidden group flex flex-col h-[400px] lg:h-full transition-colors">
               <div className="flex justify-between items-start mb-2 shrink-0 relative z-10">
                   <div>
                       <h3 className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest mb-1">Surge Prediction Engine</h3>
                       <h2 className="text-2xl font-display font-bold text-[var(--text-primary)] flex items-center gap-3">
                          48-Hour Forecast
                          <span className="px-2 py-1 rounded text-[10px] font-mono bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/20 flex items-center gap-1">
                             <Icons.Brain className="w-3 h-3" /> {latestPrediction?.confidence ? `${Math.floor(latestPrediction.confidence)}%` : '94%'} CONFIDENCE
                          </span>
                       </h2>
                   </div>
                   <div className="text-right">
                      <div className="text-xs text-[var(--text-secondary)] mb-1">Projected Peak</div>
                      <div className="text-xl font-bold text-[var(--text-primary)]">
                         {latestPrediction?.peak_time ? new Date(latestPrediction.peak_time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : (activeScenario === 'Normal' ? '14:00' : '02:00')} <span className="text-sm text-gray-500">{latestPrediction?.peak_time ? '' : 'Tomorrow'}</span>
                      </div>
                   </div>
               </div>
               <div className="flex-1 w-full relative z-10 min-h-0">
                   <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                           <defs>
                               <linearGradient id="surgeGradient" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor={activeScenario === 'Normal' ? '#00C2FF' : '#EF4444'} stopOpacity={0.4}/>
                                   <stop offset="95%" stopColor={activeScenario === 'Normal' ? '#00C2FF' : '#EF4444'} stopOpacity={0}/>
                               </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                           <XAxis dataKey="time" stroke="var(--chart-axis)" fontSize={10} tickLine={false} axisLine={false} minTickGap={40} />
                           <YAxis stroke="var(--chart-axis)" fontSize={10} tickLine={false} axisLine={false} />
                           <Tooltip 
                              contentStyle={{ backgroundColor: 'var(--chart-tooltip)', borderColor: 'var(--border-main)', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', color: 'var(--text-primary)' }}
                              itemStyle={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 'bold' }}
                              labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '10px' }}
                           />
                           <Area 
                              type="monotone" 
                              dataKey="surge" 
                              name="Patient Inflow"
                              stroke={activeScenario === 'Normal' ? '#00C2FF' : '#EF4444'} 
                              strokeWidth={3}
                              fill="url(#surgeGradient)" 
                              animationDuration={1000}
                           />
                           <Line 
                              type="monotone" 
                              dataKey="capacity" 
                              name="Max Capacity"
                              stroke="#666" 
                              strokeDasharray="4 4" 
                              strokeWidth={2} 
                              dot={false} 
                              activeDot={false}
                           />
                       </AreaChart>
                   </ResponsiveContainer>
               </div>
          </div>
      </div>
    </div>
  );

  const renderResources = () => (
    <div className="animate-slideIn h-full">
       <h2 className="text-2xl font-display font-bold text-[var(--text-primary)] mb-6">Real-time Resources</h2>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-[calc(100%-60px)]">
            <ResourcePanel 
               title="Bed Capacity"
               mainValue={stats.beds.free}
               maxValue={stats.beds.total}
               unit="Free"
               trend={`${stats.beds.total - stats.beds.free} occupied`}
               details={bedDetails}
               status={stats.beds.free < 20 ? 'critical' : stats.beds.free < 50 ? 'warning' : 'safe'}
               icon={Icons.LayoutDashboard}
               cssVariables={cssVariables}
            />
            <ResourcePanel 
               title="Medical Staff"
               mainValue={stats.staff.idle}
               maxValue={stats.staff.total || (stats.staff.doctors + stats.staff.nurses)}
               unit="Available"
               trend={`${stats.staff.active} On Duty`}
               details={[
                  { label: "Doctors", val: `${stats.staff.doctors || 0} On-site` },
                  { label: "Nurses", val: `${stats.staff.nurses || 0} On-site` }
               ]}
               status={stats.staff.idle < 2 ? 'warning' : 'safe'}
               icon={Icons.Users}
               cssVariables={cssVariables}
            />
            <ResourcePanel 
               title="Key Supplies"
               mainValue={stats.oxygen}
               maxValue={100}
               unit="% O₂"
               trend={activeScenario === 'Pollution' ? "Reorder Triggered" : "Stable Stock"}
               details={[
                  { label: "PPE Units", val: stats.ppe.toString() },
                  { label: "Meds", val: `${medicineStockPercentage}% Stock` }
               ]}
               status={stats.oxygen < 40 ? 'critical' : 'safe'}
               icon={Icons.Package}
               cssVariables={cssVariables}
            />
            <ResourcePanel 
               title="Ambulance Fleet"
               mainValue={ambulanceData?.deployed || 8}
               maxValue={ambulanceData?.total || 12}
               unit="Deployed"
               trend={ambulanceData?.trend || "API integration pending"}
               details={[
                  { label: "In-Transit", val: ambulanceData?.in_transit ? `${ambulanceData.in_transit} Units` : "N/A" },
                  { label: "Maintenance", val: ambulanceData?.maintenance ? `${ambulanceData.maintenance} Unit${ambulanceData.maintenance !== 1 ? 's' : ''}` : "N/A" }
               ]}
               status={ambulanceData?.deployed ? (ambulanceData.deployed < 4 ? 'critical' : ambulanceData.deployed < 8 ? 'warning' : 'safe') : 'safe'}
               icon={Icons.Truck}
               cssVariables={cssVariables}
            />
        </div>
    </div>
  );

  const renderDecisions = () => (
    <div className="animate-slideIn h-full flex flex-col">
       <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold text-[var(--text-primary)]">AI Decisions & Recommendations</h2>
          <div className="text-[10px] bg-yellow-400/10 text-yellow-400 px-3 py-1 rounded-full font-bold uppercase border border-yellow-400/20">
             {recommendations.length} Pending Actions
          </div>
       </div>
       <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
            {recommendations.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm text-center border border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-surface)]">
                    <Icons.CheckCircle2 className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg text-[var(--text-secondary)] mb-1">System Optimized</p>
                    <p className="text-xs opacity-50">No critical actions required at this moment.</p>
                </div>
            ) : (
                recommendations.map(rec => (
                    <div key={rec.id} className="bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-start md:items-center justify-between group hover:border-[#00C2FF]/30 transition-all shadow-lg">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-[#00C2FF] shadow-[0_0_5px_#00C2FF]"></div>
                                    {rec.agent} AGENT
                                </span>
                                <span className="text-[10px] uppercase font-bold text-[#00C2FF] bg-[#00C2FF]/10 px-2 py-0.5 rounded border border-[#00C2FF]/20">High Impact</span>
                            </div>
                            <h4 className="font-display font-bold text-[var(--text-primary)] text-lg mb-2">{rec.action}</h4>
                            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{rec.reason}</p>
                            <div className="mt-3 flex items-center gap-2 text-xs">
                               <span className="text-gray-500">Expected Outcome:</span>
                               <span className="text-green-400 font-bold">{rec.impact}</span>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto shrink-0">
                            <button className="flex-1 md:flex-none py-3 px-6 bg-[var(--element-bg)] hover:bg-red-500/20 hover:text-red-500 text-[var(--text-secondary)] rounded-xl text-xs font-bold transition-all border border-[var(--border-subtle)] uppercase tracking-wide">
                                Reject
                            </button>
                            <button className="flex-1 md:flex-none py-3 px-8 bg-[#00C2FF] hover:bg-[#00C2FF]/80 text-black rounded-xl text-xs font-bold transition-all shadow-[0_0_20px_rgba(0,194,255,0.3)] uppercase tracking-wide">
                                Approve
                            </button>
                        </div>
                    </div>
                ))
            )}
       </div>
    </div>
  );

  const renderAdvisory = () => (
    <div className="animate-slideIn h-full flex flex-col">
       <h2 className="text-2xl font-display font-bold text-[var(--text-primary)] mb-6">Advisory & Notification Center</h2>
       
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
           {/* Active Alerts List */}
           <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-6 flex flex-col transition-colors">
               <div className="flex items-center gap-2 mb-6">
                   <Icons.AlertCircle className="w-5 h-5 text-red-400" />
                   <h3 className="font-bold text-[var(--text-primary)]">Active System Alerts</h3>
                   {alerts.length > 0 && (
                       <span className="ml-auto text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded-full font-bold border border-red-500/20">
                           {alerts.length} Active
                       </span>
                   )}
               </div>
               <div className="space-y-4 overflow-y-auto pr-2 no-scrollbar flex-1">
                   {alerts.length === 0 && (
                       <div className="text-gray-500 text-sm italic flex items-center justify-center h-full">
                           <div className="text-center">
                               <Icons.CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-20" />
                               <p>No active system alerts.</p>
                           </div>
                       </div>
                   )}
                   {alerts.map(alert => {
                       const isAgentAlert = alert.id >= 100;
                       const isCritical = alert.type === 'critical';
                       const bgColor = isCritical ? 'bg-red-500/5' : 'bg-orange-500/5';
                       const borderColor = isCritical ? 'border-red-500/20' : 'border-orange-500/20';
                       const iconColor = isCritical ? 'text-red-500' : 'text-orange-400';
                       const titleColor = isCritical ? 'text-red-400' : 'text-orange-400';
                       
                       return (
                           <div key={alert.id} className={`${bgColor} border ${borderColor} p-4 rounded-xl flex gap-4 animate-slideIn hover:shadow-lg transition-all`}>
                               <div className="mt-1">
                                   <Icons.AlertCircle className={`w-4 h-4 ${iconColor}`} />
                               </div>
                               <div className="flex-1">
                                   <div className="flex items-start justify-between gap-2 mb-1">
                                       <h4 className={`${titleColor} font-bold text-sm`}>{alert.title}</h4>
                                       {isAgentAlert && (
                                           <span className="text-[9px] uppercase font-bold tracking-wider text-gray-500 bg-[var(--element-bg)] px-2 py-0.5 rounded">
                                               AI Agent
                                           </span>
                                       )}
                                   </div>
                                   <p className="text-[var(--text-secondary)] text-xs mt-1 leading-relaxed">{alert.desc}</p>
                                   <div className="flex items-center gap-3 mt-2">
                                       <span className="text-[10px] text-gray-600 uppercase font-mono">{alert.timestamp}</span>
                                       {isCritical && (
                                           <span className="text-[9px] uppercase font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                                               Critical
                                           </span>
                                       )}
                                   </div>
                               </div>
                           </div>
                       );
                   })}
               </div>
           </div>

           {/* Agent Recommendations */}
           <div className="space-y-6 overflow-y-auto pr-2 no-scrollbar">
                {recommendations.length === 0 ? (
                    <div className="bg-[var(--bg-surface-2)] border border-[var(--border-main)] rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px]">
                        <Icons.CheckCircle2 className="w-16 h-16 mb-4 opacity-20 text-[var(--text-secondary)]" />
                        <h4 className="text-[var(--text-primary)] font-bold mb-2">All Systems Optimal</h4>
                        <p className="text-[var(--text-secondary)] text-sm">No active agent recommendations at this time.</p>
                    </div>
                ) : (
                    recommendations.map((rec, index) => {
                        const colors = [
                            { border: 'border-[#00C2FF]/30', bg: 'bg-[#00C2FF]/10', icon: 'text-[#00C2FF]', agent: 'bg-[#00C2FF]/20 text-[#00C2FF]' },
                            { border: 'border-green-500/30', bg: 'bg-green-500/10', icon: 'text-green-400', agent: 'bg-green-500/20 text-green-400' },
                            { border: 'border-purple-500/30', bg: 'bg-purple-500/10', icon: 'text-purple-400', agent: 'bg-purple-500/20 text-purple-400' },
                            { border: 'border-orange-500/30', bg: 'bg-orange-500/10', icon: 'text-orange-400', agent: 'bg-orange-500/20 text-orange-400' }
                        ];
                        const colorScheme = colors[index % colors.length];
                        
                        return (
                            <div key={rec.id} className={`bg-[var(--bg-surface-2)] border ${colorScheme.border} rounded-2xl p-6 relative overflow-hidden group hover:shadow-xl transition-all animate-slideIn`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-10 h-10 rounded-lg ${colorScheme.bg} flex items-center justify-center`}>
                                        <Icons.Zap className={`w-5 h-5 ${colorScheme.icon}`} />
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${colorScheme.agent}`}>
                                        {rec.agent} Agent
                                    </span>
                                </div>
                                <h4 className="text-[var(--text-primary)] font-bold text-lg mb-2">{rec.action}</h4>
                                <div className="space-y-2 mb-4">
                                    {rec.reason && (
                                        <div className="flex items-start gap-2">
                                            <span className="text-[10px] uppercase font-bold text-gray-500 min-w-[60px]">Reason:</span>
                                            <p className="text-[var(--text-secondary)] text-xs leading-relaxed flex-1">{rec.reason}</p>
                                        </div>
                                    )}
                                    {rec.impact && (
                                        <div className="flex items-start gap-2">
                                            <span className="text-[10px] uppercase font-bold text-gray-500 min-w-[60px]">Impact:</span>
                                            <p className={`text-xs leading-relaxed flex-1 font-medium ${colorScheme.icon}`}>{rec.impact}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3 mt-4 pt-4 border-t border-[var(--border-subtle)]">
                                    <button className="flex-1 py-2 px-4 bg-[var(--element-bg)] hover:bg-red-500/20 hover:text-red-400 text-[var(--text-secondary)] rounded-lg text-xs font-bold transition-all border border-[var(--border-subtle)] uppercase">
                                        Dismiss
                                    </button>
                                    <button className={`flex-1 py-2 px-4 ${colorScheme.bg} hover:opacity-80 ${colorScheme.icon} rounded-lg text-xs font-bold transition-all shadow-lg uppercase`}>
                                        Implement
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
           </div>
       </div>
    </div>
  );

  const renderSettings = () => (
    <div className="animate-slideIn h-full flex flex-col max-w-2xl">
        <h2 className="text-2xl font-display font-bold text-[var(--text-primary)] mb-8">System Configuration</h2>

        <div className="space-y-8">
            <div className="bg-[var(--bg-surface-2)] border border-[var(--border-main)] rounded-2xl p-6 transition-colors">
                <h3 className="text-[var(--text-primary)] font-bold mb-4 flex items-center gap-2">
                    <Icons.Eye className="w-5 h-5 text-[#00C2FF]" />
                    Visual Preferences
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[var(--text-secondary)] text-sm">Theme Mode</span>
                        <div className="flex bg-[var(--element-bg)] p-1 rounded-lg border border-[var(--border-subtle)]">
                            <button 
                                onClick={() => setTheme('dark')}
                                className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${theme === 'dark' ? 'bg-[#00C2FF] text-black shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                            >
                                Dark
                            </button>
                            <button 
                                onClick={() => setTheme('light')}
                                className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${theme === 'light' ? 'bg-[#00C2FF] text-black shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                            >
                                Light
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[var(--text-secondary)] text-sm">Color Blind Mode</span>
                        <button className="w-10 h-6 bg-[var(--element-bg)] rounded-full relative transition-colors hover:bg-[var(--border-main)]">
                            <div className="absolute left-1 top-1 w-4 h-4 bg-[var(--text-primary)] rounded-full"></div>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-[var(--bg-surface-2)] border border-[var(--border-main)] rounded-2xl p-6 transition-colors">
                <h3 className="text-[var(--text-primary)] font-bold mb-4 flex items-center gap-2">
                    <Icons.Mic className="w-5 h-5 text-[#00C2FF]" />
                    Voice Module
                </h3>
                <div className="flex items-center justify-between mb-4">
                     <div className="flex flex-col">
                        <span className="text-[var(--text-secondary)] text-sm font-medium">Always-on Assistant</span>
                        <span className="text-gray-500 text-xs">Allows voice commands for navigation and queries.</span>
                     </div>
                     <button 
                        onClick={() => setIsVoiceActive(!isVoiceActive)}
                        className={`w-12 h-7 rounded-full relative transition-all duration-300 ${isVoiceActive ? 'bg-[#00C2FF]' : 'bg-[var(--element-bg)]'}`}
                    >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${isVoiceActive ? 'left-6' : 'left-1'}`}></div>
                    </button>
                </div>
                {isVoiceActive && (
                    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 flex items-center gap-4 animate-slideIn">
                        <div className="h-4 flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="w-1 bg-[#00C2FF] rounded-full animate-music" style={{animationDuration: Math.random() * 0.5 + 0.3 + 's', height: '100%'}}></div>
                            ))}
                        </div>
                        <span className="text-xs text-[#00C2FF] font-mono">Microphone Active - Listening...</span>
                    </div>
                )}
            </div>
            
            <div className="pt-4 border-t border-[var(--border-subtle)]">
                <button className="text-red-400 text-sm font-bold flex items-center gap-2 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors w-full justify-center border border-transparent hover:border-red-500/20">
                    <Icons.LogOut className="w-4 h-4" />
                    Reset System Simulation
                </button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-sans overflow-hidden transition-colors duration-300" style={cssVariables}>
        
        {/* --- Sidebar --- */}
        <aside className="w-20 lg:w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] flex flex-col shrink-0 transition-colors duration-300 z-50">
            {/* Logo Area */}
            <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-[var(--border-subtle)] cursor-pointer" onClick={onBack}>
                {/* Replaced Icon with Landing Page SVG */}
                <div className="w-10 h-10 shrink-0 text-[#00C2FF]">
                     <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <circle cx="50" cy="50" r="12" fill="currentColor" />
                        <path d="M50 50 L85 50" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                        <circle cx="85" cy="50" r="8" fill="currentColor" />
                        <path d="M50 50 L75 20" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                        <circle cx="75" cy="20" r="6" fill="currentColor" />
                        <path d="M50 50 L25 25" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                        <circle cx="25" cy="25" r="8" fill="currentColor" />
                        <path d="M50 50 L20 60" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                        <circle cx="20" cy="60" r="6" fill="currentColor" />
                        <path d="M50 50 L40 85" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                        <circle cx="40" cy="85" r="5" fill="currentColor" />
                        <path d="M50 50 L70 80" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                        <circle cx="70" cy="80" r="4" fill="currentColor" />
                     </svg>
                </div>
                <div className="ml-3 hidden lg:block">
                    <span className="font-display font-bold text-lg tracking-wider block leading-none text-[var(--text-primary)]">AROGYA</span>
                    <span className="font-display font-bold text-xs tracking-[0.2em] text-[#00C2FF]">SWARM</span>
                </div>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 py-6 space-y-2 px-2 lg:px-4 overflow-y-auto no-scrollbar">
                <SidebarItem id="overview" label="Overview" icon={Icons.LayoutDashboard} active={activeTab === 'overview'} onClick={setActiveTab} />
                <SidebarItem id="resources" label="Resources" icon={Icons.Activity} active={activeTab === 'resources'} onClick={setActiveTab} />
                <SidebarItem id="decisions" label="Decisions" icon={Icons.Zap} active={activeTab === 'decisions'} onClick={setActiveTab} />
                <SidebarItem id="advisory" label="Advisories" icon={Icons.MessageSquare} active={activeTab === 'advisory'} onClick={setActiveTab} />
                <SidebarItem id="settings" label="Settings" icon={Icons.Settings} active={activeTab === 'settings'} onClick={setActiveTab} />
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-[var(--border-subtle)]">
                <button 
                  onClick={onBack}
                  className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 text-gray-400 hover:text-[var(--text-primary)] hover:bg-[var(--element-bg)] rounded-xl transition-all group"
                >
                    <Icons.LogOut className="w-5 h-5 group-hover:text-red-400 transition-colors" />
                    <span className="hidden lg:block text-sm font-medium">Exit Dashboard</span>
                </button>
            </div>
        </aside>

        {/* --- Main Content Area --- */}
        <main className="flex-1 relative flex flex-col min-w-0 bg-[var(--bg-main)] transition-colors duration-300">
            {/* Header */}
            <header className="h-20 shrink-0 border-b border-[var(--border-subtle)] flex items-center justify-between px-8 bg-[var(--header-bg)] backdrop-blur-md sticky top-0 z-40 transition-colors">
                <h1 className="text-xl font-display font-bold capitalize text-[var(--text-primary)] flex items-center gap-3">
                    {activeTab}
                    {activeTab === 'overview' && (
                        <span className="text-xs font-sans font-normal text-gray-500 bg-[var(--element-bg)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">Live Monitor + Simulation</span>
                    )}
                </h1>

                {/* Global Status */}
                <div className="flex items-center gap-4">
                    {/* WebSocket Connection Status */}
                    <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                        isConnected 
                            ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
                            : 'bg-red-500/10 border border-red-500/30 text-red-400'
                    }`}>
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                    {activeScenario !== 'Normal' && (
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wide animate-pulse">
                            <Icons.AlertCircle className="w-3 h-3" />
                            {activeScenario} Mode Active
                        </div>
                    )}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00C2FF] to-blue-600 flex items-center justify-center shadow-[0_0_10px_#0066FF]">
                        <span className="font-bold text-xs text-black">AS</span>
                    </div>
                </div>
            </header>

            {/* Scrollable Viewport */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-10 scroll-smooth">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'resources' && renderResources()}
                {activeTab === 'decisions' && renderDecisions()}
                {activeTab === 'advisory' && renderAdvisory()}
                {activeTab === 'settings' && renderSettings()}
            </div>

            {/* Floating AI Symbol (Bottom Right) */}
            <div className="fixed bottom-8 right-8 z-50">
               <div className="relative group cursor-pointer">
                  {/* Pulse Effect */}
                  <div className="absolute inset-0 bg-[#00C2FF] rounded-full blur-xl opacity-20 group-hover:opacity-40 animate-pulse transition-opacity"></div>
                  
                  {/* Button */}
                  <div className="relative w-14 h-14 bg-[var(--bg-surface-2)] border border-[#00C2FF]/30 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,194,255,0.2)] group-hover:scale-110 transition-transform duration-300">
                     <Icons.Brain className="w-7 h-7 text-[#00C2FF] animate-node-pulse" />
                     
                     {/* Notification Dot */}
                     <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[var(--bg-surface-2)]"></div>
                  </div>

                  {/* Tooltip */}
                  <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-[var(--bg-surface-2)] border border-[var(--border-main)] px-3 py-1.5 rounded-lg text-xs font-bold text-[#00C2FF] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                     AI Assistant Ready
                  </div>
               </div>
            </div>

        </main>
    </div>
  );
};

// --- Helper Components ---

const SidebarItem: React.FC<{ 
  id: TabId; 
  label: string; 
  icon: any; 
  active: boolean; 
  onClick: (id: TabId) => void 
}> = ({ id, label, icon: Icon, active, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all duration-200 group relative ${
            active 
            ? 'bg-[#00C2FF]/10 text-[#00C2FF]' 
            : 'text-gray-400 hover:text-[var(--text-primary)] hover:bg-[var(--element-bg)]'
        }`}
    >
        {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#00C2FF] rounded-r-full hidden lg:block"></div>}
        <Icon className={`w-5 h-5 ${active ? 'fill-current opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />
        <span className={`hidden lg:block text-sm font-medium tracking-wide ${active ? 'font-bold' : ''}`}>{label}</span>
    </button>
);

const ScenarioIcon: React.FC<{ type: Scenario; className?: string }> = ({ type, className }) => {
   if (type === 'Pollution') return <Icons.Moon className={className} />;
   if (type === 'Festival') return <Icons.Users className={className} />;
   if (type === 'Outbreak') return <Icons.Activity className={className} />;
   return <Icons.ShieldCheck className={className} />;
};

const ResourcePanel: React.FC<{ 
  title: string; 
  mainValue: number; 
  maxValue: number; 
  unit: string; 
  trend: string; 
  details: {label: string, val: string}[];
  status: 'safe' | 'warning' | 'critical'; 
  icon: any;
  cssVariables?: React.CSSProperties;
}> = ({ title, mainValue, maxValue, unit, trend, details, status, icon: Icon, cssVariables }) => {
    const percentage = (mainValue / maxValue) * 100;
    const color = status === 'critical' ? 'bg-red-500' : status === 'warning' ? 'bg-orange-500' : 'bg-[#00C2FF]';
    const textColor = status === 'critical' ? 'text-red-500' : status === 'warning' ? 'text-orange-500' : 'text-[#00C2FF]';

    return (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl p-5 flex flex-col justify-between group hover:border-[var(--border-main)] transition-all shadow-lg h-full">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl bg-[var(--element-bg)] ${textColor}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded bg-[var(--element-bg)] ${textColor}`}>{trend}</span>
            </div>
            
            <div className="mb-4">
                <div className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-bold mb-1">{title}</div>
                <div className="text-3xl font-display font-bold text-[var(--text-primary)] mb-2">
                    {mainValue} <span className="text-sm text-gray-500 font-normal">/ {maxValue} {unit}</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--element-bg)] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${percentage}%` }}></div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-[var(--border-subtle)]">
               {details.map((d, i) => (
                  <div key={i}>
                     <div className="text-[10px] text-gray-500 uppercase">{d.label}</div>
                     <div className="text-xs font-bold text-[var(--text-primary)]">{d.val}</div>
                  </div>
               ))}
            </div>
        </div>
    );
};

export default Dashboard;