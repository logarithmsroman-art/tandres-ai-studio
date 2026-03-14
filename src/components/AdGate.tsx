'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, ShieldAlert } from 'lucide-react';

interface AdGateProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    type?: 'reward' | 'required';
}

declare global {
    interface Window {
        fluidPlayer: any;
    }
}

export default function AdGate({ isOpen, onClose, onComplete, type = 'required' }: AdGateProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerInstance = useRef<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [adCompleted, setAdCompleted] = useState(false);

    const VAST_URL = "https://necessary-jury.com/dLm.F0zidlgDNcv/ZXGYUI/GeNmt9AuXZKUrlYkiP/TCYb4vN/jckE5UM/T/cpt_NBjLgg2COLTBkNypM0Qj";

    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 50; // 5 seconds total
        let initInterval: NodeJS.Timeout;

        const initPlayer = () => {
            if (typeof window.fluidPlayer !== 'undefined' && videoRef.current) {
                clearInterval(initInterval);
                try {
                    playerInstance.current = window.fluidPlayer(videoRef.current, {
                        layoutControls: {
                            fillToContainer: true,
                            primaryColor: "#a855f7",
                            allowDownload: false,
                            playbackRateControl: false,
                            playPauseAnimation: true,
                            autoPlay: true,
                            mute: true, // Crucial for browser-autoplay policies
                            logo: {
                                imageUrl: '/logo.png',
                                clickUrl: 'https://tandresai.online',
                                position: 'top left',
                                opacity: 0.5
                            },
                        },
                        vastOptions: {
                            adList: [
                                {
                                    roll: 'preRoll',
                                    vastTag: VAST_URL
                                }
                            ],
                            adFinishedCallback: () => {
                                setAdCompleted(true);
                                onComplete();
                                onClose();
                            },
                            adErrorCallback: (err: any) => {
                                console.error("VAST Error:", err);
                                setError("Commercial unavailable. Unlocking tool...");
                                setTimeout(() => {
                                    onComplete();
                                    onClose();
                                }, 2000);
                            }
                        }
                    });
                } catch (e) {
                    console.error("Fluid Player Init Exception:", e);
                    setError("Player failed to start.");
                }
            } else {
                retryCount++;
                if (retryCount >= maxRetries) {
                    clearInterval(initInterval);
                    setError("Connection timed out. Please refresh.");
                    // Emergency fallback: allow them to use the tool if the ad network is down
                    setTimeout(() => {
                        onComplete();
                        onClose();
                    }, 3000);
                }
            }
        };

        if (isOpen) {
            initInterval = setInterval(initPlayer, 100);
        }

        return () => {
            if (initInterval) clearInterval(initInterval);
            if (playerInstance.current) {
                try {
                    playerInstance.current.destroy();
                } catch (e) {}
            }
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/95 backdrop-blur-xl"
                    onClick={() => adCompleted && onClose()}
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-4xl aspect-video bg-black border border-white/5 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.1)] flex flex-col items-center justify-center"
                >
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                                {type === 'reward' ? 'Earn Silver Credit' : 'Unlocking Tool Access'}
                            </span>
                        </div>
                        {adCompleted && (
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        )}
                    </div>

                    {/* Error State */}
                    {error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-20 bg-black/80">
                            <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">Something went wrong</h3>
                            <p className="text-white/60 mb-6">{error}</p>
                            <button 
                                onClick={onClose}
                                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-bold transition-all"
                            >
                                Close & Retry
                            </button>
                        </div>
                    )}

                    {/* Video Player */}
                    <video ref={videoRef} className="w-full h-full object-cover">
                        <source src="/placeholder_video.mp4" type="video/mp4" />
                    </video>

                    {/* Pre-load message & Stuck Fallback */}
                    {!playerInstance.current && !error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-0">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="mb-4"
                            >
                                <Play className="w-16 h-16 text-purple-500/20" />
                            </motion.div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-6">Establishing Studio Connection...</p>
                            
                            {/* If it takes more than 3 seconds, show a manual start button */}
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 3 }}
                                onClick={() => {
                                    // Try one final aggressive init
                                    if (typeof window.fluidPlayer !== 'undefined' && videoRef.current) {
                                        window.fluidPlayer(videoRef.current, { /* same options as above */ });
                                    } else {
                                        // If all fails, let them in
                                        onComplete();
                                        onClose();
                                    }
                                }}
                                className="px-6 py-2 bg-purple-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-purple-400 transition-all border border-purple-400/20"
                            >
                                Tap to Force Unlock
                            </motion.button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
