import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { Icons } from './ui/Icons';

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
const generateChartData = (scenario: Scenario) => {
  const base = scenario === 'Normal' ? 40 : scenario === 'Pollution' ? 65 : scenario === 'Festival' ? 85 : 95;
  const volatility = scenario === 'Normal' ? 10 : 25;
  
  return Array.from({ length: 48 }, (_, i) => {
    const time = `${i % 24}:00`;
    const surge = Math.min(100, Math.max(10, base + Math.sin(i / 8) * volatility + (Math.random() * 10 - 5)));
    const capacity = 80; // Fixed hospital capacity line
    return { time, surge: Math.floor(surge), capacity };
  });
};

const SCENARIO_CONFIG: Record<Scenario, { aqi: number; risk: RiskLevel; weather: string; beds: {free: number, total: number}; oxygen: number; staff: {active: number, idle: number}; ppe: number }> = {
  Normal: { aqi: 45, risk: 'Low', weather: 'Clear Sky', beds: {free: 85, total: 200}, oxygen: 98, staff: {active: 45, idle: 12}, ppe: 1200 },
  Pollution: { aqi: 412, risk: 'High', weather: 'Haze / Smog', beds: {free: 25, total: 200}, oxygen: 34, staff: {active: 58, idle: 2}, ppe: 950 },
  Festival: { aqi: 180, risk: 'Medium', weather: 'Clear Sky', beds: {free: 40, total: 200}, oxygen: 85, staff: {active: 55, idle: 5}, ppe: 1050 },
  Outbreak: { aqi: 90, risk: 'Critical', weather: 'Rainy', beds: {free: 5, total: 200}, oxygen: 60, staff: {active: 68, idle: 0}, ppe: 200 },
};

const Dashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [activeScenario, setActiveScenario] = useState<Scenario>('Normal');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [logs, setLogs] = useState<Log[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isFeedPaused, setIsFeedPaused] = useState(false);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const stats = SCENARIO_CONFIG[activeScenario];
  const chartData = generateChartData(activeScenario);

  // --- Live Clock ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Log Simulator ---
  useEffect(() => {
    if (isFeedPaused) return;

    const interval = setInterval(() => {
      const agents = ['Sentinel', 'Orchestrator', 'Logistics', 'Action'] as const;
      const agent = agents[Math.floor(Math.random() * agents.length)];
      
      let msg = "";
      let important = false;
      if (agent === 'Sentinel') msg = `AQI signal stable at ${stats.aqi + Math.floor(Math.random() * 10)}.`;
      if (agent === 'Orchestrator') msg = `Analyzing inflow patterns for ${activeScenario} protocols.`;
      if (agent === 'Logistics') msg = `Bed capacity check: ${stats.beds.free} beds available.`;
      if (agent === 'Action') msg = `Routine check active. No critical anomalies.`;

      if (activeScenario !== 'Normal') {
         important = Math.random() > 0.7;
         if (agent === 'Sentinel') { msg = `CRITICAL: Detected rapid spike in respiratory cases in Ward B.`; important = true; }
         if (agent === 'Logistics') { msg = `WARNING: Oxygen pressure dropping in ICU 2.`; important = true; }
         if (agent === 'Action') { msg = `Drafting emergency staff reallocation order #9921.`; important = true; }
         if (agent === 'Orchestrator') msg = `Re-calibrating surge prediction model. Confidence: 98%.`;
      }

      const newLog: Log = {
        id: Date.now(),
        agent,
        message: msg,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isImportant: important
      };

      setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50
    }, 2000);

    return () => clearInterval(interval);
  }, [activeScenario, stats, isFeedPaused]);

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
    if (activeScenario === 'Pollution') {
        setRecommendations([
            { id: 1, agent: 'Orchestrator', action: 'Activate Code Grey', reason: 'AQI > 400 linked to 200% Asthma surge.', impact: 'Mobilize 15 Pulmonologists' },
            { id: 2, agent: 'Logistics', action: 'Auto-Order Oxygen', reason: 'Reserves projected to deplete in 8hrs.', impact: '+50 Cylinders' },
        ]);
        setAlerts([
            { id: 1, title: 'Severe Smog Alert', desc: 'Prepare for respiratory surge', type: 'critical', timestamp: 'Now' }
        ]);
    } else if (activeScenario === 'Festival') {
        setRecommendations([
            { id: 1, agent: 'Orchestrator', action: 'Clear Trauma Bay', reason: 'High crowd density event nearby.', impact: '+10 Emergency Beds' }
        ]);
        setAlerts([
            { id: 1, title: 'Crowd Surge Warning', desc: 'Local density > 5/sqm', type: 'warning', timestamp: 'Now' }
        ]);
    } else if (activeScenario === 'Outbreak') {
         setRecommendations([
            { id: 1, agent: 'Sentinel', action: 'Isolation Protocol', reason: 'Viral vector identified in triage.', impact: 'Lockdown Wing C' },
            { id: 2, agent: 'Action', action: 'Alert CDC/Local Auth', reason: 'Reportable threshold exceeded.', impact: 'Compliance' }
        ]);
         setAlerts([
            { id: 1, title: 'Bio-Hazard Detected', desc: 'Isolate Sector 4 immediately', type: 'critical', timestamp: 'Now' }
        ]);
    } else {
        setRecommendations([
            { id: 1, agent: 'Logistics', action: 'Staff Rotation', reason: 'Optimize shift handover.', impact: 'Reduce fatigue' }
        ]);
        setAlerts([]);
    }
  }, [activeScenario]);

  // --- Render Helpers ---

  const renderOverview = () => (
    <div className="space-y-6 animate-slideIn pb-20">
      {/* Top Status Bar Content */}
      <div className="bg-[#0F1115] border border-white/10 rounded-2xl p-6 shadow-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             <div className="flex flex-col">
                <span className="text-xs uppercase text-gray-500 font-bold tracking-wider mb-1">Surge Risk</span>
                <span className={`font-display font-bold text-2xl ${stats.risk === 'Critical' ? 'text-red-500 animate-pulse' : stats.risk === 'High' ? 'text-orange-500' : 'text-green-500'}`}>
                    {stats.risk}
                </span>
             </div>
             <div className="flex flex-col relative overflow-hidden rounded">
                <div className="absolute inset-0 opacity-10 bg-[#00C2FF] animate-pulse"></div>
                <span className="text-xs uppercase text-gray-500 font-bold tracking-wider mb-1 relative z-10">Live AQI</span>
                <span className={`font-display font-bold text-2xl relative z-10 ${stats.aqi > 200 ? 'text-red-500' : 'text-[#00C2FF]'}`}>
                    {stats.aqi}
                </span>
             </div>
             <div className="flex flex-col">
                <span className="text-xs uppercase text-gray-500 font-bold tracking-wider mb-1">Weather</span>
                <span className="font-display font-bold text-2xl text-gray-200">{stats.weather}</span>
             </div>
             <div className="flex flex-col">
                <span className="text-xs uppercase text-gray-500 font-bold tracking-wider mb-1">Sync Status</span>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                   <span className="font-display font-bold text-xl text-gray-200">Active</span>
                </div>
             </div>
          </div>
      </div>

      {/* Embedded Simulation Controls - MOVED HERE */}
      <div className="animate-slideIn">
        <h3 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
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
                    : 'bg-[#0F1115] border-white/5 hover:border-white/20'
                    }`}
                >
                    <div className="flex items-center gap-3 mb-2">
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${activeScenario === s ? 'bg-[#00C2FF] text-black' : 'bg-white/5 text-gray-400 group-hover:text-white'}`}>
                            <ScenarioIcon type={s} className="w-4 h-4" />
                        </div>
                        <span className={`font-bold text-sm ${activeScenario === s ? 'text-[#00C2FF]' : 'text-white'}`}>{s}</span>
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
          <div className="lg:col-span-4 bg-[#0F1115] border border-[#00C2FF]/20 rounded-2xl flex flex-col h-[400px] lg:h-full overflow-hidden shadow-[0_0_30px_rgba(0,194,255,0.05)] relative">
              <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
                  <h3 className="font-display font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                      <Icons.Radio className="w-4 h-4 text-[#00C2FF] animate-pulse" />
                      Agent Neural Feed
                  </h3>
                  <button 
                    onClick={() => setIsFeedPaused(!isFeedPaused)} 
                    className="text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-white transition-colors"
                  >
                    {isFeedPaused ? 'Resume' : 'Pause'}
                  </button>
              </div>
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs no-scrollbar relative scroll-smooth" 
                ref={logsContainerRef}
              >
                  <div className="absolute left-[19px] top-0 bottom-0 w-px bg-white/5 h-full"></div>
                  {logs.map((log) => (
                      <div key={log.id} className={`flex gap-3 animate-slideIn opacity-0 relative z-10 ${log.isImportant ? 'bg-red-500/5 -mx-2 px-2 py-2 rounded border-l-2 border-red-500' : ''}`} style={{animation: 'slideInRight 0.3s forwards'}}>
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
                                  <span className="text-gray-600 text-[9px]">{log.time}</span>
                              </div>
                              <p className={`leading-relaxed ${log.isImportant ? 'text-red-200' : 'text-gray-400'}`}>{log.message}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Surge Graph */}
          <div className="lg:col-span-8 bg-[#0F1115] border border-white/10 rounded-2xl p-6 relative overflow-hidden group flex flex-col h-[400px] lg:h-full">
               <div className="flex justify-between items-start mb-2 shrink-0 relative z-10">
                   <div>
                       <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Surge Prediction Engine</h3>
                       <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                          48-Hour Forecast
                          <span className="px-2 py-1 rounded text-[10px] font-mono bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/20 flex items-center gap-1">
                             <Icons.Brain className="w-3 h-3" /> 94% CONFIDENCE
                          </span>
                       </h2>
                   </div>
                   <div className="text-right">
                      <div className="text-xs text-gray-400 mb-1">Projected Peak</div>
                      <div className="text-xl font-bold text-white">
                         {activeScenario === 'Normal' ? '14:00' : '02:00'} <span className="text-sm text-gray-500">Tomorrow</span>
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
                           <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                           <XAxis dataKey="time" stroke="#555" fontSize={10} tickLine={false} axisLine={false} minTickGap={40} />
                           <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                           <Tooltip 
                              contentStyle={{ backgroundColor: '#1A1D24', borderColor: '#333', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                              itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                              labelStyle={{ color: '#888', marginBottom: '4px', fontSize: '10px' }}
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
       <h2 className="text-2xl font-display font-bold text-white mb-6">Real-time Resources</h2>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-[calc(100%-60px)]">
            <ResourcePanel 
               title="Bed Capacity"
               mainValue={stats.beds.free}
               maxValue={stats.beds.total}
               unit="Free"
               trend="↑ 12 admissions (2h)"
               details={[
                  { label: "ICU", val: "Critical" },
                  { label: "General", val: "Available" }
               ]}
               status={stats.beds.free < 20 ? 'critical' : stats.beds.free < 50 ? 'warning' : 'safe'}
               icon={Icons.LayoutDashboard}
            />
            <ResourcePanel 
               title="Medical Staff"
               mainValue={stats.staff.active}
               maxValue={100}
               unit="Active"
               trend={`${stats.staff.idle} Idle currently`}
               details={[
                  { label: "Doctors", val: "32 On-site" },
                  { label: "Nurses", val: "Shortage (-4)" }
               ]}
               status={stats.staff.idle < 2 ? 'warning' : 'safe'}
               icon={Icons.Users}
            />
            <ResourcePanel 
               title="Key Supplies"
               mainValue={stats.oxygen}
               maxValue={100}
               unit="% O₂"
               trend={activeScenario === 'Pollution' ? "Reorder Triggered" : "Stable Stock"}
               details={[
                  { label: "PPE Units", val: stats.ppe.toString() },
                  { label: "Meds", val: "98% Stock" }
               ]}
               status={stats.oxygen < 40 ? 'critical' : 'safe'}
               icon={Icons.Package}
            />
            <ResourcePanel 
               title="Ambulance Fleet"
               mainValue={8}
               maxValue={12}
               unit="Deployed"
               trend="High demand zone: North"
               details={[
                  { label: "In-Transit", val: "4 Units" },
                  { label: "Maintenance", val: "1 Unit" }
               ]}
               status={'safe'}
               icon={Icons.Truck}
            />
        </div>
    </div>
  );

  const renderDecisions = () => (
    <div className="animate-slideIn h-full flex flex-col">
       <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold text-white">AI Decisions & Recommendations</h2>
          <div className="text-[10px] bg-yellow-400/10 text-yellow-400 px-3 py-1 rounded-full font-bold uppercase border border-yellow-400/20">
             {recommendations.length} Pending Actions
          </div>
       </div>
       <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
            {recommendations.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm text-center border border-white/5 rounded-2xl bg-[#0F1115]">
                    <Icons.CheckCircle2 className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg text-gray-400 mb-1">System Optimized</p>
                    <p className="text-xs opacity-50">No critical actions required at this moment.</p>
                </div>
            ) : (
                recommendations.map(rec => (
                    <div key={rec.id} className="bg-[#1A1D24] border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-start md:items-center justify-between group hover:border-[#00C2FF]/30 transition-all shadow-lg">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-[#00C2FF] shadow-[0_0_5px_#00C2FF]"></div>
                                    {rec.agent} AGENT
                                </span>
                                <span className="text-[10px] uppercase font-bold text-[#00C2FF] bg-[#00C2FF]/10 px-2 py-0.5 rounded border border-[#00C2FF]/20">High Impact</span>
                            </div>
                            <h4 className="font-display font-bold text-white text-lg mb-2">{rec.action}</h4>
                            <p className="text-gray-400 text-sm leading-relaxed">{rec.reason}</p>
                            <div className="mt-3 flex items-center gap-2 text-xs">
                               <span className="text-gray-500">Expected Outcome:</span>
                               <span className="text-green-400 font-bold">{rec.impact}</span>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto shrink-0">
                            <button className="flex-1 md:flex-none py-3 px-6 bg-white/5 hover:bg-red-500/20 hover:text-red-500 text-gray-400 rounded-xl text-xs font-bold transition-all border border-white/5 uppercase tracking-wide">
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
       <h2 className="text-2xl font-display font-bold text-white mb-6">Advisory & Notification Center</h2>
       
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
           {/* Active Alerts List */}
           <div className="bg-[#0F1115] border border-white/10 rounded-2xl p-6 flex flex-col">
               <div className="flex items-center gap-2 mb-6">
                   <Icons.AlertCircle className="w-5 h-5 text-red-400" />
                   <h3 className="font-bold text-white">Active System Alerts</h3>
               </div>
               <div className="space-y-4 overflow-y-auto pr-2 no-scrollbar">
                   {alerts.length === 0 && (
                       <div className="text-gray-500 text-sm italic">No active system alerts.</div>
                   )}
                   {alerts.map(alert => (
                       <div key={alert.id} className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl flex gap-4">
                           <div className="mt-1"><Icons.AlertCircle className="w-4 h-4 text-red-500" /></div>
                           <div>
                               <h4 className="text-red-400 font-bold text-sm">{alert.title}</h4>
                               <p className="text-gray-400 text-xs mt-1">{alert.desc}</p>
                               <span className="text-[10px] text-gray-600 mt-2 block uppercase font-mono">{alert.timestamp}</span>
                           </div>
                       </div>
                   ))}
               </div>
           </div>

           {/* Outbound Comms */}
           <div className="space-y-6">
                <div className="bg-[#1A1D24] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-[#00C2FF]/30 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-[#00C2FF]/10 flex items-center justify-center">
                            <Icons.Send className="w-5 h-5 text-[#00C2FF]" />
                        </div>
                        <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded">2m ago</span>
                    </div>
                    <h4 className="text-white font-bold mb-1">Patient Advisory Broadcast</h4>
                    <p className="text-gray-400 text-xs mb-3">Sent to 1,204 registered patients in Sector 4.</p>
                    <div className="bg-black/40 p-3 rounded border border-white/5 text-xs text-gray-300 font-mono">
                        "ER wait times currently >2 hrs. Please visit sector 4 clinic for minor ailments."
                    </div>
                </div>

                <div className="bg-[#1A1D24] border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-orange-500/30 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <Icons.Package className="w-5 h-5 text-orange-400" />
                        </div>
                        <span className="text-[10px] bg-white/5 text-gray-400 px-2 py-1 rounded">15m ago</span>
                    </div>
                    <h4 className="text-white font-bold mb-1">Supply Chain Automation</h4>
                    <p className="text-gray-400 text-xs mb-3">Auto-drafted PO #9920 to Primary Vendor.</p>
                    <div className="bg-black/40 p-3 rounded border border-white/5 text-xs text-gray-300 font-mono">
                        Refill request for 500 N95 masks. Est delivery: 4h.
                    </div>
                </div>
           </div>
       </div>
    </div>
  );

  const renderSettings = () => (
    <div className="animate-slideIn h-full flex flex-col max-w-2xl">
        <h2 className="text-2xl font-display font-bold text-white mb-8">System Configuration</h2>

        <div className="space-y-8">
            <div className="bg-[#1A1D24] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Icons.Eye className="w-5 h-5 text-[#00C2FF]" />
                    Visual Preferences
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Theme Mode</span>
                        <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                            <button className="px-4 py-1.5 rounded bg-[#00C2FF] text-black text-xs font-bold">Dark</button>
                            <button className="px-4 py-1.5 rounded text-gray-500 hover:text-white text-xs font-medium transition-colors">Light</button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">Color Blind Mode</span>
                        <button className="w-10 h-6 bg-white/10 rounded-full relative transition-colors hover:bg-white/20">
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-[#1A1D24] border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <Icons.Mic className="w-5 h-5 text-[#00C2FF]" />
                    Voice Module
                </h3>
                <div className="flex items-center justify-between mb-4">
                     <div className="flex flex-col">
                        <span className="text-gray-300 text-sm font-medium">Always-on Assistant</span>
                        <span className="text-gray-500 text-xs">Allows voice commands for navigation and queries.</span>
                     </div>
                     <button 
                        onClick={() => setIsVoiceActive(!isVoiceActive)}
                        className={`w-12 h-7 rounded-full relative transition-all duration-300 ${isVoiceActive ? 'bg-[#00C2FF]' : 'bg-white/10'}`}
                    >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${isVoiceActive ? 'left-6' : 'left-1'}`}></div>
                    </button>
                </div>
                {isVoiceActive && (
                    <div className="bg-[#0F1115] border border-white/5 rounded-xl p-4 flex items-center gap-4 animate-slideIn">
                        <div className="h-4 flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="w-1 bg-[#00C2FF] rounded-full animate-music" style={{animationDuration: Math.random() * 0.5 + 0.3 + 's', height: '100%'}}></div>
                            ))}
                        </div>
                        <span className="text-xs text-[#00C2FF] font-mono">Microphone Active - Listening...</span>
                    </div>
                )}
            </div>
            
            <div className="pt-4 border-t border-white/5">
                <button className="text-red-400 text-sm font-bold flex items-center gap-2 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors w-full justify-center border border-transparent hover:border-red-500/20">
                    <Icons.LogOut className="w-4 h-4" />
                    Reset System Simulation
                </button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden">
        
        {/* --- Sidebar --- */}
        <aside className="w-20 lg:w-64 bg-[#0F1115] border-r border-white/5 flex flex-col shrink-0 transition-all duration-300 z-50">
            {/* Logo Area */}
            <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/5 cursor-pointer" onClick={onBack}>
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
                    <span className="font-display font-bold text-lg tracking-wider block leading-none">AROGYA</span>
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
            <div className="p-4 border-t border-white/5">
                <button 
                  onClick={onBack}
                  className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                >
                    <Icons.LogOut className="w-5 h-5 group-hover:text-red-400 transition-colors" />
                    <span className="hidden lg:block text-sm font-medium">Exit Dashboard</span>
                </button>
            </div>
        </aside>

        {/* --- Main Content Area --- */}
        <main className="flex-1 relative flex flex-col min-w-0 bg-[#050505]">
            {/* Header */}
            <header className="h-20 shrink-0 border-b border-white/5 flex items-center justify-between px-8 bg-[#050505]/50 backdrop-blur-md sticky top-0 z-40">
                <h1 className="text-xl font-display font-bold capitalize text-white flex items-center gap-3">
                    {activeTab}
                    {activeTab === 'overview' && (
                        <span className="text-xs font-sans font-normal text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">Live Monitor + Simulation</span>
                    )}
                </h1>

                {/* Global Status */}
                <div className="flex items-center gap-4">
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
                  <div className="relative w-14 h-14 bg-[#1A1D24] border border-[#00C2FF]/30 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,194,255,0.2)] group-hover:scale-110 transition-transform duration-300">
                     <Icons.Brain className="w-7 h-7 text-[#00C2FF] animate-node-pulse" />
                     
                     {/* Notification Dot */}
                     <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#1A1D24]"></div>
                  </div>

                  {/* Tooltip */}
                  <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-[#1A1D24] border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-[#00C2FF] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
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
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
    >
        {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#00C2FF] rounded-r-full hidden lg:block"></div>}
        <Icon className={`w-5 h-5 ${active ? 'fill-current opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />
        <span className={`hidden lg:block text-sm font-medium tracking-wide ${active ? 'font-bold' : ''}`}>{label}</span>
    </button>
);

const StatusItem: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
    <div className="flex flex-col items-end">
        <span className="text-[9px] uppercase text-gray-500 font-bold tracking-wider mb-0.5">{label}</span>
        <span className={`font-display font-bold text-sm ${color}`}>
            {value}
        </span>
    </div>
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
  icon: any 
}> = ({ title, mainValue, maxValue, unit, trend, details, status, icon: Icon }) => {
    const percentage = (mainValue / maxValue) * 100;
    const color = status === 'critical' ? 'bg-red-500' : status === 'warning' ? 'bg-orange-500' : 'bg-[#00C2FF]';
    const textColor = status === 'critical' ? 'text-red-500' : status === 'warning' ? 'text-orange-500' : 'text-[#00C2FF]';

    return (
        <div className="bg-[#0F1115] border border-white/10 rounded-2xl p-5 flex flex-col justify-between group hover:border-white/20 transition-all shadow-lg h-full">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl bg-white/5 ${textColor}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded bg-white/5 ${textColor}`}>{trend}</span>
            </div>
            
            <div className="mb-4">
                <div className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">{title}</div>
                <div className="text-3xl font-display font-bold text-white mb-2">
                    {mainValue} <span className="text-sm text-gray-500 font-normal">/ {maxValue} {unit}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${percentage}%` }}></div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
               {details.map((d, i) => (
                  <div key={i}>
                     <div className="text-[10px] text-gray-500 uppercase">{d.label}</div>
                     <div className="text-xs font-bold text-white">{d.val}</div>
                  </div>
               ))}
            </div>
        </div>
    );
};

export default Dashboard;