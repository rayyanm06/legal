// ModuleList.jsx - Renders Law Scrolls as sealed letters that unfold
// Each module is a sealed envelope that opens with an unfolding animation on click

import React, { useState } from 'react';
import { modules } from '../data/modules';

const css = `
  @keyframes lexFadeIn {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }

  .lex-letter {
    position: relative;
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .lex-letter:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(0,0,0,0.1) !important;
  }

  /* Sealed envelope flap */
  .lex-flap {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 60px;
    background: linear-gradient(135deg, #1a3a2a 0%, #2d5a42 100%);
    clip-path: polygon(0 0, 50% 100%, 100% 0);
    transition: transform 0.5s ease, opacity 0.3s ease;
    transform-origin: top center;
    z-index: 2;
  }
  .lex-letter-open .lex-flap {
    transform: rotateX(180deg);
    opacity: 0;
  }

  /* Wax seal */
  .lex-seal {
    position: absolute;
    top: 36px; left: 50%;
    transform: translateX(-50%);
    width: 40px; height: 40px;
    border-radius: 50%;
    background: radial-gradient(circle, #c8f570 30%, #7cb518 100%);
    border: 3px solid #5a9a1f;
    display: flex; align-items: center; justify-content: center;
    font-size: 1rem;
    z-index: 3;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: transform 0.5s ease, opacity 0.4s ease;
  }
  .lex-letter-open .lex-seal {
    transform: translateX(-50%) scale(0);
    opacity: 0;
  }

  /* Letter content slides up */
  .lex-letter-body {
    overflow: hidden;
    max-height: 0;
    opacity: 0;
    transition: max-height 0.5s ease, opacity 0.4s ease 0.1s, padding 0.4s ease;
    padding: 0 24px;
  }
  .lex-letter-open .lex-letter-body {
    max-height: 600px;
    opacity: 1;
    padding: 20px 24px 28px;
  }
`;

export default function ModuleList() {
  const [openIds, setOpenIds] = useState(new Set());

  const toggleOpen = (id) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <style>{css}</style>
      <div style={{ padding: '48px 20px', fontFamily: "'Outfit', sans-serif" }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{
            fontFamily: "'Syne', sans-serif", fontSize: '2rem',
            fontWeight: 800, color: '#1a3a2a', margin: '0 0 8px'
          }}>📜 Law Scrolls</h2>
          <p style={{ color: '#6b7280', fontSize: '1rem' }}>
            Sealed legal knowledge. Tap to break the seal.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px', maxWidth: '1000px', margin: '0 auto',
          alignItems: 'start'
        }}>
          {modules.map((mod, i) => {
            const isOpen = openIds.has(mod.id);
            return (
              <div
                key={mod.id}
                className={`lex-letter ${isOpen ? 'lex-letter-open' : ''}`}
                onClick={() => toggleOpen(mod.id)}
                style={{
                  background: '#fdfcf8',
                  borderRadius: '4px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                  border: '1px solid #e5e0d5',
                  overflow: 'hidden',
                  paddingTop: isOpen ? '16px' : '72px',
                  paddingBottom: isOpen ? '0' : '24px',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  minHeight: isOpen ? 'auto' : '200px',
                  transition: 'padding-top 0.4s ease, box-shadow 0.3s ease',
                  animation: `lexFadeIn 0.4s ease ${i * 100}ms both`,
                }}
              >
                {/* Envelope flap */}
                <div className="lex-flap" />

                {/* Wax seal */}
                <div className="lex-seal">⚖️</div>

                {/* Sealed preview (visible when closed) */}
                {!isOpen && (
                  <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: '12px'
                    }}>
                      <span style={{
                        background: '#1a3a2a', color: '#fff',
                        padding: '3px 12px', borderRadius: '999px',
                        fontSize: '0.7rem', fontWeight: 600
                      }}>{mod.category}</span>
                      <span style={{
                        background: '#f3f4f6', padding: '3px 10px',
                        borderRadius: '999px', fontSize: '0.7rem', color: '#6b7280'
                      }}>⏱ {mod.readTime}</span>
                    </div>
                    <div style={{
                      fontFamily: "'Syne', sans-serif", fontSize: '1.1rem',
                      fontWeight: 700, color: '#1a3a2a', marginBottom: '14px'
                    }}>{mod.title}</div>
                    <div style={{
                      color: '#a8e63d', fontSize: '0.85rem',
                      fontWeight: 600, letterSpacing: '0.03em'
                    }}>Break the Seal 📜</div>
                  </div>
                )}

                {/* Letter content (revealed when open) */}
                <div className="lex-letter-body">
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '14px'
                  }}>
                    <span style={{
                      background: '#1a3a2a', color: '#fff',
                      padding: '3px 12px', borderRadius: '999px',
                      fontSize: '0.7rem', fontWeight: 600
                    }}>{mod.category}</span>
                    <span style={{
                      background: '#f3f4f6', padding: '3px 10px',
                      borderRadius: '999px', fontSize: '0.7rem', color: '#6b7280'
                    }}>⏱ {mod.readTime}</span>
                  </div>

                  <div style={{
                    fontFamily: "'Syne', sans-serif", fontSize: '1.2rem',
                    fontWeight: 700, color: '#1a3a2a', marginBottom: '16px'
                  }}>{mod.title}</div>

                  <div style={{
                    borderTop: '1px dashed #d4cfc4', paddingTop: '16px',
                    fontSize: '0.95rem', color: '#475569', lineHeight: 1.75,
                    fontFamily: "'Outfit', sans-serif",
                  }}>
                    {mod.content}
                  </div>

                  <div style={{
                    textAlign: 'center', marginTop: '18px',
                    color: '#9ca3af', fontSize: '0.8rem', fontStyle: 'italic'
                  }}>— tap to seal —</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
