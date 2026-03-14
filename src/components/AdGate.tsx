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
        if (isOpen && videoRef.current && typeof window.fluidPlayer !== 'undefined') {
            // Wait a tiny bit for the DOM to settle
            const timer = setTimeout(() => {
                try {
                    playerInstance.current = window.fluidPlayer(videoRef.current, {
                        layoutControls: {
                            fillToContainer: true,
                            primaryColor: "#a855f7",
                            allowDownload: false,
                            playbackRateControl: false,
                            playPauseAnimation: true,
                            autoPlay: true,
                            mute: false,
                            logo: {
                                imageUrl: '/logo.png',
                                clickUrl: 'https://tandresai.online',
                                position: 'top left',
                                opacity: 0.5
                            },
                            controlBar: {
                                autoHide: true,
                                animated: true
                            }
                        },
                        vastOptions: {
                            adList: [
                                {
                                    roll: 'preRoll',
                                    vastTagLoad: (vastTag: string) => vastTag, // Just return the URL
                                    vastTag: VAST_URL
                                }
                            ],
                            adFinishedCallback: () => {
                                console.log("Ad finished");
                                setAdCompleted(true);
                                onComplete();
                                onClose();
                            },
                            adErrorCallback: (error: any) => {
                                console.error("Ad Error:", error);
                                setError("Commercial failed to load. Please try again.");
                                // Fallback: allow them through if it's a persistent error
                                setTimeout(() => {
                                    onComplete();
                                    onClose();
                                }, 3000);
                            }
                        }
                    });
                } catch (e) {
                    console.error("Fluid Player Init Error:", e);
                    setError("Player initialization failed.");
                }
            }, 100);

            return () => {
                clearTimeout(timer);
                if (playerInstance.current) {
                    try {
                        playerInstance.current.destroy();
                    } catch (e) {}
                }
            };
        }
    }, [isOpen, onComplete, onClose]);

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

                    {/* Pre-load message */}
                    {!playerInstance.current && !error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-0">
                            <Play className="w-16 h-16 text-purple-500/20 animate-pulse mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Establishing Studio Connection...</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
