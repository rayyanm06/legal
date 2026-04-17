import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Upload, CheckCircle2, AlertTriangle, XCircle,
  ArrowRight, Download, Search, Plus, ShieldAlert,
  Sparkles, Layout, ChevronRight, ClipboardList, Scale,
  Trash2, ShieldCheck, AlertCircle, Info
} from 'lucide-react';
import GavelLoading from '../components/GavelLoading';
import { API_ENDPOINTS } from '../api/config';

// ── Colour maps ──────────────────────────────────────────────────────────────
const riskColorMap = {
  Low:      { bg: 'bg-green-50',  text: 'text-green-700',  dot: '#22c55e' },
  Medium:   { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: '#f59e0b' },
  High:     { bg: 'bg-orange-50', text: 'text-orange-700', dot: '#f97316' },
  Critical: { bg: 'bg-red-50',    text: 'text-red-700',    dot: '#ef4444' },
};

const flagDef = {
  Danger:  { Icon: XCircle,        cls: 'text-red-500 bg-red-50',    badge: 'bg-red-500 text-white' },
  Warning: { Icon: AlertTriangle,  cls: 'text-amber-500 bg-amber-50', badge: 'bg-amber-400 text-white' },
  Info:    { Icon: Info,           cls: 'text-blue-500 bg-blue-50',   badge: 'bg-blue-100 text-blue-700' },
};

const clauseStatusCls = {
  Fair:    'bg-green-100 text-green-700',
  Vague:   'bg-amber-100 text-amber-700',
  Unfair:  'bg-red-100   text-red-700',
  Missing: 'bg-gray-100  text-gray-500',
};

