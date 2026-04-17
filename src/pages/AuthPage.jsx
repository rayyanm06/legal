import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scale, ArrowRight, ShieldCheck, Mail, Lock, 
  User, CheckCircle2, History, Zap, Sparkles, ShieldAlert, Briefcase, Hash, MapPin
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { GoogleLogin } from '@react-oauth/google';
import {jwtDecode} from 'jwt-decode';
import { API_ENDPOINTS, API_BASE_URL } from '../api/config';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Puducherry'
];

const SPECIALIZATIONS = ['Criminal','Civil','Property','Consumer','Labour','Family','Corporate','Tax'];

const AuthPage = ({ setIsLoggedIn, setUserEmail }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('citizen');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [barCouncilNumber, setBarCouncilNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [specs, setSpecs] = useState([]);
  const navigate = useNavigate();

  const toggleSpec = (s) => setSpecs(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (role === 'lawyer') {
        const endpoint = isLogin
          ? `${API_BASE_URL}/api/lawyer/login`
          : `${API_BASE_URL}/api/lawyer/register`;
        const payload = isLogin
          ? { email, password }
          : { name, email, password, phone, barCouncilNumber, state, city, specializations: specs };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('nyai_token', data.token);
          localStorage.setItem('nyai_role', 'lawyer');
          localStorage.setItem('nyai_lawyer_name', data.name);
          localStorage.setItem('nyai_user_email', email);
          navigate('/lawyer-dashboard');
        } else {
          setError(data.error || 'Lawyer authentication failed.');
        }
      } else {
        const endpoint = isLogin ? API_ENDPOINTS.AUTH.LOGIN : API_ENDPOINTS.AUTH.REGISTER;
        const payload = isLogin ? { email, password } : { email, password, name };
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem("nyai_user_email", email);
          localStorage.setItem("nyai_token", data.token);
          if (data.name) {
            localStorage.setItem("nyai_user_name", data.name);
          }
          if (setUserEmail) setUserEmail(email);
          setIsLoggedIn(true);
          navigate('/chat');
        } else {
          setError(data.error || "Authentication failed");
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError("Connection failed. Please check your internet and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setError("");
    
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      console.log("Decoded Google User:", decoded);

      const generatedPassword = "google_oauth_fallback_" + (decoded.sub || decoded.email);

      let response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: decoded.email, password: generatedPassword })
      });

      if (!response.ok) {
        response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: decoded.email,
            name: decoded.name,
            password: generatedPassword
          })
        });
      }

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("nyai_user_email", decoded.email);
        localStorage.setItem("nyai_user_name", decoded.name);
        if (data.token) localStorage.setItem("nyai_token", data.token);
        if (setUserEmail) setUserEmail(decoded.email);
        setIsLoggedIn(true);
        navigate('/chat');
      } else {
        setError(data.error || "Google login failed sync to MongoDB.");
      }
    } catch (err) {
      console.error('Google Auth Exception:', err);
      setError("Google sign-in failed. Please try again or use email login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-offwhite flex flex-col md:flex-row relative overflow-hidden">
      {/* Branding Side */}
      <div className="w-full md:w-1/2 bg-forest noise-overlay p-12 lg:p-24 flex flex-col justify-between items-center md:items-start text-center md:text-left relative z-10">
         <div className="relative z-10">
            <Link to="/" className="flex items-center justify-center md:justify-start gap-4 mb-20 group">
               <div className="bg-lime p-3 rounded-2xl group-hover:rotate-12 transition-transform">
                  <Scale size={32} className="text-forest" />
               </div>
               <span className="text-4xl font-black text-white tracking-tighter">ny<span className="text-lime">AI</span></span>
            </Link>

            <h1 className="text-5xl lg:text-8xl font-black text-white heading-display lowercase tracking-tighter mb-12 leading-[0.9]">the future <br/><span className="text-lime italic underline decoration-lime/20 decoration-8 underline-offset-8">of justice.</span></h1>
            
            <div className="space-y-8 max-w-sm">
               <div className="flex items-start gap-6">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lime flex-shrink-0 animate-pulse-slow"><CheckCircle2 size={24} /></div>
                  <p className="text-offwhite/60 text-sm italic font-bold">"Your privacy is our baseline. All sessions are encrypted with enterprise-grade standards."</p>
               </div>
               <div className="flex items-start gap-6">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lime flex-shrink-0 animate-pulse-slow delay-500"><ShieldCheck size={24} /></div>
                  <p className="text-offwhite/60 text-sm italic font-bold">"Built for 1.4B Indians. Supporting 50+ languages via advanced LLMs like Zephyr-7B."</p>
               </div>
            </div>
         </div>

         <div className="relative z-10 mt-20 md:mt-0">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] mb-4">SDG Impact Platform</p>
            <div className="flex gap-6 opacity-30">
               <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-forest font-black italic">4</div>
               <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-forest font-black italic">8</div>
               <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-forest font-black italic">10</div>
            </div>
         </div>

         {/* Decorative History Spiral */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
            <History size={1000} className="scale-150 rotate-45" />
         </div>
      </div>

      {/* Form Side */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center p-12 lg:p-20 relative overflow-hidden overflow-y-auto">
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="w-full max-w-md relative z-10 py-8"
         >
            {/* Role Toggle */}
            <div className="flex items-center bg-gray-50 border border-gray-100 rounded-2xl p-1.5 mb-8">
               <button
                 type="button"
                 onClick={() => { setRole('citizen'); setError(''); }}
                 className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${role === 'citizen' ? 'bg-forest text-lime shadow-lg' : 'text-gray-400 hover:text-forest'}`}
               >
                 <User size={14} /> I'm a Citizen
               </button>
               <button
                 type="button"
                 onClick={() => { setRole('lawyer'); setError(''); }}
                 className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${role === 'lawyer' ? 'bg-forest text-lime shadow-lg' : 'text-gray-400 hover:text-forest'}`}
               >
                 <Briefcase size={14} /> I'm a Lawyer
               </button>
            </div>

            <div className="mb-8">
               <div className="flex items-center gap-4 mb-4">
                  <div className="w-8 h-px bg-gray-200"></div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{isLogin ? 'Welcome Back' : 'Create Account'}</p>
                  <div className="w-8 h-px bg-gray-200"></div>
               </div>
               <h2 className="text-4xl font-black text-gray-900 heading-display lowercase tracking-tighter mb-4">
                 {isLogin ? 'Login to system.' : role === 'lawyer' ? 'Join as lawyer.' : 'Join the studio.'}
               </h2>
               <p className="text-gray-400 font-bold text-sm italic">
                  {isLogin ? `Access your ${role === 'lawyer' ? 'case portal' : 'documents and cases'}.` : role === 'lawyer' ? 'Set up your nyAI lawyer portal.' : 'Start your 7-day free pro trial.'}
               </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[10px] font-black text-red-600 flex items-center gap-2 uppercase tracking-widest"
                  >
                    <ShieldAlert size={16} /> {error}
                  </motion.div>
                )}

                <AnimatePresence mode="wait">
                   {!isLogin && (
                     <motion.div 
                       initial={{ height: 0, opacity: 0 }}
                       animate={{ height: 'auto', opacity: 1 }}
                       exit={{ height: 0, opacity: 0 }}
                       className="space-y-5 overflow-hidden"
                     >
                        <div className="relative group">
                           <User className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-forest transition-colors" size={22} />
                           <input 
                              type="text" 
                              placeholder={role === 'lawyer' ? 'Full Legal Name (as on Bar Certificate)' : 'Full Legal Name'}
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-100 py-5 pl-16 pr-8 rounded-[2rem] text-base font-medium focus:ring-0 focus:border-lime transition-all focus:bg-white"
                              required 
                           />
                        </div>

                        {role === 'lawyer' && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                            <div className="relative group">
                               <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-forest transition-colors" size={22} />
                               <input 
                                  type="text" 
                                  placeholder="Bar Council Enrollment Number"
                                  value={barCouncilNumber}
                                  onChange={(e) => setBarCouncilNumber(e.target.value)}
                                  className="w-full bg-gray-50 border border-gray-100 py-5 pl-16 pr-8 rounded-[2rem] text-base font-medium focus:ring-0 focus:border-lime transition-all focus:bg-white"
                                  required 
                               />
                            </div>
                            <div className="relative group">
                               <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-forest transition-colors" size={22} />
                               <input 
                                  type="tel" 
                                  placeholder="Phone Number"
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  className="w-full bg-gray-50 border border-gray-100 py-5 pl-16 pr-8 rounded-[2rem] text-base font-medium focus:ring-0 focus:border-lime transition-all focus:bg-white"
                               />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="relative group">
                                 <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-forest transition-colors" size={16} />
                                 <select
                                   value={state}
                                   onChange={e => setState(e.target.value)}
                                   className="w-full bg-gray-50 border border-gray-100 py-4 pl-10 pr-4 rounded-2xl text-sm font-medium focus:ring-0 focus:border-lime transition-all focus:bg-white appearance-none"
                                 >
                                   <option value="">State</option>
                                   {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                 </select>
                              </div>
                              <div className="relative group">
                                 <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-forest transition-colors" size={16} />
                                 <input 
                                    type="text" 
                                    placeholder="City"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 py-4 pl-10 pr-4 rounded-2xl text-sm font-medium focus:ring-0 focus:border-lime transition-all focus:bg-white"
                                 />
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Specializations</p>
                              <div className="flex flex-wrap gap-2">
                                {SPECIALIZATIONS.map(s => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => toggleSpec(s)}
                                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${specs.includes(s) ? 'bg-forest text-lime shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                     </motion.div>
                   )}
                </AnimatePresence>

                <div className="relative group">
                   <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-forest transition-colors" size={22} />
                   <input 
                      type="email" 
                      placeholder="Email Address" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 py-5 pl-16 pr-8 rounded-[2rem] text-base font-medium focus:ring-0 focus:border-lime transition-all focus:bg-white"
                      required 
                   />
                </div>

                <div className="relative group">
                   <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-forest transition-colors" size={22} />
                   <input 
                      type="password" 
                      placeholder="Password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 py-5 pl-16 pr-8 rounded-[2rem] text-base font-medium focus:ring-0 focus:border-lime transition-all focus:bg-white"
                      required 
                   />
                </div>

                <button 
                   type="submit" 
                   disabled={isLoading}
                   className="w-full bg-forest text-offwhite font-black py-6 rounded-[2.5rem] text-xl shadow-2xl shadow-forest/20 flex items-center justify-center gap-4 hover:bg-forest-light transform hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden group"
                >
                   {isLoading ? (
                     <div className="flex items-center gap-4">
                        <div className="w-6 h-6 border-4 border-lime border-t-transparent rounded-full animate-spin"></div>
                        <span className="uppercase tracking-widest text-[10px] font-black italic">Processing...</span>
                     </div>
                   ) : (
                     <>
                        {isLogin ? (role === 'lawyer' ? 'Enter Lawyer Portal' : 'Login to nyAI') : (role === 'lawyer' ? 'Register as Lawyer' : 'Create Free Account')}
                        <ArrowRight size={24} className="text-lime group-hover:translate-x-2 transition-transform" />
                     </>
                   )}
                </button>

                {role === 'citizen' && (
                  <>
                    <div className="relative py-2">
                       <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                       <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest text-gray-300 bg-white px-4">Social Entry</div>
                    </div>

                    <div className="flex flex-col gap-4 items-center">
                       <div className="w-full flex justify-center">
                          <GoogleLogin 
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError("Google Authentication Failed")}
                            theme="filled_black"
                            shape="pill"
                            size="large"
                            text="continue_with"
                            width="300"
                          />
                       </div>

                       {/* Mock Auth Bypass for Testing without Google Client ID Setup */}
                       <button 
                         type="button"
                         onClick={() => {
                            const mockPayload = JSON.stringify({ 
                               email: email || "tester@nyai.com", 
                               name: name || "Developer Mode", 
                               picture: "https://i.pravatar.cc/150" 
                            });
                            handleGoogleSuccess({
                               credential: `mock_header.${btoa(mockPayload)}.mock_signature`
                            });
                         }}
                         className="text-[10px] font-black text-lime uppercase tracking-widest bg-forest px-4 py-2 rounded-full hover:bg-forest/80 transition-all opacity-40 hover:opacity-100"
                       >
                         🚀 Enter as Tester (Mock OAuth)
                       </button>
                       
                       <p className="text-[9px] text-gray-300 font-bold max-w-[200px] text-center italic mt-2 uppercase tracking-tight">
                         Server Persistence: All details secured in <span className="text-lime">MongoDB Atlas</span>
                       </p>
                    </div>
                  </>
                )}
             </form>

            <div className="mt-10 text-center">
               <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm font-black text-gray-400 uppercase tracking-widest underline decoration-lime decoration-2 underline-offset-4 hover:text-forest transition-colors italic"
               >
                 {isLogin ? "Need an account? Sign up free." : "Already joining us? Login here."}
               </button>
            </div>
         </motion.div>

         {/* Decorative Sparkle */}
         <div className="absolute bottom-20 right-20 opacity-10 pointer-events-none">
            <Sparkles size={200} className="text-lime" />
         </div>
         <div className="absolute top-20 left-20 opacity-10 pointer-events-none">
            <Zap size={100} className="text-forest scale-x-[-1]" />
         </div>
      </div>
    </div>
  );
};

export default AuthPage;
