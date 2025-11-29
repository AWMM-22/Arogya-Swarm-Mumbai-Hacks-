import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import LandingContent from './components/LandingContent';
import Dashboard from './components/Dashboard';

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing');

  const enterDashboard = () => {
    window.scrollTo(0, 0);
    setCurrentView('dashboard');
  };

  const exitDashboard = () => {
    window.scrollTo(0, 0);
    setCurrentView('landing');
  };

  if (currentView === 'dashboard') {
    return <Dashboard onBack={exitDashboard} />;
  }

  return (
    <div className="min-h-screen bg-background text-white font-sans selection:bg-primary/30">
      <Navbar onGetStarted={enterDashboard} />
      <main>
        <Hero onGetStarted={enterDashboard} />
        <LandingContent onGetStarted={enterDashboard} />
      </main>
    </div>
  );
}

export default App;