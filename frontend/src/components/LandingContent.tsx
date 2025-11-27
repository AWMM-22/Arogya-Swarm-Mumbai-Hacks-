import React, { useEffect, useRef, useState } from 'react';
import { Icons } from './ui/Icons';

interface LandingProps {
  onGetStarted?: () => void;
}

// --- Utility for Scroll Animations ---
const useOnScreen = (options: IntersectionObserverInit) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect(); // Trigger once
      }
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [ref, options]);

  return [ref, isVisible] as const;
};

const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = "" }) => {
  const [ref, isVisible] = useOnScreen({ threshold: 0.1 });
  
  return (
    <div 
      ref={ref} 
      className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const PopIn: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = "" }) => {
  const [ref, isVisible] = useOnScreen({ threshold: 0.1 });
  
  return (
    <div 
      ref={ref} 
      className={`transition-all duration-700 cubic-bezier(0.175, 0.885, 0.32, 1.275) transform ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// --- Animated Grid Background ---
const AnimatedGrid = () => (
  <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
    <div 
      className="absolute inset-0 opacity-[0.05]"
      style={{
        backgroundImage: 'linear-gradient(to right, #808080 1px, transparent 1px), linear-gradient(to bottom, #808080 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}
    />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,194,255,0.05),transparent_60%)]" />
    <div className="absolute left-0 right-0 h-[300px] bg-gradient-to-b from-transparent via-[#00C2FF]/5 to-transparent animate-scan" />
  </div>
);

// --- Typewriter Component ---
const TypewriterEffect: React.FC<{ text: string; className?: string; speed?: number }> = ({ text, className, speed = 40 }) => {
  const [display, setDisplay] = useState('');
  const [ref, isVisible] = useOnScreen({ threshold: 0.5 });
  const hasStarted = useRef(false);

  useEffect(() => {
    if (isVisible && !hasStarted.current) {
      hasStarted.current = true;
      let i = 0;
      const timer = setInterval(() => {
        if (i < text.length) {
          setDisplay(text.substring(0, i + 1));
          i++;
        } else {
          clearInterval(timer);
        }
      }, speed); 
      return () => clearInterval(timer);
    }
  }, [isVisible, text, speed]);

  return (
    <div ref={ref} className={className}>
      {display}
      <span className="animate-pulse text-[#00C2FF]">|</span>
    </div>
  );
};

// --- Wave Animation Component ---
const WaveEffect = () => (
  <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-0">
    <svg className="relative block w-[calc(100%+1.3px)] h-[200px] rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00C2FF" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#00C2FF" stopOpacity="0.9" /> 
            <stop offset="100%" stopColor="#00C2FF" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" fill="url(#wave-gradient)" className="animate-pulse"></path>
        <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" fill="#00C2FF" fillOpacity="0.4" className="translate-y-2"></path>
    </svg>
  </div>
);

// --- Custom Animations Style ---
const CustomStyles = () => (
  <style>{`
    @keyframes scan {
      0% { top: -20%; opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { top: 110%; opacity: 0; }
    }
    .animate-scan {
      animation: scan 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    @keyframes nodePulse {
      0% { box-shadow: 0 0 0 0 rgba(0, 194, 255, 0.4); border-color: rgba(0, 194, 255, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(0, 194, 255, 0); border-color: rgba(0, 194, 255, 0.1); }
      100% { box-shadow: 0 0 0 0 rgba(0, 194, 255, 0); border-color: rgba(0, 194, 255, 0.4); }
    }
    .animate-node-pulse {
      animation: nodePulse 3s infinite;
    }
    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .animate-marquee {
      animation: marquee 30s linear infinite;
    }
    .pause-on-hover:hover .animate-marquee {
      animation-play-state: paused;
    }
    @keyframes slideInRight {
      0% { transform: translateX(50px); opacity: 0; }
      100% { transform: translateX(0); opacity: 1; }
    }
    .animate-slideIn {
      animation: slideInRight 0.5s ease-out forwards;
      opacity: 0; 
    }
    @keyframes music {
      0% { height: 10%; }
      50% { height: 100%; }
      100% { height: 10%; }
    }
    .animate-music {
      animation: music 1s ease-in-out infinite;
    }
  `}</style>
);

// --- Section Components ---

const IntroSection = () => (
  <section className="py-24 px-6 relative overflow-hidden bg-[#050505]">
    <AnimatedGrid />
    <div className="max-w-5xl mx-auto text-center mb-20 relative z-10">
      <FadeIn>
        <div className="inline-block mb-8">
            <h2 className="text-2xl md:text-3xl font-bold tracking-[0.2em] text-[#00C2FF] uppercase border-b-2 border-[#00C2FF]/30 pb-3">
            What is Arogya Swarm?
            </h2>
        </div>
        <div className="min-h-[160px] flex items-center justify-center">
            <TypewriterEffect 
                speed={40}
                text="Arogya Swarm is an autonomous multi-agent AI system that helps hospitals predict patient surges, allocate staff, manage supply shortages, and send proactive advisories — turning a chaotic hospital into a proactive, AI-driven operations center."
                className="text-2xl md:text-4xl lg:text-5xl leading-tight text-gray-200 font-light font-display"
            />
        </div>
      </FadeIn>
    </div>

    <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 relative z-10">
      {[
        { 
          icon: Icons.Brain, 
          title: "Predictive Intelligence", 
          desc: "Forecasts surges 48 hours in advance using historic data & real-time signals." 
        },
        { 
          icon: Icons.Building2, 
          title: "Smart Operations", 
          desc: "Automates staff allocation and resource distribution before bottlenecks occur." 
        },
        { 
          icon: Icons.Network, 
          title: "Connected Ecosystem", 
          desc: "Unifies procurement, ER, and patient advisory into a single sentient network." 
        }
      ].map((item, idx) => (
        <FadeIn key={idx} delay={idx * 200}>
          <div className="bg-surface/50 border border-white/5 p-8 rounded-2xl hover:bg-white/5 transition-all duration-300 group cursor-default h-full">
            <div className="w-14 h-14 bg-[#00C2FF]/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <item.icon className="w-7 h-7 text-[#00C2FF]" />
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-3">{item.title}</h3>
            <p className="text-gray-400 leading-relaxed">{item.desc}</p>
          </div>
        </FadeIn>
      ))}
    </div>
  </section>
);

const HowItWorksSection = () => (
  <section className="py-24 px-6 relative overflow-hidden bg-[#050505]">
    <AnimatedGrid />
    
    <div className="max-w-6xl mx-auto relative z-10">
      <FadeIn>
        <h2 className="text-3xl md:text-5xl font-display font-bold text-white text-center mb-4">The Multi-Agent Engine</h2>
        <p className="text-center text-gray-400 mb-20">Sentinel → Orchestrator → Logistics → Action</p>
      </FadeIn>

      <div className="relative">
        {/* Vertical Blue Line (Timeline Spine) */}
        <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#00C2FF]/0 via-[#00C2FF] to-[#00C2FF]/0 md:-translate-x-1/2 shadow-[0_0_15px_#00C2FF]"></div>

        <div className="flex flex-col gap-12 md:gap-24">
          {[
            { 
              icon: Icons.Radio, 
              title: "Sentinel Agent", 
              role: "The Watcher",
              desc: "Monitors pollution, local events, and disease signals in real-time.",
              color: "text-blue-400",
              effect: "shadow-[0_0_30px_rgba(59,130,246,0.2)]"
            },
            { 
              icon: Icons.Brain, 
              title: "Orchestrator Agent", 
              role: "The Strategist",
              desc: "Analyzes data to formulate operational strategies and priorities.",
              color: "text-purple-400",
              effect: "shadow-[0_0_30px_rgba(168,85,247,0.2)]"
            },
            { 
              icon: Icons.Package, 
              title: "Logistics Tool Agent", 
              role: "The Manager",
              desc: "Checks hospital inventory, bed capacity, and staff availability.",
              color: "text-orange-400",
              effect: "shadow-[0_0_30px_rgba(251,146,60,0.2)]"
            },
            { 
              icon: Icons.Zap, 
              title: "Action Agents", 
              role: "The Executor",
              desc: "Automates alerts, drafts POs, and reallocates staff instantly.",
              color: "text-green-400",
              effect: "shadow-[0_0_30px_rgba(74,222,128,0.2)]"
            }
          ].map((agent, idx) => (
            <div key={idx} className={`relative flex flex-col md:flex-row items-center ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
               
               {/* Timeline Dot */}
               <div className="absolute left-6 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#050505] border-2 border-[#00C2FF] shadow-[0_0_10px_#00C2FF] z-20 mt-6 md:mt-0">
                  <div className="absolute inset-0 bg-[#00C2FF] animate-ping opacity-75 rounded-full"></div>
               </div>

               {/* Card */}
               <div className="w-full md:w-1/2 pl-16 md:pl-0 md:px-16">
                  <FadeIn className={`${idx % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                    <div className={`relative bg-[#0F1115] border border-white/10 p-8 rounded-2xl group overflow-hidden ${agent.effect} transition-all duration-300 hover:scale-105 hover:border-[#00C2FF]/30`}>
                        {/* Inner Glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#00C2FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className={`flex items-center gap-3 mb-4 ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                           <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center ${agent.color}`}>
                              <agent.icon className="w-5 h-5" />
                           </div>
                           <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{agent.role}</span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-white mb-2">{agent.title}</h3>
                        <p className="text-gray-400 leading-relaxed">{agent.desc}</p>
                    </div>
                  </FadeIn>
               </div>
               
               {/* Spacer for structure */}
               <div className="hidden md:block w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

const KeyFeaturesSection = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const features = [
    { icon: Icons.TrendingUp, title: "Surge Prediction AI", desc: "Predict patient volume spikes up to 48 hours early using historic data and real-time triggers." },
    { icon: Icons.Users, title: "Staff Reallocation", desc: "Dynamically move nurses and doctors to high-load departments before chaos ensues." },
    { icon: Icons.AlertCircle, title: "Stock Alerts", desc: "Real-time tracking of Oxygen & medicine levels with automated reordering triggers." },
    { icon: Icons.FileText, title: "Auto-Draft POs", desc: "Generates and sends purchase orders automatically when critical stock dips below safety thresholds." },
    { icon: Icons.MessageSquare, title: "Patient Advisories", desc: "Proactive SMS/App alerts to patients regarding wait times and alternative care centers." },
    { icon: Icons.LayoutDashboard, title: "Live Ops Dashboard", desc: "A single, centralized command center for monitoring all hospital vitals in real-time." }
  ];

  return (
    <section className="py-24 px-6 relative overflow-hidden bg-[#050505]">
      <AnimatedGrid />
      <div className="max-w-7xl mx-auto relative z-10">
        <FadeIn>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-16 text-center">Core Capabilities</h2>
        </FadeIn>

        {/* Mobile Grid View (Fallback) */}
        <div className="md:hidden grid gap-6">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-4 p-6 rounded-2xl bg-surface border border-white/5">
              <div className="w-10 h-10 rounded-full bg-[#00C2FF]/10 flex items-center justify-center shrink-0">
                <feature.icon className="w-5 h-5 text-[#00C2FF]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Network Graph View */}
        <div className="hidden md:block relative w-full max-w-[900px] mx-auto h-[700px]">
           {/* Center Node */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center w-40 h-40 rounded-full bg-[#0F1115] border-4 border-[#00C2FF] shadow-[0_0_50px_rgba(0,194,255,0.3)]">
              <Icons.Cpu className="w-12 h-12 text-[#00C2FF] mb-2 animate-pulse" />
              <span className="text-white font-bold tracking-wider text-sm">CORE</span>
              <span className="text-[#00C2FF] font-bold tracking-widest text-xs">SYSTEM</span>
           </div>

           {/* Connecting Lines SVG */}
           <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {features.map((_, i) => {
                 const angle = (i * 60 - 90) * (Math.PI / 180); // Start from top (-90deg)
                 // Start point (Center of container)
                 const cx = "50%";
                 const cy = "50%";
                 // End point (calculated based on radius ~35% of container width)
                 // We stop slightly short to not overlap the node circle perfectly
                 const x2 = `${50 + 35 * Math.cos(angle)}%`;
                 const y2 = `${50 + 35 * Math.sin(angle)}%`;
                 return (
                    <line 
                      key={i} 
                      x1={cx} y1={cy} 
                      x2={x2} y2={y2} 
                      stroke="#00C2FF" 
                      strokeOpacity="0.6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                 );
              })}
           </svg>

           {/* Nodes */}
           {features.map((feature, i) => {
              const angle = (i * 60 - 90) * (Math.PI / 180);
              const left = `${50 + 35 * Math.cos(angle)}%`;
              const top = `${50 + 35 * Math.sin(angle)}%`;
              
              return (
                 <div 
                   key={i}
                   className="absolute z-20 group"
                   style={{ left, top, transform: 'translate(-50%, -50%)' }}
                   onMouseEnter={() => setHoveredIndex(i)}
                   onMouseLeave={() => setHoveredIndex(null)}
                 >
                    {/* Circle Node with Breathing Animation */}
                    <div className={`w-24 h-24 rounded-full border-2 bg-[#050505] flex flex-col items-center justify-center transition-all duration-300 cursor-pointer relative animate-node-pulse ${hoveredIndex === i ? 'border-[#00C2FF] shadow-[0_0_30px_#00C2FF] scale-110 !animate-none' : 'border-[#00C2FF]/30'}`}>
                       <feature.icon className={`w-8 h-8 mb-1 transition-colors ${hoveredIndex === i ? 'text-[#00C2FF]' : 'text-gray-400'}`} />
                    </div>
                    
                    {/* Headline Below Node - Adjusted for top node to avoid line overlap */}
                    <div className={`absolute left-1/2 -translate-x-1/2 text-center w-40 pointer-events-none ${i === 0 ? 'bottom-full mb-3' : 'top-full mt-3'}`}>
                       <span className={`text-sm font-bold uppercase tracking-wider transition-colors ${hoveredIndex === i ? 'text-white' : 'text-gray-500'}`}>
                         {feature.title}
                       </span>
                    </div>

                    {/* Description Popup on Hover (Beside Node) */}
                    <div 
                      className={`absolute top-1/2 -translate-y-1/2 w-64 bg-[#1A1D24]/95 backdrop-blur-md border border-[#00C2FF]/30 p-4 rounded-xl shadow-2xl transition-all duration-300 pointer-events-none
                        ${hoveredIndex === i ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
                        ${(i === 0 || i === 1 || i === 5) ? 'left-full ml-6' : 'right-full mr-6'} 
                        z-30`}
                    >
                       <h4 className="text-[#00C2FF] font-bold mb-2">{feature.title}</h4>
                       <p className="text-sm text-gray-300 leading-relaxed">{feature.desc}</p>
                       {/* Arrow pointing to node */}
                       <div className={`absolute top-1/2 -translate-y-1/2 w-0 h-0 border-8 border-transparent
                         ${(i === 0 || i === 1 || i === 5) ? 'right-full border-r-[#1A1D24]/95' : 'left-full border-l-[#1A1D24]/95'}
                       `} />
                    </div>
                 </div>
              );
           })}
        </div>
      </div>
    </section>
  );
};

const WhySection = () => (
  <section className="py-24 px-6 relative overflow-hidden bg-[#050505]">
    <AnimatedGrid />
    <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
      
      {/* Visual Side */}
      <FadeIn className="relative">
        <div className="relative aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 bg-[#050505]">
          {/* Hospital Image Background */}
          <div className="absolute inset-0 z-0">
             <img 
               src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1000&auto=format&fit=crop" 
               alt="Smart Hospital" 
               className="w-full h-full object-cover opacity-30 grayscale mix-blend-luminosity"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent" />
          </div>

          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
          
          {/* Animated Data Waves Simulation */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
             <div className="w-40 h-40 bg-[#00C2FF] rounded-full blur-[80px] opacity-20 animate-pulse" />
             <div className="relative z-10 grid gap-4 p-8 w-full">
                <div className="bg-[#151921]/90 backdrop-blur-md p-4 rounded-lg border border-white/10 flex items-center gap-4 animate-bounce duration-[3000ms] shadow-lg">
                   <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_green]" />
                   <div className="h-2 w-24 bg-gray-700 rounded-full" />
                </div>
                <div className="bg-[#151921]/90 backdrop-blur-md p-4 rounded-lg border border-white/10 flex items-center gap-4 translate-x-4 animate-bounce duration-[4000ms] shadow-lg">
                   <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_orange]" />
                   <div className="h-2 w-32 bg-gray-700 rounded-full" />
                </div>
                <div className="bg-[#151921]/90 backdrop-blur-md p-4 rounded-lg border border-white/10 flex items-center gap-4 -translate-x-2 animate-bounce duration-[3500ms] shadow-lg">
                   <div className="w-2 h-2 rounded-full bg-[#00C2FF] shadow-[0_0_10px_#00C2FF]" />
                   <div className="h-2 w-20 bg-gray-700 rounded-full" />
                </div>
             </div>
          </div>
        </div>
      </FadeIn>

      {/* Content Side */}
      <div className="flex flex-col gap-8">
        <FadeIn>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
            Why Hospitals Need <br/>Arogya Swarm
          </h2>
        </FadeIn>

        <div className="space-y-6">
          {[
            "Reduce ER wait times drastically",
            "Prevent critical stockouts before they happen",
            "Avoid staff burnout with intelligent rotation",
            "Handle festival & pollution surges effortlessly",
            "Predict problems 2–3 days earlier"
          ].map((benefit, idx) => (
            <FadeIn key={idx} delay={idx * 100}>
              <div className="flex items-center gap-3">
                <Icons.CheckCircle2 className="w-5 h-5 text-[#00C2FF]" />
                <span className="text-lg text-gray-300">{benefit}</span>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={500}>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-[#00C2FF]/10 border border-[#00C2FF]/20 p-6 rounded-2xl">
              <div className="text-3xl font-bold text-[#00C2FF] mb-1">40%</div>
              <div className="text-sm text-gray-400">Lower wait-time peaks</div>
            </div>
            <div className="bg-primary/10 border border-primary/20 p-6 rounded-2xl">
              <div className="text-3xl font-bold text-primary mb-1">25%</div>
              <div className="text-sm text-gray-400">Reduced supply wastage</div>
            </div>
          </div>
        </FadeIn>
      </div>
    </div>
  </section>
);

const DashboardSection = () => {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <section className="py-24 px-6 relative overflow-hidden bg-[#050505]">
      <AnimatedGrid />
      <div className="max-w-7xl mx-auto relative z-10">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">Actionable Insights, Instantly</h2>
            <p className="text-gray-400">From raw data to critical decisions in milliseconds.</p>
          </div>
        </FadeIn>

        <div className="relative max-w-5xl mx-auto">
          {/* Background Blur */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

          {/* Dashboard Code Replica with Lens Effect */}
          <FadeIn>
            <div 
               className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl aspect-video bg-[#0F1115] group cursor-none" 
               ref={containerRef}
               onMouseEnter={() => setIsHovering(true)}
               onMouseLeave={() => setIsHovering(false)}
               onMouseMove={handleMouseMove}
             >
                {/* Dashboard Replica Container that zooms */}
                <div 
                  className="w-full h-full transition-transform duration-200 ease-out flex text-white text-[10px] md:text-xs select-none bg-[#050505]"
                  style={{
                    transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                    transform: isHovering ? 'scale(1.25)' : 'scale(1)'
                  }}
                >
                   {/* Mock Sidebar */}
                   <div className="w-16 md:w-36 lg:w-48 border-r border-white/5 bg-[#0F1115] flex flex-col p-4 gap-4 shrink-0">
                      <div className="flex items-center gap-2 text-[#00C2FF] mb-2">
                         <div className="w-6 h-6"><svg viewBox="0 0 100 100" fill="none" className="w-full h-full"><circle cx="50" cy="50" r="12" fill="currentColor"/><path d="M50 50 L85 50" stroke="currentColor" strokeWidth="6"/><circle cx="85" cy="50" r="8" fill="currentColor"/><path d="M50 50 L25 25" stroke="currentColor" strokeWidth="6"/><circle cx="25" cy="25" r="8" fill="currentColor"/><path d="M50 50 L40 85" stroke="currentColor" strokeWidth="6"/><circle cx="40" cy="85" r="5" fill="currentColor"/></svg></div>
                         <div className="hidden md:block leading-none">
                            <span className="font-bold block">AROGYA</span>
                            <span className="text-[8px] tracking-widest text-[#00C2FF]">SWARM</span>
                         </div>
                      </div>
                      <div className="space-y-1">
                         <div className="bg-[#00C2FF]/10 text-[#00C2FF] p-2 rounded-lg flex items-center gap-2 font-bold"><Icons.LayoutDashboard size={14}/><span className="hidden md:block">Overview</span></div>
                         <div className="text-gray-400 p-2 flex items-center gap-2"><Icons.Activity size={14}/><span className="hidden md:block">Resources</span></div>
                         <div className="text-gray-400 p-2 flex items-center gap-2"><Icons.Zap size={14}/><span className="hidden md:block">Decisions</span></div>
                         <div className="text-gray-400 p-2 flex items-center gap-2"><Icons.MessageSquare size={14}/><span className="hidden md:block">Advisories</span></div>
                         <div className="text-gray-400 p-2 flex items-center gap-2"><Icons.Settings size={14}/><span className="hidden md:block">Settings</span></div>
                      </div>
                      <div className="mt-auto pt-4 border-t border-white/5 text-gray-400 flex items-center gap-2">
                          <Icons.LogOut size={14} /> <span className="hidden md:block">Exit</span>
                      </div>
                   </div>

                   {/* Mock Main Content */}
                   <div className="flex-1 flex flex-col min-w-0 bg-[#050505]">
                      {/* Mock Header */}
                      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0F1115]/50 backdrop-blur-sm">
                         <div className="flex items-center gap-2">
                             <span className="font-bold text-sm">Overview</span>
                             <span className="bg-white/5 px-2 py-0.5 rounded text-[10px] text-gray-500 border border-white/5">Live Monitor + Simulation</span>
                         </div>
                         <div className="flex items-center gap-3">
                             <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide animate-pulse">POLLUTION MODE ACTIVE</div>
                             <div className="w-6 h-6 rounded-full bg-[#00C2FF] flex items-center justify-center text-black font-bold text-[8px]">AS</div>
                         </div>
                      </div>

                      <div className="p-6 space-y-4 overflow-hidden">
                          {/* Stats Row */}
                          <div className="bg-[#0F1115] border border-white/10 rounded-xl p-4 grid grid-cols-4 gap-4">
                             <div><div className="text-gray-500 text-[9px] font-bold mb-1">SURGE RISK</div><div className="text-orange-500 font-bold text-lg leading-none">High</div></div>
                             <div className="relative overflow-hidden rounded"><div className="text-gray-500 text-[9px] font-bold mb-1 relative z-10">LIVE AQI</div><div className="text-red-500 font-bold text-lg leading-none relative z-10">412</div><div className="absolute inset-0 bg-[#00C2FF]/5 animate-pulse"></div></div>
                             <div><div className="text-gray-500 text-[9px] font-bold mb-1">WEATHER</div><div className="text-white font-bold text-lg leading-none">Haze / Smog</div></div>
                             <div><div className="text-gray-500 text-[9px] font-bold mb-1">SYNC STATUS</div><div className="text-green-500 font-bold text-lg leading-none flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>Active</div></div>
                          </div>

                          {/* Simulation Controls */}
                          <div>
                              <div className="text-[#00C2FF] font-bold mb-2 flex items-center gap-1"><Icons.ShieldCheck size={12}/> Simulation & Crisis Mode</div>
                              <div className="grid grid-cols-4 gap-3">
                                  <div className="bg-[#0F1115] border border-white/5 p-3 rounded-lg opacity-40"><div className="font-bold mb-1 flex items-center gap-1"><Icons.ShieldCheck size={10}/> Normal</div><div className="text-[8px]">Baseline operations.</div></div>
                                  <div className="bg-[#00C2FF]/10 border border-[#00C2FF] p-3 rounded-lg relative shadow-[0_0_10px_rgba(0,194,255,0.1)]">
                                      <div className="font-bold text-[#00C2FF] mb-1 flex items-center gap-1"><Icons.Moon size={10}/> Pollution</div>
                                      <div className="text-[8px] text-gray-400">AQI &gt; 400. High respiratory load.</div>
                                      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#00C2FF]"></div>
                                  </div>
                                  <div className="bg-[#0F1115] border border-white/5 p-3 rounded-lg opacity-40"><div className="font-bold mb-1 flex items-center gap-1"><Icons.Users size={10}/> Festival</div><div className="text-[8px]">Crowd surge.</div></div>
                                  <div className="bg-[#0F1115] border border-white/5 p-3 rounded-lg opacity-40"><div className="font-bold mb-1 flex items-center gap-1"><Icons.Activity size={10}/> Outbreak</div><div className="text-[8px]">Viral vector.</div></div>
                              </div>
                          </div>

                          {/* Bottom Grid */}
                          <div className="grid grid-cols-3 gap-4 h-40">
                              <div className="bg-[#0F1115] border border-[#00C2FF]/20 rounded-xl p-3 flex flex-col">
                                  <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                                      <span className="font-bold flex items-center gap-1"><Icons.Radio size={10} className="text-[#00C2FF]"/> AGENT FEED</span>
                                      <span className="text-[8px] text-gray-500">PAUSE</span>
                                  </div>
                                  <div className="space-y-2">
                                     <div className="flex gap-2"><div className="w-1 h-1 rounded-full bg-purple-400 mt-1"></div><div className="text-gray-400">Orchestrator: Analysis complete.</div></div>
                                     <div className="flex gap-2"><div className="w-1 h-1 rounded-full bg-blue-400 mt-1"></div><div className="text-red-400 bg-red-500/10 px-1 rounded">CRITICAL: Ward B spike detected.</div></div>
                                     <div className="flex gap-2"><div className="w-1 h-1 rounded-full bg-green-400 mt-1"></div><div className="text-gray-400">Action: Staff alert sent.</div></div>
                                  </div>
                              </div>
                              <div className="col-span-2 bg-[#0F1115] border border-white/10 rounded-xl p-3 relative overflow-hidden flex flex-col">
                                  <div className="flex justify-between items-start mb-2 relative z-10">
                                      <div>
                                          <div className="text-[8px] text-gray-500 font-bold uppercase">SURGE PREDICTION ENGINE</div>
                                          <div className="text-lg font-bold">48-Hour Forecast <span className="bg-[#00C2FF]/10 text-[#00C2FF] text-[8px] px-1 rounded border border-[#00C2FF]/20">94% CONFIDENCE</span></div>
                                      </div>
                                      <div className="text-right">
                                          <div className="text-[8px] text-gray-500">Projected Peak</div>
                                          <div className="font-bold">02:00 <span className="text-gray-500 font-normal">Tomorrow</span></div>
                                      </div>
                                  </div>
                                  <div className="flex-1 relative w-full">
                                      {/* Mock Chart Line */}
                                      <svg className="w-full h-full absolute bottom-0" preserveAspectRatio="none" viewBox="0 0 100 50">
                                          <defs>
                                              <linearGradient id="mockGradient" x1="0" y1="0" x2="0" y2="1">
                                                  <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3"/>
                                                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0"/>
                                              </linearGradient>
                                          </defs>
                                          <path d="M0 45 Q 10 40, 20 20 T 40 10 T 60 25 T 80 40 T 100 20 L 100 50 L 0 50 Z" fill="url(#mockGradient)" />
                                          <path d="M0 45 Q 10 40, 20 20 T 40 10 T 60 25 T 80 40 T 100 20" fill="none" stroke="#EF4444" strokeWidth="1" />
                                          <line x1="0" y1="15" x2="100" y2="15" stroke="#444" strokeDasharray="2 2" strokeWidth="0.5" />
                                      </svg>
                                  </div>
                              </div>
                          </div>
                      </div>
                   </div>
                </div>

                {/* Lens UI Overlay (Follows Mouse) */}
                {isHovering && (
                  <div 
                    className="absolute pointer-events-none w-32 h-32 rounded-full border border-[#00C2FF]/50 shadow-[0_0_40px_rgba(0,194,255,0.3)] flex items-center justify-center bg-white/5 backdrop-brightness-150 backdrop-contrast-125"
                    style={{
                      left: `${mousePos.x}%`,
                      top: `${mousePos.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                     <div className="absolute inset-0 border border-white/20 rounded-full scale-75"></div>
                     <div className="w-1 h-1 bg-[#00C2FF] rounded-full shadow-[0_0_10px_#00C2FF]"></div>
                     <div className="absolute -bottom-6 text-[10px] text-[#00C2FF] font-mono whitespace-nowrap bg-black/50 px-2 rounded">SCANNING...</div>
                  </div>
                )}
             </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};

const TechStackSection = () => (
  <section className="py-20 px-6 relative overflow-hidden bg-[#050505] border-y border-white/5">
    <AnimatedGrid />
    <div className="max-w-7xl mx-auto relative z-10">
      <div className="text-center mb-12">
        <h3 className="text-xl font-medium text-white">Powering the Swarm</h3>
      </div>
      
      <div className="flex flex-wrap justify-center gap-6 md:gap-12">
        {[
          { name: "LangGraph / CrewAI", icon: Icons.Brain },
          { name: "FastAPI", icon: Icons.Zap },
          { name: "Redis", icon: Icons.Layers },
          { name: "PostgreSQL", icon: Icons.Database },
          { name: "Darts / Prophet", icon: Icons.TrendingUp },
          { name: "React + Tailwind", icon: Icons.Code2 },
          { name: "Twilio API", icon: Icons.MessageSquare }
        ].map((tech, idx) => (
          <FadeIn key={idx} delay={idx * 50}>
            {/* Added shadow for blue neon effect on curved divs */}
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/5 shadow-[0_0_10px_rgba(0,194,255,0.2)] hover:border-[#00C2FF]/50 hover:bg-[#00C2FF]/5 transition-all cursor-default group">
              <tech.icon className="w-4 h-4 text-gray-400 group-hover:text-[#00C2FF] transition-colors" />
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{tech.name}</span>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  </section>
);

const WhoUsesSection = () => {
  const roles = [
    { title: "Hospital COO", desc: "Gain high-level visibility into operational efficiency and bottlenecks." },
    { title: "ER Shift Manager", desc: "Get real-time alerts on incoming surges to prep staff and beds." },
    { title: "Procurement Lead", desc: "Automate inventory checks and purchasing for critical supplies." },
    { title: "Patient Ops Team", desc: "Streamline communication and advisory dissemination to patients." }
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-[#050505] pause-on-hover">
      <AnimatedGrid />
      <div className="max-w-7xl mx-auto px-6 mb-12 text-center relative z-10">
        <FadeIn>
          {/* Changed text and alignment */}
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white">Who Uses Arogya-Swarm?</h2>
        </FadeIn>
      </div>

      <div className="relative w-full overflow-hidden z-10">
        <div className="flex w-max animate-marquee gap-6">
          {/* Double the array to create seamless loop */}
          {[...roles, ...roles].map((role, idx) => (
            // Added neon blue shadow effect on moving divs
            <div key={idx} className="w-[300px] md:w-[350px] bg-[#0F1115] p-8 rounded-2xl border border-white/5 shadow-[0_0_20px_rgba(0,194,255,0.15)] hover:border-[#00C2FF]/30 transition-all shrink-0">
               <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center border border-white/10 mb-6">
                 <Icons.UserCheck className="w-6 h-6 text-gray-300" />
               </div>
               <h3 className="text-xl font-bold text-white mb-3">{role.title}</h3>
               <p className="text-gray-400 text-sm leading-relaxed">{role.desc}</p>
            </div>
          ))}
        </div>
        {/* Gradient fades for edges */}
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#050505] to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#050505] to-transparent pointer-events-none" />
      </div>
    </section>
  );
};

const TestimonialSection = () => (
  <section className="py-24 px-6 relative overflow-hidden bg-[#050505]">
    <AnimatedGrid />
    <div className="max-w-4xl mx-auto relative z-10">
      <FadeIn>
        <h2 className="text-3xl md:text-5xl font-display font-bold text-center text-white mb-16">Impact Simulations</h2>
      </FadeIn>
      
      <div className="space-y-6">
        {[
          { text: "During Diwali, Arogya-Swarm predicted a 2.4× patient surge 48 hours early, allowing proactive staffing.", tag: "Prediction Success" },
          { text: "Pollution spike triggered oxygen reorder before shortage occurred, maintaining 100% availability.", tag: "Supply Chain" },
          { text: "Hospital avoided 3 high-risk stockouts in one month thanks to automated low-stock alerts.", tag: "Risk Aversion" }
        ].map((sim, idx) => (
          <PopIn key={idx} delay={idx * 150}>
            {/* Added neon blue shadow effect */}
            <div className="bg-[#0F1115] p-8 rounded-2xl border border-white/5 shadow-[0_0_20px_rgba(0,194,255,0.15)] hover:border-[#00C2FF]/20 transition-all">
              <div className="flex items-start gap-4">
                <Icons.Quote className="w-8 h-8 text-[#00C2FF] opacity-50 shrink-0" />
                <div>
                  <p className="text-lg md:text-xl text-gray-200 font-light mb-4">"{sim.text}"</p>
                  <span className="inline-block px-3 py-1 bg-[#00C2FF]/10 text-[#00C2FF] text-xs font-bold uppercase tracking-wider rounded-full">
                    {sim.tag}
                  </span>
                </div>
              </div>
            </div>
          </PopIn>
        ))}
      </div>
    </div>
  </section>
);

const Footer: React.FC<LandingProps> = ({ onGetStarted }) => (
  <footer className="py-20 px-6 relative overflow-hidden border-t border-white/5 bg-[#050505]">
    <AnimatedGrid />
    {/* Blue Wave Effect */}
    <WaveEffect />
    
    <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center">
      <div className="mb-8">
        <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">Ready to modernize?</h2>
        <p className="text-white max-w-xl mx-auto mb-10">Join the hospitals using Arogya Swarm to deliver faster, safer, and smarter healthcare.</p>
        
        <div className="flex flex-col md:flex-row items-center gap-4 justify-center">
          <button 
            onClick={onGetStarted}
            className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition-colors w-full md:w-auto shadow-[0_0_20px_rgba(255,255,255,0.4)]"
          >
            Try Demo
          </button>
          <button className="px-8 py-4 bg-transparent border border-white/20 text-white rounded-full font-bold hover:bg-white/5 transition-colors w-full md:w-auto">
            Contact Team
          </button>
        </div>
      </div>

      <div className="flex gap-8 text-sm text-white mt-20">
        <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
        <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
        <a href="#" className="hover:text-gray-300 transition-colors">Documentation</a>
      </div>
      
      <div className="mt-8 text-white/70 text-sm">
        © 2024 Arogya Swarm. All rights reserved.
      </div>
    </div>
  </footer>
);

const LandingContent: React.FC<LandingProps> = ({ onGetStarted }) => {
  return (
    <div className="flex flex-col w-full">
      <CustomStyles />
      <IntroSection />
      <HowItWorksSection />
      <KeyFeaturesSection />
      <WhySection />
      <DashboardSection />
      <TechStackSection />
      <WhoUsesSection />
      <TestimonialSection />
      <Footer onGetStarted={onGetStarted} />
    </div>
  );
};

export default LandingContent;