// ScenarioPage.jsx - Fetches and renders Case Files one by one
// Acts as the orchestrator for individual QuestionCard instances

import React, { useState, useEffect } from 'react';
import QuestionCard from './QuestionCard';

const API_BASE = "http://localhost:5000";
// MULTILINGUAL HOOK: wrap all display strings in t() from i18next
// to enable Hindi, Marathi, Tamil support later

const css = `
  @keyframes lexFadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @media (prefers-reduced-motion:reduce){ * { animation:none!important; } }
`;

export default function ScenarioPage({ onComplete }) {
  const [scenarios, setScenarios] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/scenarios`)
      .then(res => res.json())
      .then(data => setScenarios(data))
      .catch(e => console.error("Error fetching scenarios:", e));
  }, []);

  const handleAnswer = (isCorrect) => {
    setHasAnswered(true);
    fetch(`${API_BASE}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 'guest', scenarioId: scenarios[currentIdx].id, isCorrect })
    }).catch(e => console.error(e));
  };

  const nextScenario = () => {
    setHasAnswered(false);
    setCurrentIdx(prev => prev + 1);
  };

  if (scenarios.length === 0) return <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: "'Outfit',sans-serif" }}>Loading case files…</div>;

  if (currentIdx >= scenarios.length) {
    return (
      <>
        <style>{css}</style>
        <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: "'Outfit',sans-serif", animation: 'lexFadeIn 0.4s ease' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#1a3a2a' }}>
            All Case Files Complete!
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '28px' }}>You've reviewed every scenario in the dossier.</p>
          <button onClick={onComplete} style={{
            padding: '14px 36px', background: '#a8e63d', color: '#0D3B2E',
            border: 'none', borderRadius: '10px', fontWeight: 700,
            cursor: 'pointer', fontSize: '1rem',
            boxShadow: '0 4px 12px rgba(168,230,61,0.3)',
          }}>
            Go to Profile ⚖️
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div style={{ padding: '40px 20px', fontFamily: "'Outfit',sans-serif" }}>
        {/* Progress indicator */}
        <div style={{ maxWidth: '640px', margin: '0 auto 20px', textAlign: 'center', fontWeight: 600, color: '#1a3a2a' }}>
          📁 Case File {currentIdx + 1} of {scenarios.length}
        </div>

        <div key={scenarios[currentIdx].id} style={{ animation: 'lexFadeIn 0.3s ease' }}>
          <QuestionCard scenario={scenarios[currentIdx]} onAnswer={handleAnswer} />
        </div>

        {hasAnswered && (
          <div style={{ textAlign: 'center', marginTop: '28px' }}>
            <button onClick={nextScenario} style={{
              padding: '12px 32px', background: '#a8e63d', color: '#0D3B2E',
              border: 'none', borderRadius: '10px', fontWeight: 700,
              cursor: 'pointer', fontSize: '1rem',
              boxShadow: '0 4px 12px rgba(168,230,61,0.3)',
            }}>
              Next Case File →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
