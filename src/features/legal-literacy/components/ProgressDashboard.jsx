// ProgressDashboard.jsx - LexArena structured profile page
// Hero greeting → compact stat row → quick actions → quote → badges

import React, { useState, useEffect, useRef } from 'react';
import { useProgress } from '../hooks/useProgress';

const css = `
  @keyframes lexCardIn {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lexShine {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
`;

function useCountUp(target, dur = 700) {
  const [val, setVal] = useState(0);
  const ref = useRef();
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const steps = Math.ceil(dur / 16);
    let step = 0;
    clearInterval(ref.current);
    ref.current = setInterval(() => {
      step++;
      setVal(Math.round((step / steps) * target));
      if (step >= steps) clearInterval(ref.current);
    }, 16);
    return () => clearInterval(ref.current);
  }, [target, dur]);
  return val;
}

const LEVEL_COLORS = {
  'Beginner': { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  'Aware':    { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  'Advanced': { bg: '#fefce8', text: '#ca8a04', border: '#fde68a' },
};

const BADGE_META = {
  'First Step':  { desc: 'Complete your first case',  rank: 'I',   color: '#10b981', icon: '🏁' },
  'Sharp Mind':  { desc: '5 correct answers',         rank: 'II',  color: '#6366f1', icon: '🧠' },
  'Legal Eagle': { desc: 'Ace all scenarios',          rank: 'III', color: '#f59e0b', icon: '🦅' },
};
const ALL_BADGES = Object.keys(BADGE_META);

export default function ProgressDashboard({ onGoQuiz }) {
  const { points, level, badges, accuracy, completedScenarios, loading } = useProgress('guest');
  const animPts = useCountUp(points);
  const animAcc = useCountUp(accuracy);

  if (loading) return (
    <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: "'Outfit',sans-serif", color: '#6b7280' }}>
      Loading your profile…
    </div>
  );

  const lc = LEVEL_COLORS[level] || LEVEL_COLORS['Beginner'];

  return (
    <>
      <style>{css}</style>
      <div style={{ padding: '36px 20px 48px', fontFamily: "'Outfit', sans-serif", maxWidth: '920px', margin: '0 auto' }}>

        {/* ═══ HERO GREETING ═══ */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '16px', marginBottom: '32px',
          animation: 'lexCardIn 0.4s ease both',
        }}>
          <div>
            <h2 style={{
              fontFamily: "'Syne', sans-serif", fontSize: '1.75rem',
              fontWeight: 800, color: '#1a3a2a', margin: '0 0 6px'
            }}>Your Legal Battle Profile</h2>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.9rem' }}>
              Track your progress. Earn your honours. Know your rights.
            </p>
          </div>
          {/* Level badge pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: lc.bg, border: `1.5px solid ${lc.border}`,
            color: lc.text, padding: '8px 20px', borderRadius: '999px',
            fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.03em',
          }}>
            🏛️ Rank: {level}
          </div>
        </div>

        {/* ═══ STAT CARDS — compact 2×2 grid ═══ */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px', marginBottom: '28px', alignItems: 'start',
        }}>
          {/* Points */}
          <StatCard delay={0} borderColor="#a8e63d" icon="⚡" label="Total Points"
            value={animPts} />
          {/* Accuracy */}
          <StatCard delay={80} borderColor="#f59e0b" icon="🎯" label="Accuracy"
            value={animAcc + '%'} />
          {/* Completed */}
          <StatCard delay={160} borderColor="#10b981" icon="📋" label="Cases Closed"
            value={completedScenarios.length}
            empty={completedScenarios.length === 0 ? 'None yet' : null} />
          {/* Total Attempts */}
          <StatCard delay={240} borderColor="#6366f1" icon="📊" label="Scenarios Seen"
            value={completedScenarios.length}
            empty={completedScenarios.length === 0 ? '—' : null} />
        </div>

        {/* ═══ QUICK ACTIONS ═══ */}
        {completedScenarios.length === 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a42 100%)',
            borderRadius: '14px', padding: '24px 28px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '16px', marginBottom: '28px',
            animation: 'lexCardIn 0.4s ease 300ms both',
          }}>
            <div>
              <div style={{ color: '#a8e63d', fontWeight: 700, fontSize: '1rem', marginBottom: '4px', fontFamily: "'Syne',sans-serif" }}>
                Ready to begin?
              </div>
              <div style={{ color: 'rgba(245,240,232,0.7)', fontSize: '0.85rem' }}>
                Enter the Arena to test your legal knowledge and earn your first badge.
              </div>
            </div>
            <button onClick={onGoQuiz} style={{
              background: '#a8e63d', color: '#0D3B2E', padding: '10px 24px',
              borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem',
              cursor: 'pointer', whiteSpace: 'nowrap', border: 'none',
              fontFamily: "'Outfit', sans-serif",
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(168,230,61,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              🎯 Start Quiz →
            </button>
          </div>
        )}

        {/* ═══ LEGAL OATH ═══ */}
        <div style={{
          position: 'relative', background: '#fff', borderRadius: '12px',
          padding: '24px 28px 24px 44px', marginBottom: '28px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          borderLeft: '4px solid #a8e63d',
          animation: 'lexCardIn 0.4s ease 350ms both',
        }}>
          <span style={{
            position: 'absolute', top: '8px', left: '12px',
            fontSize: '2.5rem', color: '#a8e63d20', fontFamily: 'Georgia, serif',
            lineHeight: 1, pointerEvents: 'none',
          }}>"</span>
          <p style={{
            fontStyle: 'italic', color: '#6b7280', margin: '0 0 8px',
            lineHeight: 1.6, fontSize: '0.95rem',
          }}>
            Justice cannot be for one side alone, but must be for both.
          </p>
          <div style={{
            textAlign: 'right', fontWeight: 600, fontSize: '0.8rem',
            color: '#1a3a2a', fontStyle: 'normal',
          }}>— Eleanor Roosevelt</div>
        </div>

        {/* ═══ COURTROOM HONOURS ═══ */}
        <div style={{
          background: '#fff', borderRadius: '14px', padding: '28px 24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          animation: 'lexCardIn 0.4s ease 400ms both',
        }}>
          <div style={{
            fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em',
            color: '#6b7280', fontWeight: 600, marginBottom: '24px', textAlign: 'center',
          }}>Your Courtroom Honours</div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
          }}>
            {ALL_BADGES.map(b => {
              const has = badges.includes(b);
              const meta = BADGE_META[b];
              return (
                <div key={b} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '20px 12px', borderRadius: '12px',
                  background: has ? `${meta.color}08` : '#fafafa',
                  border: has ? `1.5px solid ${meta.color}30` : '1.5px solid #f0f0f0',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                }}>
                  {/* Lock overlay */}
                  {!has && (
                    <div style={{
                      position: 'absolute', top: '10px', right: '10px',
                      fontSize: '0.7rem', color: '#d1d5db',
                    }}>🔒</div>
                  )}

                  {/* Badge icon */}
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem',
                    background: has ? `${meta.color}18` : '#f3f4f6',
                    border: has ? `2px solid ${meta.color}40` : '2px solid #e5e7eb',
                    marginBottom: '12px',
                    opacity: has ? 1 : 0.4,
                    transition: 'all 0.3s ease',
                  }}>
                    {meta.icon}
                  </div>

                  <div style={{
                    fontWeight: 700, fontSize: '0.85rem',
                    color: has ? '#1a3a2a' : '#9ca3af',
                    fontFamily: "'Syne', sans-serif", marginBottom: '4px',
                    textAlign: 'center',
                  }}>{b}</div>
                  <div style={{
                    fontSize: '0.72rem', color: '#9ca3af',
                    textAlign: 'center', lineHeight: 1.3,
                  }}>{meta.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ PROGRESS BAR ═══ */}
        <div style={{
          marginTop: '28px', background: '#fff', borderRadius: '14px',
          padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          animation: 'lexCardIn 0.4s ease 450ms both',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '12px',
          }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1a3a2a' }}>
              Overall Progress
            </span>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {completedScenarios.length} / 4 scenarios
            </span>
          </div>
          <div style={{
            height: '8px', background: '#e5e7eb', borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: '4px',
              background: 'linear-gradient(90deg, #a8e63d, #4a9e6b)',
              width: `${(completedScenarios.length / 4) * 100}%`,
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>

      </div>
    </>
  );
}

/* ── Compact Stat Card component ── */
function StatCard({ delay, borderColor, icon, label, value, empty }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '12px', padding: '20px',
      borderLeft: `3px solid ${borderColor}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      animation: `lexCardIn 0.4s ease ${delay}ms both`,
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '8px',
      }}>
        <span style={{
          fontSize: '0.65rem', textTransform: 'uppercase',
          letterSpacing: '0.1em', color: '#9ca3af', fontWeight: 600,
        }}>{label}</span>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      </div>
      {empty ? (
        <div style={{ fontSize: '0.85rem', color: '#d1d5db', fontWeight: 500 }}>{empty}</div>
      ) : (
        <div style={{
          fontFamily: "'Syne', sans-serif", fontSize: '1.75rem',
          fontWeight: 800, color: '#1a3a2a', lineHeight: 1.1,
        }}>{value}</div>
      )}
    </div>
  );
}
