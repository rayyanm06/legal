import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Upload, CheckCircle2, AlertTriangle, XCircle,
  ArrowRight, Download, Search, Info, Plus,
  FileCheck, ShieldAlert, Sparkles, Layout, ChevronRight,
  ClipboardList, Scale, Trash2, ShieldCheck, AlertCircle,
  TrendingDown, TrendingUp, Minus
} from 'lucide-react';
import GavelLoading from '../components/GavelLoading';
import { API_ENDPOINTS } from '../api/config';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import axios from 'axios';
// tesseract.js is now imported dynamically in the OCR block

// ── Helpers ──────────────────────────────────────────────────────────────────

async function extractTextFromFile(file) {
  const name = file.name.toLowerCase();

  // PDF extraction via pdfjs-dist
  if (name.endsWith('.pdf')) {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      // Try digital text extraction first
      for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map(it => it.str).join(' ') + '\n';
      }

      // OCR Fallback for scanned documents
      if (fullText.trim().length < 50) {
        console.log('📄 Low text detected, attempting OCR...');
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng');
        for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) { // Limit OCR to 3 pages for speed
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport }).promise;
          
          const { data: { text } } = await worker.recognize(canvas);
          fullText += text + '\n';
        }
        await worker.terminate();
      }

      return fullText.trim();
    } catch (err) {
      console.warn('PDF.js failed, falling back to text read:', err);
    }
  }

  // Plain text / DOCX fallback (read as text)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

const riskColor = {
  Low:      { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  dot: '#22c55e' },
  Medium:   { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: '#f59e0b' },
  High:     { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: '#f97316' },
  Critical: { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: '#ef4444' },
};

const flagIcon = { Danger: XCircle, Warning: AlertTriangle, Info: Info };
const flagColor = { Danger: 'text-red-500 bg-red-50', Warning: 'text-amber-500 bg-amber-50', Info: 'text-blue-500 bg-blue-50' };

const clauseStatusColor = {
  Fair:    'bg-green-100 text-green-700',
  Vague:   'bg-amber-100 text-amber-700',
  Unfair:  'bg-red-100 text-red-700',
  Missing: 'bg-gray-100 text-gray-500',
};

// ── Main Component ────────────────────────────────────────────────────────────

