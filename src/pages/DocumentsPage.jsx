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
// tesseract.js is now imported dynamically in the OCR block

// ── Helpers ──────────────────────────────────────────────────────────────────

const extractText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsText(file);
  });
};

const extractPDFText = async (file) => {
  if (typeof window !== 'undefined' && window.pdfjsLib && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
};

const extractDocxText = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

const extractDocumentText = async (file) => {
  const fileName = file.name.toLowerCase();
  let text = '';
  if (fileName.endsWith('.txt')) {
    text = await extractText(file);
  } else if (fileName.endsWith('.pdf')) {
    text = await extractPDFText(file);
  } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
    text = await extractDocxText(file);
  } else {
    throw new Error("⚠️ Please upload a .txt, .pdf, or .docx file");
  }

  if (!text || text.trim().length === 0) {
    throw new Error("Could not read any text from this document. The file may be scanned/image-based or password protected.");
  }
  return text;
};


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

  const [warning, setWarning] = useState('');
  const [positiveExpanded, setPositiveExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectFile = (selectedFile) => {
    setFile(selectedFile);
    if (!selectedFile) {
      setDocText('');
    }
    setAnalysisResult(null);
    setError('');
    setWarning('');
    setGeneratedResponse('');
  };

  const analyzeDocument = async () => {
    if (!file) {
      setError("Please upload a document first.");
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setWarning('');
    setAnalysisResult(null);

    try {
      // Extract text from document
      let documentText = await extractDocumentText(file);
      
      if (documentText.length > 15000) {
        documentText = documentText.substring(0, 15000);
        setWarning("⚠️ Document is massive — analysing the first comprehensive section only.");
      }

      setDocText(documentText);
      
      // Call OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are an expert legal document analyst. Your job is to analyse documents and identify risk flags. Always respond in JSON format ONLY.`
            },
            {
              role: "user",
              content: `Analyse this document and identify all risk flags, problematic clauses, and areas of concern.\n\nDocument content:\n"""\n${documentText}\n"""\n\nRespond with ONLY this exact JSON structure (populate the arrays and numbers appropriately):\n{\n  "documentType": "what type of document this is",\n  "overallRiskLevel": "Low" or "Medium" or "High" or "Critical",\n  "summary": "2-3 sentence plain English summary of what this document is",\n  "riskFlags": [\n    {\n      "id": 1,\n      "severity": "Low" or "Medium" or "High" or "Critical",\n      "category": "category of risk e.g. Financial, Legal, Privacy, Liability",\n      "title": "short title of the risk",\n      "description": "2-3 sentences explaining what the risk is",\n      "exactText": "the exact clause or sentence from the document that triggers this flag",\n      "recommendation": "what the user should do about this risk"\n    }\n  ],\n  "positiveFindings": [\n    "one sentence for each thing that looks good or fair in the document"\n  ],\n  "totalRisksFound": 0,\n  "criticalCount": 0,\n  "highCount": 0,\n  "mediumCount": 0,\n  "lowCount": 0\n}\n\nLimit to top 15 most important risk flags. If no serious risks, list minor ones. Always find at least something.`
            }
          ]
        })
      });

      if (!response.ok) {
        let errStr = "OpenAI API call failed";
        try {
          const errData = await response.json();
          errStr = errData.error?.message || errStr;
        } catch(e) {}
        throw new Error(errStr);
      }

      const data = await response.json();
      const rawText = data.choices[0].message.content.trim();
      
      // Robust JSON parsing
      let cleanText = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/,'').trim();
      const jsonStart = cleanText.indexOf('{');
      const jsonEnd = cleanText.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("AI returned invalid response format");
      }
      cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
      
      const result = JSON.parse(cleanText);
      setAnalysisResult(result);
      setPreviewMode('analysis');

    } catch (err) {
      console.error("Document analysis error:", err);
      if (err.message.includes("API key")) {
        setError("API key error. Please check your OpenAI API key configuration.");
      } else if (err.message.includes("quota")) {
        setError("OpenAI quota exceeded. Please check your API usage.");
      } else {
        setError(`Analysis failed: ${err.message}. Please try again.`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) selectFile(dropped);
  }, []);

  const handleFileInput = (e) => {
    const selected = e.target.files[0];
    if (selected) selectFile(selected);
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
              <div className={`flex flex-col gap-6 ${file ? 'lg:col-span-5' : 'lg:col-span-3'}`}>

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
                  /* unified Results Panel */
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
                        {!analysisResult && !isAnalyzing && (
                          <button
                            onClick={analyzeDocument}
                            className="px-6 py-2 bg-forest text-lime font-black rounded-xl hover:bg-opacity-90 transition-all flex items-center gap-2"
                          >
                            <Sparkles size={16} /> Analyse
                          </button>
                        )}
                        <button onClick={() => selectFile(null)} className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:text-red-500 hover:border-red-200 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-6 overflow-y-auto">
                      {isAnalyzing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '300px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #f3f4f6', borderTopColor: '#22c55e', animation: 'spin 1s linear infinite', marginBottom: '20px' }} />
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>Analysing Document...</h3>
                            <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', marginBottom: '20px' }}>Scanning for risks, loopholes, and missing protections.</p>
                            <div style={{ width: '100%', height: '6px', backgroundColor: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: '50%', height: '100%', background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)', borderRadius: '3px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                            </div>
                          </div>
                          <style>
                            {`
                              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                              @keyframes pulse { 0%, 100% { opacity: 1; transform: translateX(-100%); } 50% { opacity: .5; transform: translateX(200%); } }
                            `}
                          </style>
                        </div>
                      ) : error ? (
                        <div style={{ padding: '20px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
                          <div style={{ padding: '4px', backgroundColor: '#fee2e2', borderRadius: '8px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          </div>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#991b1b', margin: '0 0 4px 0' }}>Analysis Failed</h3>
                            <p style={{ fontSize: '14px', color: '#b91c1c', margin: 0, lineHeight: 1.5 }}>{error}</p>
                          </div>
                        </div>
                      ) : analysisResult ? (
                        <div className="space-y-6">
                            {warning && (
                              <div style={{ padding: '12px 16px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', color: '#92400e', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                                <span>⚠️</span> {warning}
                              </div>
                            )}

                            {/* Summary Bar */}
                            <div className="flex flex-wrap gap-4">
                              <div className="flex-1 bg-red-50 border border-red-100 rounded-xl p-4 flex flex-col items-center">
                                <span className="text-2xl font-black text-red-600">{analysisResult.criticalCount || 0}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-red-500 mt-1">Critical</span>
                              </div>
                              <div className="flex-1 bg-orange-50 border border-orange-100 rounded-xl p-4 flex flex-col items-center">
                                <span className="text-2xl font-black text-orange-600">{analysisResult.highCount || 0}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 mt-1">High Risk</span>
                              </div>
                              <div className="flex-1 bg-amber-50 border border-amber-100 rounded-xl p-4 flex flex-col items-center">
                                <span className="text-2xl font-black text-amber-600">{analysisResult.mediumCount || 0}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 mt-1">Medium Risk</span>
                              </div>
                              <div className="flex-1 bg-green-50 border border-green-100 rounded-xl p-4 flex flex-col items-center">
                                <span className="text-2xl font-black text-green-600">{analysisResult.lowCount || 0}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-green-500 mt-1">Low Risk</span>
                              </div>
                            </div>
                            
                            {/* Risk Flags */}
                            {analysisResult.riskFlags && analysisResult.riskFlags.length > 0 ? (
                              <div className="space-y-4 mt-6">
                                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                  <AlertTriangle size={20} className="text-orange-500"/> Detected Risks ({analysisResult.riskFlags.length})
                                </h3>
                                {analysisResult.riskFlags.map((flag, idx) => (
                                  <div key={idx} className={`bg-white rounded-2xl p-5 border shadow-sm ${
                                    flag.severity === 'Critical' ? 'border-red-300' :
                                    flag.severity === 'High' ? 'border-orange-300' :
                                    flag.severity === 'Medium' ? 'border-amber-300' : 'border-blue-200'
                                  }`}>
                                    <div className="flex justify-between items-start mb-3">
                                      <h4 className="font-bold text-gray-900 text-lg">{flag.title}</h4>
                                      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                                        flag.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                                        flag.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                                        flag.severity === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                      }`}>
                                        {flag.severity} RISK
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed mb-4">{flag.description}</p>
                                    
                                    {flag.exactText && flag.exactText !== "null" && (
                                      <div className="bg-[#fef9c3] border-l-4 border-amber-400 p-4 rounded-r-lg mb-4 text-xs font-mono text-gray-700 shadow-sm">
                                        <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-2 shadow-none">📄 From your document:</p>
                                        "{flag.exactText}"
                                      </div>
                                    )}

                                    {flag.recommendation && (
                                      <div className="bg-[#f0fdf4] border border-green-200 p-4 rounded-lg text-sm text-green-800 flex items-start gap-3 shadow-sm">
                                        <Sparkles size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                          <p className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-1">💡 What to do:</p>
                                          {flag.recommendation}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center mt-6">
                                <CheckCircle2 size={32} className="text-green-500 mx-auto mb-3" />
                                <h3 className="text-lg font-bold text-green-800">No Risk Flags Detected</h3>
                                <p className="text-sm text-green-600 mt-1">This document looks exceptionally clean and fair.</p>
                              </div>
                            )}

                            {/* Positive Findings */}
                            {analysisResult.positiveFindings && analysisResult.positiveFindings.length > 0 && (
                              <div className="mt-8 border border-gray-200 rounded-2xl overflow-hidden">
                                <button 
                                  onClick={() => setPositiveExpanded(!positiveExpanded)}
                                  className="w-full bg-gray-50 p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                                >
                                  <span className="font-bold text-gray-800 flex items-center gap-2">
                                    <CheckCircle2 size={18} className="text-green-500" /> 
                                    ✅ What looks good ({analysisResult.positiveFindings.length})
                                  </span>
                                  <ChevronRight size={18} className={`text-gray-400 transition-transform duration-300 ${positiveExpanded ? 'rotate-90' : ''}`} />
                                </button>
                                {positiveExpanded && (
                                  <div className="p-5 bg-white border-t border-gray-200">
                                    <ul className="space-y-4 px-2">
                                      {analysisResult.positiveFindings.map((finding, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed font-medium">
                                          <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                                          {finding}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4 mt-8 pt-8 border-t border-gray-100">
                              <button 
                                onClick={() => selectFile(null)}
                                className="flex-1 py-4 border-2 border-gray-200 rounded-xl font-bold text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-all flex items-center justify-center gap-2"
                              >
                                <ArrowRight size={18} className="rotate-180" /> Analyse Another Document
                              </button>
                              <button 
                                onClick={() => {
                                  if (analysisResult) {
                                    navigator.clipboard.writeText(JSON.stringify(analysisResult, null, 2));
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                  }
                                }}
                                className="flex-1 py-4 bg-forest text-lime font-black rounded-xl hover:bg-opacity-90 shadow-lg shadow-forest/20 transition-all flex items-center justify-center gap-2"
                              >
                                <ClipboardList size={18} /> {copied ? '✓ Copied!' : '📋 Copy Summary'}
                              </button>
                            </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                           <FileText size={48} className="text-gray-200 mb-4" />
                           <h3 className="text-lg font-bold text-gray-700">Document Ready</h3>
                           <p className="text-sm text-gray-500 max-w-sm mt-2">
                             Click the Analyse button in the top right to start the AI risk assessment.
                           </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT: Analysis Results Panel */}
              {!file && (
              <div className="lg:col-span-2 space-y-6">
                {/* Health Score Card */}
                <div className="bg-forest rounded-[2rem] p-8 text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url(/noise.png)' }} />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6">
                    Document Intelligence
                  </h4>
                  <div className="text-center py-4">
                    <FileCheck size={40} className="text-white/20 mx-auto mb-4" />
                    <p className="text-white/40 text-sm">Upload a document to see AI analysis</p>
                  </div>
                </div>
              </div>
              )}
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
