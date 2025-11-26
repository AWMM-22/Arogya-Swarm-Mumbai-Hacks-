import React, { useState } from 'react';
import { Icons } from './ui/Icons';

interface NavbarProps {
  onGetStarted?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onGetStarted }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 py-6 px-6 md:px-12 bg-gradient-to-b from-background/90 to-transparent backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
          <svg 
            width="40" 
            height="40" 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-8 h-8 md:w-10 md:h-10 text-[#00C2FF]"
          >
            {/* Central Node */}
            <circle cx="50" cy="50" r="12" fill="currentColor" />
            
            {/* Connections and Nodes */}
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
          <span className="text-xl md:text-2xl font-bold tracking-wider font-display text-white">
            Arogya Swarm
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <a href="#" className="hover:text-white transition-colors">Home</a>
          <a href="#" className="hover:text-white transition-colors">About</a>
          <a href="#" className="hover:text-white transition-colors">Technology</a>
          <a href="#" className="hover:text-white transition-colors">Services</a>
        </div>

        {/* CTA Button */}
        <div className="hidden md:block">
          <button 
            onClick={onGetStarted}
            className="bg-white text-black hover:bg-gray-200 transition-colors px-6 py-2.5 rounded-full text-sm font-semibold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transform hover:-translate-y-0.5 duration-200"
          >
            Get Started
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <Icons.X /> : <Icons.Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-surface border-t border-gray-800 p-6 flex flex-col gap-4 shadow-2xl">
           <a href="#" className="text-gray-300 hover:text-white py-2">Home</a>
          <a href="#" className="text-gray-300 hover:text-white py-2">About</a>
          <a href="#" className="text-gray-300 hover:text-white py-2">Technology</a>
          <a href="#" className="text-gray-300 hover:text-white py-2">Services</a>
          <button 
            onClick={() => {
              setIsMobileMenuOpen(false);
              if (onGetStarted) onGetStarted();
            }}
            className="bg-white text-black w-full py-3 rounded-full font-semibold mt-2"
          >
            Get Started
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;