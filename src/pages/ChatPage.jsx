import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Paperclip, FileSearch, FilePlus2, MessageSquare, 
  BarChart2, ShieldAlert, Scale, Plus, Settings, 
  ChevronRight, Search, Upload, CheckCircle2, 
  AlertTriangle, X, Download, Copy, Play, Zap, Phone,
  Clock, History, LayoutDashboard, Database, HardDrive,
  FileText, ShieldCheck, ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

// --- Sub-components for Tools ---

const LegalAssistant = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: "नमस्ते! I'm your nyAI legal assistant. How can I help you navigate Indian law today?", isAi: true },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), text: input, isAi: false }]);
    setInput("");
    
    // Auto-reply simulation
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        text: "I've analyzed your query regarding IPC Section 498A. Would you like a simplified breakdown or related case laws?", 
        isAi: true 
      }]);
    }, 1000);
  };

  const suggestions = [
    "What are my tenant rights in Delhi?",
    "Explain Section 498A in simple terms",
    "How to file a consumer court case?",
    "Need a legal notice for non-payment"
  ];

  return (
    <div className="flex flex-col h-full bg-offwhite relative">
      {/* Top Bar */}
      <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-offwhite/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 heading-display lowercase tracking-tighter">Legal Assistant</h2>
          <p className="text-xs text-gray-400 italic mt-1 font-medium">Ask anything about Indian law</p>
        </div>
        <div className="flex gap-3">
          <div className="px-3 py-1.5 bg-lime/10 border border-lime/30 rounded-full flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse"></span>
            <span className="text-[10px] font-black text-lime uppercase tracking-widest">v2.4 Active</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.map((msg) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id} 
            className={`flex ${msg.isAi ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`max-w-[80%] flex gap-4 ${msg.isAi ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center shadow-lg ${msg.isAi ? 'bg-lime text-forest' : 'bg-forest text-lime'}`}>
                <Scale size={20} />
              </div>
              <div className={`px-6 py-4 rounded-[2rem] shadow-sm text-sm leading-relaxed font-medium ${msg.isAi ? 'bg-white border border-gray-100 rounded-bl-sm text-gray-800' : 'bg-forest text-white rounded-br-sm'}`}>
                {msg.text}
              </div>
            </div>
          </motion.div>
        ))}

        {messages.length === 1 && (
          <div className="pt-10 max-w-2xl mx-auto">
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4 text-center">Suggested queries</p>
            <div className="grid grid-cols-2 gap-3">
              {suggestions.map(s => (
                <button key={s} onClick={() => setInput(s)} className="p-4 rounded-2xl border border-gray-100 bg-gray-50 text-xs font-bold text-gray-500 hover:border-lime/50 hover:text-forest transition-all text-left">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-gray-100 bg-offwhite">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSend} className="relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about rental laws, FIRs, or legal rights..." 
              className="w-full bg-gray-50 border border-gray-100 rounded-[2rem] px-8 py-5 pr-16 focus:border-lime focus:ring-0 text-gray-800 placeholder-gray-300 font-medium transition-all"
            />
            <button className="absolute right-2 top-2 w-12 h-12 bg-forest text-lime rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-forest/10">
              <Send size={20} />
            </button>
          </form>
          <p className="text-[10px] text-center text-gray-300 font-bold uppercase tracking-widest mt-4">
            Responses are AI-generated and not legal advice.
          </p>
        </div>
      </div>
    </div>
  );
};

const DocumentAnalyzer = () => {
  const [hasFile, setHasFile] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleUpload = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setHasFile(true);
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col bg-offwhite p-10 overflow-y-auto">
      <div className="mb-10 text-center lg:text-left">
        <h2 className="text-4xl font-bold text-gray-900 heading-display lowercase tracking-tighter">Document Analyzer</h2>
        <p className="text-gray-400 font-medium italic">Upload contracts to spot risks instantly</p>
      </div>

      {!hasFile ? (
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col items-center justify-center">
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="w-full bg-lime/5 border-2 border-dashed border-lime/30 rounded-[3rem] p-20 flex flex-col items-center justify-center group cursor-pointer transition-colors hover:bg-lime/10"
            onClick={handleUpload}
          >
            <div className="w-20 h-20 bg-lime rounded-3xl flex items-center justify-center text-forest mb-8 shadow-xl shadow-lime/20 group-hover:rotate-6 transition-transform">
              <Upload size={40} />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 heading-display lowercase tracking-tight mb-4 text-center">
              Drop your legal document here
            </h3>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-10">Supports PDF, DOCX, TXT — up to 10MB</p>
            
            <div className="flex gap-4">
              <button className="bg-forest text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest">Upload File</button>
              <button className="border border-forest/10 px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest text-forest/40 hover:bg-forest/5">Paste Text</button>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 flex-1">
          <div className="bg-gray-950 rounded-[2rem] p-10 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-4 right-4 bg-lime/10 border border-lime/30 px-3 py-1 rounded text-[10px] font-bold text-lime uppercase tracking-widest">RAW TEXT PREVIEW</div>
            <div className="h-full overflow-y-auto font-mono text-xs text-lime/80 leading-relaxed pr-4">
              {`// RENTAL AGREEMENT PREVIEW\n\n1. PARTIES: This agreement is made between...\n\n2. DURATION: The tenancy shall be for a period of 11 months...\n\n3. RENT: The tenant agrees to pay ₹25,000 per month...\n\n4. SECURITY DEPOSIT: A deposit of ₹1,00,000 shall be maintained...\n\n5. TERMINATION: Either party can terminate with 1 month notice...\n\n6. PAINTING: Tenant must repaint entire premises upon exit irrespective of wear and tear [FLAGGED]...`}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Document Intelligence</h4>
                <div className="bg-forest px-3 py-1 rounded-full text-[10px] font-black text-lime uppercase tracking-widest">Rental Agreement</div>
              </div>

              <div className="space-y-6">
                <div>
                  <h5 className="font-bold text-gray-900 mb-2">Key Clauses Identified</h5>
                  <ul className="space-y-2">
                    {[
                      "Term: 11 Months Fixed",
                      "Lock-in Period: 3 Months",
                      "Sub-letting: Strictly Prohibited",
                      "Notice Period: 30 Days"
                    ].map(t => (
                      <li key={t} className="flex items-center gap-3 text-xs text-gray-600 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-lime"></div> {t}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 border-t border-gray-50">
                  <h5 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ShieldAlert size={18} className="text-red-500" /> Risk Flags Detected
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-red-100">Unfair Painting Clause</span>
                    <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-orange-100">No Force Majeure</span>
                  </div>
                </div>

                <div className="p-6 bg-forest/5 border-l-4 border-lime rounded-r-2xl italic text-sm text-forest leading-relaxed">
                  "This document is a standard residential lease. However, Section 6 regarding repainting violates the Model Tenancy Act which exempts tenants from ordinary wear and tear."
                </div>
              </div>
            </div>

            <button className="w-full bg-forest text-lime py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-forest/10 hover:scale-[1.02] transition-transform">
              Generate Legal Response
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const DocumentGenerator = () => {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);

  const docTypes = [
    { id: 'rental', title: 'Rental Agreement', icon: FileText, desc: 'E-stamped residential lease contracts' },
    { id: 'notice', title: 'Legal Notice', icon: ShieldAlert, desc: 'Formal notices for recovery or breach' },
    { id: 'affidavit', title: 'Affidavit', icon: FileSearch, desc: 'Self-declaration legal documents' },
    { id: 'poa', title: 'Power of Attorney', icon: Scale, desc: 'Delegation of legal authority' },
    { id: 'will', title: 'Will Draft', icon: History, desc: 'Drafting your last will & testament' },
    { id: 'rti', title: 'RTI Application', icon: MessageSquare, desc: 'Information requests from govt bodies' },
  ];

  return (
    <div className="h-full bg-white p-10 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <h2 className="text-4xl font-bold text-gray-900 heading-display lowercase tracking-tighter">Document Generator</h2>
          <p className="text-gray-400 font-medium italic mt-2">Powered by Indian law templates</p>
        </header>

        {/* Stepper */}
        <div className="flex items-center gap-4 mb-16 max-w-lg">
          {[1, 2, 3].map(i => (
            <React.Fragment key={i}>
              <div 
                className={`flex-1 h-3 rounded-full transition-all duration-500 ${step >= i ? 'bg-lime' : 'bg-gray-100'}`}
              />
              {i < 3 && <div className="w-2 h-2 rounded-full bg-gray-100 flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>

        {step === 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {docTypes.map(type => (
              <button 
                key={type.id}
                onClick={() => { setSelectedType(type); setStep(2); }}
                className={`group p-8 rounded-[2rem] border-2 text-left transition-all hover:scale-[1.02] ${selectedType?.id === type.id ? 'border-lime bg-lime/5 shadow-xl' : 'border-gray-50 bg-white shadow-sm hover:border-lime/30'}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner ${selectedType?.id === type.id ? 'bg-lime text-forest' : 'bg-gray-50 text-lime group-hover:bg-lime group-hover:text-forest'}`}>
                  <type.icon size={28} />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{type.title}</h4>
                <p className="text-xs text-gray-400 font-medium italic leading-relaxed">{type.desc}</p>
              </button>
            ))}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-2xl bg-offwhite p-10 rounded-[3rem] border border-gray-100 shadow-sm"
          >
             <h3 className="text-2xl font-bold mb-8 heading-display">{selectedType?.title} Details</h3>
             <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-4 mb-2 block">Landlord Full Name</label>
                  <input type="text" placeholder="e.g. Rahul Sharma" className="w-full bg-white border border-gray-100 rounded-full px-6 py-4 focus:border-lime focus:ring-0" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-4 mb-2 block">Monthly Rent Amount (₹)</label>
                  <input type="number" placeholder="25000" className="w-full bg-white border border-gray-100 rounded-full px-6 py-4 focus:border-lime focus:ring-0" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-4 mb-2 block">Agreement Language</label>
                  <select className="w-full bg-white border border-gray-100 rounded-full px-6 py-4 focus:border-lime focus:ring-0 appearance-none">
                    <option>English</option>
                    <option>Hindi (हिन्दी)</option>
                    <option>Marathi (मराठी)</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-6">
                  <button onClick={() => setStep(1)} className="flex-1 py-4 border border-forest/10 rounded-full font-black uppercase tracking-widest text-forest/40">Back</button>
                  <button onClick={() => setStep(3)} className="flex-[2] py-4 bg-forest text-lime rounded-full font-black uppercase tracking-widest">Generate Draft</button>
                </div>
             </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col lg:flex-row gap-10"
          >
            <div className="flex-1 bg-white p-12 rounded-[2rem] border border-gray-100 shadow-[inset_0_0_50px_rgba(0,0,0,0.02)] min-h-[600px] relative">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-lime via-forest to-lime opacity-20"></div>
               <div className="text-center mb-10">
                 <h4 className="text-2xl font-serif font-bold uppercase border-b-2 border-forest inline-block pb-1">RENTAL AGREEMENT</h4>
               </div>
               <p className="text-sm leading-[2] text-gray-700 italic">
                 THIS RENTAL AGREEMENT is made at Mumbai on this 3rd day of April 2026, BETWEEN Shri. Rahul Sharma, hereinafter referred to as the LANDLORD, and ...
                 <br/><br/>
                 WHEREAS the Landlord is the absolute owner of the premises...
                 <br/><br/>
                 NOW THIS AGREEMENT WITNESSETH AS FOLLOWS...
               </p>
            </div>

            <div className="w-full lg:w-80 space-y-4">
              <div className="bg-forest p-8 rounded-[2rem] text-white">
                <ShieldCheck size={40} className="text-lime mb-6" />
                <h4 className="text-xl font-bold mb-2">Ready to use</h4>
                <p className="text-xs text-white/50 leading-relaxed mb-8 font-medium">This draft follows standard Model Tenancy Act guidelines for Maharashtra.</p>
                <button className="w-full bg-lime text-forest py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                  <Download size={16} /> Download PDF
                </button>
              </div>
              <button onClick={() => setStep(2)} className="w-full py-4 border border-gray-100 rounded-[2rem] font-black uppercase tracking-widest text-xs text-gray-400 hover:bg-gray-50 transition-colors">
                Edit Details
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const CasePredictor = () => {
  const [analyzed, setAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalyzed(true);
    }, 2000);
  };

  return (
    <div className="h-full bg-offwhite p-10 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h2 className="text-4xl font-bold text-gray-900 heading-display lowercase tracking-tighter">Case Predictor</h2>
          <p className="text-gray-400 font-medium italic mt-2">Based on 10,000+ Indian court judgements</p>
        </header>

        <section className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm mb-10">
          <textarea 
            placeholder="Describe your case briefly... (e.g. My employer terminated me without giving the 3-month notice promised in my contract.)"
            className="w-full h-40 bg-gray-50 rounded-[2rem] p-8 border-none focus:ring-2 focus:ring-lime/50 text-gray-800 placeholder-gray-300 font-medium resize-none mb-6"
          />
          
          <div className="flex flex-wrap gap-3 mb-10">
            <p className="w-full text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 px-4">Selection Category</p>
            {['Criminal', 'Civil', 'Family', 'Property', 'Labour'].map(tag => (
              <button key={tag} className="px-6 py-2 rounded-full border border-gray-100 text-xs font-bold text-gray-400 hover:border-lime hover:text-forest transition-all">
                {tag}
              </button>
            ))}
          </div>

          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full bg-forest text-lime py-5 rounded-[2rem] font-black uppercase tracking-widest text-lg shadow-xl shadow-forest/10 hover:scale-[1.01] transition-transform disabled:opacity-50"
          >
            {isAnalyzing ? 'Analyzing Jurisprudence...' : 'Predict Outcome'}
          </button>
        </section>

        {analyzed && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1 md:col-span-1 bg-forest rounded-[3rem] p-10 flex flex-col items-center justify-center text-center">
                <div className="relative w-32 h-32 mb-6">
                   <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                      <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364} strokeDashoffset={364 * (1 - 0.74)} className="text-lime" strokeLinecap="round" />
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white heading-display tracking-tighter">74%</span>
                   </div>
                </div>
                <h4 className="text-white font-bold">Win Probability</h4>
                <p className="text-[10px] text-lime font-black uppercase tracking-widest mt-1">Strong Case</p>
              </div>

              <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {[
                   { label: 'Avg. Duration', val: '14 Months', icon: Clock },
                   { label: 'Similar Cases', val: '312 Found', icon: Database },
                   { label: 'Complexity', val: 'Medium-High', icon: AlertTriangle },
                   { label: 'Success Action', val: 'Mediation', icon: Handshake }
                 ].map((stat, i) => (
                   <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-100 flex items-center gap-4">
                      <div className="w-12 h-12 bg-lime/10 rounded-2xl flex items-center justify-center text-lime"><stat.icon size={20} /></div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                        <p className="font-bold text-gray-900">{stat.val}</p>
                      </div>
                   </div>
                 ))}
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 relative overflow-hidden">
               <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-10">Procedural Timeline</h4>
               <div className="flex justify-between items-center relative gap-4">
                  <div className="absolute h-1 bg-lime/20 top-4 left-0 w-full z-0"></div>
                  <div className="absolute h-1 bg-lime top-4 left-0 w-1/2 z-0"></div>
                  {['File FIR', 'District Court', 'High Court', 'Supreme'].map((step, i) => (
                    <div key={step} className="relative z-10 flex flex-col items-center gap-4 flex-1">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= 1 ? 'bg-lime text-forest' : 'bg-gray-100 text-gray-400'}`}>
                         {i + 1}
                       </div>
                       <p className={`text-[10px] font-black uppercase tracking-tight text-center ${i <= 1 ? 'text-forest font-bold' : 'text-gray-300'}`}>{step}</p>
                    </div>
                  ))}
               </div>
            </div>
            
            <p className="text-center text-[10px] text-gray-300 font-bold uppercase tracking-widest italic">Disclaimer: Prediction is based on historical data patterns and is not a guarantee of legal outcome.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const FakeDocDetector = () => {
  const [status, setStatus] = useState('idle'); // idle, scanning, result

  const handleScan = () => {
    setStatus('scanning');
    setTimeout(() => setStatus('result'), 3000);
  };

  return (
    <div className="h-full bg-offwhite p-10 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h2 className="text-4xl font-bold text-gray-900 heading-display lowercase tracking-tighter">Fake Doc Detector</h2>
          <p className="text-gray-400 font-medium italic mt-2">AI-powered forgery detection</p>
        </header>

        {status === 'idle' && (
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-20 rounded-[3rem] border-2 border-dashed border-lime/30 flex flex-col items-center justify-center bg-lime/5 cursor-pointer group"
            onClick={handleScan}
          >
            <div className="w-20 h-20 bg-lime rounded-3xl flex items-center justify-center text-forest mb-8 shadow-xl shadow-lime/20 group-hover:rotate-6 transition-transform">
              <ShieldAlert size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 heading-display tracking-tight mb-8">Scan Document for Authenticity</h3>
            <button className="bg-forest text-lime px-10 py-4 rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-forest/20">Analyze Now</button>
          </motion.div>
        )}

        {status === 'scanning' && (
          <div className="space-y-10">
            <div className="bg-forest rounded-[3rem] p-16 relative overflow-hidden h-[400px] flex flex-col items-center justify-center">
               {/* Scan Line */}
               <motion.div 
                 animate={{ top: ['0%', '100%', '0%'] }}
                 transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                 className="absolute left-0 w-full h-1 bg-lime shadow-[0_0_20px_#A3E635] z-20 pointer-events-none"
               />
               <div className="w-64 h-80 bg-white/10 border border-white/20 rounded-xl relative opacity-40">
                  <div className="absolute top-4 left-4 w-12 h-1 bg-white/20" />
                  <div className="absolute top-8 left-4 w-40 h-2 bg-white/20" />
                  <div className="absolute top-12 left-4 w-32 h-2 bg-white/20" />
                  <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full border-2 border-white/20" />
               </div>
               <div className="mt-12 text-center relative z-30">
                 <AnimatePresence mode="wait">
                    <motion.p 
                      key={Math.random()}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-lime font-black uppercase tracking-[0.3em] text-xs"
                    >
                      Analyzing Fonts and Seals...
                    </motion.p>
                 </AnimatePresence>
               </div>
            </div>
          </div>
        )}

        {status === 'result' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
             <div className="bg-green-500 rounded-[3rem] p-12 text-center border-4 border-white shadow-2xl flex flex-col items-center">
                <CheckCircle2 size={64} className="text-white mb-4" />
                <h3 className="text-5xl font-bold text-white heading-display tracking-tight lowercase">Likely Authentic</h3>
                <p className="text-white/80 font-bold uppercase tracking-widest text-xs mt-4">98.4% Confidence Score</p>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">Verification Signals</h4>
                   <div className="space-y-6">
                      {[
                        { label: 'Font Consistency', pass: true, conf: '100%' },
                        { label: 'Metadata Integrity', pass: true, conf: '94%' },
                        { label: 'Official Seal Cross-check', pass: true, conf: '98%' },
                        { label: 'Noise Pattern Analysis', pass: true, conf: '99%' },
                        { label: 'Unusual Spacing detected', pass: false, conf: '2%' }
                      ].map((sig, i) => (
                        <div key={i} className="space-y-2">
                           <div className="flex justify-between items-center">
                             <div className="flex items-center gap-3">
                               {sig.pass ? <CheckCircle2 size={16} className="text-green-500" /> : <ShieldAlert size={16} className="text-red-500" />}
                               <span className="text-sm font-bold text-gray-700">{sig.label}</span>
                             </div>
                             <span className="text-[10px] font-black text-gray-300 tracking-widest">{sig.conf}</span>
                           </div>
                           <div className="h-1 bg-gray-50 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${sig.pass ? 'bg-lime' : 'bg-red-200'}`} style={{ width: sig.pass ? '90%' : '10%' }} />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-forest p-10 rounded-[3rem] text-white">
                    <h4 className="text-xl font-bold mb-4">Official Verification</h4>
                    <p className="text-xs text-white/50 leading-relaxed mb-10 font-medium italic">"No digital alteration detected in the document header. Forgery patterns are absent from signature zones."</p>
                    <div className="flex gap-4">
                       <button className="flex-1 py-4 bg-lime text-forest rounded-full font-black uppercase tracking-widest text-[10px]">Download Report</button>
                       <button className="flex-1 py-4 border border-white/10 rounded-full font-black uppercase tracking-widest text-[10px]">Flag for Review</button>
                    </div>
                  </div>
                  <button onClick={() => setStatus('idle')} className="w-full py-4 border border-gray-100 rounded-[3rem] font-black uppercase tracking-widest text-[10px] text-gray-400 hover:bg-gray-50">Scan Another</button>
                </div>
             </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// --- Main ChatPage Component ---

const ChatPage = () => {
  const [activeTool, setActiveTool] = useState('assistant'); // assistant, analyzer, generator, predictor, detector
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const tools = [
    { id: 'assistant', label: 'Legal Assistant', icon: MessageSquare },
    { id: 'analyzer', label: 'Document Analyzer', icon: FileSearch },
    { id: 'generator', label: 'Document Generator', icon: FilePlus2 },
    { id: 'predictor', label: 'Case Predictor', icon: BarChart2 },
    { id: 'detector', label: 'Fake Doc Detector', icon: ShieldAlert },
  ];

  const pastCases = ["Sharma v. State (2024)", "Land Dispute — Jaipur", "RTI Appeal #4421"];

  return (
    <div className="flex h-screen bg-offwhite overflow-hidden pt-16">
      {/* Sidebar */}
      <aside 
        className={`bg-forest relative h-full flex flex-col transition-all duration-300 z-40 ${isSidebarOpen ? 'w-72' : 'w-20'}`}
      >
        <div className="absolute inset-0 noise-overlay opacity-20 pointer-events-none"></div>
        
        {/* Logo removed as it is in the navbar */}

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2 relative z-10 overflow-y-auto no-scrollbar">
          {isSidebarOpen && (
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] pl-4 mb-6">AI Tools</p>
          )}
          
          {tools.map(tool => (
            <div key={tool.id} className="relative">
              <button 
                onClick={() => setActiveTool(tool.id)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group overflow-hidden ${activeTool === tool.id ? 'bg-lime/10 border border-lime/30 text-lime' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              >
                {/* Removed glowy sidebar-accent bar as requested */}
                <tool.icon size={20} className={activeTool === tool.id ? 'text-lime' : 'group-hover:text-white transition-colors'} />
                {isSidebarOpen && (
                  <span className="text-[10px] font-black uppercase tracking-widest">{tool.label}</span>
                )}
              </button>

              {/* Submenu for Legal Assistant */}
              {tool.id === 'assistant' && activeTool === 'assistant' && isSidebarOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="pl-12 pt-4 pb-4 flex flex-col gap-3"
                >
                  <p className="text-[11px] font-bold text-lime/60 uppercase tracking-widest flex items-center gap-1">
                    <History size={12} /> Past Cases
                  </p>
                  {pastCases.map(c => (
                    <button key={c} className="text-[12px] font-medium text-white/60 hover:text-white text-left transition-colors truncate">
                      • {c}
                    </button>
                  ))}
                  <button className="mt-2 text-[11px] font-black text-lime uppercase tracking-widest py-2.5 px-4 border border-lime/30 rounded-full hover:bg-lime/10 transition-all inline-block w-max">
                    + New Case
                  </button>
                </motion.div>
              )}
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-6 border-t border-white/5 relative z-10 bg-forest-dark/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lime flex items-center justify-center text-forest font-black shadow-lg shadow-lime/10">YS</div>
            {isSidebarOpen && (
               <div className="flex-1 min-w-0">
                 <p className="text-xs font-bold text-white truncate lowercase">yogesh sharma</p>
                 <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.15em] flex items-center gap-1">
                   <Zap size={10} className="text-lime" /> pro member
                 </p>
               </div>
            )}
            {isSidebarOpen && <button className="text-white/20 hover:text-white"><Settings size={18} /></button>}
          </div>
        </div>

        {/* Sidebar Toggle */}
        <button 
           onClick={() => setIsSidebarOpen(!isSidebarOpen)}
           className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-forest border border-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white z-50 shadow-xl"
        >
          {isSidebarOpen ? <Plus className="rotate-45" size={16} /> : <ArrowRight size={16} />}
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full relative overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTool}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex-1 h-full"
          >
            {activeTool === 'assistant' && <LegalAssistant />}
            {activeTool === 'analyzer' && <DocumentAnalyzer />}
            {activeTool === 'generator' && <DocumentGenerator />}
            {activeTool === 'predictor' && <CasePredictor />}
            {activeTool === 'detector' && <FakeDocDetector />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ChatPage;
