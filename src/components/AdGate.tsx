'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkipForward, Zap, Sparkles } from 'lucide-react';

interface AdGateProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    type?: 'reward' | 'required';
}

export default function AdGate({ isOpen, onClose, onComplete, type = 'required' }: AdGateProps) {
    const [status, setStatus] = useState<'playing' | 'completed'>('playing');
    const [timeLeft, setTimeLeft] = useState(10);

    useEffect(() => {
        if (isOpen) {
            // MultiTag handles ad rotation automatically. We provide the wait-gate.
            setStatus('playing');
            setTimeLeft(10); 
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
            <div className="fixed inset-0 z-[100] flex items-end justify-center pb-20 p-4 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
                />

                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="relative w-full max-w-md bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl pointer-events-auto"
                >
                    <div className="p-8 text-center space-y-6">
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                            <h3 className="text-sm font-black tracking-tight uppercase italic text-white/80">Studio Verification Active</h3>
                        </div>

                        <div>
                            {status === 'completed' ? (
                                <motion.button
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    onClick={handleSkip}
                                    className="w-full py-4 bg-purple-500 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-purple-400 transition-all shadow-xl shadow-purple-500/20 flex items-center justify-center gap-2"
                                >
                                    Finish & Unlock Tool
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
                                    <div className="flex justify-between items-center text-[10px] font-black text-white/20 uppercase tracking-widest px-1">
                                        <span>Commercial in progress</span>
                                        <span>{timeLeft}s remaining</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
