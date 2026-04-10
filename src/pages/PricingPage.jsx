import React from 'react';
import { motion } from 'framer-motion';
import { Check, Shield, Zap, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function PricingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const plans = [
    {
      name: "Basic",
      price: "Free",
      description: "Essential legal AI access for everyday users.",
      icon: <Shield size={32} className="text-forest mb-4" />,
      features: [
        "Base AI Chat Models",
        "Document Analyzer (Basic)",
        "Find Lawyers Directory",
        "Community Support",
      ],
      buttonText: "Current Plan",
      buttonClass: "bg-gray-100 text-gray-500 cursor-not-allowed",
      boxClass: "bg-white border border-gray-100",
      headerClass: "text-forest"
    },
    {
      name: "Plus",
      price: "₹499",
      period: "/month",
      description: "Advanced intelligence for serious matters.",
      icon: <Zap size={32} className="text-lime mb-4" />,
      features: [
        "Advanced AI Models (GPT-4)",
        "Priority Document Analysis",
        "Draft Legal Responses",
        "Email Summaries to Lawyers",
        "LexArena Premium Scenarios"
      ],
      buttonText: "Upgrade to Plus",
      buttonClass: "bg-forest text-lime hover:bg-forest-light",
      boxClass: "bg-forest text-white border-2 border-lime scale-105 shadow-2xl relative",
      headerClass: "text-lime",
      badge: "MOST POPULAR",
      onClick: () => alert("Plus plan upgrade flow coming soon!")
    },
    {
      name: "Pro",
      price: "₹1,499",
      period: "/month",
      description: "Uncapped legal power for professionals.",
      icon: <Crown size={32} className="text-forest mb-4" />,
      features: [
        "Unlimited Advanced AI",
        "Advanced Document Generator",
        "Lawyer Availability Calendar Access",
        "Custom Workflow Automations",
        "24/7 Priority Support"
      ],
      buttonText: "Upgrade to Pro",
      buttonClass: "bg-white text-forest border border-forest border-2 hover:bg-gray-50",
      boxClass: "bg-white border border-gray-100",
      headerClass: "text-forest",
      onClick: () => alert("Pro plan upgrade flow coming soon!")
    }
  ];

  return (
    <div className="min-h-screen bg-offwhite pt-32 pb-20 px-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-black text-forest lowercase tracking-tighter mb-4"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            simple <span className="text-lime">pricing</span>.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 font-medium text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Whether you need simple legal answers or professional tools, we have a plan for you. 
            <span className="font-bold text-forest"> Logging in and basic usage remains completely free forever.</span>
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.2 }}
              className={`rounded-[2rem] p-10 ${plan.boxClass} transition-transform hover:-translate-y-2 duration-300 z-10`}
            >
              {plan.badge && (
                <div className="absolute top-0 right-10 -translate-y-1/2 bg-lime text-forest text-[10px] font-black tracking-widest uppercase px-4 py-1.5 rounded-full shadow-lg">
                  {plan.badge}
                </div>
              )}
              {plan.icon}
              <h3 className={`text-2xl font-black uppercase tracking-tight mb-2 ${plan.headerClass}`} style={{ fontFamily: "'Syne', sans-serif" }}>
                 {plan.name}
              </h3>
              <div className="mb-6">
                <span className="text-4xl font-bold tracking-tighter" style={{ fontFamily: "'Syne', sans-serif" }}>{plan.price}</span>
                {plan.period && <span className="text-sm font-medium opacity-70 ml-1">{plan.period}</span>}
              </div>
              <p className="text-sm mb-10 opacity-80 h-10">{plan.description}</p>
              
              <ul className="space-y-4 mb-10 min-h-[220px]">
                {plan.features.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-4 text-sm font-medium">
                    <Check size={18} className={`${plan.name === 'Plus' ? 'text-lime' : 'text-forest'} shrink-0`} />
                    <span className="opacity-90">{f}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={plan.onClick}
                disabled={!plan.onClick}
                className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-transform ${plan.buttonClass} hover:scale-[1.02]`}
              >
                {plan.buttonText}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
