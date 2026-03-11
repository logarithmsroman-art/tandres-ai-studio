'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Zap, Check, ShieldCheck, Loader2, Music } from 'lucide-react';
import { PaystackButton } from 'react-paystack';
import Logo from '@/components/Logo';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail: string;
    userId: string;
    onSuccess: () => void;
    currentTier?: string;
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
            'Unlimited YT/IG',
            '200 TikTok Extracts',
            '15min Std Duration',
            '5min TikTok Limit'
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
            'Unlimited YT/IG',
            '500 TikTok Extracts',
            '15hr Std Duration',
            '10min TikTok Limit'
        ],
        icon: <Music className="w-6 h-6 text-yellow-400" />,
        popular: true,
        type: 'subscription',
        planName: 'pro',
        color: 'from-yellow-500/20 to-transparent'
    }
];

export default function PaymentModal({ isOpen, onClose, userEmail, userId, onSuccess, currentTier = 'free' }: PaymentModalProps) {
    const [activeTab, setActiveTab] = useState<'credits' | 'subscriptions'>('credits');
    const [selectedPack, setSelectedPack] = useState<any>(CREDIT_PACKS[1]);
    const [isVerifying, setIsVerifying] = useState(false);

    const handleTabChange = (tab: 'credits' | 'subscriptions') => {
        setActiveTab(tab);
        if (tab === 'credits') setSelectedPack(CREDIT_PACKS[1]);
        else setSelectedPack(LAB_SUBSCRIPTIONS[0]);
    };

    // Generate a fresh reference every time the pack or modal changes
    const reference = useMemo(() => {
        return `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }, [selectedPack.id, isOpen]);

    const handlePaystackSuccessAction = async (response: any) => {
        setIsVerifying(true);

        try {
            const verificationBody = {
                reference: response.reference,
                userId: userId,
                type: selectedPack.type,
                credits: selectedPack.credits || 0,
                planName: selectedPack.planName || null,
                months: selectedPack.months || 0
            };

            const res = await fetch('/api/paystack-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(verificationBody),
            });

            const data = await res.json();

            if (res.ok) {
                onSuccess();
                onClose();
                alert(`SUCCESS! Transaction complete.`);
            } else {
                alert('Verification Error: ' + (data.error || 'Server rejected payment.'));
            }
        } catch (err: any) {
            console.error('[paystack] Frontend error:', err);
            alert('CRITICAL ERROR: ' + err.message);
        } finally {
            setIsVerifying(false);
        }
    };

    const handlePaystackCloseAction = () => {
        alert('Payment window closed. If you already paid, please refresh or contact support.');
    };

    const componentProps = {
        email: userEmail,
        amount: selectedPack.price * 100,
        metadata: {
            custom_fields: [
                {
                    display_name: "User ID",
                    variable_name: "user_id",
                    value: userId,
                },
            ],
        },
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
        text: activeTab === 'credits' ? "Purchase Credits" : "Subscribe Now",
        onSuccess: (res: any) => handlePaystackSuccessAction(res),
        onClose: handlePaystackCloseAction,
        reference: reference
    };

    const currentList = activeTab === 'credits' ? CREDIT_PACKS : LAB_SUBSCRIPTIONS;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl"
                    />

                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="w-full max-w-6xl bg-[#050505] border border-white/5 rounded-[4rem] p-8 lg:p-10 shadow-[0_0_120px_rgba(124,58,237,0.08)] relative overflow-hidden pointer-events-auto flex flex-col min-h-[70vh] max-h-[98vh]"
                        >
                            <button onClick={onClose} className="absolute top-12 right-12 text-white/10 hover:text-white transition-colors z-30 p-2 hover:bg-white/5 rounded-full">
                                <X className="w-7 h-7" />
                            </button>

                            <div className="relative z-10 flex flex-col h-full overflow-hidden">
                                <header className="text-center shrink-0 mb-4">
                                    <div className="flex justify-center mb-4">
                                        <Logo size="md" glow={false} />
                                    </div>
                                    <span className="text-purple-400 text-[9px] font-black uppercase tracking-[0.4em] mb-2 block">Secure Checkout</span>
                                    <h2 className="text-2xl font-black tracking-tight mb-2">Upgrade Your Studio</h2>

                                    {/* Tabs */}
                                    <div className="flex bg-white/[0.03] p-1 rounded-2xl mx-auto w-max mb-6 border border-white/5">
                                        <button
                                            onClick={() => handleTabChange('credits')}
                                            className={`px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === 'credits' ? 'bg-white text-black shadow-[0_10px_30px_rgba(255,255,255,0.2)]' : 'text-white/30 hover:text-white'}`}
                                        >
                                            Gold Credits
                                        </button>
                                        <button
                                            onClick={() => handleTabChange('subscriptions')}
                                            className={`px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${activeTab === 'subscriptions' ? 'bg-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.3)]' : 'text-white/30 hover:text-white'}`}
                                        >
                                            Lab Subscriptions
                                        </button>
                                    </div>
                                </header>

                                <div className={`grid gap-4 mb-6 flex-grow overflow-y-auto px-2 py-4 custom-scrollbar ${activeTab === 'credits' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto w-full'}`}>
                                    {currentList.map((pkg) => (
                                        <button
                                            key={pkg.id}
                                            onClick={() => setSelectedPack(pkg)}
                                            className={`relative group flex flex-col rounded-[2rem] border transition-all duration-700 text-left h-full overflow-hidden ${selectedPack.id === pkg.id ? 'bg-white/[0.08] border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-1 ring-white/10 scale-[1.01]' : 'bg-white/[0.01] border-white/[0.05] hover:border-white/20 hover:bg-white/[0.03] opacity-80 hover:opacity-100'}`}
                                        >
                                            {/* Top Accent Bar */}
                                            <div className={`h-1 w-full bg-gradient-to-r ${pkg.color} absolute top-0 left-0 opacity-40 group-hover:opacity-100 transition-opacity`} />

                                            {pkg.popular && (
                                                <div className="absolute top-4 right-6 px-3 py-1 bg-white text-black text-[8px] font-black uppercase tracking-widest rounded-full shadow-2xl z-20">Premium</div>
                                            )}

                                            <div className="p-4 flex flex-col h-full relative z-10">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 bg-white/[0.05] shadow-2xl group-hover:scale-110 transition-transform duration-700`}>
                                                        {pkg.icon}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-[10px] font-black tracking-tight uppercase">{pkg.label}</h3>
                                                        <p className="text-[6px] text-white/30 font-black uppercase tracking-widest leading-none">Asset</p>
                                                    </div>
                                                </div>

                                                <p className="text-[8px] text-white/50 font-medium mb-2 leading-tight italic opacity-80 group-hover:opacity-100 transition-opacity line-clamp-1">"{(pkg as any).description}"</p>

                                                <div className="flex items-baseline gap-1 mb-2">
                                                    <span className="text-white/20 text-[9px] font-black uppercase tracking-widest">₦</span>
                                                    <span className="text-xl font-black tracking-tighter tabular-nums">{pkg.price.toLocaleString()}</span>
                                                    {pkg.type === 'subscription' && <span className="text-white/30 text-[7px] font-black uppercase tracking-[0.2em] ml-1">/ mo</span>}
                                                </div>

                                                <div className="h-[1px] w-full bg-white/5 mb-3" />

                                                <div className="space-y-1.5 mb-4 flex-grow">
                                                    {pkg.features.map((feature: string, idx: number) => (
                                                        <div key={idx} className="flex items-start gap-2 group/item">
                                                            <div className={`w-3.5 h-3.5 rounded-md flex items-center justify-center shrink-0 border transition-all ${selectedPack.id === pkg.id ? 'bg-white border-transparent text-black' : 'bg-white/5 border-white/10 text-white/30 group-hover/item:border-white/20'}`}>
                                                                <Check className="w-2 h-2" />
                                                            </div>
                                                            <span className={`text-[7.5px] font-black uppercase tracking-widest leading-[1.1] transition-colors ${selectedPack.id === pkg.id ? 'text-white/90' : 'text-zinc-500'}`}>{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className={`mt-auto w-full h-9 rounded-lg border flex items-center justify-center transition-all duration-700 active:scale-95 ${selectedPack.id === pkg.id ? 'bg-white text-black border-transparent font-black uppercase tracking-[0.2em] text-[7.5px] shadow-[0_10px_20px_rgba(255,255,255,0.1)]' : 'bg-transparent border-white/10 text-white/30 text-[7px] font-black uppercase tracking-widest hover:border-white/40 hover:text-white'}`}>
                                                    {selectedPack.id === pkg.id ? 'Get Assets' : 'Select'}
                                                </div>
                                            </div>

                                            {/* Glow Overlay */}
                                            <div className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-[80px] pointer-events-none transition-opacity duration-1000 bg-gradient-to-br ${pkg.color} ${selectedPack.id === pkg.id ? 'opacity-20' : 'opacity-0'}`} />
                                        </button>
                                    ))}
                                </div>

                                {userId ? (
                                    <div className="p-8 bg-white/[0.03] border border-white/5 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 shrink-0 ring-1 ring-white/5 shadow-2xl mt-auto">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Verified User: {userEmail}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-white/40 text-lg font-bold tracking-tight uppercase">Total:</span>
                                                <span className="text-white text-3xl font-black">₦{selectedPack.price.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {isVerifying ? (
                                            <div className="h-20 px-12 bg-purple-600/50 text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-4 border border-purple-500/50 w-full md:w-auto">
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                Verifying...
                                            </div>
                                        ) : (
                                            <PaystackButton
                                                {...componentProps}
                                                className="h-20 px-16 bg-white text-black font-extrabold uppercase tracking-[0.2em] text-sm rounded-2xl flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:shadow-white/20 group w-full md:w-auto"
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-10 bg-red-500/5 border border-red-500/10 rounded-[2.5rem] text-center shrink-0 mt-auto">
                                        <p className="text-red-400 font-bold uppercase tracking-widest text-xs">Auth session required to process payment.</p>
                                    </div>
                                )}
                            </div>

                            {/* Background Art */}
                            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
