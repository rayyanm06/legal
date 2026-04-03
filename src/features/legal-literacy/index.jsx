// index.jsx - Root entry point for LexArena ⚖️
// Provides sticky inner tab navigation and content switching with fade animation

import React, { useState, useEffect } from 'react';
import ProgressDashboard from './components/ProgressDashboard';
import QuizEngine from './components/QuizEngine';
import ScenarioPage from './components/ScenarioPage';
import ModuleList from './components/ModuleList';

const cssBlock = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Outfit:wght@400;500;600&display=swap');

  @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }

  @keyframes lexFadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .lex-tab-btn {
    position: relative; background: transparent; border: none;
    color: rgba(245, 240, 232, 0.65); padding: 8px 16px;
    font-size: 0.9rem; cursor: pointer; border-radius: 8px;
    font-weight: 600; font-family: 'Outfit', sans-serif;
    transition: all 0.25s ease; white-space: nowrap;
  }
  .lex-tab-btn:hover { color: #f5f0e8; transform: translateY(-1px); }
  .lex-tab-btn::after {
    content: ''; position: absolute; bottom: -2px; left: 50%; width: 0;
    height: 2px; background: #a8e63d; border-radius: 2px;
    transform: translateX(-50%); transition: width 0.3s ease;
  }
  .lex-tab-btn:hover::after { width: 60%; }
  .lex-tab-active {
    color: #0D3B2E !important; background: #a8e63d !important;
    border-radius: 8px; opacity: 1 !important;
  }
  .lex-tab-active::after { width: 0 !important; }

  .lex-content-fade { animation: lexFadeIn 0.3s ease forwards; }
`;

export default function LegalLiteracyApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tabs = [
    { id: 'dashboard', label: '⚖️ My Profile' },
    { id: 'quiz',      label: '🎯 Enter the Arena' },
    { id: 'scenarios', label: '📁 Case Files' },
    { id: 'modules',   label: '📜 Law Scrolls' }
  ];

  return (
    <>
      <style>{cssBlock}</style>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingTop: '60px' }}>

        {/* Sticky Inner Nav — slides to top when global nav hides */}
        <nav style={{
          position: 'sticky', top: scrolled ? '0' : '60px', zIndex: 90,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: '#1a3a2a',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transition: 'top 0.3s ease',
        }}>
          {/* Compact tagline */}
          <div style={{
            padding: '6px 16px', fontSize: '0.65rem',
            fontFamily: "'Syne', sans-serif", letterSpacing: '0.18em',
            color: '#a8e63d', fontWeight: 700, textAlign: 'center',
            borderBottom: '1px solid rgba(168,230,61,0.2)',
            width: '100%',
          }}>
            ⚖️ LEXARENA — KNOW YOUR RIGHTS. FIGHT YOUR CASE. ⚖️
          </div>
          {/* Tab row */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: '6px',
            padding: '10px 16px', flexWrap: 'wrap',
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`lex-tab-btn ${activeTab === tab.id ? 'lex-tab-active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Scrollable Content */}
        <main key={activeTab} className="lex-content-fade" style={{ flex: 1 }}>
          {activeTab === 'dashboard' && <ProgressDashboard onGoQuiz={() => setActiveTab('quiz')} />}
          {activeTab === 'quiz' && <QuizEngine onGoDashboard={() => setActiveTab('dashboard')} />}
          {activeTab === 'scenarios' && <ScenarioPage onComplete={() => setActiveTab('dashboard')} />}
          {activeTab === 'modules' && <ModuleList />}
        </main>
      </div>
    </>
  );
}
