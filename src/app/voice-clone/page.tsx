'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

const VoiceCloneTab = dynamic(() => import('@/components/VoiceCloneTab'), {
    ssr: false,
    loading: () => <div className="h-96 flex items-center justify-center text-white/20 uppercase tracking-[0.5em] font-black text-xs animate-pulse">Initializing Studio...</div>
});

export default function VoiceClonePage() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });
    }, []);

    return (
        <div className="min-h-screen bg-[#060606] text-white p-6 md:p-12 font-sans selection:bg-purple-500/30">
            <div className="max-w-5xl mx-auto space-y-12">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <Link
                            href="/"
                            className="h-12 w-12 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl shadow-xl shadow-purple-900/20 border border-white/10">
                                <Mic className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black tracking-tighter uppercase italic">Voice Clone</h1>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-md border border-purple-500/20">Studio v1.5</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-green-500/30 bg-green-500/5 text-green-400">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
                            <span className="text-xs font-black uppercase tracking-widest text-green-500">Active</span>
                        </div>
                    </div>
                </header>

                <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-12 relative overflow-hidden">
                    <VoiceCloneTab userId={user?.id} />

                    {/* Background Decor */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
                </div>
            </div>
        </div>
    );
}
