'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Zap, Check, ShieldCheck, Loader2, Music } from 'lucide-react';
import { PaystackButton } from 'react-paystack';
import Logo from '@/components/Logo';
import { supabase } from '@/lib/supabase';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail: string;
    userId: string;
    onSuccess: () => void;
    currentTier?: string;
    showSilver?: boolean;
}

const CREDIT_PACKS = [
    {
        id: 'pack-10',
        credits: 10,
        price: 1500,
        label: 'Starter Gold',
        description: 'Elite cloning entry.',
        features: [
            '10 Gold Credits',
            'Essential AI',
            'Permanent Storage',
            'No Expiry',
            '24/7 Support'
        ],
        icon: <Zap className="w-6 h-6 text-purple-400" />,
        type: 'credit',
        color: 'from-purple-500/20 to-transparent'
    },
    {
        id: 'pack-20',
        credits: 20,
        price: 3000,
        label: 'Creator Gold',
        description: 'Content creator balance.',
        features: [
            '20 Gold Credits',
            'High-Priority',
            'Studio Accuracy',
            'Permanent Storage',
            'Commercial Rights'
        ],
        icon: <Zap className="w-6 h-6 text-indigo-400" />,
        popular: true,
        type: 'credit',
        color: 'from-indigo-500/20 to-transparent'
    },
    {
        id: 'pack-50',
        credits: 50,
        price: 7500,
        label: 'Studio Gold',
        description: 'High-volume studio work.',
        features: [
            '50 Gold Credits',
            'Ultra-Priority',
            'Agency Rights',
            'Advanced Modulation',
            'White-Label'
        ],
        icon: <Zap className="w-6 h-6 text-blue-400" />,
        type: 'credit',
        color: 'from-blue-500/20 to-transparent'
    },
    {
        id: 'pack-elite',
        credits: 150,
        price: 15000,
        label: 'Elite Gold',
        description: 'Agency power pack.',
        features: [
            '150 Gold Credits',
            'Zero Limits',
            'Fastest Speed',
            'One-Time Buy',
            'Dedicated Pipe'
        ],
        icon: <Zap className="w-6 h-6 text-yellow-400" />,
        type: 'credit',
        color: 'from-yellow-500/20 to-transparent'
    }
];

const LAB_SUBSCRIPTIONS = [
    {
        id: 'plan-starter',
        months: 1,
        price: 3000,
        label: 'Starter Lab',
        description: 'Individual video studio.',
        features: [
            '1 Month Ad-Free',
            'Unlimited YouTube & Instagram',
            '200 TikTok Extractions',
            '1 Hour YouTube Video Length',
            '1 Hour Instagram Video Length',
            '5 Minutes TikTok Video Length'
        ],
        icon: <Music className="w-6 h-6 text-pink-400" />,
        type: 'subscription',
        planName: 'starter',
        color: 'from-pink-500/20 to-transparent'
    },
    {
        id: 'plan-pro',
        months: 2,
        price: 15000,
        label: 'Pro Studio',
        description: 'Elite production suite.',
        features: [
            '2 Months Ad-Free',
            'Unlimited YouTube & Instagram',
            '500 TikTok Extractions',
            '2 Hours YouTube Video Length',
            '2 Hours Instagram Video Length',
            '10 Minutes TikTok Video Length'
        ],
        icon: <Music className="w-6 h-6 text-yellow-400" />,
        popular: true,
        type: 'subscription',
        planName: 'pro',
        color: 'from-yellow-500/20 to-transparent'
    },
    {
        id: 'silver-credits',
        credits: 500,
        price: 3000,
        label: '500 Silver Credits',
        description: 'Permanent bridge pack.',
        features: [
            '500 Permanent Credits',
            'Never Expires',
            'Skip Lab Ads Instantly',
            '30 Min YouTube Video Length',
            '30 Min Instagram Video Length',
            '90 Sec TikTok Video Length'
        ],
        icon: <Zap className="w-6 h-6 text-slate-300" />,
        type: 'silver_credits',
        color: 'from-slate-500/20 to-transparent'
    }
];

