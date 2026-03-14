'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdGateProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

declare global {
    interface Window {
        fluidPlayer: any;
    }
}

export default function AdGate({ isOpen, onClose, onComplete }: AdGateProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerInstance = useRef<any>(null);
    const [initAttempted, setInitAttempted] = useState(false);

    // Please replace this with your ADSTERRA VAST URL!
    const VAST_URL = "https://necessary-jury.com/dLm.F0zidlgDNcv/ZXGYUI/GeNmt9AuXZKUrlYkiP/TCYb4vN/jckE5UM/T/cpt_NBjLgg2COLTBkNypM0Qj";

    useEffect(() => {
        if (!isOpen || initAttempted) return;

        const checkFluid = setInterval(() => {
            if (window.fluidPlayer && videoRef.current) {
                clearInterval(checkFluid);
                setInitAttempted(true);

                try {
                    playerInstance.current = window.fluidPlayer(videoRef.current, {
                        layoutControls: {
                            primaryColor: "#a855f7",
                            fillToContainer: true,
                            autoPlay: true,
                            mute: true,
                            playButtonShowing: true,
                            logo: { imageUrl: '/logo.png', opacity: 0.5 },
                        },
                        vastOptions: {
                            allowVPAID: true,
                            vastTimeout: 15000,
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
                            adErrorCallback: () => {
                                // Direct skip on error so user isn't stuck
                                onComplete();
                                onClose();
                            }
                        }
                    });
                } catch (e) {
                    console.error("Fluid Player Error:", e);
                    onComplete();
                    onClose();
                }
            }
        }, 200);

        return () => {
            clearInterval(checkFluid);
            if (playerInstance.current) {
                try {
                    playerInstance.current.destroy();
                } catch (e) {}
            }
        };
    }, [isOpen, onComplete, onClose, initAttempted]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full p-0 flex items-center justify-center"
                >
                    <div className="w-full max-w-6xl aspect-video bg-zinc-950 shadow-2xl overflow-hidden md:rounded-2xl border border-white/5">
                        <video ref={videoRef} id="ad-video" playsInline muted className="w-full h-full">
                            <source src="https://cdn.fluidplayer.com/videos/vtt_example.mp4" type="video/mp4" />
                        </video>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