const DocumentsPage = () => {
  const [activeTab, setActiveTab] = useState('analyze');
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [docText, setDocText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [previewMode, setPreviewMode] = useState('text'); // 'text' | 'analysis'
  const fileInputRef = useRef();

  const processFile = useCallback(async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setAnalysisResult(null);
    setError('');
    setGeneratedResponse('');
    setIsAnalyzing(true);

    try {
      const text = await extractTextFromFile(selectedFile);
      if (!text || text.trim().length < 30) {
        throw new Error('Could not extract enough text from this file. Please try a different format.');
      }
      setDocText(text);

      // Call backend analyze endpoint
      const resp = await fetch(API_ENDPOINTS.ANALYZE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: text }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${resp.status}`);
      }

      const data = await resp.json();
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
    const dropped = e.dataTransfer.files[0];
    if (dropped) processFile(dropped);
  }, [processFile]);

  const handleFileInput = (e) => {
    const selected = e.target.files[0];
    if (selected) processFile(selected);
  };

  const handleGenerateResponse = async () => {
    if (!docText || !analysisResult) return;
    setGenerating(true);
    setGeneratedResponse('');
    try {
      const resp = await fetch(API_ENDPOINTS.RESPONSE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: docText, analysisResult }),
      });
      const data = await resp.json();
      setGeneratedResponse(data.text || '');
    } catch (err) {
      setGeneratedResponse('Failed to generate response. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const reset = () => {
    setFile(null);
    setDocText('');
    setAnalysisResult(null);
    setError('');
    setGeneratedResponse('');
    setPreviewMode('text');
  };

  const score = analysisResult?.healthScore ?? 0;
  const riskLevel = analysisResult?.riskLevel ?? 'Medium';
  const rc = riskColor[riskLevel] || riskColor.Medium;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="pt-28 pb-20 px-4 md:px-6 min-h-screen bg-offwhite">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <header className="mb-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 heading-display lowercase mb-4 tracking-tighter">
                smart <br />
                <span className="text-forest italic underline decoration-lime decoration-8 underline-offset-4">document studio.</span>
              </h1>
              <p className="text-xl text-gray-500 leading-relaxed">
                Upload any contract. Our AI finds every risk, every unfair clause, every missing protection.
              </p>
            </div>
            <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
              <button
                onClick={() => setActiveTab('analyze')}
                className={`px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === 'analyze' ? 'bg-forest text-lime shadow-xl shadow-forest/20' : 'text-gray-400 hover:text-gray-700'}`}
              >
                <Search size={18} /> Analyze
              </button>
              <button
                onClick={() => setActiveTab('generate')}
                className={`px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === 'generate' ? 'bg-forest text-lime shadow-xl shadow-forest/20' : 'text-gray-400 hover:text-gray-700'}`}
              >
                <Plus size={18} /> Generate
              </button>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'analyze' ? (
            <motion.div
              key="analyze"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-8"
            >
              {/* LEFT: Upload + Preview */}
              <div className="lg:col-span-3 flex flex-col gap-6">

                {/* Upload Zone */}
                {!file ? (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`rounded-[2.5rem] border-4 border-dashed flex flex-col items-center justify-center p-16 text-center cursor-pointer transition-all ${
                      dragOver ? 'border-lime bg-lime/5' : 'border-gray-200 bg-white hover:border-lime'
                    }`}
                    style={{ minHeight: 380 }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt,.docx,.doc"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8 shadow-inner ring-1 ring-gray-100 group-hover:bg-lime/10">
                      <Upload size={40} className="text-gray-300" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Drop Your Document</h2>
                    <p className="text-gray-400 max-w-xs mb-8 leading-relaxed">
                      PDF, DOC, DOCX, or TXT — any contract, agreement, notice, or legal document.
                    </p>
                    <button className="bg-forest text-offwhite font-black px-10 py-5 rounded-2xl flex items-center gap-4 shadow-2xl shadow-forest/10 hover:bg-opacity-90 transition-all">
                      Select File <ArrowRight size={20} className="text-lime" />
                    </button>
                    <div className="mt-8 flex gap-8">
                      <span className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                        <ShieldCheck size={14} className="text-green-500" /> Secure Analysis
                      </span>
                      <span className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                        <Search size={14} className="text-blue-500" /> AI-Powered
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Document Preview Panel */
                  <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden flex flex-col" style={{ minHeight: 480 }}>
                    {/* File Header */}
                    <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="text-forest" />
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm">{file.name}</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {analysisResult && (
                          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                            <button
                              onClick={() => setPreviewMode('text')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${previewMode === 'text' ? 'bg-white shadow text-forest' : 'text-gray-400'}`}
                            >
                              Raw Text
                            </button>
                            <button
                              onClick={() => setPreviewMode('analysis')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${previewMode === 'analysis' ? 'bg-white shadow text-forest' : 'text-gray-400'}`}
                            >
                              Analysis View
                            </button>
                          </div>
                        )}
                        <button
                          onClick={reset}
                          className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:text-red-500 hover:border-red-200 transition-all"
                          title="Remove document"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Content Area */}
                    {isAnalyzing ? (
                      <div className="flex-1 flex items-center justify-center p-12">
                        <GavelLoading
                          size="large"
                          text="Analyzing Document"
                          subtext="Scanning all clauses with Indian legal expertise..."
                        />
                      </div>
                    ) : error ? (
                      <div className="flex-1 flex items-center justify-center p-12">
                        <div className="text-center">
                          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
                          <h3 className="text-lg font-bold text-gray-700 mb-2">Analysis Failed</h3>
                          <p className="text-sm text-gray-500 mb-6 max-w-sm">{error}</p>
                          <button
                            onClick={reset}
                            className="px-6 py-3 bg-forest text-lime rounded-xl font-bold text-sm"
                          >
                            Try Again
                          </button>
                        </div>
                      </div>
                    ) : previewMode === 'text' ? (
                      /* Raw text preview */
                      <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 500 }}>
                        <div className="font-mono text-xs text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl p-4 border border-gray-100">
                          {docText || 'No text extracted.'}
                        </div>
                      </div>
                    ) : (
                      /* Analysis view — annotated clauses */
                      <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: 500 }}>
                        {/* Doc type badge */}
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-forest text-lime text-xs font-black rounded-full uppercase tracking-widest">
                            {analysisResult?.documentType}
                          </span>
                          {analysisResult?.partyA && (
                            <span className="text-xs text-gray-500">
                              {analysisResult.partyA} ↔ {analysisResult.partyB}
                            </span>
                          )}
                        </div>

                        {/* Key Clauses with status */}
                        {(analysisResult?.keyClauses || []).map((kc, i) => {
                          const clause = typeof kc === 'string' ? { clause: 'Clause', text: kc, status: 'Info' } : kc;
                          const color = clauseStatusColor[clause?.status] || 'bg-gray-100 text-gray-500';
                          return (
                            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-bold text-gray-800">{clause?.clause || 'Clause'}</h4>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${color}`}>
                                  {clause?.status || 'Info'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 leading-relaxed">{clause?.text}</p>
                            </div>
                          );
                        })}

                        {/* Missing Clauses */}
                        {analysisResult?.missingClauses?.length > 0 && (
                          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                            <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                              <AlertCircle size={16} /> Missing Clauses
                            </h4>
                            <ul className="space-y-1">
                              {(analysisResult.missingClauses || []).map((mc, i) => (
                                <li key={i} className="text-xs text-amber-700 flex items-start gap-2">
                                  <span className="mt-0.5">•</span> {mc}
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

              {/* RIGHT: Analysis Results Panel */}
              <div className="lg:col-span-2 space-y-6">

                {/* Health Score Card */}
                <div className="bg-forest rounded-[2rem] p-8 text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url(/noise.png)' }} />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6">
                    Document Intelligence
                  </h4>

                  {!analysisResult && !isAnalyzing ? (
                    <div className="text-center py-4">
                      <FileCheck size={40} className="text-white/20 mx-auto mb-4" />
                      <p className="text-white/40 text-sm">Upload a document to see AI analysis</p>
                    </div>
                  ) : isAnalyzing ? (
                    <div className="flex justify-center py-4">
                      <GavelLoading size="small" text="Analyzing..." />
                    </div>
                  ) : (
                    <>
                      {/* Score Ring */}
                      <div className="flex flex-col items-center mb-6">
                        <div className="relative w-36 h-36 flex items-center justify-center mb-4">
                          <svg className="w-full h-full -rotate-90">
                            <circle cx="72" cy="72" r="64" stroke="white" strokeOpacity="0.1" strokeWidth="8" fill="none" />
                            <motion.circle
                              cx="72" cy="72" r="64"
                              stroke={rc.dot}
                              strokeWidth="10"
                              fill="none"
                              strokeDasharray="402"
                              initial={{ strokeDashoffset: 402 }}
                              animate={{ strokeDashoffset: 402 - (402 * score / 100) }}
                              transition={{ duration: 1.4, ease: 'easeOut' }}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-white">{score}</span>
                            <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">/100</span>
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
                    {(analysisResult?.riskFlags || []).length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                          Risk Flags Detected ({(analysisResult?.riskFlags || []).length})
                        </h4>
                        {(analysisResult?.riskFlags || []).map((flag, i) => {
                          const Icon = flagIcon[flag?.type] || Info || AlertCircle;
                          const color = (flagColor && flagColor[flag?.type]) || (flagColor && flagColor.Info) || 'text-blue-500 bg-blue-50';
                          return (
                            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer">
                              <div className="flex gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                                  <Icon size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="text-sm font-bold text-gray-900 truncate">
                                      {flag?.title || "Legal Risk"}
                                    </h5>
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase flex-shrink-0 ${
                                      flag?.type === 'Danger' ? 'bg-red-500 text-white' :
                                      flag?.type === 'Warning' ? 'bg-amber-400 text-white' :
                                      'bg-blue-100 text-blue-700'
                                    }`}>{flag?.type || 'Info'}</span>
                                  </div>
                                  <p className="text-xs text-gray-500 leading-relaxed">{flag?.desc || 'Potential concern identified.'}</p>
                              {flag.recommendation && (
                                <p className="text-xs text-forest font-semibold mt-1.5 flex items-start gap-1">
                                  <ChevronRight size={12} className="mt-0.5 flex-shrink-0" />
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

                {/* No flags fallback */}
                {analysisResult && analysisResult.riskFlags?.length === 0 && (
                  <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
                    <CheckCircle2 size={24} className="text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-green-700 font-semibold">No major risk flags detected</p>
                    <p className="text-xs text-green-600 mt-1">This document appears relatively fair.</p>
                  </div>
                )}

                {/* Recommendations */}
                {analysisResult?.recommendations?.length > 0 && (
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <h4 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                      <Sparkles size={16} className="text-lime" /> AI Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {analysisResult.recommendations.map((r, i) => (
                        <li key={i} className="text-xs text-gray-600 flex items-start gap-2 leading-relaxed">
                          <span className="w-5 h-5 rounded-full bg-lime/20 text-forest font-black text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Generate Legal Response Button */}
                {analysisResult && (
                  <div className="space-y-4">
                    <button
                      onClick={handleGenerateResponse}
                      disabled={generating}
                      className="w-full bg-lime text-forest font-black py-5 rounded-2xl shadow-xl shadow-lime/10 hover:bg-lime-hover transition-all flex items-center justify-center gap-3 disabled:opacity-60"
                    >
                      {generating ? 'Drafting Response...' : 'Generate Legal Response'} <Sparkles size={18} />
                    </button>

                    {generating && (
                      <div className="flex justify-center py-4">
                        <GavelLoading size="small" text="Drafting your legal response..." />
                      </div>
                    )}

                    {generatedResponse && (
                      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <h4 className="text-sm font-black text-gray-900 mb-3">📄 Generated Legal Response</h4>
                        <div className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed font-mono bg-gray-50 p-4 rounded-xl max-h-64 overflow-y-auto">
                          {generatedResponse}
                        </div>
                        <button
                          onClick={() => {
                            const blob = new Blob([generatedResponse], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url; a.download = 'legal_response.txt'; a.click();
                          }}
                          className="mt-3 w-full py-3 border border-gray-200 rounded-xl text-xs font-black text-gray-500 hover:text-forest hover:border-forest transition-all flex items-center justify-center gap-2"
                        >
                          <Download size={14} /> Download as TXT
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* Generate Tab */
            <motion.div
              key="generate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  { title: 'Rental Agreement', icon: FileText, desc: 'Residential or Commercial leases' },
                  { title: 'Legal Notice', icon: AlertTriangle, desc: 'Formal notice to individuals/orgs' },
                  { title: 'ITR Reply', icon: ClipboardList, desc: 'Respond to Income Tax notices' },
                  { title: 'Copyright Notice', icon: Scale, desc: 'Protect your creative work' },
                  { title: 'NDA', icon: ShieldAlert, desc: 'Non-disclosure agreements' },
                  { title: 'Employment Contract', icon: Layout, desc: 'For new hires or freelancers' },
                ].map((doc, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.03 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl group cursor-pointer hover:border-lime transition-all"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 mb-8 group-hover:bg-lime/20 group-hover:text-lime transition-all">
                      <doc.icon size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{doc.title}</h3>
                    <p className="text-sm text-gray-500 mb-8">{doc.desc}</p>
                    <button className="w-full py-4 border border-gray-100 rounded-xl text-xs font-black uppercase tracking-widest text-gray-400 group-hover:border-forest group-hover:text-forest transition-all flex items-center justify-center gap-3">
                      Generate Draft <ArrowRight size={16} />
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
};

export default DocumentsPage;
// cache bust 20260417224223
