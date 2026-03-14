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
            setStatus('playing');
            setTimeLeft(15);
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
                    className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.1)]"
                >
                    {/* Header: Status Info */}
                    <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/20">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Sponsored Resource</span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {status === 'completed' ? (
                                <motion.button
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    onClick={handleSkip}
                                    className="px-8 py-2.5 bg-purple-500 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-purple-400 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
                                >
                                    Skip Ad
                                    <SkipForward className="w-3.5 h-3.5" />
                                </motion.button>
                            ) : (
                                <button
                                    disabled
                                    className="px-8 py-2.5 bg-white/5 border border-white/10 text-white/20 text-[11px] font-black uppercase tracking-widest rounded-xl flex items-center gap-3 cursor-not-allowed"
                                >
                                    Skip in {timeLeft}s
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Ad Content area */}
                    <div className="aspect-video w-full bg-black relative flex flex-col items-center justify-center">
                        {/* Real Ad Iframe / Video Wrapper */}
                        <div className="absolute inset-0 z-0">
                            {/* NOTE: Most ad networks block direct iframes, but since the user wants it 'In-Page', 
                                we embed the link in a container that looks native. */}
                            <iframe 
                                src={MONETAG_DIRECT_LINK}
                                className="w-full h-full border-0 pointer-events-auto opacity-90"
                                sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
                                title="Advertisement"
                            />
                        </div>

                        {/* Visual Overlay if ad takes time to load */}
                        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] z-10">
                             <div className="w-full h-1 absolute bottom-0">
                                <motion.div 
                                    className="h-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 15, ease: "linear" }}
                                />
                             </div>
                        </div>
                    </div>

                    {/* Footer: Tips / Plan Info */}
                    <div className="px-8 py-5 border-t border-white/5 bg-zinc-900/40 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400/60" />
                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">
                                Support Tandres AI by watching this short sponsor.
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-2 opacity-50">
                            <Clock className="w-3 h-3 text-white/40" />
                            <span className="text-[9px] font-medium text-white/40 uppercase tracking-widest italic">15s Secure Session</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
