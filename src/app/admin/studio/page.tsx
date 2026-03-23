'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, MessageSquare, Save, Terminal, ShieldAlert, Cpu, Zap, CreditCard, LayoutDashboard, Eye, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const TOOLS = [
    { id: 'audio_link', name: 'Audio Link Extraction', sub: 'Pasted URL' },
    { id: 'audio_upload', name: 'Audio File Upload', sub: 'Local Files' },
    { id: 'video_link', name: 'Video Link Extraction', sub: 'Pasted URL' },
    { id: 'audio_trimmer', name: 'Audio Trimmer', sub: 'Processing' },
    { id: 'audio_joiner', name: 'Audio Joiner', sub: 'Processing' },
    { id: 'magic_sync', name: 'Magic Sync', sub: 'AI Video/Audio' }
];

const FEATURE_FLAGS = [
    { id: 'feature_silver', name: 'Silver Credits', sub: 'Site Visibility' },
];

const REVENUE_PLANS = [
    { id: 'pack-10', name: 'Gold Pack 10', cat: 'Credits' },
    { id: 'pack-20', name: 'Gold Pack 20', cat: 'Credits' },
    { id: 'pack-50', name: 'Gold Pack 50', cat: 'Credits' },
    { id: 'pack-elite', name: 'Elite 150', cat: 'Credits' },
    { id: 'plan-starter', name: 'Starter Lab', cat: 'Subs' },
    { id: 'plan-pro', name: 'Pro Studio', cat: 'Subs' },
    { id: 'silver-credits', name: '500 Silver', cat: 'Lab Assets' }
];

