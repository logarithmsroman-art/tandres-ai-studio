'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, SkipForward, X, AlertCircle, Loader2, Sparkles, Zap, Clock } from 'lucide-react';

interface AdGateProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    type?: 'reward' | 'required';
}

export default function AdGate({ isOpen, onClose, onComplete, type = 'required' }: AdGateProps) {
    const [status, setStatus] = useState<'loading' | 'optimizing' | 'waiting' | 'playing' | 'completed'>('loading');
    const [timeLeft, setTimeLeft] = useState(15);
    const [providerIndex, setProviderIndex] = useState(0);

    const MONETAG_DIRECT_LINK = "https://omg10.com/4/10721609";

    const providers = [
        { name: 'Monetag', weight: 1 },
        { name: 'Adsterra', weight: 0.8 },
        { name: 'PropellerAds', weight: 0.6 }
    ];

    useEffect(() => {
        if (isOpen) {
            // Trigger the native Monetag Vignette/Interstitial instantly
            try {
                // @ts-ignore
                if (window.show_8854045) { // Common Monetag trigger function
                    // @ts-ignore
                    window.show_8854045();
                }
            } catch (e) {
                console.warn("Native ad trigger failed, falling back to wait-state.");
            }
            setStatus('playing');
            setTimeLeft(10); // Native ads are usually 10s
        }
    }, [isOpen]);

    useEffect(() => {
        if (status === 'playing' && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setStatus('completed');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [status, timeLeft]);

    const handleSkip = () => {
        if (status === 'completed') {
            onComplete();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.1)]"
                >
                    {/* Simplified Hub while Native Ad plays in front */}
                    <div className="p-12 text-center space-y-8">
                        <div className="w-20 h-20 bg-purple-500/10 rounded-full border border-purple-500/20 flex items-center justify-center mx-auto">
                            <Zap className="w-10 h-10 text-purple-400 animate-pulse" />
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-2xl font-black tracking-tight uppercase italic text-white">Studio Verification</h3>
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed">
                                Please interact with the advertisement <br/> to unlock your high-speed session.
                            </p>
                        </div>

                        <div className="pt-4">
                            {status === 'completed' ? (
                                <motion.button
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    onClick={handleSkip}
                                    className="w-full py-4 bg-purple-500 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-purple-400 transition-all shadow-xl shadow-purple-500/20 flex items-center justify-center gap-2"
                                >
                                    Continue to Tool
                                    <SkipForward className="w-4 h-4" />
                                </motion.button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div 
                                            className="h-full bg-purple-500"
                                            initial={{ width: "0%" }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 10, ease: "linear" }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest block">
                                        Action Ready in {timeLeft}s
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Info */}
                    <div className="px-8 py-5 border-t border-white/5 bg-zinc-900/40 flex items-center justify-center gap-2.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400/60" />
                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">
                            Native Commercial Stream Active
                        </span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
