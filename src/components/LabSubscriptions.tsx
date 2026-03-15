'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Box, Clock, ShieldCheck, X } from 'lucide-react';

interface LabSubscriptionsProps {
    userId: string;
    onClose: () => void;
    onPurchase: (plan: any) => void;
}

export default function LabSubscriptions({ userId, onClose, onPurchase }: LabSubscriptionsProps) {
    const plans = [
        {
            id: 'starter',
            name: 'Starter Lab',
            price: '₦3,000',
            duration: '1 Month',
            type: 'subscription',
            icon: <Zap className="w-8 h-8 text-blue-400" />,
            color: 'from-blue-600/20 to-blue-900/20',
            borderColor: 'border-blue-500/30',
            features: [
                'Full 30-Day Ad-Free Experience',
                'Unlimited YouTube & Instagram Usage',
                '200 TikTok Extractions Included',
                'YouTube: Up to 1-Hour Video Length',
                'Instagram: Up to 1-Hour Video Length',
                'TikTok: Up to 5-Minute Video Length'
            ]
        },
        {
            id: 'pro',
            name: 'Pro Studio',
            price: '₦15,000',
            duration: '2 Months',
            type: 'subscription',
            isPopular: true,
            icon: <Crown className="w-8 h-8 text-purple-400" />,
            color: 'from-purple-600/20 to-purple-900/20',
            borderColor: 'border-purple-500/50',
            features: [
                'Complete 60-Day Ad-Free Experience',
                'Unlimited YouTube & Instagram Usage',
                '500 TikTok Extractions Included',
                'YouTube: Up to 2-Hour Video Length',
                'Instagram: Up to 2-Hour Video Length',
                'TikTok: Up to 10-Minute Video Length'
            ]
        },
        {
            id: 'silver_credits',
            name: '500 Silver Credits',
            price: '₦3,000',
            duration: 'Forever',
            type: 'silver_credits',
            icon: <Box className="w-8 h-8 text-slate-300" />,
            color: 'from-slate-600/20 to-slate-900/20',
            borderColor: 'border-slate-400/30',
            features: [
                '500 Permanent Silver Credits',
                'Balance Never Expires (Use Forever)',
                'Instantly Skip 500 Lab Ad-Gates',
                'YouTube: Up to 30-Min Video Length',
                'Instagram: Up to 30-Min Video Length',
                'TikTok: Up to 90-Sec Video Length'
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 bg-black/90 backdrop-blur-xl overflow-y-auto pt-20 pb-10">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-5xl bg-[#050505] border border-white/5 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl overflow-hidden my-auto"
            >
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-purple-500/5 blur-[120px] pointer-events-none" />

                <div className="flex justify-between items-start mb-8 sm:mb-12 relative z-10">
                    <div className="pr-12">
                        <h2 className="text-2xl sm:text-4xl font-black text-white mb-2 uppercase tracking-tighter italic">Lab Subscriptions</h2>
                        <p className="text-zinc-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest leading-relaxed max-w-md">Unlock full speed and elite extraction capabilities.</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-white absolute top-0 right-0">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 relative z-10">
                    {plans.map((plan) => (
                        <motion.div
                            key={plan.id}
                            whileHover={{ y: -5 }}
                            className={`flex flex-col rounded-[1.5rem] sm:rounded-2xl border ${plan.borderColor} bg-gradient-to-b ${plan.color} p-6 sm:p-8 relative overflow-hidden`}
                        >
                            {plan.isPopular && (
                                <div className="absolute top-4 right-4 bg-white text-black text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-xl">
                                    Best Value
                                </div>
                            )}

                            <div className="mb-6 p-4 bg-white/5 w-fit rounded-2xl border border-white/5">
                                {plan.icon}
                            </div>

                            <h3 className="text-lg sm:text-xl font-black text-white mb-1 uppercase tracking-tight">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-2xl sm:text-3xl font-black text-white">{plan.price}</span>
                                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">/ {plan.duration === 'Forever' ? 'One-time' : plan.duration}</span>
                            </div>

                            <div className="flex-grow space-y-4 mb-8">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-4 h-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check className="w-2.5 h-2.5 text-white" />
                                        </div>
                                        <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed leading-none">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => onPurchase(plan)}
                                className={`w-full py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl active:scale-95 ${
                                    plan.id === 'pro' 
                                    ? 'bg-white text-black shadow-white/10' 
                                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/5'
                                }`}
                            >
                                Secure Access
                            </button>
                        </motion.div>
                    ))}
                </div>

                <p className="text-center text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em] mt-12 mb-0 opacity-40">
                    Elite Multi-Track Processing • Global CDN • 24/7 Priority
                </p>
            </motion.div>
        </div>
    );
}
