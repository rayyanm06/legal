import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Globe, Star, ShieldCheck, Scale, Phone, 
  Search, Filter, MapPin, ArrowRight, Briefcase,
  CheckCircle2, Award, Clock, Languages, Building,
  GraduationCap, IndianRupee
} from 'lucide-react';
import IntakeModal from '../components/IntakeModal';
import LawyerMap from '../features/lawyer-map/LawyerMap';

// ─── 20 INDIAN MALE LAWYERS ───
const LAWYERS_DATA = [
  {
    id: 1,
    name: "Adv. Vikram Mehta",
    specialty: "Criminal Law",
    rating: 4.9,
    experience: 18,
    city: "New Delhi",
    languages: ["Hindi", "English"],
    education: "Delhi University, LLB",
    fee: "₹3,000 / consultation",
    bio: "Senior criminal defense advocate with over 18 years of experience in the Delhi High Court. Specializes in bail matters, white-collar crimes, and NDPS cases.",
    email: "rayyanzaid1406@gmail.com",
    photo: "https://randomuser.me/api/portraits/men/32.jpg",
    available: true,
    cases: 1200
  },
  {
    id: 2,
    name: "Adv. Arjun Rao",
    specialty: "Family Law",
    rating: 4.8,
    experience: 14,
    city: "Mumbai",
    languages: ["Hindi", "English", "Marathi"],
    education: "Government Law College, Mumbai",
    fee: "₹2,500 / consultation",
    bio: "Expert in family law matters including divorce, custody, and maintenance. Known for compassionate yet effective representation in Bombay High Court.",
    email: "arjun.rao@example.com",
    photo: "https://randomuser.me/api/portraits/men/45.jpg",
    available: true,
    cases: 850
  },
  {
    id: 3,
    name: "Adv. Rajesh Iyer",
    specialty: "Property Law",
    rating: 4.7,
    experience: 22,
    city: "Chennai",
    languages: ["Tamil", "English", "Hindi"],
    education: "Madras Law College",
    fee: "₹3,500 / consultation",
    bio: "Veteran property law practitioner handling real estate disputes, title verification, and land acquisition matters across Tamil Nadu for over two decades.",
    email: "rajesh.iyer@example.com",
    photo: "https://randomuser.me/api/portraits/men/52.jpg",
    available: true,
    cases: 1400
  },
  {
    id: 4,
    name: "Adv. Siddharth Kapoor",
    specialty: "Corporate Law",
    rating: 4.9,
    experience: 16,
    city: "Gurugram",
    languages: ["Hindi", "English"],
    education: "NLSIU Bangalore",
    fee: "₹5,000 / consultation",
    bio: "Corporate law specialist advising startups and MNCs on formation, compliance, SEBI regulations, and mergers & acquisitions.",
    email: "siddharth.kapoor@example.com",
    photo: "https://randomuser.me/api/portraits/men/62.jpg",
    available: true,
    cases: 600
  },
  {
    id: 5,
    name: "Adv. Anand Sharma",
    specialty: "Consumer Law",
    rating: 4.6,
    experience: 12,
    city: "Jaipur",
    languages: ["Hindi", "English", "Rajasthani"],
    education: "University of Rajasthan",
    fee: "₹1,500 / consultation",
    bio: "Consumer rights champion with a track record of successful complaints against major corporations and e-commerce platforms.",
    email: "anand.sharma@example.com",
    photo: "https://randomuser.me/api/portraits/men/22.jpg",
    available: false,
    cases: 520
  },
  {
    id: 6,
    name: "Adv. Karthik Nair",
    specialty: "Tax Law",
    rating: 4.8,
    experience: 20,
    city: "Kochi",
    languages: ["Malayalam", "English", "Hindi"],
    education: "Kerala Law Academy",
    fee: "₹4,000 / consultation",
    bio: "Chartered Accountant turned advocate. Deep expertise in Income Tax tribunals, GST disputes, and representing clients before the ITAT.",
    email: "karthik.nair@example.com",
    photo: "https://randomuser.me/api/portraits/men/34.jpg",
    available: true,
    cases: 950
  },
  {
    id: 7,
    name: "Adv. Pradeep Joshi",
    specialty: "IP Law",
    rating: 4.7,
    experience: 10,
    city: "Bangalore",
    languages: ["Kannada", "English", "Hindi"],
    education: "NUJS Kolkata",
    fee: "₹3,500 / consultation",
    bio: "Intellectual property specialist handling software patents, trademark registrations, and copyright infringement for tech companies.",
    email: "pradeep.joshi@example.com",
    photo: "https://randomuser.me/api/portraits/men/71.jpg",
    available: true,
    cases: 380
  },
  {
    id: 8,
    name: "Adv. Mohit Agarwal",
    specialty: "Cyber Law",
    rating: 4.5,
    experience: 8,
    city: "Hyderabad",
    languages: ["Telugu", "Hindi", "English"],
    education: "NALSAR University of Law",
    fee: "₹2,500 / consultation",
    bio: "Cybercrime and digital law expert. Handles data breach cases, online fraud, and IT Act violations with a tech-first approach.",
    email: "mohit.agarwal@example.com",
    photo: "https://randomuser.me/api/portraits/men/15.jpg",
    available: true,
    cases: 290
  },
  {
    id: 9,
    name: "Adv. Devendra Singh",
    specialty: "Criminal Law",
    rating: 4.6,
    experience: 25,
    city: "Lucknow",
    languages: ["Hindi", "English", "Urdu"],
    education: "Lucknow University",
    fee: "₹2,000 / consultation",
    bio: "Quarter-century of experience in criminal defense. Known across UP for handling high-profile murder cases and political disputes.",
    email: "devendra.singh@example.com",
    photo: "https://randomuser.me/api/portraits/men/55.jpg",
    available: true,
    cases: 1800
  },
  {
    id: 10,
    name: "Adv. Harsh Patel",
    specialty: "Property Law",
    rating: 4.8,
    experience: 15,
    city: "Ahmedabad",
    languages: ["Gujarati", "Hindi", "English"],
    education: "Gujarat National Law University",
    fee: "₹2,500 / consultation",
    bio: "Property dispute resolution, RERA compliance, and real estate due diligence expert. Active in Gujarat HC and consumer courts.",
    email: "harsh.patel@example.com",
    photo: "https://randomuser.me/api/portraits/men/41.jpg",
    available: true,
    cases: 720
  },
  {
    id: 11,
    name: "Adv. Ramesh Verma",
    specialty: "Family Law",
    rating: 4.5,
    experience: 19,
    city: "Chandigarh",
    languages: ["Hindi", "English", "Punjabi"],
    education: "Punjab University",
    fee: "₹2,000 / consultation",
    bio: "Handles complex divorce, custody, and domestic violence cases in Punjab & Haryana High Court with sensitivity and precision.",
    email: "ramesh.verma@example.com",
    photo: "https://randomuser.me/api/portraits/men/64.jpg",
    available: false,
    cases: 980
  },
  {
    id: 12,
    name: "Adv. Suresh Reddy",
    specialty: "Corporate Law",
    rating: 4.9,
    experience: 13,
    city: "Hyderabad",
    languages: ["Telugu", "English", "Hindi"],
    education: "Osmania University",
    fee: "₹4,500 / consultation",
    bio: "Serves IT companies and pharma giants on compliance, shareholder disputes, and IPO-related legal advisory in South India.",
    email: "suresh.reddy@example.com",
    photo: "https://randomuser.me/api/portraits/men/36.jpg",
    available: true,
    cases: 500
  },
  {
    id: 13,
    name: "Adv. Ashish Tiwari",
    specialty: "Tax Law",
    rating: 4.7,
    experience: 17,
    city: "Pune",
    languages: ["Marathi", "Hindi", "English"],
    education: "ILS Law College, Pune",
    fee: "₹3,000 / consultation",
    bio: "Tax litigation specialist dealing with Income Tax appeals, GST advisory, and transfer pricing disputes for businesses.",
    email: "ashish.tiwari@example.com",
    photo: "https://randomuser.me/api/portraits/men/48.jpg",
    available: true,
    cases: 700
  },
  {
    id: 14,
    name: "Adv. Manoj Kumar",
    specialty: "Consumer Law",
    rating: 4.4,
    experience: 11,
    city: "Patna",
    languages: ["Hindi", "English", "Bhojpuri"],
    education: "Patna Law College",
    fee: "₹1,000 / consultation",
    bio: "Affordable consumer rights advocate fighting for justice in medical negligence, defective products, and insurance claim rejections.",
    email: "manoj.kumar@example.com",
    photo: "https://randomuser.me/api/portraits/men/28.jpg",
    available: true,
    cases: 430
  },
  {
    id: 15,
    name: "Adv. Nikhil Das",
    specialty: "Cyber Law",
    rating: 4.6,
    experience: 7,
    city: "Kolkata",
    languages: ["Bengali", "Hindi", "English"],
    education: "NUJS Kolkata",
    fee: "₹2,000 / consultation",
    bio: "Young and dynamic cyber law practitioner. Expert in social media crimes, hacking cases, and data privacy under IT Act 2000.",
    email: "nikhil.das@example.com",
    photo: "https://randomuser.me/api/portraits/men/19.jpg",
    available: true,
    cases: 210
  },
  {
    id: 16,
    name: "Adv. Rohan Deshmukh",
    specialty: "IP Law",
    rating: 4.8,
    experience: 14,
    city: "Mumbai",
    languages: ["Marathi", "Hindi", "English"],
    education: "Government Law College, Mumbai",
    fee: "₹4,000 / consultation",
    bio: "Handles patent prosecution, trademark litigation, and anti-piracy enforcement for Bollywood production houses and media companies.",
    email: "rohan.deshmukh@example.com",
    photo: "https://randomuser.me/api/portraits/men/57.jpg",
    available: true,
    cases: 480
  },
  {
    id: 17,
    name: "Adv. Amit Saxena",
    specialty: "Criminal Law",
    rating: 4.5,
    experience: 21,
    city: "Bhopal",
    languages: ["Hindi", "English"],
    education: "NLIU Bhopal",
    fee: "₹2,500 / consultation",
    bio: "Supreme Court practitioner with deep expertise in anticipatory bail, quashing of FIR, and serious criminal offenses.",
    email: "amit.saxena@example.com",
    photo: "https://randomuser.me/api/portraits/men/67.jpg",
    available: false,
    cases: 1500
  },
  {
    id: 18,
    name: "Adv. Gaurav Mishra",
    specialty: "Family Law",
    rating: 4.7,
    experience: 9,
    city: "Noida",
    languages: ["Hindi", "English"],
    education: "Amity Law School",
    fee: "₹2,000 / consultation",
    bio: "Compassionate family lawyer focusing on mutual consent divorces, child custody mediation, and NRI matrimonial disputes.",
    email: "gaurav.mishra@example.com",
    photo: "https://randomuser.me/api/portraits/men/73.jpg",
    available: true,
    cases: 350
  },
  {
    id: 19,
    name: "Adv. Dinesh Bhatt",
    specialty: "Property Law",
    rating: 4.6,
    experience: 24,
    city: "Indore",
    languages: ["Hindi", "English"],
    education: "Holkar Science College, Indore",
    fee: "₹1,500 / consultation",
    bio: "Land acquisition and agricultural land matters specialist. Decades of experience in Madhya Pradesh property courts.",
    email: "dinesh.bhatt@example.com",
    photo: "https://randomuser.me/api/portraits/men/60.jpg",
    available: true,
    cases: 1100
  },
  {
    id: 20,
    name: "Adv. Sandeep Choudhary",
    specialty: "Corporate Law",
    rating: 4.8,
    experience: 11,
    city: "Bangalore",
    languages: ["Hindi", "English", "Kannada"],
    education: "NLSIU Bangalore",
    fee: "₹5,000 / consultation",
    bio: "Startup ecosystem lawyer. Advises on funding rounds, ESOP structuring, term sheets, and DPIIT startup recognition.",
    email: "sandeep.choudhary@example.com",
    photo: "https://randomuser.me/api/portraits/men/25.jpg",
    available: true,
    cases: 320
  }
];

