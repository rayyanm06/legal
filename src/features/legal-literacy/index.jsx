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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardStep, setOnboardStep] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    const hasSeen = localStorage.getItem('lexarena_onboarded');
    if (!hasSeen) {
      setTimeout(() => setShowOnboarding(true), 1200);
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const finishOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('lexarena_onboarded', 'true');
  };

  const nextStep = () => {
    if (onboardStep < 3) setOnboardStep(s => s + 1);
    else finishOnboarding();
  };

  const restartOnboarding = () => {
    setOnboardStep(0);
    setShowOnboarding(true);
  };

  const tabs = [
    { id: 'dashboard', label: '⚖️ My Profile' },
    { id: 'quiz',      label: '🎯 Enter the Arena' },
    { id: 'scenarios', label: '📁 Case Files' },
    { id: 'modules',   label: '📜 Law Scrolls' }
  ];

  const onboardingData = [
    { target: 'dashboard', title: '🪪 Your Dossier', text: 'Track your legal literacy points and professional badges here.' },
    { target: 'quiz',      title: '🎯 The Arena',   text: 'Generate custom AI quizzes based on your favorite legal topics.' },
    { target: 'scenarios', title: '📁 Case Files',  text: 'Examine real-world legal scenarios or draft new ones with AI.' },
    { target: 'modules',   title: '📜 Law Scrolls', text: 'Search any legal concept to generate a custom Law Scroll.' }
  ];

  return (
    <>
      <style>{cssBlock}</style>
      
      {/* ─── ONBOARDING OVERLAY ─── */}
      {showOnboarding && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(13, 59, 46, 0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          animation: 'lexFadeIn 0.4s ease'
        }}>
          <div style={{
            background: 'white', padding: '32px', borderRadius: '24px',
            maxWidth: '340px', textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            borderTop: '6px solid #a8e63d', position: 'relative'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
              {onboardingData[onboardStep].target === 'dashboard' && '🛡️'}
              {onboardingData[onboardStep].target === 'quiz' && '⚔️'}
              {onboardingData[onboardStep].target === 'scenarios' && '⚖️'}
              {onboardingData[onboardStep].target === 'modules' && '📜'}
            </div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.4rem', fontWeight: 800, color: '#1a3a2a', marginBottom: '12px' }}>
              {onboardingData[onboardStep].title}
            </h3>
            <p style={{ fontFamily: "'Outfit', sans-serif", color: '#4b5563', lineHeight: 1.6, marginBottom: '24px' }}>
              {onboardingData[onboardStep].text}
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ width: i === onboardStep ? '20px' : '8px', height: '8px', background: i === onboardStep ? '#a8e63d' : '#e5e7eb', borderRadius: '4px', transition: 'all 0.3s' }} />
                ))}
              </div>
              <button 
                onClick={nextStep}
                style={{
                  background: '#1a3a2a', color: '#a8e63d', border: 'none',
                  padding: '10px 24px', borderRadius: '10px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Outfit', sans-serif"
                }}
              >
                {onboardStep === 3 ? 'Get Started →' : 'Next Tip'}
              </button>
            </div>
            
            <button 
              onClick={finishOnboarding}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#9ca3af', fontSize: '1.2rem', cursor: 'pointer' }}
            >✕</button>
          </div>
          
          <div style={{ marginTop: '20px', color: 'white', fontWeight: 600, fontSize: '0.9rem', opacity: 0.8 }}>
            Step {onboardStep + 1} of 4 • Welcome to LexArena
          </div>
        </div>
      )}

      {/* ─── HELP BUTTON (BOTTOM LEFT) ─── */}
      <button
        onClick={restartOnboarding}
        title="Help & Tutorial"
        style={{
          position: 'fixed', bottom: '24px', left: '24px', zIndex: 80,
          width: '44px', height: '44px', borderRadius: '50%',
          background: '#1a3a2a', color: '#a8e63d', border: '2px solid #a8e63d',
          fontSize: '1.4rem', fontWeight: 800, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transition: 'transform 0.2s',
          fontFamily: "'Syne', sans-serif"
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        ?
      </button>

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
