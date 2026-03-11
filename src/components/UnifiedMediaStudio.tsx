'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Video, Zap } from 'lucide-react';
import Link from 'next/link';

interface UnifiedMediaStudioProps {
    userId?: string;
}

export default function UnifiedMediaStudio({ userId }: UnifiedMediaStudioProps) {
    const tools = [
        {
            id: 'voice-clone',
            href: '/voice-clone',
            title: 'AI Voice Clone',
            description: 'Clone any human voice with high fidelity using Fish Speech v1.5.',
            icon: <Mic className="w-8 h-8" />,
            color: 'from-purple-600 to-indigo-600',
            glow: 'rgba(147, 51, 234, 0.4)',
            premium: true
        },
        {
            id: 'video-edit',
            href: '/lab',
            title: 'The Lab',
            description: 'Professional tools for video extraction, audio trimming, and multi-track joining.',
            icon: <Video className="w-8 h-8" />,
            color: 'from-blue-600 to-cyan-600',
            glow: 'rgba(37, 99, 235, 0.4)',
            premium: false
        }
    ];

    return (
        <div className="w-full max-w-6xl mx-auto py-12">
            <AnimatePresence mode="wait">
                <motion.div
                    key="tool-selection"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                    {tools.map((tool) => (
                        <Link href={tool.href} key={tool.id}>
                            <motion.div
                                whileHover={{ y: -8 }}
                                whileTap={{ scale: 0.98 }}
                                className="group relative p-12 bg-white/[0.03] border border-white/10 rounded-[2.5rem] overflow-hidden text-left transition-all hover:bg-white/[0.05] hover:border-white/20 h-full"
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
                            </motion.div>
                        </Link>
                    ))}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