const LawyerCard = ({ lawyer, onConnect }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -8 }}
    className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 group cursor-pointer hover:border-lime/50 transition-all flex flex-col h-full overflow-hidden relative"
  >
    {/* Available Badge */}
    {lawyer.available && (
      <div className="absolute top-6 right-6">
        <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 px-3 py-1 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">Available</span>
        </div>
      </div>
    )}
    {!lawyer.available && (
      <div className="absolute top-6 right-6">
        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full">
          <div className="w-2 h-2 bg-gray-400 rounded-full" />
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Busy</span>
        </div>
      </div>
    )}

    {/* Profile Header */}
    <div className="flex items-center gap-5 mb-6">
      <div className="relative flex-shrink-0">
        <img 
          src={lawyer.photo} 
          alt={lawyer.name} 
          className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-100 group-hover:border-lime transition-colors" 
        />
        <div className="absolute -bottom-1 -right-1 bg-forest text-white w-6 h-6 rounded-lg flex items-center justify-center">
          <ShieldCheck size={14} />
        </div>
      </div>
      <div className="min-w-0">
        <h3 className="text-lg font-black text-gray-900 group-hover:text-forest transition-colors truncate">{lawyer.name}</h3>
        <p className="text-[10px] uppercase font-black text-lime tracking-widest italic">{lawyer.specialty}</p>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < Math.floor(lawyer.rating) ? "currentColor" : "none"} />)}
          </div>
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{lawyer.rating}</p>
        </div>
      </div>
    </div>

    {/* Bio */}
    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-6 italic">{lawyer.bio || lawyer.vicinity || "Consultation available."}</p>

    {/* Stats Row */}
    <div className="grid grid-cols-3 gap-3 mb-6">
      <div className="bg-gray-50 rounded-xl p-3 text-center">
        <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1">Exp.</p>
        <p className="text-sm font-black text-gray-900">{lawyer.experience || '8+'}y</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-3 text-center">
        <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1">Cases</p>
        <p className="text-sm font-black text-gray-900">{lawyer.cases || '200'}+</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-3 text-center">
        <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1">City</p>
        <p className="text-xs font-black text-gray-900 truncate" title={lawyer.city || lawyer.vicinity?.split(',')[0]}>{lawyer.city || lawyer.vicinity?.split(',')[0] || "Local"}</p>
      </div>
    </div>

    {/* Tags */}
    <div className="flex flex-wrap gap-1.5 mb-6">
      {(lawyer.languages || ["English", "Local"]).map(lang => (
        <span key={lang} className="text-[9px] font-bold bg-forest/5 text-forest px-2.5 py-1 rounded-full uppercase tracking-wider">{lang}</span>
      ))}
    </div>

    {/* Fee & Connect */}
    <div className="mt-auto space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-forest">
          <IndianRupee size={16} />
          <p className="text-sm font-black tracking-tight">{lawyer.fee || "₹1,500 / consultation"}</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase">
          <MapPin size={12} className="text-red-500" /> {lawyer.city || "Local"}
        </div>
      </div>
      <button 
        onClick={() => onConnect(lawyer)}
        className="w-full bg-forest text-offwhite font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-forest/20 hover:bg-forest-light transform hover:scale-[1.02] active:scale-95 transition-all group-hover:bg-lime group-hover:text-forest group-hover:shadow-lime/20"
      >
        Connect Now <ArrowRight size={20} />
      </button>
    </div>
  </motion.div>
);

const LawyersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("directory"); // kept for compatibility if needed, but not used now
  const [localLawyers, setLocalLawyers] = useState([]);

  const categories = ["All", "Family Law", "Criminal Law", "Property Law", "Corporate Law", "Consumer Law", "Tax Law", "IP Law", "Cyber Law"];

  const handleConnect = (lawyer) => {
    setSelectedLawyer(lawyer);
    setModalOpen(true);
  };

  // Filter lawyers
  const filteredLawyers = LAWYERS_DATA.filter(lawyer => {
    const matchesSearch = 
      lawyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lawyer.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lawyer.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lawyer.languages.some(l => l.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = activeFilter === "All" || lawyer.specialty === activeFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Stat counts
  const totalCases = LAWYERS_DATA.reduce((acc, l) => acc + l.cases, 0);
  const avgRating = (LAWYERS_DATA.reduce((acc, l) => acc + l.rating, 0) / LAWYERS_DATA.length).toFixed(1);

  return (
    <div className="pt-32 pb-20 px-6 min-h-screen bg-offwhite">
      <div className="max-w-7xl mx-auto">
        {/* Hero Header */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch gap-8 mb-20 bg-forest noise-overlay p-8 lg:p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
          <div className="relative z-10 lg:w-2/3">
            <div className="inline-flex items-center gap-2 bg-lime/10 border border-lime/20 px-4 py-2 rounded-full mb-8">
              <ShieldCheck size={16} className="text-lime" />
              <span className="text-lime text-xs font-black uppercase tracking-widest italic">Verified Indian Advocates</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-white heading-display lowercase tracking-tighter mb-8 leading-[0.9]">
              find your <span className="text-lime italic underline decoration-lime/20 decoration-8 underline-offset-8">advocate.</span>
            </h1>
            <p className="text-lg text-offwhite/60 leading-relaxed italic max-w-xl mb-10">
              Connect with India's top-rated legal professionals. Browse by expertise, read their profiles, and request consultation — all within minutes.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                <p className="text-[9px] text-white/30 uppercase font-black mb-1">Advocates</p>
                <p className="text-2xl font-black text-lime">{LAWYERS_DATA.length}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                <p className="text-[9px] text-white/30 uppercase font-black mb-1">Cases Handled</p>
                <p className="text-2xl font-black text-white">{totalCases.toLocaleString()}+</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                <p className="text-[9px] text-white/30 uppercase font-black mb-1">Avg. Rating</p>
                <p className="text-2xl font-black text-amber-400">⭐ {avgRating}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                <p className="text-[9px] text-white/30 uppercase font-black mb-1">Specialties</p>
                <p className="text-2xl font-black text-white">8+</p>
              </div>
            </div>
          </div>

          {/* Right Side Map (Replaced the 3x3 Photo Grid) */}
          <div className="hidden lg:flex lg:w-1/3 relative min-h-[300px]">
            <div className="absolute inset-[-1rem] lg:inset-[-2rem] left-0 rounded-l-[3.5rem] lg:rounded-[3.5rem] overflow-hidden border-l-[8px] lg:border-[8px] border-white/10 shadow-[0_0_50px_rgba(151,248,118,0.2)]">
               <LawyerMap 
                 apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} 
                 onLawyersUpdate={setLocalLawyers}
                 selectedCategory={activeFilter}
               />
               
               {/* Map overlay gradient to blend with the green hero background neatly */}
               <div className="absolute inset-0 pointer-events-none rounded-[3.5rem] shadow-[inset_0_0_30px_rgba(20,50,40,0.5)]"></div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="sticky top-24 z-30 bg-offwhite/95 backdrop-blur-xl py-6 mb-12 flex flex-col lg:flex-row gap-6 justify-between items-center rounded-3xl shadow-[0_20px_40px_-20px_rgba(0,0,0,0.05)] border border-gray-100 p-4 lg:p-6">
          <div className="w-full lg:w-1/3 flex-shrink-0">
            <div className="relative group w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-forest transition-colors" size={24} />
              <input 
                type="text" 
                placeholder="Search name, city, expertise..."
                className="w-full bg-white border border-gray-100 py-5 pl-16 pr-6 rounded-[2rem] text-lg font-medium focus:ring-0 focus:border-lime transition-all shadow-lg shadow-gray-200/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2.5 overflow-x-auto overflow-y-hidden pb-4 pt-1 no-scrollbar w-full lg:flex-1 min-w-0">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`flex-shrink-0 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${activeFilter === cat ? 'bg-forest text-lime border-forest shadow-xl shadow-forest/20' : 'bg-white text-gray-400 border-gray-100 hover:border-lime/50'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count & Search Query Info */}
        <h2 className="text-2xl font-black text-forest lowercase italic mb-8 ml-2">
          verified advocates ({filteredLawyers.length})
        </h2>

        {/* Render Only Curated Grid Because Map is in Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-20">
          {filteredLawyers.map((lawyer, i) => (
            <motion.div
              key={lawyer.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="h-full"
            >
              <LawyerCard lawyer={lawyer} onConnect={handleConnect} />
            </motion.div>
          ))}
          
          {/* No Results */}
          {filteredLawyers.length === 0 && (
            <div className="col-span-full text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-100">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mx-auto mb-8">
                <Search size={40} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">No advocates found</h2>
              <p className="text-gray-400">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>

        {/* Trust Banner */}
        <div className="bg-white rounded-[3rem] border border-gray-100 p-8 md:p-12 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-lime/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <ShieldCheck size={32} className="text-forest" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">All Advocates Verified</h3>
                <p className="text-gray-500 text-sm">Every advocate listed has been verified for their Bar Council registration and practice credentials.</p>
              </div>
            </div>
            <div className="flex items-center gap-8 text-center">
              <div>
                <p className="text-2xl font-black text-forest">{LAWYERS_DATA.length}</p>
                <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Advocates</p>
              </div>
              <div className="w-px h-10 bg-gray-100" />
              <div>
                <p className="text-2xl font-black text-forest">{categories.length - 1}</p>
                <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Specialties</p>
              </div>
              <div className="w-px h-10 bg-gray-100" />
              <div>
                <p className="text-2xl font-black text-forest">{LAWYERS_DATA.filter(l => l.available).length}</p>
                <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest">Available Now</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Intake Modal */}
      <IntakeModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        lawyer={selectedLawyer} 
      />
    </div>
  );
};

export default LawyersPage;
