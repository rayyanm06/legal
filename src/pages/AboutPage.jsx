import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Globe, Scale, ShieldCheck, Heart, Zap,
  CheckCircle2, ArrowRight, History, Sparkles, Brain, Code
} from 'lucide-react';

const AboutPage = () => {
  const sdgs = [
    { id: 4, name: "Quality Education", desc: "Democratizing legal knowledge for the last mile." },
    { id: 8, name: "Decent Work", desc: "Empowering lawyers with AI-driven document tools." },
    { id: 10, name: "Reduced Inequalities", desc: "Removing language and cost barriers to justice." }
  ];

  const roadmap = [
    { quarter: "Q3 2025", title: "Fake Document Detector", desc: "National database integration to verify legal documents." },
    { quarter: "Q4 2025", title: "eCourts Portal Integration", desc: "Direct access to real-time case data from Indian courts." },
    { quarter: "Q1 2026", title: "nyAI Mobile App", desc: "Native iOS and Android apps with offline support." },
    { quarter: "Q2 2026", title: "Legal Literacy Gamified", desc: "Interactive courses and certifications for citizens." }
  ];

  return (
    <div className="bg-offwhite min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-32">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-8 mb-12">
            <div className="max-w-3xl">
               <div className="inline-flex items-center gap-2 bg-forest/5 border border-forest/10 px-4 py-2 rounded-full mb-8">
                  <Heart size={16} className="text-red-500 fill-red-500" />
                  <span className="text-forest text-[10px] font-black uppercase tracking-widest italic tracking-tighter">Justice for All Citizens</span>
               </div>
               <h1 className="text-5xl md:text-8xl font-black text-gray-900 heading-display lowercase tracking-tighter mb-8 leading-[0.9]">democratizing <br/><span className="text-forest italic underline decoration-lime decoration-8 underline-offset-8">legal knowledge.</span></h1>
               <p className="text-2xl text-gray-500 leading-relaxed italic border-l-4 border-lime/30 pl-8">nyAI (pronounced "nyaay") was born to ensure that no Indian citizen is left behind in the legal system due to language barriers or high costs.</p>
            </div>
            <div className="w-full md:w-auto">
               <div className="bg-forest p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                  <div className="relative z-10 text-center">
                    <p className="text-5xl font-black text-lime heading-display mb-2">1.2B+</p>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest italic">Lives we aim to touch</p>
                  </div>
                  <Sparkles size={80} className="absolute -top-4 -right-4 text-white/5 opacity-0 group-hover:opacity-100 transition-all duration-700" />
               </div>
            </div>
          </div>
        </header>

        {/* SDG Impact */}
        <section className="mb-32">
           <h2 className="text-3xl font-black text-gray-900 heading-display mb-12 text-center">Aligned with <span className="italic underline decoration-lime decoration-4 underline-offset-8">Global Goals.</span></h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {sdgs.map(sdg => (
                <motion.div 
                  key={sdg.id}
                  whileHover={{ y: -10 }}
                  className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col items-center text-center"
                >
                   <div className="w-20 h-20 rounded-3xl bg-forest/5 flex items-center justify-center text-forest mb-8 text-4xl font-serif italic border border-forest/10">SDG {sdg.id}</div>
                   <h3 className="text-2xl font-black text-gray-900 mb-4">{sdg.name}</h3>
                   <p className="text-gray-400 text-sm italic leading-relaxed">{sdg.desc}</p>
                </motion.div>
              ))}
           </div>
        </section>

        {/* Vision Statement */}
        <section className="bg-forest py-24 px-12 rounded-[4rem] relative overflow-hidden mb-32 noise-overlay">
           <div className="max-w-4xl mx-auto text-center relative z-10">
              <h2 className="text-4xl md:text-6xl font-black text-white heading-display mb-12 leading-tight">"In Bharat, justice should <br/><span className="text-lime italic lowercase tracking-tight underline decoration-lime/20 decoration-8 underline-offset-4">not be expensive.</span> It should be a fundamental given."</h2>
              <div className="flex justify-center gap-12 mt-12">
                 <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-lime animate-pulse"><Globe size={32} /></div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest text-center">50+ Languages <br/> mBart-50 SDK</p>
                 </div>
                 <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-lime animate-pulse delay-500"><Brain size={32} /></div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest text-center">Zephyr-7B <br/> Custom legal LLM</p>
                 </div>
                 <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-lime animate-pulse delay-1000"><Code size={32} /></div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest text-center">Open Architecture <br/> OSS Centric</p>
                 </div>
              </div>
           </div>
        </section>

        {/* Roadmap */}
        <section>
           <div className="flex items-center justify-between mb-16">
              <h2 className="text-3xl font-black text-gray-900 heading-display">The future <span className="italic">of nyAI.</span></h2>
              <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest underline decoration-lime decoration-2 underline-offset-4 hover:text-forest transition-colors">See Detailed Roadmap Registry</button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {roadmap.map((item, i) => (
                <div key={i} className="flex flex-col gap-6">
                   <p className="text-3xl font-black text-lime font-mono italic opacity-20 border-b-2 border-lime/10 pb-4">{item.quarter}</p>
                   <div>
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h4>
                      <p className="text-gray-400 text-sm italic leading-relaxed">{item.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* Team Teaser */}
        <div className="mt-32 pt-32 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-12">
           <div className="flex -space-x-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-20 h-20 rounded-3xl border-8 border-offwhite bg-gray-200 overflow-hidden shadow-2xl">
                   <img src={`https://i.pravatar.cc/150?u=${i+100}`} alt="team" />
                </div>
              ))}
              <div className="w-20 h-20 rounded-3xl border-8 border-offwhite bg-lime flex items-center justify-center font-black text-forest">YOU</div>
           </div>
           <div className="text-center md:text-right">
              <h4 className="text-2xl font-black text-gray-900 heading-display">Built by a <span className="italic">community of rebels.</span></h4>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-2 flex items-center justify-center md:justify-end gap-3">
                Join our mission <ArrowRight size={18} className="text-lime" />
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
