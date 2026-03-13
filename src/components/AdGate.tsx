'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, SkipForward, X, AlertCircle, Loader2, Sparkles, Zap } from 'lucide-react';

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
            setStatus('loading');
            setTimeLeft(15);
            setProviderIndex(0);

            const loadAd = async () => {
                // 1. Initial Loading
                await new Promise(r => setTimeout(r, 1200));

                // 2. Optimizing for Nigeria (Fallback logic visualization)
                setStatus('optimizing');
                await new Promise(r => setTimeout(r, 1800));

                // 3. Trigger Ad
                setStatus('waiting');
            };

            loadAd();
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
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.15)]"
                >
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 p-8 flex items-center justify-between z-20">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Sponsored Content</span>
                        </div>
                        {status === 'completed' ? (
                            <button
                                onClick={handleSkip}
                                className="px-6 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                            >
                                Continue to Studio
                                <SkipForward className="w-3 h-3" />
                            </button>
                        ) : (
                            <div className="px-6 py-2 bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest rounded-full">
                                {status === 'loading' ? 'Loading Ad...' : `Unlock in ${timeLeft}s`}
                            </div>
                        )}
                    </div>

                    {/* Ad Content area */}
                    <div className="aspect-video w-full bg-black/40 flex items-center justify-center relative group">
                        {status === 'loading' ? (
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                                <span className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Initializing Global Ad Server...</span>
                            </div>
                        ) : status === 'optimizing' ? (
                            <div className="flex flex-col items-center gap-6 text-center px-12">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="p-4 bg-purple-500/10 rounded-full border border-purple-500/20"
                                >
                                    <Zap className="w-8 h-8 text-purple-400" />
                                </motion.div>
                                <div>
                                    <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] block mb-2">Network Optimization</span>
                                    <p className="text-white text-xs font-bold uppercase tracking-widest leading-relaxed">
                                        Connecting to <span className="text-purple-400">{providers[providerIndex].name}</span> for Nigeria Base...
                                    </p>
                                </div>
                            </div>
                        ) : status === 'waiting' ? (
                            <div className="flex flex-col items-center gap-8 text-center px-12">
                                <div className="p-6 bg-purple-500/10 rounded-3xl border border-purple-500/20 shadow-2xl shadow-purple-500/10 mb-2">
                                    <Play className="w-12 h-12 text-purple-400 fill-purple-400/20" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Ad Ready</h3>
                                    <p className="text-white/40 text-sm font-medium leading-relaxed max-w-xs mx-auto">Click below to watch the ad and unlock your studio action instantly.</p>
                                    <motion.a
                                        href={MONETAG_DIRECT_LINK}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setStatus('playing')}
                                        className="mt-6 px-10 py-4 bg-white text-black text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-purple-50 transition-all shadow-xl shadow-white/10 flex items-center gap-3 no-underline cursor-pointer"
                                    >
                                        <Play className="w-4 h-4 fill-current" />
                                        Watch Video Now
                                    </motion.a>
                                </div>
                            </div>
                        ) : status === 'playing' ? (
                            <div className="w-full flex flex-col items-center justify-center min-h-[400px] p-12 bg-black/60 relative overflow-hidden">
                                {/* Cinema Background Glow */}
                                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-black/40 pointer-events-none" />
                                
                                <div className="relative z-10 flex flex-col items-center text-center gap-8">
                                    <div className="h-20 w-20 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl relative border border-white/10">
                                        <Sparkles className="w-10 h-10 text-white" />
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <h3 className="text-3xl font-black tracking-tight uppercase italic text-white">Ad Verification</h3>
                                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Processing view... Stay on this page</p>
                                    </div>

                                    <div className="w-64 space-y-4">
                                        <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest text-purple-400">
                                            <span>Verifying</span>
                                            <span className="text-white/20">{timeLeft}s</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                                                initial={{ width: "0%" }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 15, ease: "linear" }}
                                            />
                                        </div>
                                    </div>

                                    <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                                        <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Secure Session Active</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 bg-gradient-to-b from-green-500/5 to-transparent">
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="bg-green-500/10 border border-green-500/20 p-6 rounded-3xl shadow-[0_0_50px_rgba(34,197,94,0.1)]"
                                >
                                    <Zap className="w-16 h-16 text-green-500 fill-green-500/10" />
                                </motion.div>
                                <div className="text-center">
                                    <h3 className="text-4xl font-black tracking-tighter uppercase italic mb-3 text-white">Action Verified</h3>
                                    <p className="text-white/30 text-xs font-bold uppercase tracking-[0.3em]">Studio tool is now fully unlocked</p>
                                </div>
                            </div>
                        )}

                        {/* Video Mockup Controls Overlay (just for visuals) */}
                        <div className="absolute inset-x-0 bottom-0 p-8 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="h-1 bg-white/10 flex-grow mr-4 rounded-full overflow-hidden">
                                <div className="h-full bg-white/30" style={{ width: `${((15 - timeLeft) / 15) * 100}%` }} />
                            </div>
                            <Play className="w-4 h-4 text-white/40" />
                        </div>
                    </div>

                    {/* Bottom Info */}
                    <div className="p-8 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-4 h-4 text-white/20" />
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Skip the wait entirely with a Pro Plan</span>
                        </div>
                        <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
