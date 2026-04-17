import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Briefcase, Users, Bot, Calendar, Settings, LogOut,
  Scale, Bell, Plus, X, ChevronRight, FileText, Trash2, Upload, Send,
  CheckCircle2, Clock, AlertTriangle, ExternalLink, TrendingUp, Download,
  ChevronDown, ArrowRight, Loader
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api/config';

// ── Helpers ──────────────────────────────────────────────────────────────────
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('nyai_token')}`, 'Content-Type': 'application/json' });

const STATUS_STYLE = {
  active:   'bg-lime/20 text-forest border border-lime/40',
  won:      'bg-teal-50 text-teal-700 border border-teal-200',
  lost:     'bg-red-50 text-red-600 border border-red-200',
  settled:  'bg-amber-50 text-amber-700 border border-amber-200',
  dropped:  'bg-gray-100 text-gray-500 border border-gray-200',
};

const CAT_STYLE = {
  Consumer: 'bg-blue-50 text-blue-700', Criminal: 'bg-red-50 text-red-700',
  Civil: 'bg-purple-50 text-purple-700', Property: 'bg-amber-50 text-amber-700',
  Labour: 'bg-orange-50 text-orange-700', Family: 'bg-pink-50 text-pink-700',
  Corporate: 'bg-indigo-50 text-indigo-700', Other: 'bg-gray-100 text-gray-600',
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const daysUntil = (d) => Math.ceil((new Date(d) - new Date()) / (1000*60*60*24));

// ── API wrapper ───────────────────────────────────────────────────────────────
const api = async (path, opts = {}) => {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: authHeader(), ...opts });
  return res.json();
};

// ── Sub-components ────────────────────────────────────────────────────────────

/** Inline form modal */
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-gray-900 heading-display tracking-tighter">{title}</h3>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-forest rounded-xl hover:bg-gray-50 transition-all"><X size={20} /></button>
      </div>
      {children}
    </motion.div>
  </div>
);

/** Stat card */
const StatCard = ({ label, value, icon: Icon, color = 'forest' }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40">
    <div className={`w-12 h-12 rounded-2xl bg-forest flex items-center justify-center text-lime mb-4`}>
      <Icon size={22} />
    </div>
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-4xl font-black text-gray-900 heading-display tracking-tighter">{value}</p>
  </div>
);

/** Citation card (IndianKanoon case) */
const CitedCaseCard = ({ c }) => (
  <a href={c.url} target="_blank" rel="noopener noreferrer"
     className="block bg-forest/95 border border-white/10 p-5 rounded-2xl hover:bg-forest transition-all group">
    <div className="flex justify-between items-start gap-3 mb-2">
      <p className="text-offwhite font-bold text-sm leading-snug group-hover:text-lime transition-colors">{c.title}</p>
      <ExternalLink size={14} className="text-lime flex-shrink-0 mt-0.5" />
    </div>
    <div className="flex gap-3 flex-wrap">
      <span className="text-[9px] font-black uppercase tracking-widest bg-white/10 text-offwhite/60 px-2 py-0.5 rounded-full">{c.court}</span>
      {c.date && <span className="text-[9px] font-black uppercase tracking-widest bg-white/10 text-offwhite/60 px-2 py-0.5 rounded-full">{c.date}</span>}
      {c.outcome && <span className="text-[9px] font-black uppercase tracking-widest bg-lime/20 text-lime px-2 py-0.5 rounded-full">{c.outcome}</span>}
    </div>
  </a>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const LawyerDashboardPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseTab, setCaseTab] = useState('details');
  const [loading, setLoading] = useState(false);

  // Modals
  const [showAddCase, setShowAddCase] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddHearing, setShowAddHearing] = useState(false);

  // Forms
  const [caseForm, setCaseForm] = useState({ caseId: '', clientName: '', title: '', court: '', category: 'Civil', filingDate: '' });
  const [clientForm, setClientForm] = useState({ name: '', email: '', phone: '' });
  const [hearingForm, setHearingForm] = useState({ date: '', notes: '' });
  const [statusForm, setStatusForm] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const lawyerName = localStorage.getItem('nyai_lawyer_name') || 'Lawyer';
  const initials = lawyerName.substring(0, 2).toUpperCase();

  // ── Data fetchers ──────────────────────────────────────────────────────────
  const fetchDashboard = async () => {
    try {
      const d = await api('/api/lawyer/dashboard');
      setData(d);
    } catch (e) { console.warn('Dashboard fetch failed'); }
  };

  const fetchCases = async () => {
    try {
      const d = await api('/api/lawyer/cases');
      if (Array.isArray(d)) setCases(d);
    } catch (e) { console.warn('Cases fetch failed'); }
  };

  const fetchClients = async () => {
    try {
      const d = await api('/api/lawyer/clients');
      if (Array.isArray(d)) setClients(d);
    } catch (e) { console.warn('Clients fetch failed'); }
  };

  const refreshCase = async (caseId) => {
    const updated = await api(`/api/lawyer/cases/${caseId}`);
    setSelectedCase(updated);
    await fetchCases();
  };

  useEffect(() => {
    fetchDashboard();
    fetchCases();
    fetchClients();
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAddCase = async (e) => {
    e.preventDefault(); setLoading(true);
    await api('/api/lawyer/cases', { method: 'POST', body: JSON.stringify(caseForm) });
    setShowAddCase(false); setCaseForm({ caseId: '', clientName: '', title: '', court: '', category: 'Civil', filingDate: '' });
    await fetchCases(); await fetchDashboard(); setLoading(false);
  };

  const handleAddClient = async (e) => {
    e.preventDefault(); setLoading(true);
    await api('/api/lawyer/clients', { method: 'POST', body: JSON.stringify(clientForm) });
    setShowAddClient(false); setClientForm({ name: '', email: '', phone: '' });
    await fetchClients(); await fetchDashboard(); setLoading(false);
  };

  const handleAddHearing = async (e) => {
    e.preventDefault(); setLoading(true);
    await api(`/api/lawyer/cases/${selectedCase.caseId}/hearings`, { method: 'POST', body: JSON.stringify(hearingForm) });
    setShowAddHearing(false); setHearingForm({ date: '', notes: '' });
    await refreshCase(selectedCase.caseId); await fetchDashboard(); setLoading(false);
  };

  const handleStatusChange = async (status) => {
    if (!status || !selectedCase) return;
    await api(`/api/lawyer/cases/${selectedCase.caseId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await refreshCase(selectedCase.caseId); await fetchDashboard();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedCase) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target.result;
      await api(`/api/lawyer/cases/${selectedCase.caseId}/documents`, {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, fileType: file.type, content })
      });
      await refreshCase(selectedCase.caseId);
      setUploading(false);
    };
    reader.readAsText(file);
  };

  const handleDeleteDoc = async (idx) => {
    await api(`/api/lawyer/cases/${selectedCase.caseId}/documents/${idx}`, { method: 'DELETE' });
    await refreshCase(selectedCase.caseId);
  };

  const handleAiSubmit = async (e, caseId) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true); setAiResult(null);
    try {
      const res = await api(`/api/lawyer/cases/${caseId}/ai-assist`, { method: 'POST', body: JSON.stringify({ query: aiQuery }) });
      setAiResult(res);
      await refreshCase(caseId);
    } catch (err) { console.error(err); }
    setAiLoading(false);
  };

  const handleMarkRead = async () => {
    await api('/api/lawyer/notifications/read', { method: 'PATCH' });
    await fetchDashboard();
  };

  const handleLogout = () => {
    ['nyai_token','nyai_role','nyai_lawyer_name','nyai_user_email'].forEach(k => localStorage.removeItem(k));
    navigate('/login');
  };

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const sidebarLinks = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'cases', label: 'My Cases', icon: Briefcase },
    { id: 'clients', label: 'My Clients', icon: Users },
    { id: 'ai', label: 'AI Assistant', icon: Bot },
    { id: 'hearings', label: 'Hearings', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // ── Hearing groups ─────────────────────────────────────────────────────────
  const allHearings = cases
    .flatMap(c => c.hearings.map(h => ({ ...h, caseTitle: c.title, clientName: c.clientName, court: c.court, caseId: c.caseId, days: daysUntil(h.date) })))
    .filter(h => h.days >= 0)
    .sort((a, b) => a.days - b.days);

  const hearingGroups = {
    'Today': allHearings.filter(h => h.days === 0),
    'This Week': allHearings.filter(h => h.days > 0 && h.days <= 7),
    'This Month': allHearings.filter(h => h.days > 7 && h.days <= 30),
    'Later': allHearings.filter(h => h.days > 30),
  };

  // ── Input class helper ─────────────────────────────────────────────────────
  const inp = "w-full bg-gray-50 border border-gray-100 py-4 px-5 rounded-2xl text-sm font-medium focus:outline-none focus:border-lime transition-all";
  const lbl = "text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2";

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex min-h-screen bg-[#F8F9FA] pt-20">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 hidden lg:flex flex-col sticky top-20 h-[calc(100vh-80px)]">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="w-12 h-12 bg-forest rounded-xl flex items-center justify-center text-lime font-black text-lg">{initials}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-black text-gray-900 truncate uppercase tracking-tighter">Adv. {lawyerName}</h4>
              <p className="text-[10px] font-black text-lime uppercase tracking-widest italic">
                {data?.verified ? '✓ VERIFIED' : 'LAWYER PORTAL'}
              </p>
            </div>
          </div>

          <nav className="space-y-2">
            {sidebarLinks.map(link => (
              <button
                key={link.id}
                onClick={() => { setTab(link.id); setSelectedCase(null); }}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black transition-all ${tab === link.id ? 'bg-forest text-lime shadow-xl shadow-forest/10' : 'text-gray-400 hover:text-forest hover:bg-gray-50'}`}
              >
                <link.icon size={20} />
                {link.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all mt-4"
            >
              <LogOut size={20} /> Logout
            </button>
          </nav>

          {data?.unreadCount > 0 && (
            <div className="mt-8 bg-forest/5 border border-lime/20 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Notifications</p>
                <button onClick={handleMarkRead} className="text-[9px] font-black text-lime uppercase tracking-widest hover:underline">{data.unreadCount} unread</button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {data.notifications.map((n, i) => (
                  <p key={i} className="text-xs text-gray-600 font-medium leading-snug border-l-2 border-lime pl-2">{n.message}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 lg:p-12 overflow-x-hidden">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div>
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <div>
                <h1 className="text-4xl font-black text-gray-900 heading-display lowercase tracking-tighter mb-1">
                  lawyer <span className="text-forest italic underline decoration-lime decoration-4 underline-offset-4">portal.</span>
                </h1>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] italic">
                  Bar No: {data?.barCouncilNumber || '—'}
                </p>
              </div>
              <Bell size={24} className="text-gray-400 hover:text-forest cursor-pointer" onClick={handleMarkRead} />
            </header>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <StatCard label="Total Cases" value={data?.totalCases ?? '—'} icon={Briefcase} />
              <StatCard label="Active Cases" value={data?.activeCases ?? '—'} icon={Scale} />
              <StatCard label="Cases Won" value={data?.wonCases ?? '—'} icon={TrendingUp} />
              <StatCard label="Total Clients" value={data?.totalClients ?? '—'} icon={Users} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Cases */}
              <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/40">
                <h3 className="text-xl font-black text-gray-900 heading-display mb-6">Recent <span className="italic">Cases.</span></h3>
                <div className="space-y-4">
                  {(data?.recentCases || []).length === 0 && <p className="text-sm text-gray-400 italic">No cases yet.</p>}
                  {(data?.recentCases || []).map((c, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-lime/5 transition-all group cursor-pointer" onClick={() => { setCases(prev => prev); setSelectedCase(c); setTab('cases'); }}>
                      <div className="w-10 h-10 bg-forest rounded-xl flex items-center justify-center text-lime flex-shrink-0"><Briefcase size={16} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-900 truncate">{c.title}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">{c.clientName} • {c.court}</p>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${STATUS_STYLE[c.status]}`}>{c.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Hearings */}
              <div className="bg-forest noise-overlay p-8 rounded-[3rem] border border-white/10 shadow-2xl">
                <h3 className="text-xl font-black text-white heading-display mb-6">Upcoming <span className="italic text-lime">Hearings.</span></h3>
                <div className="space-y-4">
                  {(data?.upcomingHearings || []).length === 0 && <p className="text-sm text-white/40 italic">No upcoming hearings.</p>}
                  {(data?.upcomingHearings || []).map((h, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-offwhite font-bold text-sm">{h.caseTitle}</p>
                        <span className="text-lime text-[10px] font-black">in {h.daysUntil}d</span>
                      </div>
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{h.court} • {fmtDate(h.date)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MY CASES ── */}
        {tab === 'cases' && !selectedCase && (
          <div>
            <div className="flex items-center justify-between mb-10">
              <h1 className="text-4xl font-black text-gray-900 heading-display lowercase tracking-tighter">my <span className="text-forest italic underline decoration-lime decoration-4 underline-offset-4">cases.</span></h1>
              <button onClick={() => setShowAddCase(true)} className="bg-forest text-lime px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-forest/20">
                <Plus size={16} /> Add New Case
              </button>
            </div>

            {cases.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <Briefcase size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-black uppercase tracking-widest text-sm italic">No cases yet. Add your first case.</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {cases.map((c, i) => {
                const nextHearing = c.hearings.filter(h => daysUntil(h.date) >= 0).sort((a,b) => new Date(a.date) - new Date(b.date))[0];
                return (
                  <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/30 hover:border-lime/40 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">{c.caseId || 'No ID'}</p>
                        <h3 className="text-lg font-black text-gray-900 leading-tight">{c.title}</h3>
                        <p className="text-sm text-gray-500 font-medium mt-1">{c.clientName} • {c.court}</p>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${STATUS_STYLE[c.status]}`}>{c.status}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap mb-4">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${CAT_STYLE[c.category] || CAT_STYLE.Other}`}>{c.category}</span>
                      {nextHearing && <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-forest/10 text-forest">Next: {fmtDate(nextHearing.date)}</span>}
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{c.documents.length} docs</span>
                    </div>
                    <button
                      onClick={() => { setSelectedCase(c); setCaseTab('details'); setAiResult(null); }}
                      className="w-full py-3 bg-gray-50 hover:bg-forest hover:text-lime text-gray-700 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                    >
                      Open Case <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CASE DETAIL ── */}
        {tab === 'cases' && selectedCase && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setSelectedCase(null)} className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-forest hover:border-lime/40 transition-all shadow-sm">
                <ChevronRight size={18} className="rotate-180" />
              </button>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{selectedCase.caseId}</p>
                <h1 className="text-2xl font-black text-gray-900 tracking-tighter">{selectedCase.title}</h1>
              </div>
              <span className={`ml-auto text-[10px] font-black uppercase px-3 py-1.5 rounded-full ${STATUS_STYLE[selectedCase.status]}`}>{selectedCase.status}</span>
            </div>

            {/* Case Tabs */}
            <div className="flex gap-2 mb-8 bg-gray-100 p-1.5 rounded-2xl w-fit">
              {['details', 'documents', 'ai'].map(t => (
                <button key={t} onClick={() => setCaseTab(t)}
                  className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${caseTab === t ? 'bg-forest text-lime shadow-lg' : 'text-gray-500 hover:text-forest'}`}
                >
                  {t === 'ai' ? 'AI Assistant' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* DETAILS TAB */}
            {caseTab === 'details' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 space-y-4">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest italic mb-4">Case Info</h3>
                  {[
                    ['Client', selectedCase.clientName],
                    ['Court', selectedCase.court],
                    ['Category', selectedCase.category],
                    ['Filing Date', fmtDate(selectedCase.filingDate)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center py-3 border-b border-gray-50">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{k}</span>
                      <span className="text-sm font-bold text-gray-900">{v || '—'}</span>
                    </div>
                  ))}
                  <div className="pt-4">
                    <label className={lbl}>Update Status</label>
                    <div className="flex gap-2 flex-wrap">
                      {['active','won','lost','settled','dropped'].map(s => (
                        <button key={s} onClick={() => handleStatusChange(s)}
                          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedCase.status === s ? 'bg-forest text-lime' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest italic">Hearings</h3>
                    <button onClick={() => setShowAddHearing(true)} className="bg-forest text-lime px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:scale-105 transition-all">
                      <Plus size={12} /> Add
                    </button>
                  </div>
                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {selectedCase.hearings.length === 0 && <p className="text-sm text-gray-400 italic">No hearings added yet.</p>}
                    {[...selectedCase.hearings].sort((a,b) => new Date(b.date) - new Date(a.date)).map((h, i) => {
                      const d = daysUntil(h.date);
                      return (
                        <div key={i} className={`p-4 rounded-2xl border ${d >= 0 ? 'bg-lime/5 border-lime/20' : 'bg-gray-50 border-gray-100'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold text-gray-900">{fmtDate(h.date)}</p>
                              {h.notes && <p className="text-xs text-gray-500 mt-1">{h.notes}</p>}
                            </div>
                            {d >= 0 && <span className="text-[9px] font-black text-lime bg-forest px-2 py-0.5 rounded-full">in {d}d</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* DOCUMENTS TAB */}
            {caseTab === 'documents' && (
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest italic">Case Documents</h3>
                  <label className="bg-forest text-lime px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all cursor-pointer shadow-xl shadow-forest/20">
                    {uploading ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploading ? 'Uploading...' : 'Upload File'}
                    <input ref={fileRef} type="file" accept=".txt,.doc,.docx,.pdf" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>

                <div className="border-4 border-dashed border-gray-100 rounded-[2rem] p-10 text-center mb-6 hover:border-lime/40 transition-all">
                  <FileText size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm font-bold text-gray-400">Drag & drop or click Upload above</p>
                  <p className="text-[10px] text-gray-300 font-bold mt-1 uppercase tracking-widest">TXT, DOC, PDF supported • Text extracted automatically</p>
                </div>

                {selectedCase.documents.length === 0 && <p className="text-sm text-gray-400 italic text-center">No documents uploaded yet.</p>}
                <div className="space-y-3">
                  {selectedCase.documents.map((doc, i) => (
                    <div key={i} className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl hover:bg-lime/5 border border-gray-100 hover:border-lime/20 transition-all">
                      <div className="w-10 h-10 bg-forest rounded-xl flex items-center justify-center text-lime flex-shrink-0"><FileText size={18} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-900 truncate">{doc.fileName}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">{doc.fileType} • {fmtDate(doc.uploadedAt)} • {doc.content?.length || 0} chars</p>
                      </div>
                      <button onClick={() => handleDeleteDoc(i)} className="p-2 text-gray-300 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI ASSISTANT TAB */}
            {caseTab === 'ai' && (
              <div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 mb-6">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest italic mb-6">AI Legal Assistant — {selectedCase.title}</h3>
                  <form onSubmit={(e) => handleAiSubmit(e, selectedCase.caseId)} className="flex gap-4">
                    <input
                      value={aiQuery}
                      onChange={e => setAiQuery(e.target.value)}
                      placeholder="Ask AI about this case… e.g. 'What is my strongest argument?'"
                      className="flex-1 bg-gray-50 border border-gray-100 py-4 px-6 rounded-2xl text-sm font-medium focus:outline-none focus:border-lime"
                    />
                    <button type="submit" disabled={aiLoading}
                      className="bg-forest text-lime px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-forest/20 disabled:opacity-50">
                      {aiLoading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </form>
                </div>

                {aiResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-4">AI Response</p>
                      <div className="text-sm text-gray-800 font-medium leading-relaxed whitespace-pre-wrap">{aiResult.response}</div>
                    </div>

                    {aiResult.citedCases?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-4">Cited Cases from IndianKanoon</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {aiResult.citedCases.map((c, i) => <CitedCaseCard key={i} c={c} />)}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {selectedCase.aiNotes?.length > 0 && (
                  <div className="mt-8">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-4">Previous Queries</p>
                    <div className="space-y-4">
                      {[...selectedCase.aiNotes].reverse().map((note, i) => (
                        <details key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                          <summary className="p-5 cursor-pointer font-bold text-sm text-gray-700 list-none flex justify-between items-center hover:bg-gray-50">
                            {note.query}
                            <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                          </summary>
                          <div className="px-5 pb-5 text-xs text-gray-600 leading-relaxed whitespace-pre-wrap border-t border-gray-50 pt-4">
                            {note.response}
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── CLIENTS ── */}
        {tab === 'clients' && (
          <div>
            <div className="flex items-center justify-between mb-10">
              <h1 className="text-4xl font-black text-gray-900 heading-display lowercase tracking-tighter">my <span className="text-forest italic underline decoration-lime decoration-4 underline-offset-4">clients.</span></h1>
              <button onClick={() => setShowAddClient(true)} className="bg-forest text-lime px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-forest/20">
                <Plus size={16} /> Add Client
              </button>
            </div>

            {clients.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <Users size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-black uppercase tracking-widest text-sm italic">No clients yet. Add your first client.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients.map((cl, i) => {
                const clientCases = cases.filter(c => c.clientName === cl.name).length;
                return (
                  <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/30">
                    <div className="w-12 h-12 bg-forest rounded-2xl flex items-center justify-center text-lime font-black text-lg mb-4">
                      {cl.name.substring(0, 2).toUpperCase()}
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-1">{cl.name}</h3>
                    {cl.email && <p className="text-xs text-gray-400 font-medium mb-1">{cl.email}</p>}
                    {cl.phone && <p className="text-xs text-gray-400 font-medium mb-4">{cl.phone}</p>}
                    <div className="flex gap-2 flex-wrap">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{clientCases} case{clientCases !== 1 ? 's' : ''}</span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Added {fmtDate(cl.addedAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── AI ASSISTANT (cross-case) ── */}
        {tab === 'ai' && (
          <div>
            <div className="mb-10">
              <h1 className="text-4xl font-black text-gray-900 heading-display lowercase tracking-tighter mb-2">AI case <span className="text-forest italic underline decoration-lime decoration-4 underline-offset-4">assistant.</span></h1>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] italic">Select a case and ask anything — RAG-powered from IndianKanoon</p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 mb-6">
              <label className={lbl}>Select Case</label>
              <select
                value={selectedCase?._id || ''}
                onChange={e => {
                  const c = cases.find(c => c._id === e.target.value);
                  setSelectedCase(c || null);
                  setAiResult(null);
                }}
                className={inp}
              >
                <option value="">— Choose a case —</option>
                {cases.map((c, i) => <option key={i} value={c._id}>{c.title} ({c.clientName})</option>)}
              </select>
            </div>

            {selectedCase && (
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 mb-6">
                <form onSubmit={(e) => handleAiSubmit(e, selectedCase.caseId)} className="flex gap-4">
                  <input
                    value={aiQuery}
                    onChange={e => setAiQuery(e.target.value)}
                    placeholder="Ask AI about this case…"
                    className="flex-1 bg-gray-50 border border-gray-100 py-4 px-6 rounded-2xl text-sm font-medium focus:outline-none focus:border-lime"
                  />
                  <button type="submit" disabled={aiLoading}
                    className="bg-forest text-lime px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-forest/20 disabled:opacity-50">
                    {aiLoading ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </form>
              </div>
            )}

            {aiResult && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-4">AI Response</p>
                  <div className="text-sm text-gray-800 font-medium leading-relaxed whitespace-pre-wrap">{aiResult.response}</div>
                </div>
                {aiResult.citedCases?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-4">Cited Cases — IndianKanoon</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiResult.citedCases.map((c, i) => <CitedCaseCard key={i} c={c} />)}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* ── HEARINGS ── */}
        {tab === 'hearings' && (
          <div>
            <h1 className="text-4xl font-black text-gray-900 heading-display lowercase tracking-tighter mb-10">upcoming <span className="text-forest italic underline decoration-lime decoration-4 underline-offset-4">hearings.</span></h1>

            {allHearings.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-black uppercase tracking-widest text-sm italic">No upcoming hearings.</p>
              </div>
            )}

            {Object.entries(hearingGroups).map(([group, hearings]) => hearings.length > 0 && (
              <div key={group} className="mb-10">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic mb-4 flex items-center gap-2">
                  {group === 'Today' && <span className="w-2 h-2 bg-lime rounded-full animate-pulse"></span>}
                  {group}
                </p>
                <div className="space-y-4">
                  {hearings.map((h, i) => (
                    <div key={i} className={`p-6 rounded-[2rem] border flex items-center gap-6 ${group === 'Today' ? 'bg-lime border-lime/30' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/30'}`}>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black flex-shrink-0 ${group === 'Today' ? 'bg-forest text-lime' : 'bg-forest text-lime'}`}>
                        {new Date(h.date).getDate()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-black text-base ${group === 'Today' ? 'text-forest' : 'text-gray-900'}`}>{h.caseTitle}</p>
                        <p className={`text-xs font-bold italic ${group === 'Today' ? 'text-forest/70' : 'text-gray-400'}`}>{h.clientName} • {h.court}</p>
                        {h.notes && <p className={`text-xs mt-1 ${group === 'Today' ? 'text-forest/80' : 'text-gray-500'}`}>{h.notes}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-black ${group === 'Today' ? 'text-forest' : 'text-gray-900'}`}>{fmtDate(h.date)}</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${group === 'Today' ? 'text-forest/70' : 'text-lime'}`}>
                          {h.days === 0 ? 'TODAY' : `In ${h.days} days`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && (
          <div>
            <h1 className="text-4xl font-black text-gray-900 heading-display lowercase tracking-tighter mb-10">account <span className="text-forest italic underline decoration-lime decoration-4 underline-offset-4">settings.</span></h1>
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/40 max-w-xl">
              <div className="w-16 h-16 bg-forest rounded-2xl flex items-center justify-center text-lime font-black text-2xl mb-6">{initials}</div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tighter mb-1">Adv. {lawyerName}</h2>
              <p className="text-gray-400 text-sm font-medium italic mb-6">{localStorage.getItem('nyai_user_email')}</p>
              {data?.barCouncilNumber && (
                <div className="flex justify-between items-center py-4 border-b border-gray-50">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bar Council No.</span>
                  <span className="text-sm font-bold text-gray-900">{data.barCouncilNumber}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-4 border-b border-gray-50">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Portal Status</span>
                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${data?.verified ? 'bg-lime text-forest' : 'bg-amber-100 text-amber-700'}`}>{data?.verified ? '✓ Verified' : 'Pending Verification'}</span>
              </div>
              <button onClick={handleLogout} className="mt-8 w-full py-4 border-2 border-red-200 rounded-2xl text-red-500 font-black text-sm uppercase tracking-widest hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                <LogOut size={16} /> Logout of Portal
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Modals ── */}
      {showAddCase && (
        <Modal title="Add New Case" onClose={() => setShowAddCase(false)}>
          <form onSubmit={handleAddCase} className="space-y-5">
            {[
              { label: 'Case ID (optional)', key: 'caseId', placeholder: 'e.g. HC/2026/1234' },
              { label: 'Case Title', key: 'title', placeholder: 'e.g. Sharma vs State of Maharashtra', req: true },
              { label: 'Client Name', key: 'clientName', placeholder: 'e.g. Rajesh Sharma' },
              { label: 'Court', key: 'court', placeholder: 'e.g. Bombay High Court' },
            ].map(f => (
              <div key={f.key}>
                <label className={lbl}>{f.label}</label>
                <input required={f.req} value={caseForm[f.key]} placeholder={f.placeholder}
                  onChange={e => setCaseForm(p => ({ ...p, [f.key]: e.target.value }))} className={inp} />
              </div>
            ))}
            <div>
              <label className={lbl}>Category</label>
              <select value={caseForm.category} onChange={e => setCaseForm(p => ({ ...p, category: e.target.value }))} className={inp}>
                {['Consumer','Criminal','Civil','Property','Labour','Family','Corporate','Other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Filing Date</label>
              <input type="date" value={caseForm.filingDate} onChange={e => setCaseForm(p => ({ ...p, filingDate: e.target.value }))} className={inp} />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-forest text-lime font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-forest/20">
              {loading ? 'Adding...' : 'Add Case'}
            </button>
          </form>
        </Modal>
      )}

      {showAddClient && (
        <Modal title="Add Client" onClose={() => setShowAddClient(false)}>
          <form onSubmit={handleAddClient} className="space-y-5">
            {[
              { label: 'Full Name', key: 'name', req: true },
              { label: 'Email Address', key: 'email', type: 'email' },
              { label: 'Phone Number', key: 'phone', type: 'tel' },
            ].map(f => (
              <div key={f.key}>
                <label className={lbl}>{f.label}</label>
                <input required={f.req} type={f.type || 'text'} value={clientForm[f.key]}
                  onChange={e => setClientForm(p => ({ ...p, [f.key]: e.target.value }))} className={inp} />
              </div>
            ))}
            <button type="submit" disabled={loading} className="w-full bg-forest text-lime font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-forest/20">
              {loading ? 'Adding...' : 'Add Client'}
            </button>
          </form>
        </Modal>
      )}

      {showAddHearing && selectedCase && (
        <Modal title={`Add Hearing — ${selectedCase.title}`} onClose={() => setShowAddHearing(false)}>
          <form onSubmit={handleAddHearing} className="space-y-5">
            <div>
              <label className={lbl}>Date</label>
              <input required type="date" value={hearingForm.date} onChange={e => setHearingForm(p => ({ ...p, date: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className={lbl}>Notes (optional)</label>
              <textarea rows={3} value={hearingForm.notes} placeholder="e.g. Arguments on bail application"
                onChange={e => setHearingForm(p => ({ ...p, notes: e.target.value }))}
                className={inp + ' resize-none'} />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-forest text-lime font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-forest/20">
              {loading ? 'Adding...' : 'Add Hearing'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default LawyerDashboardPage;
