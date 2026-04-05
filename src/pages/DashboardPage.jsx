import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, FileText, Bell, Users, Settings, 
  Search, ShieldAlert, CheckCircle2, TrendingUp,
  Clock, Download, MoreVertical, Plus, Scale,
  ChevronRight, Calendar, AlertTriangle, Sparkles, MapPin, Trash2, ArrowRight
} from 'lucide-react';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [userName, setUserName] = useState("Guest");

  React.useEffect(() => {
    const savedName = localStorage.getItem('nyai_user_name');
    if (savedName) setUserName(savedName);
  }, []);

  const initials = userName.substring(0, 2).toUpperCase();

  const sidebarLinks = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "documents", label: "My Documents", icon: FileText },
    { id: "alerts", label: "Legal Alerts", icon: Bell },
    { id: "consultations", label: "Consultations", icon: Users },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  const recentDocs = [
    { name: "Rental_Agreement_Mumbai", type: "Rental Agreement", date: "Oct 12, 2026", risk: "Low" },
    { name: "Notice_Amazon_India", type: "Consumer Complaint", date: "Sep 28, 2026", risk: "Medium" },
    { name: "Freelance_SOW", type: "Service Contract", date: "Sep 15, 2026", risk: "Low" }
  ];

  const alerts = [
    { id: 1, title: "GST Filing Due", category: "Compliance", timeLeft: "3 days", severity: "High" },
    { id: 2, title: "Rental Agreement Expiry", category: "Property", timeLeft: "12 days", severity: "Medium" },
    { id: 3, title: "ITR Deadline", category: "Tax", timeLeft: "45 days", severity: "Low" }
  ];

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] pt-20">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 hidden lg:flex flex-col sticky top-20 h-[calc(100vh-80px)]">
         <div className="p-8">
            <div className="flex items-center gap-4 mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-100">
               <div className="w-12 h-12 bg-forest rounded-xl flex items-center justify-center text-lime font-black text-lg">{initials}</div>
               <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-gray-900 truncate uppercase tracking-tighter">{userName}</h4>
                  <p className="text-[10px] font-black text-lime uppercase tracking-widest italic">PRO MEMBER</p>
               </div>
            </div>

            <nav className="space-y-2">
               {sidebarLinks.map(link => (
                 <button 
                  key={link.id} 
                  onClick={() => setActiveTab(link.id)}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === link.id ? 'bg-forest text-lime shadow-xl shadow-forest/10' : 'text-gray-400 hover:text-forest hover:bg-gray-50'}`}
                 >
                   <link.icon size={20} />
                   {link.label}
                 </button>
               ))}
            </nav>
         </div>

      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-12 overflow-x-hidden">
         {/* Top Header */}
         <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
            <div>
               <h1 className="text-4xl font-black text-gray-900 heading-display lowercase tracking-tighter mb-2">legal <span className="text-forest italic underline decoration-lime decoration-4 underline-offset-4">dashboard.</span></h1>
               <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] italic">Your justice score and compliance heartbeat</p>
            </div>
            <div className="flex gap-4">
               <button className="bg-white border border-gray-100 p-4 rounded-xl text-gray-400 hover:text-forest hover:scale-110 transition-all shadow-sm relative">
                  <Bell size={24} />
                  <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
               </button>
               <button className="bg-forest text-offwhite px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-2xl shadow-forest/20 hover:bg-forest-light transform hover:scale-105 transition-all">
                  <Download size={18} /> Export Full Audit
               </button>
            </div>
         </header>

         {/* Overview Grid */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Score Card */}
            <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
               <div className="relative w-48 h-48 flex items-center justify-center flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                     <circle cx="96" cy="96" r="80" stroke="#f3f4f6" strokeWidth="12" fill="transparent" />
                     <motion.circle 
                        cx="96" cy="96" r="80" stroke="#0D3B2E" strokeWidth="16" fill="transparent" 
                        strokeDasharray="502.6"
                        initial={{ strokeDashoffset: 502.6 }}
                        animate={{ strokeDashoffset: 502.6 - (502.6 * 0.82) }}
                        transition={{ duration: 2, ease: "easeOut" }}
                     />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-5xl font-black text-forest heading-display tracking-tight">82</span>
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Excellent</span>
                  </div>
                  <div className="absolute top-0 right-0 p-2 bg-lime text-forest rounded-lg shadow-lg rotate-12 scale-110">
                     <TrendingUp size={16} />
                  </div>
               </div>

               <div className="flex-1 space-y-6">
                  <h3 className="text-2xl font-black text-gray-900 leading-tight">Your Legal Health Score is up <span className="text-green-500 italic">4% this month.</span></h3>
                  <div className="grid grid-cols-2 gap-4">
                     {[
                       { label: "Docs Verified", value: "12/15", icon: <FileText size={14} /> },
                       { label: "Active Disputes", value: "0", icon: <Scale size={14} /> },
                       { label: "Alerts Cleared", value: "85%", icon: <CheckCircle2 size={14} /> },
                       { label: "Consultation Hrs", value: "4.5h", icon: <Clock size={14} /> }
                     ].map((stat, i) => (
                       <div key={i} className="bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                             {stat.icon} {stat.label}
                          </div>
                          <p className="text-xl font-black text-gray-900">{stat.value}</p>
                       </div>
                     ))}
                  </div>
                  <button className="text-forest text-[10px] font-black uppercase tracking-widest flex items-center gap-2 p-1 border-b-2 border-lime hover:gap-4 transition-all w-fit">
                    Improve Score further <ArrowRight size={14} />
                  </button>
               </div>
            </div>

            {/* Smart Alerts Feed */}
            <div className="bg-forest noise-overlay p-10 rounded-[3rem] border border-white/10 shadow-2xl flex flex-col">
               <div className="flex justify-between items-center mb-8">
                  <h4 className="text-white text-[10px] font-black uppercase tracking-widest border-b border-lime/40 pb-2 italic">Priority Notifications</h4>
                  <span className="text-lime text-[10px] font-black animate-pulse">● LIVE</span>
               </div>
               <div className="space-y-4 flex-1">
                  {alerts.map(alert => (
                    <div key={alert.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl group hover:bg-white/10 transition-all cursor-pointer">
                       <div className="flex justify-between items-start mb-2">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${alert.severity === 'High' ? 'bg-red-500 text-white' : alert.severity === 'Medium' ? 'bg-amber-400 text-forest' : 'bg-lime text-forest'}`}>
                            {alert.category}
                          </span>
                          <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest font-mono italic">in {alert.timeLeft}</p>
                       </div>
                       <h5 className="text-offwhite font-bold text-sm group-hover:text-lime transition-colors">{alert.title}</h5>
                    </div>
                  ))}
               </div>
               <button className="w-full bg-lime text-forest font-black py-4 rounded-2xl text-xs uppercase tracking-widest mt-8 shadow-xl shadow-lime/10 hover:scale-105 transition-all">Add Custom Alert <Plus size={16} className="inline ml-2" /></button>
            </div>
         </div>

         {/* Bottom Sections */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* My Documents Registry */}
            <div className="lg:col-span-2">
               <div className="flex items-center justify-between mb-8 px-4">
                  <h3 className="text-2xl font-black text-gray-900 heading-display">Document <span className="italic">History.</span></h3>
                  <button className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-forest transition-all shadow-sm"><MoreVertical size={18} /></button>
               </div>
               <div className="space-y-2">
                  {recentDocs.map((doc, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/30 flex items-center gap-8 group hover:border-lime/50 transition-all cursor-pointer">
                       <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-lime group-hover:text-forest transition-colors">
                          <FileText size={24} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-black text-gray-900 truncate uppercase tracking-tighter mb-1">{doc.name}</h4>
                          <div className="flex gap-4">
                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">{doc.type}</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">• {doc.date}</p>
                          </div>
                       </div>
                       <div className="hidden md:flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${doc.risk === 'Low' ? 'bg-green-50 text-green-500 border border-green-100' : 'bg-amber-50 text-amber-500 border border-amber-100'}`}>
                            {doc.risk} Risk
                          </span>
                       </div>
                       <div className="flex gap-2">
                          <button className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-forest hover:bg-gray-100 transition-all active:scale-90 shadow-sm"><Download size={18} /></button>
                          <button className="p-3 bg-forest text-lime rounded-xl hover:bg-forest-light transition-all active:scale-90 shadow-lg shadow-forest/10"><ChevronRight size={18} /></button>
                       </div>
                    </div>
                  ))}
               </div>
               <button className="w-full py-6 mt-6 border-4 border-dashed border-gray-100 rounded-[2.5rem] text-gray-300 font-black uppercase tracking-[0.3em] text-xs hover:border-lime hover:text-forest transition-all italic">Go to Document Studio</button>
            </div>

            {/* Compliance Sidebar */}
            <div>
               <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50">
                  <div className="flex justify-between items-center mb-8">
                     <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Compliance Status</h4>
                     <p className="text-[10px] font-black text-green-500">8 AVAILABLE</p>
                  </div>
                  <div className="space-y-6">
                     {[
                       { label: "Income Tax Proof", done: true },
                       { label: "Rental Renewal", done: false },
                       { label: "IP Trademark Status", done: true },
                       { label: "GST Filing Status", done: true },
                       { label: "Family Will Update", done: false }
                     ].map((item, i) => (
                       <div key={i} className="flex items-center justify-between group cursor-pointer">
                          <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.done ? 'bg-green-50 text-green-500' : 'bg-gray-50 text-gray-400 group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors'}`}>
                                {item.done ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                             </div>
                             <p className={`text-sm font-bold ${item.done ? 'text-gray-900 italic line-through opacity-40' : 'text-gray-600 group-hover:text-forest transition-colors'}`}>{item.label}</p>
                          </div>
                          <ChevronRight size={16} className="text-gray-200" />
                       </div>
                     ))}
                  </div>
                  <div className="mt-10 pt-10 border-t border-gray-50">
                     <p className="text-[10px] text-gray-400 italic mb-4 leading-relaxed tracking-wide">Sync your legal identity with Digilocker for automatic checklist updates.</p>
                     <button className="w-full py-4 border border-forest border-2 rounded-2xl text-forest font-black uppercase tracking-widest text-xs hover:bg-forest hover:text-lime transition-all">Link to Digilocker</button>
                  </div>
               </div>

               <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 mt-8 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Emergency SOS</p>
                    <h4 className="text-xl font-black text-gray-900 tracking-tighter">Fast-Track Status</h4>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-500 animate-pulse">
                     <AlertTriangle size={24} />
                  </div>
               </div>
            </div>
         </div>
      </main>
    </div>
  );
};

export default DashboardPage;