// ── Read file as base64 (safe — no external libs) ───────────────────────────
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = e => resolve(e.target.result.split(',')[1]); // strip data URI prefix
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const [activeTab,        setActiveTab]        = useState('analyze');
  const [dragOver,         setDragOver]         = useState(false);
  const [file,             setFile]             = useState(null);
  const [docText,          setDocText]          = useState('');
  const [isAnalyzing,      setIsAnalyzing]      = useState(false);
  const [analysisResult,   setAnalysisResult]   = useState(null);
  const [error,            setError]            = useState('');
  const [generating,       setGenerating]       = useState(false);
  const [generatedResp,    setGeneratedResp]    = useState('');
  const [previewMode,      setPreviewMode]      = useState('text');
  const fileInputRef = useRef();

  // ── Process uploaded file ─────────────────────────────────────────────────
  const processFile = useCallback(async (selectedFile) => {
    if (!selectedFile) return;

    const allowedTypes = ['application/pdf', 'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(selectedFile.type) &&
        !selectedFile.name.match(/\.(pdf|txt|doc|docx)$/i)) {
      setError('Please upload a PDF, DOC, DOCX, or TXT file.');
      return;
    }

    setFile(selectedFile);
    setAnalysisResult(null);
    setError('');
    setGeneratedResp('');
    setDocText('');
    setIsAnalyzing(true);

    try {
      // Convert to base64 — works for ALL file types without any external lib
      const base64Content = await readFileAsBase64(selectedFile);

      // Send file to backend which handles PDF parsing + analysis in one shot
      const resp = await fetch(API_ENDPOINTS.ANALYZE, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileContent: base64Content,
          fileName:    selectedFile.name,
          fileType:    selectedFile.type,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${resp.status}`);
      }

      const data = await resp.json();

      // data.extractedText is returned by backend so we can show it in preview
      if (data.extractedText) setDocText(data.extractedText);

      // Ensure sensible defaults
      data.healthScore    = data.healthScore    ?? 50;
      data.riskLevel      = data.riskLevel      ?? 'Medium';
      data.riskFlags      = data.riskFlags      ?? [];
      data.keyClauses     = data.keyClauses     ?? [];
      data.missingClauses = data.missingClauses ?? [];
      data.recommendations= data.recommendations?? [];

      setAnalysisResult(data);
      setPreviewMode('analysis');
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  const handleFileInput = (e) => {
    if (e.target.files[0]) processFile(e.target.files[0]);
  };

  const reset = () => {
    setFile(null); setDocText(''); setAnalysisResult(null);
    setError(''); setGeneratedResp(''); setPreviewMode('text');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerateResponse = async () => {
    if (!docText && !analysisResult) return;
    setGenerating(true); setGeneratedResp('');
    try {
      const resp = await fetch(API_ENDPOINTS.RESPONSE, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: docText, analysisResult }),
      });
      const data = await resp.json();
      setGeneratedResp(data.text || 'Could not generate response.');
    } catch {
      setGeneratedResp('Failed to generate response. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const score     = analysisResult?.healthScore ?? 0;
  const riskLevel = analysisResult?.riskLevel   ?? 'Medium';
  const rc        = riskColorMap[riskLevel] || riskColorMap.Medium;
  const circumference = 2 * Math.PI * 56; // r=56

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="pt-28 pb-20 px-4 md:px-6 min-h-screen bg-offwhite">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 heading-display lowercase mb-4 tracking-tighter">
                smart <br/>
                <span className="text-forest italic underline decoration-lime decoration-8 underline-offset-4">
                  document studio.
                </span>
              </h1>
              <p className="text-xl text-gray-500 leading-relaxed">
                Upload any contract. Our AI finds every risk, every unfair clause, every missing protection — instantly.
              </p>
            </div>
            <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
              {['analyze','generate'].map(tab => (
                <button key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest flex items-center gap-3 transition-all
                    ${activeTab === tab ? 'bg-forest text-lime shadow-xl shadow-forest/20' : 'text-gray-400 hover:text-gray-700'}`}
                >
                  {tab === 'analyze' ? <Search size={18}/> : <Plus size={18}/>}
                  {tab === 'analyze' ? 'Analyze' : 'Generate'}
                </button>
              ))}
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'analyze' ? (

            /* ── Analyze Tab ────────────────────────────────────────────── */
            <motion.div key="analyze"
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-8"
            >
              {/* LEFT: Upload / Preview */}
              <div className="lg:col-span-3 flex flex-col gap-6">

                {!file ? (
                  /* ── Drop Zone ─────────────────────────────────────────── */
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`rounded-[2.5rem] border-4 border-dashed flex flex-col items-center justify-center p-16 text-center cursor-pointer transition-all
                      ${dragOver ? 'border-lime bg-lime/5 scale-[1.01]' : 'border-gray-200 bg-white hover:border-lime'}`}
                    style={{ minHeight: 380 }}
                  >
                    <input ref={fileInputRef} type="file"
                      accept=".pdf,.txt,.doc,.docx"
                      className="hidden" onChange={handleFileInput}
                    />
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-inner ring-1 transition-all
                      ${dragOver ? 'bg-lime/20 ring-lime text-lime' : 'bg-gray-50 ring-gray-100 text-gray-300'}`}>
                      <Upload size={40} className="transition-transform hover:scale-110"/>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Drop Your Document</h2>
                    <p className="text-gray-400 max-w-xs mb-8 leading-relaxed">
                      PDF, DOC, DOCX, or TXT — any contract, agreement, notice, or legal document
                    </p>
                    <button className="bg-forest text-offwhite font-black px-10 py-5 rounded-2xl flex items-center gap-4 shadow-2xl shadow-forest/10 hover:opacity-90 transition-all">
                      Select File <ArrowRight size={20} className="text-lime"/>
                    </button>
                    <div className="mt-8 flex gap-8">
                      <span className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                        <ShieldCheck size={14} className="text-green-500"/> Secure
                      </span>
                      <span className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                        <Search size={14} className="text-blue-500"/> AI-Powered
                      </span>
                    </div>
                  </div>
                ) : (
                  /* ── Document Preview Panel ────────────────────────────── */
                  <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden flex flex-col" style={{ minHeight: 480 }}>

                    {/* File header */}
                    <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="text-forest flex-shrink-0"/>
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm truncate max-w-[260px]">{file.name}</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {analysisResult && (
                          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                            {['text','analysis'].map(m => (
                              <button key={m}
                                onClick={() => setPreviewMode(m)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all
                                  ${previewMode === m ? 'bg-white shadow text-forest' : 'text-gray-400'}`}
                              >{m === 'text' ? 'Raw Text' : 'Analysis'}</button>
                            ))}
                          </div>
                        )}
                        <button onClick={reset}
                          className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:text-red-500 hover:border-red-200 transition-all"
                        ><Trash2 size={16}/></button>
                      </div>
                    </div>

                    {/* Content */}
                    {isAnalyzing ? (
                      <div className="flex-1 flex items-center justify-center p-12">
                        <GavelLoading size="large" text="Analyzing Document"
                          subtext="Scanning every clause with Indian legal expertise…"/>
                      </div>
                    ) : error ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <AlertCircle size={48} className="text-red-400 mb-4"/>
                        <h3 className="text-lg font-bold text-gray-700 mb-2">Analysis Failed</h3>
                        <p className="text-sm text-gray-500 mb-6 max-w-sm">{error}</p>
                        <button onClick={reset}
                          className="px-6 py-3 bg-forest text-lime rounded-xl font-bold text-sm">
                          Try Again
                        </button>
                      </div>
                    ) : previewMode === 'text' ? (
                      /* Raw text */
                      <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 520 }}>
                        <pre className="font-mono text-xs text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl p-4 border border-gray-100">
                          {docText || 'Text will appear here after analysis.'}
                        </pre>
                      </div>
                    ) : (
                      /* Analysis view */
                      <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: 520 }}>
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          <span className="px-3 py-1 bg-forest text-lime text-xs font-black rounded-full uppercase tracking-widest">
                            {analysisResult?.documentType}
                          </span>
                          {analysisResult?.partyA && (
                            <span className="text-xs text-gray-500">
                              {analysisResult.partyA} ↔ {analysisResult.partyB}
                            </span>
                          )}
                        </div>

                        {analysisResult?.keyClauses?.map((kc, i) => {
                          const c = typeof kc === 'string' ? { clause:'Clause', text:kc, status:'Info' } : kc;
                          return (
                            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-bold text-gray-800 truncate">{c.clause}</h4>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 ml-2
                                  ${clauseStatusCls[c.status] || 'bg-gray-100 text-gray-500'}`}>
                                  {c.status}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 leading-relaxed">{c.text}</p>
                            </div>
                          );
                        })}

                        {analysisResult?.missingClauses?.length > 0 && (
                          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                            <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                              <AlertCircle size={16}/> Missing Clauses
                            </h4>
                            <ul className="space-y-1">
                              {analysisResult.missingClauses.map((mc, i) => (
                                <li key={i} className="text-xs text-amber-700 flex items-start gap-2">
                                  <span className="mt-0.5">•</span>{mc}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* RIGHT: Results Panel */}
              <div className="lg:col-span-2 space-y-6">

                {/* Health Score */}
                <div className="bg-forest rounded-[2rem] p-8 text-white overflow-hidden relative">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6">
                    Document Intelligence
                  </h4>
                  {!analysisResult && !isAnalyzing ? (
                    <div className="text-center py-6">
                      <FileText size={40} className="text-white/20 mx-auto mb-4"/>
                      <p className="text-white/40 text-sm">Upload a document to see analysis</p>
                    </div>
                  ) : isAnalyzing ? (
                    <div className="flex justify-center py-4">
                      <GavelLoading size="small" text="Analyzing…"/>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col items-center mb-6">
                        <div className="relative w-36 h-36 flex items-center justify-center mb-4">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
                            <circle cx="64" cy="64" r="56" stroke="white" strokeOpacity="0.1" strokeWidth="8" fill="none"/>
                            <motion.circle
                              cx="64" cy="64" r="56"
                              stroke={rc.dot} strokeWidth="10" fill="none"
                              strokeLinecap="round"
                              strokeDasharray={circumference}
                              initial={{ strokeDashoffset: circumference }}
                              animate={{ strokeDashoffset: circumference - (circumference * score / 100) }}
                              transition={{ duration: 1.4, ease: 'easeOut' }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-white">{score}</span>
                            <span className="text-[10px] text-white/40 font-black uppercase">/100</span>
                          </div>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${rc.bg} ${rc.text}`}>
                          {riskLevel} Risk
                        </span>
                      </div>
                      <p className="text-white/60 text-sm text-center leading-relaxed italic">
                        {analysisResult?.summary}
                      </p>
                    </>
                  )}
                </div>

                {/* Risk Flags */}
                {analysisResult?.riskFlags?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                      Risk Flags ({analysisResult.riskFlags.length})
                    </h4>
                    {analysisResult.riskFlags.map((flag, i) => {
                      const def = flagDef[flag.type] || flagDef.Info;
                      const Icon = def.Icon;
                      return (
                        <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                          <div className="flex gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${def.cls}`}>
                              <Icon size={18}/>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h5 className="text-sm font-bold text-gray-900 truncate">{flag.title}</h5>
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase flex-shrink-0 ${def.badge}`}>
                                  {flag.type}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 leading-relaxed">{flag.desc}</p>
                              {flag.recommendation && (
                                <p className="text-xs text-forest font-semibold mt-1.5 flex items-start gap-1">
                                  <ChevronRight size={12} className="mt-0.5 flex-shrink-0"/>
                                  {flag.recommendation}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* No flags */}
                {analysisResult && analysisResult.riskFlags?.length === 0 && (
                  <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
                    <CheckCircle2 size={24} className="text-green-500 mx-auto mb-2"/>
                    <p className="text-sm text-green-700 font-semibold">No major risk flags</p>
                    <p className="text-xs text-green-600 mt-1">This document appears relatively fair.</p>
                  </div>
                )}

                {/* Recommendations */}
                {analysisResult?.recommendations?.length > 0 && (
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <h4 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                      <Sparkles size={16} className="text-lime"/> AI Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {analysisResult.recommendations.map((r, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-2 leading-relaxed">
                          <span className="w-5 h-5 rounded-full bg-lime/20 text-forest font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i+1}
                          </span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Generate Legal Response */}
                {analysisResult && (
                  <div className="space-y-4">
                    <button onClick={handleGenerateResponse} disabled={generating}
                      className="w-full bg-lime text-forest font-black py-5 rounded-2xl shadow-xl shadow-lime/10 hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-60">
                      {generating ? 'Drafting Response…' : 'Generate Legal Response'}
                      <Sparkles size={18}/>
                    </button>

                    {generating && (
                      <div className="flex justify-center py-4">
                        <GavelLoading size="small" text="Drafting your legal response…"/>
                      </div>
                    )}

                    {generatedResp && (
                      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <h4 className="text-sm font-black text-gray-900 mb-3">📄 Generated Legal Response</h4>
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed font-mono bg-gray-50 p-4 rounded-xl max-h-64 overflow-y-auto">
                          {generatedResp}
                        </pre>
                        <button
                          onClick={() => {
                            const blob = new Blob([generatedResp], { type:'text/plain' });
                            const url  = URL.createObjectURL(blob);
                            const a    = document.createElement('a');
                            a.href = url; a.download = 'legal_response.txt'; a.click();
                          }}
                          className="mt-3 w-full py-3 border border-gray-200 rounded-xl text-xs font-black text-gray-500 hover:text-forest hover:border-forest transition-all flex items-center justify-center gap-2">
                          <Download size={14}/> Download as TXT
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

          ) : (
            /* ── Generate Tab ───────────────────────────────────────────── */
            <motion.div key="generate"
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  { title:'Rental Agreement',    Icon:FileText,    desc:'Residential or commercial leases' },
                  { title:'Legal Notice',        Icon:AlertTriangle,desc:'Formal notice to individuals/orgs' },
                  { title:'ITR Reply',           Icon:ClipboardList,desc:'Respond to Income Tax notices' },
                  { title:'Copyright Notice',    Icon:Scale,       desc:'Protect your creative work' },
                  { title:'NDA',                 Icon:ShieldAlert,  desc:'Non-disclosure agreements' },
                  { title:'Employment Contract', Icon:Layout,      desc:'For new hires or freelancers' },
                ].map(({ title, Icon, desc }, idx) => (
                  <motion.div key={idx} whileHover={{ scale:1.03 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl group cursor-pointer hover:border-lime transition-all">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 mb-8 group-hover:bg-lime/20 group-hover:text-lime transition-all">
                      <Icon size={32}/>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 mb-8">{desc}</p>
                    <button className="w-full py-4 border border-gray-100 rounded-xl text-xs font-black uppercase tracking-widest text-gray-400 group-hover:border-forest group-hover:text-forest transition-all flex items-center justify-center gap-3">
                      Generate Draft <ArrowRight size={16}/>
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
