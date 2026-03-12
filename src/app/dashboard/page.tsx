'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { 
    Clock, ShieldCheck, Layers, BadgeCheck, 
    ArrowLeft, Zap, Sparkles, CreditCard, 
    History, TrendingUp, Settings
} from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/Logo';

type Profile = {
    credits: number;
    free_credits: number;
    subscription_tier: string;
    plan_expires_at: string | null;
    tiktok_extractions_remaining: number;
};

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [nextPlan, setNextPlan] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                await fetchData(session.user.id);
            } else {
                window.location.href = '/';
            }
            setLoading(false);
        };
        init();
    }, []);

    const fetchData = async (userId: string) => {
        const { data: profData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (profData) setProfile(profData);

        const { data: queueData } = await supabase
            .from('subscription_queue')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(1);
        if (queueData && queueData.length > 0) setNextPlan(queueData[0]);
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <Logo size="lg" className="animate-pulse" />
        </div>
    );

    return (
        <main className="min-h-screen bg-[#050505] text-white selection:bg-purple-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-600/5 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-blue-600/5 blur-[150px] rounded-full -translate-x-1/2 translate-y-1/2" />
            </div>

            <nav className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-black/40 backdrop-blur-3xl">
                <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-4 group">
                        <div className="p-2.5 bg-zinc-900 border border-white/10 rounded-xl group-hover:border-purple-500/50 transition-all">
                            <ArrowLeft className="w-5 h-5 text-white/40 group-hover:text-white" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">Back to Studio</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center font-black text-xs text-white">
                            {user?.email?.[0].toUpperCase()}
                        </div>
                    </div>
                </div>
            </nav>

            <div className="pt-32 pb-20 px-8 relative z-10">
                <div className="max-w-7xl mx-auto space-y-12">
                    {/* Page Title */}
                    <header>
                        <motion.h1 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-6xl font-black tracking-tighter italic uppercase"
                        >
                            Account <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Dashboard</span>
                        </motion.h1>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT: Main Status */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-8 space-y-8"
                        >
                            {/* Primary Plan Card */}
                            <section className={`p-10 rounded-[3rem] border bg-gradient-to-br transition-all relative overflow-hidden group/card shadow-2xl ${
                                profile?.subscription_tier === 'pro' ? 'from-purple-900/40 to-black border-purple-500/30' : 
                                profile?.subscription_tier === 'starter' ? 'from-blue-900/40 to-black border-blue-500/30' : 
                                'from-zinc-900/40 to-black border-white/5'
                            }`}>
                                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 blur-[100px] -mr-48 -mt-48 pointer-events-none" />
                                
                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                    <div className="flex items-center gap-8">
                                        <div className={`p-8 rounded-[2rem] border shadow-2xl ${
                                            profile?.subscription_tier === 'pro' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' :
                                            profile?.subscription_tier === 'starter' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                                            'bg-white/5 border-white/10 text-zinc-600'
                                        }`}>
                                            <ShieldCheck className="w-10 h-10" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-4 mb-2">
                                                <h2 className="text-5xl font-black tracking-tighter uppercase italic">{profile?.subscription_tier || 'Free'} Plan</h2>
                                                <BadgeCheck className={`w-6 h-6 ${profile?.subscription_tier !== 'free' ? 'text-emerald-400' : 'text-zinc-800'}`} />
                                            </div>
                                            <div className="flex items-center gap-3 text-zinc-500 text-xs font-black uppercase tracking-[0.2em]">
                                                <Clock className="w-4 h-4" />
                                                {profile?.plan_expires_at ? `Expiring on ${new Date(profile.plan_expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}` : 'Standard Studio Access'}
                                            </div>
                                        </div>
                                    </div>

                                    {profile?.subscription_tier === 'free' && (
                                        <Link href="/lab" className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all">
                                            Upgrade Lab
                                        </Link>
                                    )}
                                </div>

                                {/* Plan Benefits Summary */}
                                <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                                    {[
                                        { label: 'YT/IG Limit', val: profile?.subscription_tier === 'pro' ? '2 Hours' : profile?.subscription_tier === 'starter' ? '1 Hour' : '30 Mins' },
                                        { label: 'TikTok Extra', val: profile?.tiktok_extractions_remaining ?? 0 },
                                        { label: 'Ads Status', val: profile?.subscription_tier !== 'free' ? 'Ad-Free' : 'Ad-Supported' },
                                        { label: 'Stack Status', val: nextPlan ? 'Queued' : 'Empty' }
                                    ].map((stat, i) => (
                                        <div key={i} className="p-6 bg-white/[0.03] border border-white/5 rounded-[1.8rem] hover:bg-white/[0.06] transition-all">
                                            <span className="block text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-2">{stat.label}</span>
                                            <span className="block text-xl font-black italic">{stat.val}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Stacking / Next Plan Section */}
                            <section className="bg-zinc-900/30 border border-white/5 rounded-[3rem] p-10">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-8 flex items-center gap-3">
                                    <Layers className="w-4 h-4" /> Subscription Queue
                                </h3>

                                {nextPlan ? (
                                    <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] gap-8">
                                        <div className="flex items-center gap-6">
                                            <div className="p-5 bg-emerald-500/10 rounded-2xl text-emerald-400">
                                                <Layers className="w-6 h-6 animate-pulse" />
                                            </div>
                                            <div>
                                                <h4 className="text-2xl font-black uppercase italic text-white tracking-tight">{nextPlan.plan_id.replace('_', ' ')}</h4>
                                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Ready for automatic activation</p>
                                            </div>
                                        </div>
                                        <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                            Activates on expiration
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                                        <Layers className="w-12 h-12 text-zinc-800" />
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">No Queued Plans</p>
                                            <p className="text-[10px] font-bold text-zinc-600 mt-1">Buying multiple plans automatically stacks them here.</p>
                                        </div>
                                    </div>
                                )}
                            </section>
                        </motion.div>

                        {/* RIGHT: Wallet & Actions */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-4 space-y-8"
                        >
                            <section className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 space-y-10">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 flex items-center gap-3">
                                    <Sparkles className="w-4 h-4 text-yellow-500" /> Wallet Hub
                                </h3>

                                <div className="space-y-6">
                                    {/* Gold Hub */}
                                    <div className="p-8 bg-gradient-to-br from-yellow-900/20 to-zinc-900 border border-yellow-500/20 rounded-[2.5rem] relative overflow-hidden group">
                                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/5 blur-3xl rounded-full" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500 block mb-4">Gold Balance</span>
                                        <div className="text-6xl font-black italic tracking-tighter text-white mb-2">{profile?.credits ?? 0}</div>
                                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Premium currency for Lab AI tools</p>
                                    </div>

                                    {/* Silver Hub */}
                                    <div className="p-8 bg-zinc-900/50 border border-white/5 rounded-[2.5rem] relative overflow-hidden">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 block mb-4">Silver Credits</span>
                                        <div className="text-6xl font-black italic tracking-tighter text-white/50 mb-2">{profile?.free_credits ?? 0}</div>
                                        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                            <BadgeCheck className="w-3 h-3" />
                                            Permanent Ad-Skipping Balance
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Link href="/" className="p-5 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-3 hover:bg-white/10 transition-colors">
                                        <Zap className="w-5 h-5 text-purple-400" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Top Up</span>
                                    </Link>
                                    <Link href="/" className="p-5 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center gap-3 hover:bg-white/10 transition-colors">
                                        <History className="w-5 h-5 text-blue-400" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">History</span>
                                    </Link>
                                </div>
                            </section>

                            <button
                                onClick={() => supabase.auth.signOut()}
                                className="w-full py-6 border border-red-500/20 bg-red-500/5 text-red-500 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-red-500/10 transition-all"
                            >
                                Sign Out Account
                            </button>
                        </motion.div>
                    </div>
                </div>
            </div>
        </main>
    );
}