export default function AdminLocks() {
    const [locks, setLocks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/');
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            router.push('/');
            return;
        }

        setAuthorized(true);
        fetchLocks();
    };

    const fetchLocks = async () => {
        const { data, error } = await supabase.from('system_locks').select('*');
        if (data) setLocks(data);
        else if (error) console.error('Error fetching locks:', error);
        setLoading(false);
    };

    const handleToggle = (id: string, current: boolean) => {
        setLocks(prev => prev.map(l => l.id === id ? { ...l, is_locked: !current } : l));
    };

    const handleMessageChange = (id: string, msg: string) => {
        setLocks(prev => prev.map(l => l.id === id ? { ...l, lock_message: msg } : l));
    };

    const saveLock = async (id: string) => {
        const allItems = [...TOOLS, ...REVENUE_PLANS, ...FEATURE_FLAGS];
        const meta = allItems.find(i => i.id === id);
        const existing = locks.find(l => l.id === id);
        const lock = existing
            ? { ...existing, name: existing.name ?? meta?.name ?? id }
            : { id, name: meta?.name ?? id, is_locked: false, lock_message: '' };
        setIsSaving(id);
        const { error } = await supabase.from('system_locks').upsert(lock);
        if (error) alert('Error saving: ' + error.message);
        setTimeout(() => setIsSaving(null), 1000);
    };

    if (loading || !authorized) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-6">
            <Cpu className="w-12 h-12 text-purple-500 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Establishing Secure Link...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-12 font-sans selection:bg-purple-500/30 overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16 pt-8 md:pt-0">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                                <ShieldAlert className="w-8 h-8 text-purple-400" />
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic leading-none">Command Center</h1>
                        </div>
                        <p className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-widest leading-loose max-w-xl">
                            Elite Administrative Override. Control tool access and revenue flows across the global studio network.
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <Link
                            href="/admin/visitors"
                            className="flex items-center gap-3 px-6 py-4 bg-blue-500/10 border border-blue-500/20 rounded-[2rem] hover:bg-blue-500/20 transition-all"
                        >
                            <Users className="w-5 h-5 text-blue-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Visitor Analytics</span>
                        </Link>
                        <div className="flex items-center gap-6 px-6 md:px-8 py-4 bg-zinc-900/50 border border-white/5 rounded-[2rem] backdrop-blur-3xl">
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Status</p>
                                <p className="text-xs font-black uppercase text-green-400">Live & Secure</p>
                            </div>
                            <div className="h-10 w-[1px] bg-white/5" />
                            <Zap className="w-5 h-5 text-purple-500 animate-pulse" />
                        </div>
                    </div>
                </header>

                {/* Section Header */}
                <div className="flex items-center gap-4 mb-8">
                    <LayoutDashboard className="w-5 h-5 text-blue-400" />
                     <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Studio Tool Control</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-20">
                    {TOOLS.map((tool) => {
                        const lockData = locks.find(l => l.id === tool.id) || { id: tool.id, is_locked: false, lock_message: '' };
                        const isLocked = lockData.is_locked;

                        return (
                            <AdminCard 
                                key={tool.id}
                                id={tool.id}
                                name={tool.name}
                                sub={tool.sub}
                                isLocked={isLocked}
                                lockMessage={lockData.lock_message}
                                isSaving={isSaving === tool.id}
                                onToggle={() => handleToggle(tool.id, isLocked)}
                                onMessageChange={(msg: string) => handleMessageChange(tool.id, msg)}
                                onSave={() => saveLock(tool.id)}
                            />
                        );
                    })}
                </div>

                {/* Feature Visibility Section */}
                <div className="flex items-center gap-4 mb-8 mt-16">
                    <Eye className="w-5 h-5 text-emerald-400" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Feature Visibility</h2>
                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Unlocked = visible on site</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-20">
                    {FEATURE_FLAGS.map((feature) => {
                        const lockData = locks.find(l => l.id === feature.id) || { id: feature.id, is_locked: true, lock_message: '' };
                        const isLocked = lockData.is_locked;

                        return (
                            <AdminCard
                                key={feature.id}
                                id={feature.id}
                                name={feature.name}
                                sub={feature.sub}
                                isLocked={isLocked}
                                lockMessage={lockData.lock_message}
                                isSaving={isSaving === feature.id}
                                onToggle={() => handleToggle(feature.id, isLocked)}
                                onMessageChange={(msg: string) => handleMessageChange(feature.id, msg)}
                                onSave={() => saveLock(feature.id)}
                                compact
                            />
                        );
                    })}
                </div>

                {/* Revenue Section */}
                <div className="flex items-center gap-4 mb-8">
                    <CreditCard className="w-5 h-5 text-indigo-400" />
                     <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Revenue & Plan Locks</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {REVENUE_PLANS.map((plan) => {
                        const lockData = locks.find(l => l.id === plan.id) || { id: plan.id, is_locked: false, lock_message: '' };
                        const isLocked = lockData.is_locked;

                        return (
                            <AdminCard 
                                key={plan.id}
                                id={plan.id}
                                name={plan.name}
                                sub={plan.cat}
                                isLocked={isLocked}
                                lockMessage={lockData.lock_message}
                                isSaving={isSaving === plan.id}
                                onToggle={() => handleToggle(plan.id, isLocked)}
                                onMessageChange={(msg: string) => handleMessageChange(plan.id, msg)}
                                onSave={() => saveLock(plan.id)}
                                compact
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function AdminCard({ id, name, sub, isLocked, lockMessage, isSaving, onToggle, onMessageChange, onSave, compact = false }: any) {
    return (
        <motion.div 
            className={`group p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border transition-all duration-700 ${
                isLocked 
                ? 'bg-red-500/5 border-red-500/20' 
                : 'bg-zinc-900/30 border-white/5 hover:border-white/10'
            }`}
        >
            <div className="flex items-start justify-between mb-8">
                <div>
                    <p className="text-[8px] md:text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em] mb-2">{sub}</p>
                    <h3 className={`font-black uppercase tracking-tighter ${compact ? 'text-lg' : 'text-xl'}`}>{name}</h3>
                </div>
                <button 
                    onClick={onToggle}
                    className={`p-3 md:p-4 rounded-2xl md:rounded-3xl transition-all ${
                        isLocked ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-500'
                    }`}
                >
                    {isLocked ? <Lock className="w-4 h-4 md:w-5 md:h-5 fill-current" /> : <Unlock className="w-4 h-4 md:w-5 md:h-5" />}
                </button>
            </div>

            <div className="space-y-4 md:space-y-6">
                {!compact && (
                    <div className="relative">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600">
                            <MessageSquare className="w-4 h-4" />
                        </div>
                        <input 
                            type="text"
                            placeholder="Paused notification..."
                            value={lockMessage}
                            onChange={(e) => onMessageChange(e.target.value)}
                            className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-[10px] font-bold focus:outline-none focus:border-purple-500/50 transition-colors"
                        />
                    </div>
                )}

                <button 
                    onClick={onSave}
                    disabled={isSaving}
                    className={`w-full py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all ${
                        isSaving 
                        ? 'bg-green-500 text-white' 
                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                    }`}
                >
                    {isSaving ? (
                        <>
                            <Terminal className="w-4 h-4 animate-bounce" />
                            Confirmed
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Status
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
}
