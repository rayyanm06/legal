// ScenarioPage.jsx - Fetches and renders Case Files one by one
// Acts as the orchestrator for individual QuestionCard instances

import React, { useState, useEffect } from 'react';
import QuestionCard from './QuestionCard';
<<<<<<< HEAD
import { askClaude, parseJSONResponse } from '../utils/aiService';
=======
import { scenarios as localScenarios } from '../data/scenarios';
>>>>>>> main

const API_BASE = "http://localhost:5000";

const css = `
  @keyframes lexFadeIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @media (prefers-reduced-motion:reduce){ * { animation:none!important; } }
`;

export default function ScenarioPage({ onComplete }) {
  const [scenarios, setScenarios] = useState(localScenarios);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/scenarios`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setScenarios(data);
        }
      })
      .catch(e => console.warn("Backend not reachable, using local scenarios:", e));
  }, []);

  const handleAnswer = (isCorrect) => {
    setHasAnswered(true);
    fetch(`${API_BASE}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: 'guest', scenarioId: scenarios[currentIdx].id, isCorrect })
    }).catch(e => console.warn("Could not save progress:", e));
  };

  const nextScenario = () => {
    setHasAnswered(false);
    setCurrentIdx(prev => prev + 1);
  };

<<<<<<< HEAD
  // ─── AI Scenario Generator ───
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState(null);

  const generateNewCase = async () => {
    setIsGenerating(true);
    setGenError(null);
    
    try {
      // DYNAMIC: This replaces static data with AI-generated content
      const response = await askClaude(`Generate ONE legal scenario quiz question for India.
Pick a random category from: Consumer Rights, Workplace Rights, 
Tenant Rights, Cyber Law, RTI, Women's Rights, Traffic Law, 
Police & Arrest, Banking & Fraud.

IMPORTANT: Respond with ONLY a JSON object. 
No text before it. No text after it. No markdown. No backticks.
Start your response with { and end with }

{
  "id": ${Date.now()},
  "category": "category name here",
  "situation": "2-3 sentence real scenario set in India",
  "question": "What should you do in this situation?",
  "options": ["A. first option", "B. second option", "C. third option", "D. fourth option"],
  "correctOption": "B",
  "explanation": "2-3 sentences explaining why this is correct",
  "difficulty": "beginner"
}`, 800);
      
      let raw = response.trim();
      
      // Strip any markdown if present
      raw = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
      
      // Strip any text before first {
      const jsonStart = raw.indexOf('{');
      const jsonEnd = raw.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON found");
      raw = raw.substring(jsonStart, jsonEnd + 1);
      
      const newScenario = JSON.parse(raw);
      
      // Validate required fields exist
      if (!newScenario.situation || !newScenario.options || !newScenario.correctOption) {
        throw new Error("Incomplete scenario generated");
      }
      
      // Replace current scenario with the AI generated one
      // We add it to the scenarios list and jump to it
      setScenarios(prev => [...prev, newScenario]);
      setCurrentIdx(scenarios.length); // The index of the newly added one
      setHasAnswered(false);
      
    } catch (err) {
      console.error("Generate case error:", err);
      setGenError("Couldn't generate a new case. Try again.");
      setTimeout(() => setGenError(null), 4000);
    } finally {
      setIsGenerating(false);
    }
  };

  if (scenarios.length === 0) return <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: "'Outfit',sans-serif" }}>Loading case files…</div>;
=======
  if (scenarios.length === 0) return <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>Loading case files…</div>;
>>>>>>> main

  if (currentIdx >= scenarios.length) {
    return (
      <>
        <style>{css}</style>
<<<<<<< HEAD
        <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: "'Outfit',sans-serif", animation: 'lexFadeIn 0.4s ease' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>⚖️</div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: '2rem', fontWeight: 800, color: '#1a3a2a', marginBottom: '8px' }}>
            Mission Accomplished!
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '32px', fontSize: '1.1rem' }}>
            You've ruled on all current dossiers. You can wait for new ones or draft them now.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button onClick={generateScenario} disabled={isGenerating} style={{
              padding: '14px 32px', background: '#1a3a2a', color: '#a8e63d',
              border: 'none', borderRadius: '12px', fontWeight: 700,
              cursor: isGenerating ? 'wait' : 'pointer', fontSize: '1rem',
              boxShadow: '0 4px 12px rgba(26,58,42,0.2)',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              {isGenerating ? 'Drafting...' : '✨ Draft More Cases (AI)'}
            </button>
            <button onClick={onComplete} style={{
              padding: '14px 32px', background: '#a8e63d', color: '#0D3B2E',
              border: 'none', borderRadius: '12px', fontWeight: 700,
              cursor: 'pointer', fontSize: '1rem',
              boxShadow: '0 4px 12px rgba(168,230,61,0.3)',
            }}>
              Back to Profile 👤
            </button>
          </div>