export default function PaymentModal({ isOpen, onClose, userEmail, userId, onSuccess, currentTier = 'free', showSilver = false }: PaymentModalProps) {
    const [activeTab, setActiveTab] = useState<'credits' | 'subscriptions'>('credits');
    const [selectedPack, setSelectedPack] = useState<any>(CREDIT_PACKS[1]);
    const [isVerifying, setIsVerifying] = useState(false);
    const [systemLocks, setSystemLocks] = useState<any[]>([]);

    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

    useEffect(() => {
        const fetchLocks = async () => {
            const { data } = await supabase.from('system_locks').select('*');
            if (data) setSystemLocks(data);
        };
        if (isOpen) fetchLocks();
    }, [isOpen]);

    const handleTabChange = (tab: 'credits' | 'subscriptions') => {
        setActiveTab(tab);
        const list = tab === 'credits' ? CREDIT_PACKS : (showSilver ? LAB_SUBSCRIPTIONS : LAB_SUBSCRIPTIONS.filter(p => p.type !== 'silver_credits'));
        // Pick the first UNLOCKED plan as the default
        const firstUnlocked = list.find(p => !systemLocks.find((l: any) => l.id === p.id && l.is_locked));
        setSelectedPack(firstUnlocked ?? list[0]);
    };

    const isSelectedLocked = !!systemLocks.find((l: any) => l.id === selectedPack?.id && l.is_locked);

    const reference = useMemo(() => {
        return `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }, [selectedPack?.id, isOpen]);

    const handlePaystackSuccessAction = async (response: any) => {
        setIsVerifying(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Session expired during payment. Contact support with reference: ' + response.reference);

            const res = await fetch('/api/paystack-verify', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    reference: response.reference,
                    type: selectedPack.type,
                    credits: selectedPack.credits || 0,
                    planName: selectedPack.planName || null,
                    months: selectedPack.months || 0
                }),
            });
            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                alert('Verification Error: ' + (data.error || 'Check your connection.'));
            }
        } catch (err: any) {
            alert('CRITICAL ERROR: ' + err.message);
        } finally {
            setIsVerifying(false);
        }
    };

    const visibleSubscriptions = showSilver
        ? LAB_SUBSCRIPTIONS
        : LAB_SUBSCRIPTIONS.filter(p => p.type !== 'silver_credits');
    const currentList = activeTab === 'credits' ? CREDIT_PACKS : visibleSubscriptions;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-2xl"
                    />

                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="w-full max-w-6xl bg-[#050505] border border-white/5 rounded-[2rem] md:rounded-[4rem] p-4 md:p-10 shadow-2xl relative overflow-hidden pointer-events-auto flex flex-col max-h-[96vh]"
                        >
                            <button onClick={onClose} className="absolute top-6 md:top-12 right-6 md:right-12 text-white/20 hover:text-white transition-colors z-30 p-2">
                                <X className="w-6 h-6 md:w-7 md:h-7" />
                            </button>

                            <div className="relative z-10 flex flex-col h-full overflow-hidden pt-8 md:pt-0">
                                <header className="text-center shrink-0 mb-6">
                                    <div className="flex justify-center mb-4 scale-75 md:scale-100">
                                        <Logo size="md" glow={false} />
                                    </div>
                                    <span className="text-purple-400 text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] mb-2 block">Secure Studio Checkout</span>
                                    <h2 className="text-xl md:text-2xl font-black tracking-tight mb-4 px-4 leading-tight">Elite Digital Assets</h2>

                                    <div className="flex bg-white/[0.03] p-1 rounded-2xl mx-auto w-max border border-white/5 scale-90 md:scale-100">
                                        <button
                                            onClick={() => handleTabChange('credits')}
                                            className={`px-4 md:px-8 py-2.5 md:py-3 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === 'credits' ? 'bg-white text-black shadow-lg' : 'text-white/30'}`}
                                        >
                                            Gold Credits
                                        </button>
                                        <button
                                            onClick={() => handleTabChange('subscriptions')}
                                            className={`px-4 md:px-8 py-2.5 md:py-3 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === 'subscriptions' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/30'}`}
                                        >
                                            Lab Plans
                                        </button>
                                    </div>
                                </header>

                                <div className={`mb-6 flex-grow overflow-y-auto px-1 md:px-2 py-2 custom-scrollbar gap-4 ${activeTab === 'credits' ? 'flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4' : 'flex flex-col md:grid md:grid-cols-3 max-w-5xl mx-auto w-full'}`}>
                                    {currentList.map((pkg) => {
                                        const isLocked = systemLocks.find((l: any) => l.id === pkg.id)?.is_locked;
                                        const isSelected = selectedPack.id === pkg.id;

                                        return (
                                            <button
                                                key={pkg.id}
                                                disabled={isLocked}
                                                onClick={() => setSelectedPack(pkg)}
                                                className={`relative group flex flex-col shrink-0 md:h-full rounded-[1.5rem] md:rounded-[2rem] border transition-all duration-500 text-left overflow-hidden ${isSelected ? 'bg-white/[0.08] border-white/20 ring-1 ring-white/10' : 'bg-white/[0.01] border-white/[0.05] opacity-80'} ${isLocked ? 'grayscale opacity-30 cursor-not-allowed' : 'hover:opacity-100'}`}
                                            >
                                                <div className={`h-1 w-full bg-gradient-to-r ${pkg.color} absolute top-0 left-0 opacity-40`} />
                                                
                                                {isLocked && <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20"><span className="text-[10px] font-black uppercase tracking-widest bg-red-500 text-white px-4 py-1.5 rounded-full">Paused</span></div>}

                                                <div className="p-5 md:p-6 flex flex-col h-full relative z-10">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 bg-white/[0.05]">
                                                            {pkg.icon}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-[11px] md:text-[12px] font-black tracking-tight uppercase leading-none mb-1">{pkg.label}</h3>
                                                            <p className="text-[7px] text-white/30 font-black uppercase tracking-widest leading-none">Studio Asset</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-baseline gap-1 mb-4">
                                                        <span className="text-white/20 text-[10px] font-black">₦</span>
                                                        <span className="text-2xl font-black tracking-tighter">{pkg.price.toLocaleString()}</span>
                                                        {pkg.type === 'subscription' && <span className="text-white/30 text-[8px] font-black uppercase tracking-widest ml-1">/ mo</span>}
                                                    </div>

                                                    <div className="space-y-2 mb-6 flex-grow">
                                                        {pkg.features.map((f, i) => (
                                                            <div key={i} className="flex items-center gap-2">
                                                                <div className={`w-3.5 h-3.5 rounded-lg flex items-center justify-center border ${isSelected ? 'bg-white text-black' : 'bg-white/5 border-white/10 text-white/30'}`}>
                                                                    <Check className="w-2 h-2" />
                                                                </div>
                                                                <span className="text-[8px] md:text-[9px] font-bold text-white/60 uppercase tracking-widest">{f}</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className={`mt-auto w-full h-11 rounded-xl border flex items-center justify-center tracking-[0.2em] font-black text-[9px] uppercase transition-all ${isSelected ? 'bg-white text-black border-transparent shadow-lg' : 'bg-transparent border-white/10 text-white/30'}`}>
                                                        {isSelected ? 'Secure Pack' : 'Select'}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {userId ? (
                                    <div className="p-6 md:p-8 bg-white/[0.03] border border-white/10 rounded-[2rem] md:rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 shrink-0 shadow-2xl mt-auto">
                                        <div className="flex flex-col gap-1 text-center md:text-left">
                                            <div className="flex items-center justify-center md:justify-start gap-2 mb-1 opacity-40">
                                                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none">Authenticated Session</span>
                                            </div>
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-white/40 text-sm font-bold uppercase tracking-widest">Total:</span>
                                                <span className="text-white text-2xl md:text-3xl font-black">₦{selectedPack.price.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center md:items-end gap-2 w-full md:w-auto">
                                            {isSelectedLocked ? (
                                                <button
                                                    disabled
                                                    className="h-14 md:h-[4.5rem] px-8 md:px-12 rounded-xl md:rounded-2xl flex items-center justify-center gap-3 w-full md:w-auto font-black uppercase tracking-[0.2em] text-[10px] md:text-xs bg-red-500/10 border border-red-500/20 text-red-400 cursor-not-allowed"
                                                >
                                                    🔒 Plan Locked — Unavailable
                                                </button>
                                            ) : (
                                                <PaystackButton
                                                    {...{
                                                        email: userEmail,
                                                        amount: selectedPack.price * 100,
                                                        publicKey,
                                                        text: isVerifying ? "Verifying..." : (activeTab === 'credits' ? "Purchase Gold Pack" : "Activate Full Lab"),
                                                        onSuccess: (res: any) => handlePaystackSuccessAction(res),
                                                        onClose: () => alert('Payment cancelled.'),
                                                        reference,
                                                        className: `h-14 md:h-[4.5rem] px-8 md:px-12 rounded-xl md:rounded-2xl flex items-center justify-center gap-4 transition-all w-full md:w-auto font-black uppercase tracking-[0.2em] text-[10px] md:text-xs shadow-2xl ${isVerifying ? 'bg-purple-600/50 cursor-not-allowed' : 'bg-white text-black hover:scale-[1.02] active:scale-95'}`
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-[2rem] text-center mt-auto">
                                        <p className="text-red-400 font-black uppercase tracking-widest text-[10px]">Active Session Required for Checkout</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
