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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-5xl bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-purple-500/10 blur-[120px] pointer-events-none" />

                <div className="flex justify-between items-start mb-12 relative z-10">
                    <div>
                        <h2 className="text-4xl font-bold text-white mb-2">Lab Subscriptions</h2>
                        <p className="text-zinc-400">Unlock the full speed and power of the Tandres AI Lab.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    {plans.map((plan) => (
                        <motion.div
                            key={plan.id}
                            whileHover={{ y: -5 }}
                            className={`flex flex-col rounded-2xl border ${plan.borderColor} bg-gradient-to-b ${plan.color} p-6 relative overflow-hidden`}
                        >
                            {plan.isPopular && (
                                <div className="absolute top-4 right-4 bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                    Best Value
                                </div>
                            )}

                            <div className="mb-6 p-3 bg-white/5 w-fit rounded-xl">
                                {plan.icon}
                            </div>

                            <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-3xl font-bold text-white">{plan.price}</span>
                                <span className="text-sm text-zinc-400">/ {plan.duration}</span>
                            </div>

                            <div className="flex-grow space-y-4 mb-8">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                                        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => onPurchase(plan)}
                                className={`w-full py-4 rounded-xl font-bold transition-all ${
                                    plan.id === 'pro' 
                                    ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                                    : 'bg-white/10 hover:bg-white/20 text-white'
                                }`}
                            >
                                Get Started
                            </button>
                        </motion.div>
                    ))}
                </div>

                <p className="text-center text-zinc-500 text-xs mt-12 mb-0">
                    All extractions and processed media are stored securely. Subscriptions stack automatically.
                </p>
            </motion.div>
        </div>
    );
}
