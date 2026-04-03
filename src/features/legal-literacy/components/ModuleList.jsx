// ModuleList.jsx - Renders Law Scrolls as sealed letters that unfold
// Each module is a sealed envelope that opens with an unfolding animation on click

import React, { useState } from 'react';
import { modules as staticModules } from '../data/modules';
import { askClaude, parseJSONResponse } from '../utils/aiService';

const css = `
  @keyframes lexFadeIn {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lexPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @keyframes lexAIPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
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

  /* Wax seal - using text instead of emoji */
  .lex-seal {
    position: absolute;
    top: 36px; left: 50%;
    transform: translateX(-50%);
    width: 44px; height: 44px;
    border-radius: 50%;
    background: radial-gradient(circle, #c8f570 30%, #7cb518 100%);
    border: 3px solid #5a9a1f;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.65rem;
    font-weight: 800;
    color: #1a3a2a;
    z-index: 3;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    transition: transform 0.5s ease, opacity 0.4s ease;
    text-transform: uppercase;
    letter-spacing: 0.05em;
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
    max-height: 800px;
    opacity: 1;
    padding: 20px 24px 28px;
  }

  .lex-skeleton {
    background: white; border-radius: 12px; 
    padding: 24px; margin-bottom: 24px;
    border-left: 4px solid #e5e7eb;
    animation: lexFadeIn 0.3s ease;
    width: 100%; grid-column: 1 / -1;
  }
  .lex-skeleton-bar {
    background: #f3f4f6; border-radius: 6px; 
    animation: lexPulse 1.5s ease-in-out infinite;
  }
`;

