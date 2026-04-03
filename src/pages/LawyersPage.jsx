import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Globe, Star, ShieldCheck, Scale, Phone, 
  Search, Filter, MapPin, Grid, List, ArrowRight,
  Zap, CheckCircle2, MoreVertical, Bookmark, MessageSquare, Video, History
} from 'lucide-react';

const LawyerCard = ({ id, name, specialty, bio, rating, reviews, free, languages, availability, photo }) => (
  <motion.div 
    whileHover={{ y: -8 }}
    className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 group cursor-pointer hover:border-lime/50 transition-all flex flex-col h-full overflow-hidden relative"
  >
    <div className="absolute top-6 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
       <button className="p-2 bg-gray-50 border border-gray-100 rounded-lg text-gray-400 hover:text-forest hover:bg-white hover:scale-110 transition-all shadow-sm"><Bookmark size={16} /></button>
    </div>

    <div className="flex items-center gap-6 mb-8">
       <div className="relative">
          <img src={photo || `https://i.pravatar.cc/150?u=${id}`} alt={name} className="w-20 h-20 rounded-2xl object-cover" />
          <div className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-white w-6 h-6 rounded-full flex items-center justify-center">
             <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
          </div>
       </div>
       <div>
          <div className="flex items-center gap-2 mb-1">
             <h3 className="text-xl font-black text-gray-900 group-hover:text-forest transition-colors">{name}</h3>
             <ShieldCheck size={20} className="text-lime" fill="currentColor" fillOpacity={0.1} />
          </div>
          <p className="text-[10px] uppercase font-black text-lime tracking-widest italic">{specialty}</p>
          <div className="flex items-center gap-3 mt-2">
             <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < Math.floor(rating) ? "currentColor" : "none"} />)}
             </div>
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{reviews} Reviews</p>
          </div>
       </div>
    </div>

    <div className="flex-1">
       <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-8 italic">"{bio}"</p>
       
       <div className="flex flex-wrap gap-2 mb-8 border-t border-gray-50 pt-6">
          {languages.map(lang => (
            <span key={lang} className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-gray-50 border border-gray-100 rounded text-gray-400">{lang}</span>
          ))}
       </div>
    </div>

    <div className="space-y-4">
       <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-forest">
             <Scale size={18} />
             <p className="text-sm font-black tracking-tight">{free ? 'FREE First Chat' : '₹600 / Session'}</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase">
             <MapPin size={12} className="text-red-500" /> Bengaluru
          </div>
       </div>
       <button className="w-full bg-forest text-offwhite font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-forest/20 hover:bg-forest-light transform hover:scale-105 active:scale-95 transition-all group-hover:bg-lime group-hover:text-forest group-hover:shadow-lime/20">
          Connect Now <ArrowRight size={20} />
       </button>
    </div>
  </motion.div>
);

const LawyersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const categories = ["All", "Family", "Criminal", "Property", "Corporate", "Consumer", "Tax", "IP Law"];

  const lawyers = [
    { id: 1, name: "Adv. Rajesh Sharma", specialty: "Criminal Law", rating: 4.9, reviews: 1240, languages: ["English", "Hindi", "Punjabi"], availability: "Available", bio: "Former Public Prosecutor with 15+ years experience in criminal defense and bail matters." },
    { id: 2, name: "Adv. Animesh Pathak", specialty: "Family & Divorce", rating: 4.8, reviews: 890, languages: ["English", "Bengali", "Hindi"], availability: "Available", bio: "Expert in matrimonial disputes, child custody, and mutual divorce settlements." },
    { id: 3, name: "Adv. Kavita Deshpande", specialty: "Property & Real Estate", rating: 4.7, reviews: 560, languages: ["English", "Marathi", "Hindi"], availability: "Waitlist", bio: "Specializes in property verification, title deeds, and RERA disputes." },
    { id: 4, name: "Adv. S. Ramanujan", specialty: "Corporate Law", rating: 5.0, reviews: 320, languages: ["English", "Tamil"], availability: "Busy", bio: "Strategic legal advisor to early-stage startups and MSMEs for compliance & funding." },
    { id: 5, name: "Adv. Priya Singh", specialty: "Consumer Protection", rating: 4.9, reviews: 2100, languages: ["English", "Hindi"], availability: "Available", bio: "High success rate in consumer court cases against big tech and insurance firms." },
    { id: 6, name: "Adv. Amit Bajaj", specialty: "IP & Copyright", rating: 4.6, reviews: 450, languages: ["English", "Hindi"], availability: "Available", bio: "Patent attorney and trademark expert. Helped 100+ artists protect their work." }
  ];

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-offwhite">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-20 bg-forest noise-overlay p-12 lg:p-20 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
             <div className="inline-flex items-center gap-2 bg-lime/10 border border-lime/20 px-4 py-2 rounded-full mb-8">
                <span className="w-2 h-2 rounded-full bg-lime animate-pulse"></span>
                <span className="text-lime text-xs font-black uppercase tracking-widest italic">500+ Verified Advocates Online</span>
             </div>
             <h1 className="text-5xl lg:text-8xl font-bold text-white heading-display lowercase tracking-tighter mb-8 leading-[0.9]">lawyer <span className="text-lime italic underline decoration-lime/20 decoration-8 underline-offset-8">connect.</span></h1>
             <p className="text-xl text-offwhite/60 leading-relaxed italic max-w-lg">Find the right legal advocate for your specific needs. Real experts, verified by nyAI, ready in minutes.</p>
          </div>
          
          <div className="relative z-10 w-full md:w-auto">
             <div className="flex flex-col gap-6">
                <div className="flex -space-x-4 mb-4">
                   {[...Array(6)].map((_, i) => (
                     <img key={i} src={`https://i.pravatar.cc/150?u=${i+44}`} className="w-16 h-16 rounded-3xl border-8 border-forest/50" alt="adv" />
                   ))}
                   <div className="w-16 h-16 rounded-3xl bg-lime flex items-center justify-center text-forest font-black text-xl border-8 border-forest/50">+500</div>
                </div>
                <div className="bg-lime/10 border border-lime/20 p-6 rounded-[2rem]">
                   <p className="text-3xl font-black text-lime font-mono">₹1.00 <span className="text-xs text-white/40 italic">/ min starter fee</span></p>
                   <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-2 italic">Connect to random available lawyer</p>
                </div>
             </div>
          </div>
          
          {/* Decryption SVG decoration */}
          <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-5">
             <History size={600} className="absolute -top-40 -left-40" />
          </div>
        </div>

        {/* Filter Section */}
        <div className="sticky top-24 z-30 bg-offwhite/80 backdrop-blur-md py-6 mb-12 border-b border-gray-100 flex flex-col md:flex-row gap-8 justify-between items-center px-4 -mx-4 rounded-3xl">
           <div className="flex items-center gap-4 w-full md:w-2/3">
              <div className="relative flex-1 group">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-forest transition-colors" size={24} />
                 <input 
                    type="text" 
                    placeholder="Search by name, expertise, or city..."
                    className="w-full bg-white border border-gray-100 py-6 pl-16 pr-8 rounded-[2rem] text-lg font-medium focus:ring-0 focus:border-lime transition-all shadow-xl shadow-gray-200/40"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
              <button className="bg-white border border-gray-100 p-6 rounded-[2rem] text-forest hover:bg-lime/10 transition-all shadow-xl shadow-gray-200/40"><Filter size={24} /></button>
           </div>
           
           <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar w-full md:w-auto">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${activeFilter === cat ? 'bg-forest text-lime border-forest shadow-xl shadow-forest/10' : 'bg-white text-gray-400 border-gray-100 hover:border-lime/50'}`}
                >
                  {cat}
                </button>
              ))}
           </div>
        </div>

        {/* Categories / Services Grid */}
        <div className="mb-20 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
           {[
             { label: "Family", icon: <Users size={20} /> },
             { label: "Property", icon: <Scale size={20} /> },
             { label: "Criminal", icon: <ShieldCheck size={20} /> },
             { label: "Tax", icon: <Zap size={20} /> },
             { label: "Corporate", icon: <Grid size={20} /> },
             { label: "Labor", icon: <List size={20} /> }
           ].map((item, i) => (
             <button key={i} className="flex flex-col items-center justify-center p-8 bg-white border border-gray-50 rounded-[2rem] hover:border-lime hover:scale-105 transition-all shadow-lg shadow-gray-200/40">
                <div className="w-12 h-12 rounded-xl bg-forest/5 flex items-center justify-center text-forest mb-4">{item.icon}</div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.label}</p>
             </button>
           ))}
        </div>

        {/* Lawyer List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-20">
           {lawyers.map(lawyer => (
             <LawyerCard key={lawyer.id} {...lawyer} />
           ))}
        </div>

        {/* Placeholder for no results */}
        {lawyers.length === 0 && (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-100">
             <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mx-auto mb-8">
                <Search size={40} />
             </div>
             <h2 className="text-3xl font-bold text-gray-900 mb-2">No advocates found matching your criteria</h2>
             <p className="text-gray-400 mb-10">Try adjusting your filters or search for another keyword.</p>
             <button className="bg-forest text-offwhite px-10 py-5 rounded-2xl font-black uppercase tracking-widest">Reset All Filters</button>
          </div>
        )}

        {/* How It Works Section */}
        <section className="bg-charcoal py-20 px-12 rounded-[3.5rem] mt-32 relative overflow-hidden text-center lg:text-left">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                 <h2 className="heading-display text-5xl md:text-6xl text-white mb-8">Consultations <br/><span className="text-lime italic lowercase">Streamlined.</span></h2>
                 <p className="text-lg text-offwhite/40 mb-12 italic">From crisis calls to long-term litigation, here is how nyAI brings experts directly to your doorstep.</p>
                 <div className="space-y-12">
                    {[
                      { step: "01", title: "Smart Discovery", desc: "AI matches you with advocates specializing in your specific case type based on past win rates." },
                      { step: "02", title: "Encrypted Connect", desc: "Connect via anonymous video call, audio call, or chat within minutes of raising a request." },
                      { step: "03", title: "Automated Briefing", desc: "nyAI sends the lawyer a summary of your session history so you don't repeat yourself." }
                    ].map((s, i) => (
                      <div key={i} className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                         <div className="text-5xl font-black text-lime/10 font-serif italic border-l-4 border-lime/10 pl-6">{s.step}</div>
                         <div>
                            <h4 className="text-xl font-bold text-white mb-2">{s.title}</h4>
                            <p className="text-offwhite/50 text-sm leading-relaxed">{s.desc}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="relative">
                 <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12 backdrop-blur-2xl relative z-10">
                    <div className="flex flex-col justify-center items-center gap-10">
                       <div className="w-32 h-32 bg-lime rounded-full p-4 flex items-center justify-center animate-pulse-slow shadow-2xl shadow-lime/20">
                          <Video size={56} className="text-forest" />
                       </div>
                       <div className="text-center">
                          <h3 className="text-3xl font-black text-white mb-2">Anonymous Consultation</h3>
                          <p className="text-[10px] text-lime font-black uppercase tracking-[0.2em] italic mb-8">Safety First • No ID sharing required initially</p>
                          <div className="flex gap-4">
                             <div className="bg-white/5 p-4 rounded-2xl flex-1 border border-white/10">
                                <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-1">Your Wait Time</p>
                                <p className="text-xl font-black text-white">Under 2 Min</p>
                             </div>
                             <div className="bg-white/5 p-4 rounded-2xl flex-1 border border-white/10">
                                <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-1">Fee Model</p>
                                <p className="text-xl font-black text-white">₹1.00 / min</p>
                             </div>
                          </div>
                       </div>
                       <button className="w-full bg-lime text-forest font-black py-5 rounded-2xl text-xl shadow-2xl shadow-lime/20 transform hover:scale-105 active:scale-95 transition-all">Connect to SOS Network</button>
                    </div>
                 </div>
                 {/* Decorative background circle */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-lime opacity-5 rounded-full blur-[100px] pointer-events-none"></div>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default LawyersPage;
