'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Zap, Check, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { PaystackButton } from 'react-paystack';
import Logo from '@/components/Logo';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    userEmail: string;
    userId: string;
    onSuccess: () => void;
}

const PACKAGES = [
    {
        id: 'pack-10',
        credits: 10,
        price: 1500,
        label: 'Starter Pack',
        desc: 'Ideal for quick projects. Includes full access to all Video Studio tools.',
        icon: <Zap className="w-5 h-5 text-purple-400" />
    },
    {
        id: 'pack-20',
        credits: 20,
        price: 3000,
        label: 'Creator Pack',
        desc: 'Most popular. High-priority voice generation and faster processing.',
        icon: <Zap className="w-5 h-5 text-indigo-400" />,
        popular: true
    },
    {
        id: 'pack-50',
        credits: 50,
        price: 7500,
        label: 'Studio Pack',
        desc: 'Built for agencies. Generate professional assets for multiple clients.',
        icon: <Zap className="w-5 h-5 text-blue-400" />
    },
    {
        id: 'pack-monthly',
        credits: 150,
        price: 15000,
        label: 'Monthly Pro',
        desc: 'Our best value bundle. 150 credits for heavy-duty content production.',
        sub: true,
        icon: <Zap className="w-5 h-5 text-white" />
    }
];

export default function PaymentModal({ isOpen, onClose, userEmail, userId, onSuccess }: PaymentModalProps) {
    const [selectedPack, setSelectedPack] = useState(PACKAGES[1]);
    const [isVerifying, setIsVerifying] = useState(false);

    // Generate a fresh reference every time the pack or modal changes
    const reference = useMemo(() => {
        return `TR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }, [selectedPack.id, isOpen]);

    const handlePaystackSuccessAction = async (response: any) => {
        // Response format: { reference: "...", status: "success", trans: "..." }
        alert('PAYMENT CAPTURED! Reference: ' + response.reference);
        setIsVerifying(true);

        try {
            const verificationBody = {
                reference: response.reference,
                userId: userId,
                credits: selectedPack.credits
            };

            console.log('[paystack] Sending to verification:', verificationBody);

            const res = await fetch('/api/paystack-verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(verificationBody),
            });

            const data = await res.json();
            console.log('[paystack] Backend response:', data);

            if (res.ok) {
                onSuccess();
                onClose();
                alert(`SUCCESS! ${selectedPack.credits} credits added.`);
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
        text: "Purchase Credits",
        onSuccess: (res: any) => handlePaystackSuccessAction(res),
        onClose: handlePaystackCloseAction,
        reference: reference
    };

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
                            className="w-full max-w-3xl bg-[#0a0a0a] border border-white/10 rounded-[3.5rem] p-12 shadow-[0_0_100px_rgba(124,58,237,0.1)] relative overflow-hidden pointer-events-auto"
                        >
                            <button onClick={onClose} className="absolute top-10 right-10 text-white/20 hover:text-white transition-colors z-30">
                                <X className="w-6 h-6" />
                            </button>

                            <div className="relative z-10 flex flex-col h-full">
                                <header className="mb-12 text-center">
                                    <div className="flex justify-center mb-6">
                                        <Logo size="lg" glow={false} />
                                    </div>
                                    <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Secure Checkout</span>
                                    <h2 className="text-4xl font-bold tracking-tight mb-3">Upgrade Your Studio</h2>
                                    <p className="text-white/40 text-sm max-w-md mx-auto">Choose a plan to instantly add credits to your account. All payments are secured by Paystack.</p>
                                </header>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 overflow-y-auto max-h-[40vh] pr-2 custom-scrollbar">
                                    {PACKAGES.map((pkg) => (
                                        <button
                                            key={pkg.id}
                                            onClick={() => setSelectedPack(pkg)}
                                            className={`relative p-8 rounded-[2rem] border text-left transition-all group overflow-hidden flex flex-col justify-between min-h-[160px] ${selectedPack.id === pkg.id ? 'bg-purple-600/[0.08] border-purple-500 ring-1 ring-purple-500/20' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                                        >
                                            {pkg.popular && (
                                                <div className="absolute top-0 right-0 bg-purple-600 text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl text-white shadow-lg">Popular</div>
                                            )}

                                            <div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${selectedPack.id === pkg.id ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/40' : 'bg-white/5 text-white/40'}`}>
                                                        {pkg.icon}
                                                    </div>
                                                    {selectedPack.id === pkg.id && <motion.div layoutId="check" className="h-6 w-6 bg-purple-500 rounded-full flex items-center justify-center text-white"><Check className="w-4 h-4" /></motion.div>}
                                                </div>

                                                <h3 className="text-xl font-bold tracking-tight mb-2">{pkg.label}</h3>
                                                <p className="text-[11px] text-white/30 leading-relaxed mb-6 font-medium">{pkg.desc}</p>
                                            </div>

                                            <div className="flex items-baseline gap-2 mt-auto">
                                                <span className="text-white/20 text-xs font-black uppercase tracking-widest">₦</span>
                                                <span className="text-3xl font-black tracking-tighter">{pkg.price.toLocaleString()}</span>
                                                <div className="ml-auto flex flex-col items-end">
                                                    <span className="text-white text-[10px] font-black uppercase tracking-widest">{pkg.credits} Credits</span>
                                                    {pkg.sub && <span className="text-[8px] text-purple-400 font-bold uppercase tracking-widest italic">Billed Monthly</span>}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {userId ? (
                                    <div className="p-8 bg-white/[0.03] border border-white/5 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 mt-auto ring-1 ring-white/5 shadow-2xl">
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
                                    <div className="p-10 bg-red-500/5 border border-red-500/10 rounded-[2.5rem] text-center">
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
