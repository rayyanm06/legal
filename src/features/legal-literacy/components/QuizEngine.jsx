// QuizEngine.jsx - Wraps scenarios into a quiz session with progress bar
// Final Verdict end screen with courtroom styling

import React, { useState, useEffect } from 'react';
import QuestionCard from './QuestionCard';

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
  const [scenarios, setScenarios] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/scenarios`)
      .then(res => res.json())
      .then(data => setScenarios(data.slice(0, 5)))
      .catch(e => console.error(e));
  }, []);

  const handleAnswer = (isCorrect) => {
    setHasAnswered(true);
    if (isCorrect) setScore(s => s + 1);
    fetch(`${API_BASE}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 'guest', scenarioId: scenarios[currentIdx].id, isCorrect })
    }).catch(e => console.error(e));
  };

  const nextQuestion = () => {
    setHasAnswered(false);
    if (currentIdx + 1 >= scenarios.length) setIsDone(true);
    else setCurrentIdx(idx => idx + 1);
  };

  const resetQuiz = () => {
    setCurrentIdx(0); setScore(0); setIsDone(false); setHasAnswered(false);
  };

  if (scenarios.length === 0) return <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: "'Outfit',sans-serif" }}>Loading quiz…</div>;

  const progress = ((currentIdx + (hasAnswered ? 1 : 0)) / scenarios.length) * 100;
  const isPerfect = isDone && score === scenarios.length;

  /* ── FINAL VERDICT ── */
  if (isDone) {
    return (
      <>
        <style>{css}</style>
        <div style={{ padding: '60px 20px', fontFamily: "'Outfit',sans-serif", animation: 'lexFadeIn 0.4s ease' }}>
          <div style={{
            background: '#fff', borderRadius: '20px', padding: '48px 36px',
            textAlign: 'center', maxWidth: '520px', margin: '0 auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            borderTop: '4px solid #a8e63d',
            ...(isPerfect ? { animation: 'lexGoldGlow 2s ease infinite' } : {})
          }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#1a3a2a', marginBottom: '8px' }}>
              ⚖️ THE VERDICT IS IN
            </div>
            {isPerfect && (
              <div style={{
                display: 'inline-block', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                color: '#fff', padding: '6px 20px', borderRadius: '999px',
                fontWeight: 700, fontSize: '0.85rem', margin: '12px 0',
              }}>🏆 Perfect Judgement!</div>
            )}
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '3.2rem', fontWeight: 800, color: '#1a3a2a', margin: '20px 0 8px' }}>
              {score} / {scenarios.length}
            </div>
            <p style={{ color: '#6b7280', marginBottom: '6px' }}>You ruled on {score} of {scenarios.length} cases correctly</p>
            <p style={{ color: '#1a3a2a', fontWeight: 600 }}>+{score * 10} points added to your dossier</p>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={resetQuiz} style={{ padding: '12px 28px', background: '#a8e63d', color: '#0D3B2E', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
                Retry Quiz
              </button>
              <button onClick={onGoDashboard} style={{ padding: '12px 28px', background: '#1a3a2a', color: '#f5f0e8', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
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
      <div style={{ padding: '40px 20px', fontFamily: "'Outfit',sans-serif" }}>
        {/* Header + Progress bar */}
        <div style={{ maxWidth: '640px', margin: '0 auto 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '10px', color: '#1a3a2a' }}>
            <span>Question {currentIdx + 1} of {scenarios.length}</span>
            <span>Score: {score}</span>
          </div>
          <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '3px',
              background: 'linear-gradient(90deg, #a8e63d, #4a9e6b)',
              width: `${progress}%`, transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        <QuestionCard key={currentIdx} scenario={scenarios[currentIdx]} onAnswer={handleAnswer} />

        {hasAnswered && (
          <div style={{ textAlign: 'center', marginTop: '28px' }}>
            <button onClick={nextQuestion} style={{
              padding: '12px 32px', background: '#a8e63d', color: '#0D3B2E',
              border: 'none', borderRadius: '10px', fontWeight: 700,
              cursor: 'pointer', fontSize: '1rem',
              boxShadow: '0 4px 12px rgba(168,230,61,0.3)',
            }}>
              {currentIdx + 1 === scenarios.length ? 'See Verdict ⚖️' : 'Next Question →'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
