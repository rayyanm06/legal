// QuizEngine.jsx - Wraps scenarios into a quiz session with progress bar
// Final Verdict end screen with courtroom styling

import React, { useState, useEffect } from 'react';
import QuestionCard from './QuestionCard';
import { scenarios as localScenarios } from '../data/scenarios';

const API_BASE = "http://localhost:5000";

const css = `
  @keyframes lexFadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes lexGoldGlow {
    0%,100% { box-shadow: 0 0 20px rgba(234,179,8,0.3); }
    50%     { box-shadow: 0 0 40px rgba(234,179,8,0.6); }
  }
  @media (prefers-reduced-motion:reduce){ * { animation:none!important; } }
`;

export default function QuizEngine({ onGoDashboard }) {
  const [scenarios, setScenarios] = useState(localScenarios.slice(0, 5));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/scenarios`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setScenarios(data.slice(0, 5));
        }
      })
      .catch(e => {
        console.warn("Backend not reachable, using local scenarios:", e);
      });
  }, []);

  const handleAnswer = (isCorrect) => {
    setHasAnswered(true);
    if (isCorrect) setScore(s => s + 1);
    
    // Optional: Log progress to backend if available
    fetch(`${API_BASE}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 'guest', scenarioId: scenarios[currentIdx].id, isCorrect })
    }).catch(e => console.warn("Could not save progress to backend:", e));
  };

  const nextQuestion = () => {
    setHasAnswered(false);
    if (currentIdx + 1 >= scenarios.length) setIsDone(true);
    else setCurrentIdx(idx => idx + 1);
  };

  const resetQuiz = () => {
    setCurrentIdx(0); setScore(0); setIsDone(false); setHasAnswered(false);
  };

  if (scenarios.length === 0) return <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>Loading quiz...</div>;

  const progress = ((currentIdx + (hasAnswered ? 1 : 0)) / scenarios.length) * 100;
  const isPerfect = isDone && score === scenarios.length;

  /* ── FINAL VERDICT ── */
  if (isDone) {
    return (
      <>
        <style>{css}</style>
        <div style={{ padding: '60px 20px', fontFamily: "'DM Sans', sans-serif", animation: 'lexFadeIn 0.4s ease' }}>
          <div style={{
            background: '#fff', borderRadius: '24px', padding: '56px 40px',
            textAlign: 'center', maxWidth: '560px', margin: '0 auto',
            boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
            borderTop: '6px solid #a8e63d',
            ...(isPerfect ? { animation: 'lexGoldGlow 2s ease infinite' } : {})
          }}>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.8rem', fontWeight: 500, color: '#1a3a2a', marginBottom: '8px' }}>
              THE VERDICT IS IN
            </div>
            {isPerfect && (
              <div style={{
                display: 'inline-block', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                color: '#fff', padding: '8px 24px', borderRadius: '999px',
                fontWeight: 700, fontSize: '0.9rem', margin: '16px 0',
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>Perfect Judgement</div>
            )}
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '4rem', fontWeight: 500, color: '#1a3a2a', margin: '24px 0 12px' }}>
              {score} / {scenarios.length}
            </div>
            <p style={{ color: '#64748b', marginBottom: '8px', fontSize: '1.1rem' }}>You ruled on {score} of {scenarios.length} cases correctly</p>
            <p style={{ color: '#1a3a2a', fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>+{score * 10} points added to dossier</p>

            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <button onClick={resetQuiz} style={{ padding: '14px 32px', background: '#a8e63d', color: '#0D3B2E', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                Retry Quiz
              </button>
              <button onClick={onGoDashboard} style={{ padding: '14px 32px', background: '#1a3a2a', color: '#f5f0e8', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                Go to Profile
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  /* ── QUIZ IN PROGRESS ── */
  return (
    <>
      <style>{css}</style>
      <div style={{ padding: '40px 20px', fontFamily: "'DM Sans', sans-serif" }}>
        {/* Header + Progress bar */}
        <div style={{ maxWidth: '640px', margin: '0 auto 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '12px', color: '#1a3a2a', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Question {currentIdx + 1} of {scenarios.length}</span>
            <span>Score: {score}</span>
          </div>
          <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '4px',
              background: 'linear-gradient(90deg, #a8e63d, #4a9e6b)',
              width: `${progress}%`, transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        <QuestionCard key={currentIdx} scenario={scenarios[currentIdx]} onAnswer={handleAnswer} />

        {hasAnswered && (
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <button onClick={nextQuestion} style={{
              padding: '14px 40px', background: '#a8e63d', color: '#0D3B2E',
              border: 'none', borderRadius: '12px', fontWeight: 700,
              cursor: 'pointer', fontSize: '1rem',
              boxShadow: '0 8px 24px rgba(168,230,61,0.25)',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s ease'
            }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
              {currentIdx + 1 === scenarios.length ? 'See Verdict' : 'Next Question'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