=======
        <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", animation: 'lexFadeIn 0.4s ease' }}>

          <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '2.4rem', fontWeight: 500, color: '#1a3a2a' }}>
            All Case Files Complete!
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '28px' }}>You've reviewed every scenario in the dossier.</p>
          <button onClick={onComplete} style={{
            padding: '14px 36px', background: '#a8e63d', color: '#0D3B2E',
            border: 'none', borderRadius: '10px', fontWeight: 700,
            cursor: 'pointer', fontSize: '1rem',
            boxShadow: '0 4px 12px rgba(168,230,61,0.3)',
            fontFamily: "'DM Sans', sans-serif"
          }}>
            Go to Profile
          </button>
>>>>>>> main
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div style={{ padding: '40px 20px', fontFamily: "'DM Sans', sans-serif" }}>
        {/* Progress indicator */}
<<<<<<< HEAD
        {/* Header with AI Generator Button */}
        <div style={{
          maxWidth: '640px', margin: '0 auto 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ fontWeight: 600, color: '#1a3a2a' }}>
            📁 Case File {currentIdx + 1} of {scenarios.length}
          </div>
          <button
            onClick={generateNewCase}
            disabled={isGenerating}
            style={{
              padding: '6px 14px', background: 'transparent', color: '#1a3a2a',
              border: '1.5px solid #1a3a2a', borderRadius: '8px',
              fontWeight: 600, fontSize: '0.85rem', cursor: isGenerating ? 'wait' : 'pointer',
              fontFamily: "'Outfit',sans-serif", transition: 'all 0.2s',
              opacity: isGenerating ? 0.6 : 1,
            }}
            onMouseOver={e => !isGenerating && (e.target.style.background = '#f0fdf4')}
            onMouseOut={e => !isGenerating && (e.target.style.background = 'transparent')}
          >
            {isGenerating ? "⏳ Drafting Case File..." : "✨ Generate New Case"}
          </button>
=======
        <div style={{ maxWidth: '640px', margin: '0 auto 20px', textAlign: 'center', fontWeight: 600, color: '#1a3a2a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Case File {currentIdx + 1} of {scenarios.length}
>>>>>>> main
        </div>

        {/* Generator Error Banner */}
        {genError && (
          <div style={{
            maxWidth: '640px', margin: '0 auto 16px', background: '#fef2f2',
            border: '1px solid #dc2626', borderRadius: '8px', padding: '10px 14px',
            color: '#991b1b', fontSize: '0.85rem', fontFamily: "'Outfit',sans-serif"
          }}>
            ⚠️ {genError}
          </div>
        )}

        {isGenerating ? (
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '60px 20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)', maxWidth: '640px',
            margin: '0 auto', textAlign: 'center',
          }}>
             <div style={{
                color: '#4a9e6b', fontStyle: 'italic', fontFamily: "'Outfit'",
                fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'
              }}>
                <span style={{ animation: 'lexAIPulse 1.2s ease-in-out infinite', fontSize: '1.5rem' }}>⚖️</span>
                AI is drafting your case file...
              </div>
          </div>
        ) : (
          <div key={scenarios[currentIdx]?.id} style={{ animation: 'lexFadeIn 0.3s ease' }}>
            <QuestionCard scenario={scenarios[currentIdx]} onAnswer={handleAnswer} />
          </div>
        )}

        {hasAnswered && (
          <div style={{ textAlign: 'center', marginTop: '28px' }}>
            <button onClick={nextScenario} style={{
              padding: '12px 32px', background: '#a8e63d', color: '#0D3B2E',
              border: 'none', borderRadius: '10px', fontWeight: 700,
              cursor: 'pointer', fontSize: '1rem',
              boxShadow: '0 4px 12px rgba(168,230,61,0.3)',
              fontFamily: "'DM Sans', sans-serif"
            }}>
              Next Case File
            </button>
          </div>
        )}
      </div>
    </>
  );
}
