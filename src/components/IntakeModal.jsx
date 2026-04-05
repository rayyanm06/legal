import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ArrowRight, ArrowLeft, User, Phone, Mail, MapPin,
  CheckCircle2, Loader2, Send, ShieldCheck, AlertTriangle,
  Scale, FileText, Building, Briefcase, Shield, Gavel
} from 'lucide-react';

// Category-specific intake questions
const CATEGORY_QUESTIONS = {
  "Family Law": [
    { id: "matter_type", label: "What type of family matter is this?", type: "select", options: ["Divorce", "Child Custody", "Maintenance/Alimony", "Domestic Violence", "Property Division", "Adoption", "Other"] },
    { id: "duration", label: "How long has this issue been ongoing?", type: "select", options: ["Less than 1 month", "1-6 months", "6-12 months", "1-3 years", "More than 3 years"] },
    { id: "children", label: "Are minor children involved?", type: "select", options: ["Yes", "No"] },
    { id: "urgency", label: "How urgent is this matter?", type: "select", options: ["Immediate / Emergency", "Within a week", "Within a month", "No immediate urgency"] },
    { id: "details", label: "Briefly describe your situation", type: "textarea" }
  ],
  "Criminal Law": [
    { id: "offense_type", label: "Nature of the offense", type: "select", options: ["Theft / Robbery", "Assault / Violence", "Fraud / Cheating", "Cybercrime", "Drug Related", "Murder / Attempt", "Defamation", "Other"] },
    { id: "fir_filed", label: "Has an FIR been filed?", type: "select", options: ["Yes, by me", "Yes, against me", "No", "Not sure"] },
    { id: "custody", label: "Is anyone currently in custody?", type: "select", options: ["Yes", "No"] },
    { id: "bail_needed", label: "Is bail required?", type: "select", options: ["Yes, urgently", "Yes, but not immediate", "No", "Already on bail"] },
    { id: "details", label: "Briefly describe the situation", type: "textarea" }
  ],
  "Property Law": [
    { id: "property_type", label: "Type of property matter", type: "select", options: ["Purchase / Sale Dispute", "Land Dispute", "Tenant / Landlord Issue", "Illegal Encroachment", "Title Verification", "Property Registration", "Inheritance / Succession", "Other"] },
    { id: "property_location", label: "Property location (City/Area)", type: "text" },
    { id: "documents_available", label: "Do you have relevant documents?", type: "select", options: ["Yes, all documents", "Some documents", "No documents", "Documents with other party"] },
    { id: "govt_land", label: "Is government land involved?", type: "select", options: ["Yes", "No", "Not sure"] },
    { id: "details", label: "Briefly describe the dispute", type: "textarea" }
  ],
  "Corporate Law": [
    { id: "business_type", label: "Type of business", type: "select", options: ["Private Limited", "LLP", "Partnership", "Sole Proprietorship", "Startup", "NGO / Trust", "Other"] },
    { id: "matter_type", label: "Nature of the issue", type: "select", options: ["Company Registration", "Contract Dispute", "Shareholder Dispute", "Compliance Issue", "SEBI / Regulatory", "Mergers & Acquisitions", "Other"] },
    { id: "company_registered", label: "Is the company registered?", type: "select", options: ["Yes", "No", "In process"] },
    { id: "amount_involved", label: "Approximate amount involved", type: "select", options: ["Less than ₹1 Lakh", "₹1-10 Lakh", "₹10-50 Lakh", "₹50 Lakh - ₹1 Crore", "More than ₹1 Crore"] },
    { id: "details", label: "Briefly describe the issue", type: "textarea" }
  ],
  "Consumer Law": [
    { id: "product_service", label: "Product or service involved?", type: "select", options: ["Product (Electronics, Vehicle, etc.)", "Service (Hospital, Bank, Insurance, etc.)", "E-commerce / Online Purchase", "Real Estate / Builder", "Telecom / Internet", "Other"] },
    { id: "amount_dispute", label: "Amount in dispute", type: "select", options: ["Less than ₹5,000", "₹5,000 - ₹50,000", "₹50,000 - ₹5 Lakh", "₹5 Lakh - ₹50 Lakh", "More than ₹50 Lakh"] },
    { id: "complaint_filed", label: "Complaint filed with the company?", type: "select", options: ["Yes, no response", "Yes, unsatisfactory response", "No, not yet", "Filed in Consumer Forum"] },
    { id: "timeline", label: "When did the issue occur?", type: "select", options: ["Less than 1 month ago", "1-6 months ago", "6-12 months ago", "More than 1 year ago"] },
    { id: "details", label: "Describe what happened", type: "textarea" }
  ],
  "Tax Law": [
    { id: "tax_type", label: "Type of tax issue", type: "select", options: ["Income Tax", "GST", "Property Tax", "Capital Gains", "TDS Issues", "Tax Evasion Notice", "Other"] },
    { id: "notice_received", label: "Have you received a tax notice?", type: "select", options: ["Yes", "No"] },
    { id: "assessment_year", label: "Assessment year (if applicable)", type: "text" },
    { id: "amount_involved", label: "Amount involved", type: "select", options: ["Less than ₹50,000", "₹50,000 - ₹5 Lakh", "₹5 Lakh - ₹25 Lakh", "₹25 Lakh - ₹1 Crore", "More than ₹1 Crore"] },
    { id: "details", label: "Describe the situation", type: "textarea" }
  ],
  "IP Law": [
    { id: "ip_type", label: "Type of IP matter", type: "select", options: ["Patent", "Trademark", "Copyright", "Trade Secret", "Design Registration", "Domain Dispute", "Other"] },
    { id: "registration_status", label: "Registration status", type: "select", options: ["Registered", "Application pending", "Not registered", "Expired"] },
    { id: "infringement", label: "Is this about infringement?", type: "select", options: ["Yes, someone copied my IP", "Yes, I received infringement notice", "No, I need registration help", "Other"] },
    { id: "details", label: "Describe the matter", type: "textarea" }
  ],
  "Cyber Law": [
    { id: "crime_type", label: "Type of cybercrime", type: "select", options: ["Online Fraud / Phishing", "Identity Theft", "Hacking", "Cyberstalking / Harassment", "Data Breach", "Online Defamation", "Social Media Crime", "Other"] },
    { id: "fir_filed", label: "Has an FIR / Cyber complaint been filed?", type: "select", options: ["Yes", "No", "Filed online complaint"] },
    { id: "evidence", label: "Do you have evidence (screenshots, records)?", type: "select", options: ["Yes, extensive", "Some evidence", "No evidence", "Evidence may be lost"] },
    { id: "financial_loss", label: "Any financial loss?", type: "select", options: ["No", "Less than ₹10,000", "₹10,000 - ₹1 Lakh", "₹1 Lakh - ₹10 Lakh", "More than ₹10 Lakh"] },
    { id: "details", label: "Describe what happened", type: "textarea" }
  ],
  "General Practice": [
    { id: "matter_type", label: "What type of legal matter is this?", type: "select", options: ["Civil Dispute", "Criminal Matter", "Family Issue", "Property Related", "Business / Corporate", "Consumer Complaint", "Government / RTI", "Other"] },
    { id: "urgency", label: "How urgent is this?", type: "select", options: ["Immediate / Emergency", "Within a week", "Within a month", "No rush"] },
    { id: "previous_legal", label: "Have you consulted a lawyer before for this?", type: "select", options: ["Yes", "No"] },
    { id: "details", label: "Describe your legal issue in detail", type: "textarea" }
  ]
};

