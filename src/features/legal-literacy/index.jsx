// index.jsx - Root entry point for LexArena
// Provides sidebar navigation and content switching with fade animation

import React, { useState } from 'react';
import { 
  Users, Zap, FileText, Database, Plus, History, Settings
} from 'lucide-react';
import ProgressDashboard from './components/ProgressDashboard';
import QuizEngine from './components/QuizEngine';
import ScenarioPage from './components/ScenarioPage';
import ModuleList from './components/ModuleList';

const cssBlock = `
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }

  @keyframes lexFadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .lex-sidebar {
    width: 288px;
    background: #0D3B2E;
    height: calc(100vh - 64px);
    position: sticky;
    top: 64px;
    border-right: 1px solid rgba(255,255,255,0.05);
    display: flex;
    flex-direction: column;
    z-index: 40;
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .lex-sidebar-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border-radius: 16px;
    transition: all 0.3s ease;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    color: rgba(255, 255, 255, 0.4);
  }
  
  .lex-sidebar-btn:hover { 
    color: #fff; 
    background: rgba(255, 255, 255, 0.05);
  }

  .lex-sidebar-active {
    background: rgba(168, 230, 61, 0.1) !important;
    border: 1px solid rgba(168, 230, 61, 0.3) !important;
    color: #A8E63D !important;
  }

  .lex-sidebar-btn span {
    font-size: 10px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.15em;
  }

  .lex-content-fade { animation: lexFadeIn 0.3s ease forwards; }

  /* Custom scrollbar for sidebar */
  .lex-sidebar-nav::-webkit-scrollbar { display: none; }
  .lex-sidebar-nav { -ms-overflow-style: none; scrollbar-width: none; }

  @media (max-width: 768px) {
    .lex-sidebar {
      width: 100%;
      height: auto;
      position: relative;
      top: 0;
      border-right: none;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .lex-layout {
      flex-direction: column !important;
    }
  }
`;

export default function LegalLiteracyApp() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'My Profile', icon: Users },
    { id: 'quiz',      label: 'Enter the Arena', icon: Zap },
    { id: 'scenarios', label: 'Case Files', icon: FileText },
    { id: 'modules',   label: 'Law Scrolls', icon: Database }
  ];

  return (
    <>
      <style>{cssBlock}</style>
      <div className="lex-layout" style={{ display: 'flex', minHeight: '100vh', paddingTop: '64px', background: '#F5F0E8' }}>

        {/* Sidebar Nav */}
        <aside className="lex-sidebar">
          {/* Noise overlay */}
          <div className="absolute inset-0 noise-overlay opacity-20 pointer-events-none"></div>
          
          <nav className="lex-sidebar-nav flex-1 px-4 py-8 space-y-2 relative z-10 overflow-y-auto">
            <p style={{
              fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase', letterSpacing: '0.3em',
              paddingLeft: '16px', marginBottom: '24px'
            }}>
              Learning Path
            </p>
            
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`lex-sidebar-btn ${activeTab === tab.id ? 'lex-sidebar-active' : ''}`}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', zIndex: 10 }}>
            <div style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Legal Arena v1.0.4
            </div>
          </div>
        </aside>

        {/* Scrollable Content */}
        <main key={activeTab} className="lex-content-fade" style={{ flex: 1, padding: '20px', background: '#F5F0E8' }}>
          {activeTab === 'dashboard' && <ProgressDashboard onGoQuiz={() => setActiveTab('quiz')} />}
          {activeTab === 'quiz' && <QuizEngine onGoDashboard={() => setActiveTab('dashboard')} />}
          {activeTab === 'scenarios' && <ScenarioPage onComplete={() => setActiveTab('dashboard')} />}
          {activeTab === 'modules' && <ModuleList />}
        </main>
      </div>
    </>
  );
}
