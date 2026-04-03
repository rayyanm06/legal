import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Upload, CheckCircle2, AlertTriangle, XCircle, 
  ArrowRight, Download, Search, Info, Plus, Play, 
  FileCheck, ShieldAlert, Sparkles, Layout, ChevronRight,
  ClipboardList, Scale, Trash2, Printer, ShieldCheck
} from 'lucide-react';

const DocumentCard = ({ title, type, status, risk = "Low" }) => {
  const riskColors = {
    "Low": "text-green-500 bg-green-50",
    "Medium": "text-amber-500 bg-amber-50",
    "High": "text-red-500 bg-red-50",
    "Draft": "text-gray-400 bg-gray-50"
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 group cursor-pointer hover:border-lime/50 transition-all"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-xl bg-forest/5 flex items-center justify-center text-forest group-hover:bg-lime group-hover:text-forest transition-colors">
          <FileText size={24} />
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${riskColors[risk]}`}>
          {risk} Risk
        </span>
      </div>
      <h3 className="text-lg font-bold text-gray-900 group-hover:text-forest transition-colors">{title}</h3>
      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 italic">{type}</p>
      
      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
          <CheckCircle2 size={12} className="text-green-500" /> {status}
        </div>
        <div className="flex gap-2">
           <button className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-forest hover:bg-gray-100 transition-all"><Download size={16} /></button>
           <button className="p-2 bg-gray-100 rounded-lg text-forest hover:bg-lime transition-all"><ArrowRight size={16} /></button>
        </div>
      </div>
    </motion.div>
  );
};

const DocumentsPage = () => {
  const [activeTab, setActiveTab] = useState("analyze");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleUpload = () => {
    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        setAnalysisResult({
          score: 72,
          risk: "Medium",
          summary: "This rental agreement is mostly standard but contains a potentially unfair eviction clause and lacks a clear dispute resolution mechanism.",
          flags: [
            { type: "Danger", title: "Immediate Eviction Clause", desc: "Clause 14.2 allows eviction without the mandated 30-day notice period under state law." },
            { type: "Warning", title: "Maintenance Liability", desc: "Shifts all structural maintenance costs to the tenant, which is non-standard." },
            { type: "Safe", title: "Rent Escalation", desc: "Capped at 10% annually, which aligns with market standards." }
          ]
        });
      }
    }, 200);
  };

  const documentTypes = [
    { title: "Rental Agreement", icon: FileText, desc: "Residential or Commercial leases" },
    { title: "Legal Notice", icon: AlertTriangle, desc: "Formal notice to individuals/orgs" },
    { title: "ITR Reply", icon: ClipboardList, desc: "Respond to Income Tax notices" },
    { title: "Copyright Notice", icon: Scale, desc: "Protect your creative work" },
    { title: "NDA", icon: ShieldAlert, desc: "Non-disclosure agreements" },
    { title: "Employment Contract", icon: Layout, desc: "For new hires or freelancers" }
  ];

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-offwhite">
      <div className="max-w-7xl mx-auto">
        <header className="mb-20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
            <div className="max-w-2xl">
               <h1 className="text-5xl md:text-7xl font-bold text-gray-900 heading-display lowercase mb-6 tracking-tighter">smart <br/><span className="text-forest italic underline decoration-lime decoration-8 underline-offset-4">document studio.</span></h1>
               <p className="text-xl text-gray-500 leading-relaxed">Analyze risky contracts in seconds or generate production-grade legal documents in your language.</p>
            </div>
            <div className="flex gap-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
               <button 
                  onClick={() => setActiveTab("analyze")}
                  className={`px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === "analyze" ? 'bg-forest text-lime shadow-xl shadow-forest/20' : 'text-gray-400 hover:text-gray-700'}`}
               >
                 <Search size={18} /> Analyze
               </button>
               <button 
                  onClick={() => setActiveTab("generate")}
                  className={`px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === "generate" ? 'bg-forest text-lime shadow-xl shadow-forest/20' : 'text-gray-400 hover:text-gray-700'}`}
               >
                 <Plus size={18} /> Generate
               </button>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === "analyze" ? (
            <motion.div 
               key="analyze"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="grid grid-cols-1 lg:grid-cols-3 gap-12"
            >
              <div className="lg:col-span-2">
                {!analysisResult ? (
                  <div 
                    onClick={handleUpload}
                    className="aspect-[16/10] bg-white border-4 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center p-12 text-center group cursor-pointer hover:border-lime transition-all overflow-hidden relative"
                  >
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-12">
                         <div className="w-full max-w-sm h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
                            <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${uploadProgress}%` }}
                               className="h-full bg-forest relative"
                            >
                               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-lime/50 to-transparent animate-shimmer scale-x-150"></div>
                            </motion.div>
                         </div>
                         <p className="text-lg font-black text-forest uppercase tracking-[0.3em] font-mono">Analyzing Clauses...</p>
                         <p className="text-gray-400 text-xs font-bold mt-2 font-mono italic">OCR Running • Cross-referencing Penal Codes • mBart Translate Active</p>
                      </div>
                    )}
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-lime/10 group-hover:text-lime transition-all mb-8 shadow-inner ring-1 ring-gray-100">
                      <Upload size={40} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Document</h2>
                    <p className="text-gray-400 max-w-sm mb-10 text-lg">Drag & drop your PDF, DOCX, or even a photo of a handwritten document.</p>
                    <button className="bg-forest text-offwhite font-black px-10 py-5 rounded-2xl hover:bg-forest-light transform hover:scale-105 transition-all shadow-2xl shadow-forest/20 flex items-center gap-4">
                       Select from Device <ArrowRight size={24} className="text-lime" />
                    </button>
                    <div className="mt-12 flex gap-8">
                       <span className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest"><ShieldCheck size={14} className="text-green-500" /> Safe & Secure</span>
                       <span className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest"><Search size={14} className="text-blue-500" /> Deep Clause Analysis</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
                     <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                           <FileText size={20} className="text-forest" />
                           <h3 className="font-bold text-gray-900">Rental_Agreement_V4.pdf</h3>
                           <span className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded font-black text-gray-400 uppercase">2.4 MB</span>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => setAnalysisResult(null)} className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                           <button className="p-2 bg-forest text-lime rounded-xl flex items-center gap-2 text-sm font-bold px-4">Download PDF <Download size={16} /></button>
                        </div>
                     </div>
                     <div className="flex-1 p-12 bg-gray-100 flex items-center justify-center">
                        <div className="w-full max-w-md aspect-[1/1.414] bg-white shadow-2xl border border-gray-200 p-8 rounded-lg">
                           <div className="space-y-4 opacity-10 filter blur-[1px]">
                              {[...Array(20)].map((_, i) => (
                                <div key={i} className={`h-2 bg-gray-200 rounded-full ${i % 3 === 0 ? 'w-2/3' : 'w-full'}`}></div>
                              ))}
                           </div>
                           <div className="absolute inset-0 flex items-center justify-center p-8">
                              <div className="space-y-12 w-full">
                                 <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-red-50 border border-red-200 p-4 rounded-xl shadow-lg relative left-12"
                                 >
                                    <p className="text-[10px] font-black text-red-600 uppercase mb-1">Clause 14.2: Illegal Eviction</p>
                                    <p className="text-[11px] text-red-900 leading-tight">Landlord cannot evict without 30 days notice under State Act.</p>
                                 </motion.div>
                                 <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-green-50 border border-green-200 p-4 rounded-xl shadow-lg relative -left-12"
                                 >
                                    <p className="text-[10px] font-black text-green-600 uppercase mb-1">Clause 8.1: Rent Cap</p>
                                    <p className="text-[11px] text-green-900 leading-tight">Fair market escalation rate of 10%.</p>
                                 </motion.div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                )}
              </div>

              <div className="space-y-8">
                 <div className="bg-forest noise-overlay p-10 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
                    <h4 className="text-white text-[10px] font-black uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Legal Health Score</h4>
                    <div className="flex flex-col items-center">
                       <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                          <svg className="w-full h-full transform -rotate-90">
                             <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                             <motion.circle 
                                cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                                className={analysisResult ? (analysisResult.risk === 'High' ? 'text-red-500' : 'text-amber-400') : 'text-lime'}
                                strokeDasharray="553"
                                initial={{ strokeDashoffset: 553 }}
                                animate={{ strokeDashoffset: 553 - (553 * (analysisResult?.score || 0) / 100) }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                             />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                             <span className="text-5xl font-black text-white heading-display">{analysisResult?.score || 0}%</span>
                             <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-2">{analysisResult?.risk || 'N/A'} Risk</span>
                          </div>
                       </div>
                       <p className="text-white/60 text-sm text-center italic leading-relaxed">
                          {analysisResult?.summary || "Upload a document to see risk score and analysis summary."}
                       </p>
                    </div>
                 </div>

                 {analysisResult && (
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Flagged Clauses</h4>
                      {analysisResult.flags.map((flag, i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 flex gap-4 group hover:border-lime/50 transition-all cursor-pointer">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${flag.type === 'Danger' ? 'bg-red-50 text-red-500' : flag.type === 'Safe' ? 'bg-green-50 text-green-500' : 'bg-amber-50 text-amber-500'}`}>
                              {flag.type === 'Danger' ? <ShieldAlert size={20} /> : flag.type === 'Safe' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                           </div>
                           <div>
                              <h5 className="text-xs font-black text-gray-900 mb-1 flex items-center gap-2">
                                 {flag.title} 
                                 <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${flag.type === 'Danger' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}>{flag.type}</span>
                              </h5>
                              <p className="text-[10px] text-gray-500 leading-normal">{flag.desc}</p>
                           </div>
                        </div>
                      ))}
                      <button className="w-full bg-lime text-forest font-black py-4 rounded-2xl shadow-xl shadow-lime/10 hover:bg-lime-hover transform hover:scale-102 transition-all flex items-center justify-center gap-3 mt-6">
                        Ask AI to fix this <Sparkles size={18} />
                      </button>
                   </div>
                 )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
               key="generate"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
            >
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {documentTypes.map((doc, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ scale: 1.05 }}
                      className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 group cursor-pointer hover:border-lime hover:shadow-2xl transition-all"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 mb-8 group-hover:bg-lime/20 group-hover:text-lime transition-all">
                        <doc.icon size={32} />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{doc.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed mb-8">{doc.desc}</p>
                      <button className="w-full py-4 border border-gray-100 rounded-xl text-xs font-black uppercase tracking-widest text-gray-400 group-hover:border-forest group-hover:text-forest transition-all flex items-center justify-center gap-3">
                         Generate Draft <ArrowRight size={16} />
                      </button>
                    </motion.div>
                  ))}
                  <div className="bg-forest noise-overlay rounded-[2.5rem] p-8 flex flex-col justify-center items-center text-center group cursor-pointer border border-lime/20 hover:border-lime transition-all">
                     <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-lime group-hover:scale-110 transition-transform">
                        <Play size={24} fill="currentColor" />
                     </div>
                     <h3 className="text-2xl font-bold text-white mb-2">How it works</h3>
                     <p className="text-sm text-white/40 max-w-xs mb-8 italic">Watch 2 min guide on generating legally binding documents in 50+ languages.</p>
                     <button className="text-lime text-xs font-black uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
                        See Demo Section <ArrowRight size={14} />
                     </button>
                  </div>
               </div>

               <div className="mt-20 border-t border-gray-100 pt-20">
                  <div className="flex items-center justify-between mb-12">
                     <h2 className="text-3xl font-bold text-gray-900 heading-display">Your Recent <span className="italic">Studio Activity.</span></h2>
                     <button className="text-xs font-black text-gray-400 uppercase tracking-widest underline decoration-lime decoration-2 underline-offset-4">View History Registry</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     <DocumentCard title="Rental_Agreement_V4" type="Rental Agreement" status="Synced to Cloud" risk="Medium" />
                     <DocumentCard title="Freelance_Contract_nyAI" type="Service Agreement" status="Verified by AI" risk="Low" />
                     <DocumentCard title="Legal_Notice_Amazon" type="Consumer Dispute" status="Draft" risk="Draft" />
                     <DocumentCard title="Copyright_Transfer" type="IP Law" status="Waitlisted" risk="Low" />
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DocumentsPage;