const IntakeModal = ({ isOpen, onClose, lawyer }) => {
  const [step, setStep] = useState(1);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  // Step 1: Client info
  const [clientInfo, setClientInfo] = useState({
    name: localStorage.getItem('nyai_user_name') || '', 
    phone: '', 
    email: localStorage.getItem('nyai_user_email') || '', 
    city: ''
  });

  // Step 2: Category answers
  const [answers, setAnswers] = useState({});

  if (!isOpen || !lawyer) return null;

  const category = lawyer.specialty || "General Practice";
  const questions = CATEGORY_QUESTIONS[category] || CATEGORY_QUESTIONS["General Practice"];

  const updateClient = (field, value) => {
    setClientInfo(prev => ({ ...prev, [field]: value }));
  };

  const updateAnswer = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const isStep1Valid = clientInfo.name && clientInfo.phone && clientInfo.email && clientInfo.city;
  const isStep2Valid = questions.every(q => {
    if (q.id === 'details') return true; // details optional
    return answers[q.id] && answers[q.id].trim() !== '';
  });

  const handleSubmit = async () => {
    setSending(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/send-lawyer-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientInfo,
          answers,
          lawyer: {
            name: lawyer.name,
            specialty: lawyer.specialty,
            email: lawyer.email,
            city: lawyer.city
          },
          category
        })
      });
      const data = await response.json();
      if (data.success) {
        setSent(true);
      } else {
        setError(data.error || 'Failed to send. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setClientInfo({ name: '', phone: '', email: '', city: '' });
    setAnswers({});
    setSent(false);
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="bg-forest p-6 md:p-8 relative overflow-hidden flex-shrink-0">
            <div className="absolute inset-0 opacity-5">
              <Scale size={300} className="absolute -top-20 -right-20" />
            </div>
            <div className="relative z-10 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <img
                  src={lawyer.photo}
                  alt={lawyer.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-lime/30"
                />
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    Connect with {lawyer.name}
                  </h2>
                  <p className="text-lime text-xs font-bold uppercase tracking-widest mt-1">
                    {lawyer.specialty} • {lawyer.city}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
              >
                <X size={22} />
              </button>
            </div>

            {/* Steps Indicator */}
            {!sent && (
              <div className="relative z-10 flex items-center gap-3 mt-6">
                {[1, 2, 3].map(s => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step === s ? 'bg-lime text-forest scale-110' :
                      step > s ? 'bg-lime/30 text-lime' : 'bg-white/10 text-white/30'
                    }`}>
                      {step > s ? <CheckCircle2 size={16} /> : s}
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest font-bold hidden md:inline ${
                      step === s ? 'text-lime' : 'text-white/30'
                    }`}>
                      {s === 1 ? 'Your Details' : s === 2 ? 'Case Info' : 'Confirm'}
                    </span>
                    {s < 3 && <div className={`w-8 h-[2px] ${step > s ? 'bg-lime/50' : 'bg-white/10'}`} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <AnimatePresence mode="wait">
              {/* SUCCESS STATE */}
              {sent ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-10"
                >
                  <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={48} className="text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Sent Successfully!</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-8">
                    Your case details have been securely sent to <span className="font-bold text-forest">{lawyer.name}</span>. 
                    The advocate will review your information and get back to you shortly.
                  </p>
                  <div className="bg-lime/10 border border-lime/20 p-4 rounded-2xl max-w-sm mx-auto mb-8">
                    <p className="text-xs font-bold text-forest uppercase tracking-widest">Expected Response</p>
                    <p className="text-lg font-bold text-forest mt-1">Within 24-48 hours</p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="bg-forest text-white font-bold py-4 px-10 rounded-2xl hover:bg-forest-light transition-colors"
                  >
                    Done
                  </button>
                </motion.div>
              ) : (
                <>
                  {/* STEP 1: Client Details */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                    >
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Your Information</h3>
                      <p className="text-gray-400 text-sm mb-8">Help the advocate understand who you are.</p>

                      <div className="space-y-5">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name *</label>
                          <div className="relative">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                            <input
                              type="text"
                              value={clientInfo.name}
                              onChange={e => updateClient('name', e.target.value)}
                              placeholder="Enter your full name"
                              className="w-full bg-gray-50 border border-gray-100 py-4 pl-12 pr-4 rounded-xl text-base focus:ring-2 focus:ring-lime/50 focus:border-lime transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Phone Number *</label>
                          <div className="relative">
                            <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                            <input
                              type="tel"
                              value={clientInfo.phone}
                              onChange={e => updateClient('phone', e.target.value)}
                              placeholder="+91 XXXXX XXXXX"
                              className="w-full bg-gray-50 border border-gray-100 py-4 pl-12 pr-4 rounded-xl text-base focus:ring-2 focus:ring-lime/50 focus:border-lime transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address *</label>
                          <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                            <input
                              type="email"
                              value={clientInfo.email}
                              onChange={e => updateClient('email', e.target.value)}
                              placeholder="your@email.com"
                              className="w-full bg-gray-50 border border-gray-100 py-4 pl-12 pr-4 rounded-xl text-base focus:ring-2 focus:ring-lime/50 focus:border-lime transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">City *</label>
                          <div className="relative">
                            <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                            <input
                              type="text"
                              value={clientInfo.city}
                              onChange={e => updateClient('city', e.target.value)}
                              placeholder="e.g. Mumbai, Delhi, Bangalore"
                              className="w-full bg-gray-50 border border-gray-100 py-4 pl-12 pr-4 rounded-xl text-base focus:ring-2 focus:ring-lime/50 focus:border-lime transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: Category Questions */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <Gavel size={20} className="text-forest" />
                        <h3 className="text-xl font-bold text-gray-900">{category} — Case Details</h3>
                      </div>
                      <p className="text-gray-400 text-sm mb-8">Answer these questions so the advocate can assess your case.</p>

                      <div className="space-y-5">
                        {questions.map(q => (
                          <div key={q.id}>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                              {q.label} {q.id !== 'details' && '*'}
                            </label>
                            {q.type === 'select' ? (
                              <select
                                value={answers[q.id] || ''}
                                onChange={e => updateAnswer(q.id, e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 py-4 px-4 rounded-xl text-base focus:ring-2 focus:ring-lime/50 focus:border-lime transition-all appearance-none cursor-pointer"
                              >
                                <option value="">Select an option</option>
                                {q.options.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : q.type === 'textarea' ? (
                              <textarea
                                value={answers[q.id] || ''}
                                onChange={e => updateAnswer(q.id, e.target.value)}
                                placeholder="Provide as much detail as possible..."
                                rows={4}
                                className="w-full bg-gray-50 border border-gray-100 py-4 px-4 rounded-xl text-base focus:ring-2 focus:ring-lime/50 focus:border-lime transition-all resize-none"
                              />
                            ) : (
                              <input
                                type="text"
                                value={answers[q.id] || ''}
                                onChange={e => updateAnswer(q.id, e.target.value)}
                                placeholder="Type here..."
                                className="w-full bg-gray-50 border border-gray-100 py-4 px-4 rounded-xl text-base focus:ring-2 focus:ring-lime/50 focus:border-lime transition-all"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: Confirm */}
                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                    >
                      <h3 className="text-xl font-bold text-gray-900 mb-1">Review & Send</h3>
                      <p className="text-gray-400 text-sm mb-8">Confirm your details before sending to the advocate.</p>

                      {/* Client Summary */}
                      <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Your Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Name</p>
                            <p className="text-sm font-bold text-gray-900">{clientInfo.name}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Phone</p>
                            <p className="text-sm font-bold text-gray-900">{clientInfo.phone}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Email</p>
                            <p className="text-sm font-bold text-gray-900">{clientInfo.email}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">City</p>
                            <p className="text-sm font-bold text-gray-900">{clientInfo.city}</p>
                          </div>
                        </div>
                      </div>

                      {/* Case Summary */}
                      <div className="bg-forest/5 rounded-2xl p-5 mb-6 border border-forest/10">
                        <h4 className="text-xs font-bold text-forest uppercase tracking-widest mb-4">{category} — Case Summary</h4>
                        <div className="space-y-3">
                          {questions.map(q => {
                            const val = answers[q.id];
                            if (!val) return null;
                            return (
                              <div key={q.id} className="flex justify-between items-start gap-4">
                                <p className="text-xs text-gray-500 flex-shrink-0">{q.label}</p>
                                <p className="text-xs font-bold text-gray-900 text-right">{val}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Security Notice */}
                      <div className="flex items-start gap-3 bg-lime/10 border border-lime/20 p-4 rounded-2xl mb-4">
                        <ShieldCheck size={20} className="text-forest flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-forest leading-relaxed">
                          Your information will be securely sent to <strong>{lawyer.name}</strong> via encrypted email. 
                          The advocate is bound by professional confidentiality standards.
                        </p>
                      </div>

                      {error && (
                        <div className="flex items-start gap-3 bg-red-50 border border-red-100 p-4 rounded-2xl mb-4">
                          <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-red-700">{error}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          {!sent && (
            <div className="flex-shrink-0 border-t border-gray-100 p-6 md:p-8 bg-gray-50/50 flex justify-between items-center gap-4">
              {step > 1 ? (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-2 text-gray-400 hover:text-gray-900 font-bold py-3 px-6 rounded-xl transition-colors"
                >
                  <ArrowLeft size={18} /> Back
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                  className={`flex items-center gap-2 font-bold py-4 px-8 rounded-2xl transition-all ${
                    (step === 1 ? isStep1Valid : isStep2Valid)
                      ? 'bg-forest text-white hover:bg-forest-light shadow-xl shadow-forest/20'
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  Continue <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={sending}
                  className="flex items-center gap-2 bg-lime text-forest font-bold py-4 px-8 rounded-2xl hover:bg-lime-hover shadow-xl shadow-lime/20 transition-all disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} /> Send to Advocate
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default IntakeModal;
