'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Upload, Play, Download, Trash2, Cpu, AlertCircle, CheckCircle2, Music, Sparkles, Zap, ArrowLeft, Loader2 } from 'lucide-react';
import AdGate from './AdGate';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
const PaymentModal = dynamic(() => import('./PaymentModal'), { ssr: false });

const CHARACTER_LIMIT = 500;

interface VoiceCloneTabProps {
    userId?: string;
    onSuccess?: () => void;
}

export default function VoiceCloneTab({ userId, onSuccess }: VoiceCloneTabProps) {
    const [voiceSample, setVoiceSample] = useState<string | null>(null);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [resultAudio, setResultAudio] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showLimitAlert, setShowLimitAlert] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchProfile = async () => {
        if (!userId) return;
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (data) setProfile(data);
    };

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    // Removed awardCredit and handleEarnCredits as ads no longer apply to Voice Clone

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert('File too large. Max 10MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setVoiceSample(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        if (!voiceSample || !text) return;

        setError(null);
        setResultAudio(null);
        setShowLimitAlert(false);

        // Guest Limit Check
        if (!userId) {
            setShowLimitAlert(true);
            setError('Please login to generate voices.');
            return;
        }

        // Strict Paid Credit Check (Gold)
        if ((profile?.credits || 0) <= 0) {
            setError('0 Gold Credits remaining. Top up required to generate this voice.');
            setIsPaymentOpen(true);
            return;
        }

        // Logic for deducting paid credits (handled in executeGeneration or via separate API)

        executeGeneration();
    };

    const executeGeneration = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('Session expired. Please login again.');

            const res = await fetch('/api/voice-clone', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ voiceAudio: voiceSample, text }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Server error');
            if (!data.url) throw new Error('No audio URL returned.');

            setResultAudio(data.url);
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-12 max-w-4xl mx-auto relative">
            {/* Floating Limit Alert */}
            <AnimatePresence>
                {showLimitAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -50, scale: 0.9 }}
                        className="fixed top-8 right-8 z-[100] w-96 bg-purple-600 border border-purple-400 p-8 rounded-[2rem] shadow-2xl flex flex-col gap-4 group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                                <Mic className="w-6 h-6 animate-pulse" />
                            </div>
                            <div>
                                <h4 className="font-black uppercase tracking-widest text-white text-sm">Auth Required</h4>
                                <p className="text-white/60 text-[10px] font-bold">Log in to clone voices</p>
                            </div>
                            <button onClick={() => setShowLimitAlert(false)} className="ml-auto text-white/40 hover:text-white transition-colors">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-white text-sm font-medium leading-relaxed">
                            Voice cloning requires a Tandres account to manage credits and secure your data.
                        </p>
                        <button
                            onClick={() => setShowLimitAlert(false)}
                            className="bg-white text-purple-600 h-12 rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                            Log In Now
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Left: Input Selection */}
                <div className="flex flex-col gap-8">
                    <div className="group relative">
                        <label className="block text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-4 ml-1">Step 1: Reference Audio</label>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative h-64 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center p-8 transition-all cursor-pointer overflow-hidden ${voiceSample ? 'border-purple-500/40 bg-purple-500/[0.02]' : 'border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]'}`}
                        >
                            <input type="file" ref={fileInputRef} hidden accept="audio/*" onChange={handleFileUpload} />

                            {voiceSample ? (
                                <div className="flex flex-col items-center gap-4 relative z-10 text-center">
                                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold tracking-tight">Voice Sample Uploaded</span>
                                        <span className="text-white/30 text-xs">Ready for cloning</span>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setVoiceSample(null); }}
                                        className="mt-4 text-xs font-bold text-white/20 hover:text-red-400 transition-colors uppercase tracking-widest"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-6 relative z-10 text-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/20 group-hover:scale-110 transition-transform">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-medium opacity-60">Upload 10s voice clip</span>
                                        <span className="text-white/20 text-xs mt-1">MP3, WAV, M4A up to 10MB</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Text Input */}
                <div className="flex flex-col gap-8">
                    <div className="relative">
                        <label className="block text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-4 ml-1">Step 2: Script</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Enter the text you want the cloned voice to speak..."
                            className="w-full h-64 bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 text-white placeholder:text-white/10 focus:outline-none focus:border-purple-500/40 focus:bg-purple-500/[0.02] transition-all resize-none text-lg leading-relaxed font-medium"
                            maxLength={CHARACTER_LIMIT}
                        />
                        <div className="absolute bottom-6 right-8 flex flex-col items-end gap-2">
                            {text.length > CHARACTER_LIMIT * 0.9 && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-[9px] font-black text-red-400 uppercase tracking-widest bg-red-400/10 px-2 py-1 rounded-md mb-1"
                                >
                                    {text.length > CHARACTER_LIMIT ? 'Limit Exceeded' : 'Near Limit'}
                                </motion.span>
                            )}
                            <span className={`text-[10px] font-black uppercase tracking-widest ${text.length > CHARACTER_LIMIT ? 'text-red-500' : text.length > CHARACTER_LIMIT * 0.9 ? 'text-red-400' : 'text-white/20'}`}>
                                {text.length} / {CHARACTER_LIMIT}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-[1px] w-full bg-white/5" />

            {/* Action Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-4">
                <div className="flex flex-col max-w-sm">
                    <div className="flex flex-col max-w-sm">
                        <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.03] border border-white/10 rounded-2xl w-fit group">
                            <Zap className={`w-4 h-4 transition-colors ${(profile?.credits || 0) > 0 ? 'text-purple-400' : 'text-red-400 animate-pulse'}`} />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">
                                    {(profile?.credits || 0)} Gold Credits Remaining
                                </span>
                                {(profile?.credits || 0) === 0 && (
                                    <span className="text-[8px] font-bold uppercase tracking-widest text-red-500/60 -mt-0.5">0 Gold Credits remaining. Top-up required</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    disabled={!voiceSample || !text || loading || text.length > CHARACTER_LIMIT}
                    onClick={handleGenerate}
                    className={`h-20 px-12 rounded-3xl font-black text-lg uppercase tracking-widest flex items-center gap-4 transition-all active:scale-95 shadow-2xl relative overflow-hidden ${(!voiceSample || !text || loading) ? 'bg-white/5 text-white/20 cursor-not-allowed opacity-50' : 'bg-white text-black hover:-translate-y-1 shadow-white/10 animate-glow'}`}
                >
                    {loading ? (
                        <>
                            <div className="h-5 w-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            Generating...
                        </>
                    ) : (
                        'Generate Voice'
                    )}
                </button>
            </div>

            {/* Result Display */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-10 bg-purple-500/5 border border-purple-500/10 rounded-3xl flex flex-col items-center justify-center gap-4 text-center"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-[ping_1.5s_infinite]" />
                            <div className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-[ping_1.5s_infinite_0.3s]" />
                            <div className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-[ping_1.5s_infinite_0.6s]" />
                        </div>
                        <h4 className="text-xl font-bold tracking-tight">Generating your voice...</h4>
                        <p className="text-white/30 text-sm max-w-sm">Please wait while we process your audio. This usually takes 10-30 seconds.</p>
                    </motion.div>
                )}

                {resultAudio && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-10 bg-white/[0.02] border border-white/5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 animate-in shadow-2xl shadow-purple-900/10"
                    >
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                                <Music className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold tracking-tight">Audio Ready</h4>
                                <p className="text-white/30 text-sm">Download your high-fidelity voice clone.</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <audio controls src={resultAudio} className="h-12 invert opacity-80" />
                            <a
                                href={resultAudio}
                                download={`cloned-voice-${Date.now()}.mp3`}
                                className="h-14 px-8 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl flex items-center gap-3 transition-all active:scale-95 shadow-xl shadow-purple-600/20"
                            >
                                <Download className="w-5 h-5" />
                                Export MP3
                            </a>
                        </div>
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-8 bg-red-500/5 border border-red-500/10 rounded-3xl flex items-center gap-4 text-red-400 font-medium"
                    >
                        <AlertCircle className="w-6 h-6 shrink-0" />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Payment Modal Integration */}
            <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                userEmail={profile?.email || ''}
                userId={userId || ''}
                onSuccess={fetchProfile}
            />
        </div>
    );
}
