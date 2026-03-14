'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Cpu, Zap, Share2 } from 'lucide-react';

interface AdGateProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    type?: 'reward' | 'required';
}

export default function AdGate({ isOpen, onClose, onComplete, type = 'required' }: AdGateProps) {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('Initializing AI Core...');
    const [isReady, setIsReady] = useState(false);

    const DIRECT_LINK = "https://omg10.com/4/10732253";

    useEffect(() => {
        if (!isOpen) {
            setProgress(0);
            setIsReady(false);
            return;
        }

        const statuses = [
            'Establishing Neural Link...',
            'Calibrating Audio Buffers...',
            'Processing Synaptic Layers...',
            'Optimizing AI Output...',
            'Finalizing Studio Connection...'
        ];

        let currentStatus = 0;
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsReady(true);
                    return 100;
                }
                
                // Update status message based on progress
                const statusIndex = Math.floor((prev / 100) * statuses.length);
                if (statusIndex !== currentStatus && statusIndex < statuses.length) {
                    currentStatus = statusIndex;
                    setStatus(statuses[statusIndex]);
                }
                
                return prev + 1;
            });
        }, 80); // ~8 seconds total

        return () => clearInterval(interval);
    }, [isOpen]);

    const handleUnlock = () => {
        window.open(DIRECT_LINK, '_blank');
        onComplete();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/98 backdrop-blur-2xl overflow-hidden">
                {/* Background Magic Particles */}
                <div className="absolute inset-0 opacity-20">
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-purple-500 rounded-full"
                            initial={{ 
                                x: Math.random() * 100 + "%", 
                                y: Math.random() * 100 + "%",
                                opacity: 0 
                            }}
                            animate={{ 
                                y: [null, "-100%"],
                                opacity: [0, 1, 0]
                            }}
                            transition={{ 
                                duration: Math.random() * 5 + 5, 
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        />
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="relative w-full max-w-lg mx-4 p-8 rounded-[2.5rem] bg-zinc-900/50 border border-white/10 shadow-[0_0_80px_rgba(168,85,247,0.1)] flex flex-col items-center text-center"
                >
                    {/* Animated Icon */}
                    <div className="relative w-24 h-24 mb-8">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 border-t-2 border-r-2 border-purple-500/50 rounded-full"
                        />
                        <div className="absolute inset-4 rounded-full bg-purple-500/10 flex items-center justify-center">
                            {isReady ? (
                                <Zap className="w-8 h-8 text-purple-400 fill-purple-400/20" />
                            ) : (
                                <Cpu className="w-8 h-8 text-purple-500 animate-pulse" />
                            )}
                        </div>
                    </div>

                    <h2 className="text-xl font-black text-white uppercase tracking-[0.2em] mb-2 leading-tight">
                        {isReady ? 'Access Granted' : 'AI Processing'}
                    </h2>
                    
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] h-4 mb-8 italic">
                        {status}
                    </p>

                    {/* Progress Bar Container */}
                    <div className="w-full h-1 bg-white/5 rounded-full mb-10 overflow-hidden relative">
                        <motion.div 
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-fuchsia-500"
                            animate={{ width: `${progress}%` }}
                            transition={{ ease: "linear" }}
                        />
                    </div>

                    <div className="w-full space-y-4">
                        {!isReady ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full">
                                    <Sparkles className="w-3 h-3 text-purple-400" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Optimizing Resource Quality</span>
                                </div>
                                <p className="text-[8px] text-white/20 uppercase tracking-[0.2em]">Required for free studio access</p>
                            </div>
                        ) : (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={handleUnlock}
                                className="group relative w-full py-5 bg-white text-black rounded-3xl font-black uppercase text-xs tracking-[0.2em] hover:bg-purple-500 hover:text-white transition-all duration-500 overflow-hidden overflow-hidden shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-3">
                                    <Share2 className="w-4 h-4" />
                                    {type === 'reward' ? 'Unlock +1 Silver Credit' : 'Unlock Tool Access'}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-fuchsia-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            </motion.button>
                        )}
                    </div>

                    {/* Fine print */}
                    <p className="mt-8 text-[7px] font-medium text-white/10 uppercase tracking-[0.1em] max-w-[200px]">
                        By unlocking, you support the Tandres AI Studio processing layers. Thank you for your patience.
                    </p>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
