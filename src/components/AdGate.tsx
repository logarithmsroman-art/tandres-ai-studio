'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShieldAlert } from 'lucide-react';

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
    const [isPlayerReady, setIsPlayerReady] = useState(false);

    const VAST_URL = "https://necessary-jury.com/dLm.F0zidlgDNcv/ZXGYUI/GeNmt9AuXZKUrlYkiP/TCYb4vN/jckE5UM/T/cpt_NBjLgg2COLTBkNypM0Qj";

    useEffect(() => {
        if (!isOpen) return;

        let checkInterval: NodeJS.Timeout;
        let timeoutTimer: NodeJS.Timeout;

        const cleanup = () => {
            if (checkInterval) clearInterval(checkInterval);
            if (timeoutTimer) clearTimeout(timeoutTimer);
            if (playerInstance.current && playerInstance.current.destroy) {
                try {
                    playerInstance.current.destroy();
                    playerInstance.current = null;
                } catch (e) {
                    console.error("Error destroying player:", e);
                }
            }
        };

        checkInterval = setInterval(() => {
            if (window.fluidPlayer && videoRef.current) {
                clearInterval(checkInterval);
                try {
                    playerInstance.current = window.fluidPlayer(videoRef.current, {
                        layoutControls: {
                            fillToContainer: true,
                            primaryColor: "#a855f7",
                            allowDownload: false,
                            playbackRateControl: false,
                            playPauseAnimation: true,
                            autoPlay: true,
                            mute: true, // Required for autoplay
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
                                    vastTag: VAST_URL
                                }
                            ],
                            vastTimeout: 10000,
                            adFinishedCallback: () => {
                                onComplete();
                                onClose();
                            },
                            adErrorCallback: (err: any) => {
                                console.warn("VAST Error (continuing to tool):", err);
                                // Fallback: if ad fails, don't block the user
                                onComplete();
                                onClose();
                            }
                        }
                    });
                    setIsPlayerReady(true);
                } catch (e) {
                    console.error("Fluid Player init error:", e);
                    setError("Failed to start player.");
                }
            }
        }, 100);

        // Max wait 8 seconds for the whole thing
        timeoutTimer = setTimeout(() => {
            if (!isPlayerReady && !error) {
                console.warn("Ad load timeout - granting access");
                onComplete();
                onClose();
            }
        }, 8000);

        return cleanup;
    }, [isOpen, onComplete, onClose]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.15)]"
                >
                    <video ref={videoRef} playsInline muted className="w-full h-full object-cover">
                        <source src="" type="video/mp4" />
                    </video>

                    {/* Clean Loading State - No 'nonsense' buttons */}
                    {!isPlayerReady && !error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20">
                            <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Studio Connection Active</p>
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-30 p-8 text-center">
                            <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
                            <p className="text-white font-bold mb-4">{error}</p>
                            <button onClick={onClose} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-black uppercase tracking-widest transition-all">
                                Close
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
