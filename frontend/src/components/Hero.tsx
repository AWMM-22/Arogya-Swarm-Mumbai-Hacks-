import React from 'react';
import { Icons } from './ui/Icons';
import DashboardPreview from './DashboardPreview';
import DNABackground from './DNABackground';

interface HeroProps {
  onGetStarted?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  return (
    <section className="relative min-h-screen pt-32 px-4 pb-20 overflow-hidden flex flex-col items-center">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50" />

      {/* Grid Pattern at top */}
      <div className="absolute top-0 left-0 right-0 h-[400px] opacity-20 pointer-events-none" 
           style={{
             backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
             backgroundSize: '40px 40px',
             maskImage: 'linear-gradient(to bottom, black, transparent)'
           }} 
      />

      {/* DNA Background Layer - Positioned absolutely to sit behind text */}
      <div className="absolute top-20 left-0 w-full h-[400px] pointer-events-none z-0">
        <DNABackground />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
        
        {/* Pill Badge */}
        <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8">
          <span className="text-gray-300 text-sm font-medium tracking-wide">
            World's Most Adopted Healthcare AI
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-medium text-white mb-10 leading-tight tracking-tight relative">
          Revolutionizing<br />
          Healthcare with <span className="italic font-serif text-[#00C2FF]">AI</span>
        </h1>

        {/* CTA Button */}
        <div className="mb-16 animate-slideIn" style={{ animationDelay: '0.2s' }}>
            <button 
                onClick={onGetStarted}
                className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(0,194,255,0.5)] hover:scale-105 transition-all duration-300 flex items-center gap-2 overflow-hidden"
            >
                <span className="relative z-10">Get Started</span>
                <Icons.ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                
                {/* Button Shine Effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12" />
            </button>
        </div>

      </div>

      {/* Dashboard Mockup */}
      <DashboardPreview />

    </section>
  );
};

export default Hero;