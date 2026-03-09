'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Video, Scissors, Download, Music, Zap, Lock, CreditCard } from 'lucide-react';
import VoiceCloneTab from './VoiceCloneTab';
import VideoEditTab from './VideoEditTab';

type StudioTool = 'voice-clone' | 'video-edit';

interface UnifiedMediaStudioProps {
    userId?: string;
    onSuccess?: () => void;
}

export default function UnifiedMediaStudio({ userId, onSuccess }: UnifiedMediaStudioProps) {
    const [activeTool, setActiveTool] = useState<StudioTool | null>(null);

    const tools = [
        {
            id: 'voice-clone',
            title: 'AI Voice Clone',
            description: 'Clone any human voice with high fidelity using Fish Speech v1.5.',
            icon: <Mic className="w-8 h-8" />,
            color: 'from-purple-600 to-indigo-600',
            glow: 'rgba(147, 51, 234, 0.4)',
            premium: true
        },
        {
            id: 'video-edit',
            title: 'Multimedia Fusion Suite',
            description: 'Professional hub for video extraction, audio cutting, and multi-track joining.',
            icon: <Video className="w-8 h-8" />,
            color: 'from-blue-600 to-cyan-600',
            glow: 'rgba(37, 99, 235, 0.4)',
            premium: false
        }
    ];

    return (
        <div className="w-full max-w-6xl mx-auto py-12">
            <AnimatePresence mode="wait">
                {!activeTool ? (
                    <motion.div
                        key="tool-selection"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                        {tools.map((tool) => (
                            <motion.button
                                key={tool.id}
                                onClick={() => setActiveTool(tool.id as StudioTool)}
                                whileHover={{ y: -8 }}
                                whileTap={{ scale: 0.98 }}
                                className="group relative p-12 bg-white/[0.03] border border-white/10 rounded-[2.5rem] overflow-hidden text-left transition-all hover:bg-white/[0.05] hover:border-white/20"
                            >
                                {/* Active Background Glow */}
                                <div
                                    className="absolute -inset-20 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                                    style={{ background: `radial-gradient(circle, ${tool.glow} 0%, transparent 70%)` }}
                                />

                                <div className="relative z-10 flex flex-col h-full gap-6">
                                    <div className={`h-16 w-16 bg-gradient-to-tr ${tool.color} rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/20`}>
                                        {tool.icon}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-4xl font-bold tracking-tight">{tool.title}</h3>
                                            {tool.premium && (
                                                <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] uppercase font-black rounded-full tracking-widest">Premium</span>
                                            )}
                                        </div>
                                        <p className="text-white/40 text-lg leading-relaxed max-w-sm">
                                            {tool.description}
                                        </p>
                                    </div>

                                    <div className="mt-auto pt-8 flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">Start Creating</span>
                                        <div className="h-10 w-10 border border-white/10 rounded-full flex items-center justify-center group-hover:border-white/40 transition-colors">
                                            <Zap className="w-4 h-4 text-white/40 group-hover:text-white" />
                                        </div>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="active-tool"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-12 min-h-[600px] relative overflow-hidden"
                    >
                        {/* Back button */}
                        <div className="mb-12 flex items-center justify-between relative z-10">
                            <button
                                onClick={() => setActiveTool(null)}
                                className="flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
                            >
                                <div className="h-8 w-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/5 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                </div>
                                <span className="font-medium text-sm">Back to Studio</span>
                            </button>

                            <div className="flex items-center gap-4">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/20">Studio Engine Active</span>
                            </div>
                        </div>

                        {activeTool === 'voice-clone' ? (
                            <div className="relative z-10">
                                <header className="max-w-xl">
                                    <h2 className="text-5xl font-bold tracking-tight mb-4">Voice Clone</h2>
                                    <p className="text-white/30 text-lg leading-relaxed">Clone any human voice by uploading a short 10-second reference clip and typing your script.</p>
                                </header>

                                <VoiceCloneTab userId={userId} onSuccess={onSuccess} />
                            </div>
                        ) : (
                            <div className="relative z-10">
                                <header className="max-w-xl">
                                    <h2 className="text-5xl font-bold tracking-tight mb-4">Multimedia Fusion Suite</h2>
                                    <p className="text-white/30 text-lg leading-relaxed">Professional tools to process your video content, extract high-quality audio, and join clips with ease.</p>
                                </header>

                                <VideoEditTab userId={userId} onSuccess={onSuccess} />
                            </div>
                        )}

                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full -mr-40 -mt-20 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -ml-40 -mb-20 pointer-events-none" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
