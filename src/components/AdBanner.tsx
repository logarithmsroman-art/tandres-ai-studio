'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Sparkles } from 'lucide-react';

export default function AdBanner() {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl border border-purple-500/20">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-white mb-1">Boost Your Studio</h4>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Get unlimited high-speed extractions with Gold Credits.</p>
                </div>
            </div>

            <a 
                href="https://omg10.com/4/10721609" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-8 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 relative z-10"
            >
                Learn More
                <ExternalLink className="w-3 h-3" />
            </a>
        </motion.div>
    );
}
