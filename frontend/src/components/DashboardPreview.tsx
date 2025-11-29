import React from 'react';
import { Icons } from './ui/Icons';

const DashboardPreview: React.FC = () => {
  return (
    <div className="w-full max-w-6xl mx-auto mt-8 relative z-10">
       {/* Glow Effect behind the dashboard */}
       <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[90%] h-[300px] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>

       {/* Dashboard Container - Static, no zoom */}
       <div className="relative rounded-2xl border border-white/10 shadow-2xl bg-[#050505] overflow-hidden select-none">
          <div className="flex text-white text-[10px] md:text-xs min-h-[600px] md:min-h-[700px]">
              
              {/* Sidebar */}
              <div className="w-16 md:w-56 border-r border-white/5 bg-[#0F1115] flex flex-col p-4 gap-6 shrink-0 hidden md:flex">
                   {/* Logo */}
                   <div className="flex items-center gap-3 text-[#00C2FF] mb-2 px-2">
                        <div className="w-8 h-8 shrink-0">
                           <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                              <circle cx="50" cy="50" r="12" fill="currentColor"/>
                              <path d="M50 50 L85 50" stroke="currentColor" strokeWidth="6"/>
                              <circle cx="85" cy="50" r="8" fill="currentColor"/>
                              <path d="M50 50 L75 20" stroke="currentColor" strokeWidth="6"/>
                              <circle cx="75" cy="20" r="6" fill="currentColor"/>
                              <path d="M50 50 L25 25" stroke="currentColor" strokeWidth="6"/>
                              <circle cx="25" cy="25" r="8" fill="currentColor"/>
                              <path d="M50 50 L20 60" stroke="currentColor" strokeWidth="6"/>
                              <circle cx="20" cy="60" r="6" fill="currentColor"/>
                              <path d="M50 50 L40 85" stroke="currentColor" strokeWidth="6"/>
                              <circle cx="40" cy="85" r="5" fill="currentColor"/>
                              <path d="M50 50 L70 80" stroke="currentColor" strokeWidth="6"/>
                              <circle cx="70" cy="80" r="4" fill="currentColor"/>
                           </svg>
                        </div>
                        <div className="leading-none">
                           <span className="font-display font-bold block text-lg text-white tracking-wide">AROGYA</span>
                           <span className="text-[10px] tracking-[0.2em] text-[#00C2FF] font-bold">SWARM</span>
                        </div>
                   </div>
                   
                   {/* Nav Items - Overview Active */}
                   <div className="space-y-2">
                        <div className="bg-[#00C2FF]/10 text-[#00C2FF] p-3 rounded-xl flex items-center gap-3 font-bold border border-[#00C2FF]/20 shadow-[0_0_15px_rgba(0,194,255,0.1)]">
                           <Icons.LayoutDashboard size={18}/><span>Overview</span>
                        </div>
                        <div className="text-gray-400 p-3 flex items-center gap-3 hover:text-white transition-colors hover:bg-white/5 rounded-xl">
                           <Icons.Activity size={18}/><span>Resources</span>
                        </div>
                        <div className="text-gray-400 p-3 flex items-center gap-3 hover:text-white transition-colors hover:bg-white/5 rounded-xl">
                           <Icons.Zap size={18}/><span>Decisions</span>
                        </div>
                        <div className="text-gray-400 p-3 flex items-center gap-3 hover:text-white transition-colors hover:bg-white/5 rounded-xl">
                           <Icons.MessageSquare size={18}/><span>Advisories</span>
                        </div>
                        <div className="text-gray-400 p-3 flex items-center gap-3 hover:text-white transition-colors hover:bg-white/5 rounded-xl">
                           <Icons.Settings size={18}/><span>Settings</span>
                        </div>
                   </div>

                   <div className="mt-auto pt-6 border-t border-white/5 text-gray-400 flex items-center gap-3 px-2">
                       <Icons.LogOut size={16} /> <span className="font-medium">Exit Dashboard</span>
                   </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 flex flex-col min-w-0 bg-[#050505]">
                 
                 {/* Top Header */}
                 <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#0F1115]/50 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        <span className="font-display font-bold text-xl">Overview</span>
                        <span className="hidden sm:block bg-white/5 px-3 py-1 rounded text-xs text-gray-400 border border-white/5 font-medium">Live Monitor + Simulation</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-2 rounded-full text-xs font-bold tracking-wider animate-pulse flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                           <Icons.AlertCircle size={14} /> POLLUTION MODE ACTIVE
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00C2FF] to-blue-600 flex items-center justify-center text-black font-bold text-sm shadow-[0_0_20px_#0066FF]">AS</div>
                    </div>
                 </div>

                 {/* Body */}
                 <div className="p-8 space-y-8">
                     
                     {/* Stats Row */}
                     <div className="bg-[#0F1115] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                           <div className="pl-2">
                              <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">SURGE RISK</div>
                              <div className="text-orange-500 font-display font-bold text-3xl tracking-tight">High</div>
                           </div>
                           <div className="relative pl-2 border-l border-white/5">
                              <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2 relative z-10">LIVE AQI</div>
                              <div className="text-red-500 font-display font-bold text-3xl tracking-tight relative z-10">412</div>
                              <div className="absolute top-1/2 left-4 -translate-y-1/2 w-16 h-16 bg-red-500/20 blur-xl rounded-full animate-pulse"></div>
                           </div>
                           <div className="pl-2 border-l border-white/5">
                              <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">WEATHER</div>
                              <div className="text-white font-display font-bold text-3xl tracking-tight">Haze / Smog</div>
                           </div>
                           <div className="pl-2 border-l border-white/5">
                              <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">SYNC STATUS</div>
                              <div className="text-green-500 font-display font-bold text-2xl flex items-center gap-3 mt-1">
                                 <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_green] animate-pulse"></div> Active
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Simulation Cards */}
                     <div>
                        <div className="text-white font-display font-bold text-lg mb-4 flex items-center gap-2">
                           <Icons.ShieldCheck size={20} className="text-[#00C2FF]"/> Simulation & Crisis Mode
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                            <div className="bg-[#0F1115] border border-white/5 p-5 rounded-xl opacity-40">
                               <div className="font-bold mb-2 flex items-center gap-2 text-white"><Icons.ShieldCheck size={16} className="text-gray-500"/> Normal</div>
                               <div className="text-[10px] text-gray-500 font-medium">Baseline operations.</div>
                            </div>
                            <div className="bg-[#00C2FF]/10 border border-[#00C2FF] p-5 rounded-xl relative shadow-[0_0_30px_rgba(0,194,255,0.15)] ring-1 ring-[#00C2FF]/50 transform scale-[1.02]">
                               <div className="font-bold mb-2 flex items-center gap-2 text-[#00C2FF]"><Icons.Moon size={16}/> Pollution</div>
                               <div className="text-[10px] text-gray-300 font-medium">AQI &gt; 400. High respiratory load.</div>
                               <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-[#00C2FF] shadow-[0_0_10px_#00C2FF] animate-pulse"></div>
                            </div>
                            <div className="bg-[#0F1115] border border-white/5 p-5 rounded-xl opacity-40">
                               <div className="font-bold mb-2 flex items-center gap-2 text-white"><Icons.Users size={16} className="text-gray-500"/> Festival</div>
                               <div className="text-[10px] text-gray-500 font-medium">Crowd surge. High trauma risk.</div>
                            </div>
                            <div className="bg-[#0F1115] border border-white/5 p-5 rounded-xl opacity-40">
                               <div className="font-bold mb-2 flex items-center gap-2 text-white"><Icons.Activity size={16} className="text-gray-500"/> Outbreak</div>
                               <div className="text-[10px] text-gray-500 font-medium">Viral vector. Bio-threat high.</div>
                            </div>
                        </div>
                     </div>

                     {/* Bottom Row - Feed and Chart */}
                     <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:h-96">
                        
                        {/* Agent Neural Feed (Empty as per image) */}
                        <div className="md:col-span-4 bg-[#0F1115] border border-white/10 rounded-2xl flex flex-col h-48 md:h-full overflow-hidden">
                             <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
                                <h3 className="font-display font-bold text-white flex items-center gap-2 text-xs uppercase tracking-wider">
                                    <Icons.Radio className="w-4 h-4 text-[#00C2FF] animate-pulse" />
                                    Agent Neural Feed
                                </h3>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Pause</span>
                            </div>
                            <div className="flex-1 bg-black/40 relative">
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20"></div>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="md:col-span-8 bg-[#0F1115] border border-white/10 rounded-2xl p-6 relative overflow-hidden flex flex-col h-64 md:h-full">
                             <div className="flex justify-between items-start mb-4 relative z-10">
                                 <div>
                                     <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Surge Prediction Engine</h3>
                                     <h2 className="text-xl font-display font-bold text-white flex items-center gap-3">
                                        48-Hour Forecast
                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/20 flex items-center gap-1">
                                           <Icons.Brain className="w-3 h-3" /> 94% CONFIDENCE
                                        </span>
                                     </h2>
                                 </div>
                                 <div className="text-right">
                                    <div className="text-[10px] text-gray-400 mb-0.5">Projected Peak</div>
                                    <div className="text-lg font-bold text-white leading-none">
                                       02:00 <span className="text-xs text-gray-500 font-normal">Tomorrow</span>
                                    </div>
                                 </div>
                             </div>
                             
                             {/* Static SVG Chart replicating the red curve */}
                             <div className="flex-1 w-full relative z-10">
                                 <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 200">
                                     <defs>
                                         <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                             <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3"/>
                                             <stop offset="100%" stopColor="#EF4444" stopOpacity="0"/>
                                         </linearGradient>
                                     </defs>
                                     {/* Dashed Threshold Line */}
                                     <line x1="0" y1="60" x2="400" y2="60" stroke="#444" strokeWidth="1" strokeDasharray="4 4" />
                                     <text x="5" y="55" fill="#666" fontSize="10" fontFamily="monospace">75</text>
                                     <text x="5" y="110" fill="#666" fontSize="10" fontFamily="monospace">50</text>
                                     <text x="5" y="160" fill="#666" fontSize="10" fontFamily="monospace">25</text>

                                     {/* Red Curve */}
                                     <path d="M0 130 C 20 120, 40 130, 60 110 C 80 90, 100 85, 120 75 C 140 65, 160 55, 180 65 C 200 75, 220 70, 240 75 C 260 80, 280 110, 300 130 C 320 150, 340 140, 360 130 L 400 110 V 200 L 0 200 Z" fill="url(#chartGradient)" />
                                     <path d="M0 130 C 20 120, 40 130, 60 110 C 80 90, 100 85, 120 75 C 140 65, 160 55, 180 65 C 200 75, 220 70, 240 75 C 260 80, 280 110, 300 130 C 320 150, 340 140, 360 130 L 400 110" fill="none" stroke="#EF4444" strokeWidth="3" />
                                     
                                     {/* Peak Dot */}
                                     <circle cx="150" cy="65" r="4" fill="#EF4444" stroke="#0F1115" strokeWidth="2" />
                                 </svg>
                             </div>
                        </div>
                     </div>
                 </div>
              </div>
          </div>
       </div>
    </div>
  );
};

export default DashboardPreview;