export default function ModuleList() {
  const [openIds, setOpenIds] = useState(new Set());
  
  // New AI Module Generation State
  const [aiModules, setAiModules] = useState([]);
  const [userTopic, setUserTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // AI Rights Explainer State (Bottom Explainer)
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiExLoading, setAiExLoading] = useState(false);
  const [aiExError, setAiExError] = useState('');

  const generateAIModule = async () => {
    if (!userTopic.trim()) return;
    setIsGenerating(true);
    
    try {
      // DYNAMIC: This replaces static data with AI-generated content
      const prompt = `You are a legal education content writer for India.
  
Create a short micro-learning module about: "${userTopic}"

Write for a general audience aged 18-35 with no legal background.
Use simple, conversational language. Set all examples in India.

Respond ONLY with a JSON object. No markdown. No backticks. Raw JSON:
{
  "id": ${Date.now()},
  "title": "clear title for this module",
  "category": "relevant category (Consumer Rights / Criminal Law / etc.)",
  "readTime": "X min",
  "content": "6-8 sentences covering: what this law/right is, when it applies, what you can do if violated, one real example from India. Plain English only.",
  "keyTakeaway": "one sentence summary of the most important thing to remember"
}`;

      const response = await askClaude(prompt, 1000);
      const newModule = parseJSONResponse(response);
      
      // Mark it as AI generated for UI badge
      newModule.isAI = true;
      
      setAiModules(prev => [newModule, ...prev]);
      setUserTopic('');
    } catch (err) {
      console.error('AI Module Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExplainAI = async () => {
    if (!aiQuery.trim()) return;
    setAiExLoading(true);
    setAiExError('');
    setAiResponse('');

    try {
      const prompt = `You are a legal literacy assistant focused on Indian law and constitutional rights.
A user wants to understand: "${aiQuery}"

Explain this in simple language a teenager can understand.
Structure your response as:
1. What this right/law is (2 sentences)
2. When it applies to you (2 sentences)  
3. What you can do if it's violated (2 sentences)
4. One real example from India (1-2 sentences)

Keep total response under 150 words. Use plain English, no legal jargon.`;
      
      const text = await askClaude(prompt, 600);
      setAiResponse(text);
    } catch (err) {
      console.error('AI Rights Explainer error:', err);
      setAiExError('Could not unpack this legal scroll right now. Please try again.');
    } finally {
      setAiExLoading(false);
    }
  };

  const toggleOpen = (id) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const combinedModules = [...aiModules, ...staticModules];

  return (
    <>
      <style>{css}</style>
<<<<<<< HEAD
      <div style={{ padding: '48px 20px', fontFamily: "'Outfit', sans-serif" }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
=======
      <div style={{ padding: '32px 20px', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
>>>>>>> main
          <h2 style={{
            fontFamily: "'Instrument Serif', serif", fontSize: '2.8rem',
            fontWeight: 500, color: '#1a3a2a', margin: '0 0 8px'
          }}>Law Scrolls</h2>
          <p style={{ color: '#6b7280', fontSize: '1rem' }}>
            Sealed legal knowledge. Tap to break the seal.
          </p>
        </div>

        {/* ═══ NEW: AI Module Generator Bar ═══ */}
        <div style={{
          maxWidth: '1000px', margin: '0 auto 40px',
          display: 'flex', gap: '12px', flexWrap: 'wrap'
        }}>
          <input
            type="text"
            value={userTopic}
            onChange={e => setUserTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generateAIModule()}
            placeholder="What legal topic do you want to learn about? e.g. 'How to file a police complaint' or 'My rights at work'"
            style={{
              flex: 1, padding: '14px 20px', borderRadius: '8px',
              border: '1px solid #d1d5db', fontFamily: "'Outfit', sans-serif",
              fontSize: '1rem', outline: 'none'
            }}
            disabled={isGenerating}
          />
          <button
            onClick={generateAIModule}
            disabled={isGenerating || !userTopic.trim()}
            style={{
              background: '#1a3a2a', color: 'white', border: 'none',
              borderRadius: '8px', padding: '10px 24px', fontWeight: 600,
              fontFamily: "'Outfit', sans-serif", cursor: isGenerating ? 'wait' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {isGenerating ? "📜 Writing module..." : "📜 Generate Module"}
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px', maxWidth: '1000px', margin: '0 auto',
          alignItems: 'start'
        }}>
          {/* Skeleton Loader */}
          {isGenerating && (
            <div className="lex-skeleton">
              <div className="lex-skeleton-bar" style={{ height: '12px', width: '60%', marginBottom: '12px' }} />
              <div className="lex-skeleton-bar" style={{ height: '8px', width: '90%', marginBottom: '8px' }} />
              <div className="lex-skeleton-bar" style={{ height: '8px', width: '75%' }} />
            </div>
          )}

          {combinedModules.map((mod, i) => {
            const isOpen = openIds.has(mod.id);
            return (
              <div
                key={mod.id}
                className={`lex-letter ${isOpen ? 'lex-letter-open' : ''}`}
                onClick={() => toggleOpen(mod.id)}
                style={{
                  background: '#fdfcf8',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  border: '1px solid #e5e0d5',
                  overflow: 'hidden',
                  paddingTop: isOpen ? '16px' : '72px',
                  paddingBottom: isOpen ? '0' : '24px',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  minHeight: isOpen ? 'auto' : '220px',
                  transition: 'padding-top 0.4s ease, box-shadow 0.3s ease',
                  animation: `lexFadeIn 0.3s ease ${mod.isAI ? 0 : (i * 100)}ms both`,
                  ...(mod.isAI ? { transform: 'translateY(-10px)' } : {})
                }}
              >
                {/* AI Badge */}
                {mod.isAI && !isOpen && (
                  <div style={{
                    position: 'absolute', top: '12px', right: '12px', zIndex: 5,
                    background: '#a8e63d', color: '#1a3a2a', fontSize: '0.7rem',
                    padding: '2px 8px', borderRadius: '999px', fontWeight: 700
                  }}>✨ AI Generated</div>
                )}

                {/* Envelope flap */}
                <div className="lex-flap" />

                {/* Wax seal - using text */}
                <div className="lex-seal">NYAI</div>

                {/* Sealed preview (visible when closed) */}
                {!isOpen && (
                  <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: '16px'
                    }}>
                      <span style={{
                        background: '#1a3a2a', color: '#fff',
                        padding: '4px 12px', borderRadius: '4px',
                        fontSize: '0.7rem', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.05em'
                      }}>{mod.category}</span>
                      <span style={{
                        background: '#f3f4f6', padding: '4px 10px',
                        borderRadius: '4px', fontSize: '0.7rem', color: '#6b7280',
                        fontWeight: 600
                      }}>TIME: {mod.readTime}</span>
                    </div>
                    <div style={{
                      fontFamily: "'Instrument Serif', serif", fontSize: '1.6rem',
                      fontWeight: 500, color: '#1a3a2a', marginBottom: '14px'
                    }}>{mod.title}</div>
                    <div style={{
                      color: '#a8e63d', fontSize: '0.8rem',
                      fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase'
                    }}>Break the Seal</div>
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
                      padding: '4px 12px', borderRadius: '4px',
                      fontSize: '0.7rem', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}>{mod.category}</span>
                    <span style={{
                      background: '#f3f4f6', padding: '4px 10px',
                      borderRadius: '4px', fontSize: '0.7rem', color: '#6b7280',
                      fontWeight: 600
                    }}>TIME: {mod.readTime}</span>
                  </div>

                  <div style={{
<<<<<<< HEAD
                    fontFamily: "'Syne', sans-serif", fontSize: '1.2rem',
                    fontWeight: 700, color: '#1a3a2a', marginBottom: '16px'
                  }}>
                    {mod.title}
                    {mod.isAI && <span style={{ marginLeft: '10px', verticalAlign: 'middle', background: '#a8e63d', color: '#1a3a2a', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>AI DRAFTED</span>}
                  </div>
=======
                    fontFamily: "'Instrument Serif', serif", fontSize: '1.85rem',
                    fontWeight: 500, color: '#1a3a2a', marginBottom: '16px'
                  }}>{mod.title}</div>
>>>>>>> main

                  <div style={{
                    borderTop: '1px dashed #d4cfc4', paddingTop: '16px',
                    fontSize: '0.95rem', color: '#475569', lineHeight: 1.8,
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {mod.content}
                  </div>

                  {mod.keyTakeaway && (
                    <div style={{
                      background: '#f0fdf4', borderLeft: '3px solid #a8e63d',
                      padding: '8px 12px', marginTop: '16px', fontSize: '0.85rem',
                      color: '#1a3a2a'
                    }}>
                      💡 Key Takeaway: {mod.keyTakeaway}
                    </div>
                  )}

                  <div style={{
                    textAlign: 'center', marginTop: '24px',
                    color: '#9ca3af', fontSize: '0.75rem', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>— tap to seal —</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ═══ BOTTOM: AI Rights Explainer ═══ */}
        <div style={{
          maxWidth: '1000px', margin: '60px auto 0', padding: '36px',
          background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          borderTop: '4px solid #a8e63d'
        }}>
          <h3 style={{
            fontFamily: "'Syne', sans-serif", fontSize: '1.4rem',
            fontWeight: 800, color: '#1a3a2a', margin: '0 0 4px'
          }}>⚡ Quick Right Checker</h3>
          <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '20px' }}>
            Get a 10-second summary of any legal right.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <input
              type="text"
              value={aiQuery}
              onChange={e => setAiQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleExplainAI()}
              placeholder="e.g. My rights if my boss fires me"
              style={{
                flex: '1 1 300px', padding: '14px 20px', borderRadius: '10px',
                border: '1px solid #d1d5db', fontFamily: "'Outfit', sans-serif",
                fontSize: '1rem', outline: 'none'
              }}
              disabled={aiExLoading}
            />
            <button
              onClick={handleExplainAI}
              disabled={aiExLoading || !aiQuery.trim()}
              style={{
                padding: '14px 28px', background: aiExLoading ? '#86efac' : '#a8e63d',
                color: '#0D3B2E', border: 'none', borderRadius: '10px',
                fontWeight: 700, fontSize: '1rem', cursor: aiExLoading ? 'wait' : 'pointer',
                fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap'
              }}
            >
              Explain ⚖️
            </button>
          </div>

          {aiExLoading && (
            <div style={{ color: '#4a9e6b', fontStyle: 'italic', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ animation: 'lexAIPulse 1.2s ease-in-out infinite' }}>📜</span>
              Consulting the scrolls...
            </div>
          )}

          {aiExError && (
            <div style={{ background: '#fef2f2', borderLeft: '4px solid #dc2626', borderRadius: '8px', padding: '12px', color: '#991b1b', fontSize: '0.9rem', marginTop: '12px' }}>
              ⚠️ {aiExError}
            </div>
          )}

          {aiResponse && (
            <div style={{
              background: '#f0fdf4', borderLeft: '4px solid #a8e63d',
              borderRadius: '8px', padding: '24px', marginTop: '16px',
              fontSize: '1rem', lineHeight: '1.6', color: '#1a3a2a',
              animation: 'lexFadeIn 0.3s ease', whiteSpace: 'pre-wrap'
            }}>
              {aiResponse}
              <div style={{ marginTop: '16px', fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic' }}>
                🤖 AI-Generated Insight
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
