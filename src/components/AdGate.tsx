'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

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
    const [isThinking, setIsThinking] = useState(true);

    const VAST_URL = "https://necessary-jury.com/dLm.F0zidlgDNcv/ZXGYUI/GeNmt9AuXZKUrlYkiP/TCYb4vN/jckE5UM/T/cpt_NBjLgg2COLTBkNypM0Qj";

    useEffect(() => {
        if (!isOpen) return;

        let checkInterval: NodeJS.Timeout;
        let timeoutTimer: NodeJS.Timeout;

        const init = () => {
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
                            mute: true,
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
                                onComplete();
                                onClose();
                            },
                            adErrorCallback: (err: any) => {
                                console.warn("Ad skip/error:", err);
                                onComplete();
                                onClose();
                            }
                        }
                    });
                    
                    // Once initialized, hide our loader and let Fluid Player show its own if needed
                    setTimeout(() => setIsThinking(false), 500);
                } catch (e) {
                    console.error("Fluid Player init error:", e);
                    onComplete();
                    onClose();
                }
            }
        };

        checkInterval = setInterval(init, 200);

        // Fail-safe: if nothing happens in 10 seconds, let them in
        timeoutTimer = setTimeout(() => {
            onComplete();
            onClose();
        }, 10000);

        return () => {
            clearInterval(checkInterval);
            clearTimeout(timeoutTimer);
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
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full flex flex-col items-center justify-center p-0 md:p-12 lg:p-20"
                >
                    <div className="relative w-full h-full max-w-6xl aspect-video bg-black shadow-2xl overflow-hidden rounded-0 md:rounded-3xl border border-white/5">
                        {/* Fluid Player will take over this video tag */}
                        <video ref={videoRef} playsInline muted className="w-full h-full">
                            <source src="https://cdn.fluidplayer.com/videos/vtt_example.mp4" type="video/mp4" />
                        </video>

                        {/* Initial "Studio Connection" screen - simpler and centered */}
                        {isThinking && (
                            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50">
                                <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic">Establishing Link...</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
