// QuestionCard.jsx - Displays an individual legal scenario question
// Handles validation, green pulse on correct, styled explanation with slide-down

import React, { useState } from 'react';

const css = `
  @keyframes lexPulseGreen {
    0%   { box-shadow: 0 0 0 0 rgba(168,230,61,0.7); }
    100% { box-shadow: 0 0 0 14px transparent; }
  }
  @keyframes lexSlideDown {
    from { max-height:0; opacity:0; }
    to   { max-height:400px; opacity:1; }
  }
  @media (prefers-reduced-motion:reduce){ * { animation:none!important; } }

  .lex-opt-btn {
    display:block; width:100%; padding:16px 18px; margin-bottom:12px;
    border-radius:12px; border:1px solid #1a3a2a20;
    background:#fff; color:#1a3a2a; cursor:pointer;
    text-align:left; font-size:1rem; font-family:'Outfit',sans-serif;
    transition: all 0.2s ease;
  }
  .lex-opt-btn:not(:disabled):hover {
    background:#f0fdf4; border-color:#a8e63d; transform:translateX(4px);
  }
`;

const CAT_COLORS = {
  'Consumer Rights': '#a8e63d',
  'Workplace Rights': '#6366f1',
  'Tenant Rights': '#f59e0b',
  'Right to Information': '#10b981',
};

export default function QuestionCard({ scenario, onAnswer }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (option) => {
    if (selected) return;
    setSelected(option);
    const isCorrect = option.charAt(0) === scenario.correctOption.charAt(0);
    if (onAnswer) onAnswer(isCorrect);
  };

  const isCorrectAnswer = selected && selected.charAt(0) === scenario.correctOption.charAt(0);
  const topColor = CAT_COLORS[scenario.category] || '#a8e63d';

  const getBtnStyle = (opt) => {
    if (!selected) return {};
    const isThisCorrect = opt.charAt(0) === scenario.correctOption.charAt(0);
    const isThisSelected = opt === selected;
    if (isThisCorrect)                    return { background: '#dcfce7', borderColor: '#16a34a', color: '#15803d', fontWeight: 600 };
    if (isThisSelected && !isThisCorrect) return { background: '#fee2e2', borderColor: '#dc2626', color: '#991b1b', fontWeight: 600 };
    return { opacity: 0.45, cursor: 'not-allowed' };
  };

  const getIcon = (opt) => {
    if (!selected) return null;
    const isThisCorrect = opt.charAt(0) === scenario.correctOption.charAt(0);
    const isThisSelected = opt === selected;
    if (isThisCorrect) return '✅ ';
    if (isThisSelected && !isThisCorrect) return '❌ ';
    return null;
  };

  return (
    <>
      <style>{css}</style>
      <div style={{
        background: '#fff', borderRadius: '16px', padding: '28px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)', maxWidth: '640px',
        margin: '0 auto', fontFamily: "'Outfit',sans-serif",
        borderTop: `4px solid ${topColor}`,
        animation: isCorrectAnswer ? 'lexPulseGreen 0.4s ease' : 'none',
      }}>
        {/* Category pill */}
        <span style={{
          display: 'inline-block', background: '#1a3a2a', color: '#fff',
          padding: '4px 14px', borderRadius: '999px', fontSize: '0.75rem',
          fontWeight: 600, marginBottom: '14px', letterSpacing: '0.04em'
        }}>⚖️ {scenario.category}</span>

        <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#475569', margin: '0 0 18px' }}>
          {scenario.situation}
        </p>
        <div style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '24px', color: '#1a3a2a', fontFamily: "'Syne',sans-serif" }}>
          {scenario.question}
        </div>

        {/* Options */}
        <div>
          {scenario.options.map((opt, i) => (
            <button
              key={i}
              className="lex-opt-btn"
              style={getBtnStyle(opt)}
              onClick={() => handleSelect(opt)}
              disabled={!!selected}
            >
              {getIcon(opt)}{opt}
            </button>
          ))}
        </div>

        {/* Explanation */}
        {selected && (
          <div style={{
            marginTop: '20px', padding: '18px', background: '#fafff5',
            borderLeft: '4px solid #a8e63d', borderRadius: '8px',
            animation: 'lexSlideDown 0.4s ease', overflow: 'hidden',
            fontFamily: "'Outfit',sans-serif", color: '#475569', lineHeight: 1.7,
          }}>
            <strong style={{ color: isCorrectAnswer ? '#16a34a' : '#dc2626' }}>
              {isCorrectAnswer ? '✓ Correct! ' : '✗ Incorrect. '}
            </strong>
            <span style={{ color: '#6b7280' }}>💡 Why this answer: </span>
            {scenario.explanation}
          </div>
        )}
      </div>
    </>
  );
}
