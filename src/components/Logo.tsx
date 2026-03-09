'use client';

import { motion } from 'framer-motion';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    glow?: boolean;
}

export default function Logo({ className = '', size = 'md', glow = true }: LogoProps) {
    const sizes = {
        sm: 'h-8 w-8 text-xl rounded-lg',
        md: 'h-10 w-10 text-2xl rounded-xl',
        lg: 'h-16 w-16 text-4xl rounded-2xl',
        xl: 'h-24 w-24 text-5xl rounded-3xl'
    };

    return (
        <div className={`relative group ${className}`}>
            {/* Outer Glow */}
            {glow && (
                <motion.div
                    className="absolute -inset-2 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                />
            )}

            {/* Logo Container */}
            <div className={`relative ${sizes[size]} flex items-center justify-center overflow-hidden border border-white/10 shadow-2xl`}>
                {/* Glossy Overlay */}
                <div className="absolute inset-0 bg-[#0a0a0a]" />
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-blue-500/10" />

                {/* Border Glow Gradient */}
                <div className="absolute inset-0 p-[1.5px] rounded-inherit">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-600 via-indigo-500 to-blue-400 rounded-inherit opacity-80" />
                    <div className="absolute inset-[1.5px] bg-[#0a0a0a] rounded-[calc(inherit-1.5px)]" />
                </div>

                {/* The "T" */}
                <span className="relative z-10 font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
                    T
                </span>

                {/* Shine Animation */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full"
                    animate={{ x: ['100%', '-100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 1 }}
                />
            </div>
        </div>
    );
}
