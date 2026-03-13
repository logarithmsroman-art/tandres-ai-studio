'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, MessageSquare, Save, Terminal, ShieldAlert, Cpu } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const TOOLS = [
    { id: 'audio_link', name: 'Audio Link Extraction', sub: 'Pasted URL' },
    { id: 'audio_upload', name: 'Audio File Upload', sub: 'Local Files' },
    { id: 'video_link', name: 'Video Link Extraction', sub: 'Pasted URL' },
    { id: 'audio_trimmer', name: 'Audio Trimmer', sub: 'Processing' },
    { id: 'audio_joiner', name: 'Audio Joiner', sub: 'Processing' },
    { id: 'magic_sync', name: 'Magic Sync', sub: 'AI Video/Audio' }
];

export default function AdminLocks() {
    const [locks, setLocks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null);

    useEffect(() => {
        fetchLocks();
    }, []);

    const fetchLocks = async () => {
        const { data, error } = await supabase.from('system_locks').select('*');
        if (data) setLocks(data);
        else if (error) console.error('Error fetching locks:', error);
        setLoading(false);
    };

    const handleToggle = async (id: string, current: boolean) => {
        setLocks(prev => prev.map(l => l.id === id ? { ...l, is_locked: !current } : l));
    };

    const handleMessageChange = (id: string, msg: string) => {
        setLocks(prev => prev.map(l => l.id === id ? { ...l, lock_message: msg } : l));
    };

    const saveLock = async (lock: any) => {
        setIsSaving(lock.id);
        const { error } = await supabase.from('system_locks').upsert(lock);
        if (error) alert('Error saving: ' + error.message);
        setTimeout(() => setIsSaving(null), 1000);
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white/20">ACCESSING STUDIO CORE...</div>;

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8 lg:p-12 font-sans selection:bg-purple-500/30">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                                <Cpu className="w-8 h-8 text-purple-400" />
                            </div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter italic">Studio Control</h1>
                        </div>
                        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest leading-loose max-w-xl">
                            Master Override System. Lock tools instantly and set user notification messages across the entire platform.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-6 px-8 py-4 bg-zinc-900/50 border border-white/5 rounded-3xl backdrop-blur-xl">
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">System Health</p>
                            <p className="text-xs font-black uppercase text-green-400">Stable</p>
                        </div>
                        <div className="h-10 w-[1px] bg-white/5" />
                        <ShieldAlert className="w-5 h-5 text-purple-500 animate-pulse" />
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {TOOLS.map((tool) => {
                        const lockData = locks.find(l => l.id === tool.id) || { id: tool.id, name: tool.name, is_locked: false, lock_message: '' };
                        const isLocked = lockData.is_locked;

                        return (
                            <motion.div 
                                key={tool.id}
                                className={`group p-8 rounded-[3rem] border transition-all duration-700 ${
                                    isLocked 
                                    ? 'bg-red-500/5 border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.05)]' 
                                    : 'bg-zinc-900/30 border-white/5 hover:border-white/10'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-8">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em] mb-2">{tool.sub}</p>
                                        <h3 className="text-xl font-black uppercase tracking-tighter">{tool.name}</h3>
                                    </div>
                                    <button 
                                        onClick={() => handleToggle(tool.id, isLocked)}
                                        className={`p-4 rounded-3xl transition-all ${
                                            isLocked ? 'bg-red-500 text-white shadow-xl shadow-red-900/20' : 'bg-zinc-800 text-zinc-500'
                                        }`}
                                    >
                                        {isLocked ? <Lock className="w-5 h-5 fill-current" /> : <Unlock className="w-5 h-5" />}
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="relative">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600">
                                            <MessageSquare className="w-4 h-4" />
                                        </div>
                                        <input 
                                            type="text"
                                            placeholder="User maintenance message..."
                                            value={lockData.lock_message}
                                            onChange={(e) => handleMessageChange(tool.id, e.target.value)}
                                            className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-xs font-bold focus:outline-none focus:border-purple-500/50 transition-colors"
                                        />
                                    </div>

                                    <button 
                                        onClick={() => saveLock(lockData)}
                                        disabled={isSaving === tool.id}
                                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all ${
                                            isSaving === tool.id 
                                            ? 'bg-green-500 text-white' 
                                            : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                        }`}
                                    >
                                        {isSaving === tool.id ? (
                                            <>
                                                <Terminal className="w-4 h-4 animate-bounce" />
                                                Saved
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
