import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NAV_ITEMS } from './components/Sidebar';
import { LegendModal } from './components/LegendModal';
import { Dashboard } from './pages/Dashboard';
import { PipesSimulator } from './pages/PipesSimulator';
import { SharedMemorySimulator } from './pages/SharedMemorySimulator';
import { MessageQueueSimulator } from './pages/MessageQueueSimulator';
import { SocketSimulator } from './pages/SocketSimulator';
import { SignalsSimulator } from './pages/SignalsSimulator';
import { NamedPipeSimulator } from './pages/NamedPipeSimulator';
import { ProducerConsumerLab } from './pages/ProducerConsumerLab';
import { DeadlockLab } from './pages/DeadlockLab';
import { Comparison } from './pages/Comparison';
import { Tutorials } from './pages/Tutorials';
import { Quiz } from './pages/Quiz';
import { markMechanismVisited, addRecentSimulation, getPreferences, savePreferences } from './utils/storage';

export function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const prefs = getPreferences();
    if (prefs.theme) setTheme(prefs.theme);
  }, []);

  const handleNavigate = (pageId) => {
    setActivePage(pageId);
    markMechanismVisited(pageId);
    if (pageId !== 'dashboard' && pageId !== 'quiz' && pageId !== 'tutorials' && pageId !== 'comparison') {
      addRecentSimulation(pageId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    savePreferences({ ...getPreferences(), theme: newTheme });
  };

  const activeNavItem = NAV_ITEMS.find((item) => item.id === activePage) || NAV_ITEMS[0];

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'pipes':
        return <PipesSimulator />;
      case 'shared-memory':
        return <SharedMemorySimulator />;
      case 'message-queues':
        return <MessageQueueSimulator />;
      case 'sockets':
        return <SocketSimulator />;
      case 'signals':
        return <SignalsSimulator />;
      case 'named-pipes':
        return <NamedPipeSimulator />;
      case 'producer-consumer':
        return <ProducerConsumerLab />;
      case 'deadlock':
        return <DeadlockLab />;
      case 'comparison':
        return <Comparison onSelectMechanism={handleNavigate} />;
      case 'tutorials':
        return <Tutorials onLaunchSimulator={handleNavigate} />;
      case 'quiz':
        return <Quiz onExploreLab={() => handleNavigate('dashboard')} />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <Navbar
        activePageTitle={activeNavItem.name}
        isRunning={false}
        onOpenLegend={() => setIsLegendOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        {/* Central Workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-dark-950 grid-bg">
          {/* Mobile hamburger banner */}
          <div className="lg:hidden flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-dark-900 border border-slate-700 text-xs font-mono text-cyan-300 font-semibold"
            >
              ☰ Open Menu
            </button>
            <span className="text-xs font-mono text-slate-400">
              {activeNavItem.name}
            </span>
          </div>

          {renderActivePage()}
        </main>
      </div>

      {/* Visual Simulator Legend Modal */}
      <LegendModal
        isOpen={isLegendOpen}
        onClose={() => setIsLegendOpen(false)}
      />
    </div>
  );
}

export default App;
