'use client';

import { useState, useEffect, useRef } from 'react';
import { Users, Activity, Cpu, Globe, Monitor, Smartphone, Tablet, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type VisitorLog = {
    id: string;
    created_at: string;
    ip_address: string | null;
    country: string | null;
    region: string | null;
    city: string | null;
    browser: string | null;
    os: string | null;
    device_type: string | null;
    is_authenticated: boolean;
    user_id: string | null;
};

function toDateString(date: Date) {
    return date.toISOString().slice(0, 10);
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
}

function formatDisplayDate(dateStr: string) {
    const today = toDateString(new Date());
    const yesterday = toDateString(new Date(Date.now() - 86400000));
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
    });
}

function DeviceBadge({ type }: { type: string | null }) {
    if (type === 'mobile') return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-green-400 bg-green-500/10">
            <Smartphone className="w-3 h-3" /> Mobile
        </span>
    );
    if (type === 'tablet') return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-yellow-400 bg-yellow-500/10">
            <Tablet className="w-3 h-3" /> Tablet
        </span>
    );
    return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10">
            <Monitor className="w-3 h-3" /> Desktop
        </span>
    );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="p-6 md:p-8 rounded-[2rem] bg-zinc-900/30 border border-white/5">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-3">{label}</p>
            <p className="text-3xl font-black text-white truncate">{value}</p>
        </div>
    );
}

export default function AdminVisitors() {
    const today = toDateString(new Date());
    const yesterday = toDateString(new Date(Date.now() - 86400000));

    const [visits, setVisits] = useState<VisitorLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [authorized, setAuthorized] = useState(false);
    const [selectedDate, setSelectedDate] = useState(today);
    const [showCalendar, setShowCalendar] = useState(false);
    const calendarRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    // Close calendar on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
                setShowCalendar(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/'); return; }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') { router.push('/'); return; }

        setAuthorized(true);
        fetchVisits(today);
    };

    const fetchVisits = async (dateStr: string) => {
        setFetching(true);
        // Use date prefix filter — matches any timestamp that starts with the selected date
        const nextDay = toDateString(new Date(new Date(dateStr + 'T12:00:00').getTime() + 86400000));

        const { data, error } = await supabase
            .from('visitor_logs')
            .select('*')
            .gte('created_at', `${dateStr}T00:00:00`)
            .lt('created_at', `${nextDay}T00:00:00`)
            .order('created_at', { ascending: false });

        if (data) setVisits(data);
        else if (error) console.error('[admin/visitors] fetch error:', error.message, error.details, error.hint);
        setLoading(false);
        setFetching(false);
    };

    const selectDate = (dateStr: string) => {
        setSelectedDate(dateStr);
        setShowCalendar(false);
        fetchVisits(dateStr);
    };

    const shiftDay = (delta: number) => {
        const d = new Date(selectedDate + 'T12:00:00');
        d.setDate(d.getDate() + delta);
        const newDate = toDateString(d);
        // Don't go into the future
        if (newDate > today) return;
        selectDate(newDate);
    };

    if (loading || !authorized) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-6">
            <Cpu className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Loading Analytics...</p>
        </div>
    );

    // Stats for the selected day
    const totalVisits = visits.length;
    const uniqueIPs = new Set(visits.map(v => v.ip_address).filter(Boolean)).size;

    const countryCounts = visits.reduce((acc, v) => {
        if (v.country) acc[v.country] = (acc[v.country] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const top3Countries = Object.entries(countryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([c]) => c)
        .join(', ') || '—';

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-12 font-sans selection:bg-blue-500/30 overflow-x-hidden">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16 pt-8 md:pt-0">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                <Users className="w-8 h-8 text-blue-400" />
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic leading-none">Visitor Analytics</h1>
                        </div>
                        <p className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-widest leading-loose max-w-xl">
                            Real-time visitor intelligence. Filter by date to explore your audience.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 px-6 md:px-8 py-4 bg-zinc-900/50 border border-white/5 rounded-[2rem] backdrop-blur-3xl">
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Showing</p>
                            <p className="text-xs font-black uppercase text-blue-400">{formatDisplayDate(selectedDate)}</p>
                        </div>
                        <div className="h-10 w-[1px] bg-white/5" />
                        <Globe className="w-5 h-5 text-blue-500 animate-pulse" />
                    </div>
                </header>

                {/* Date Filter Bar */}
                <div className="flex flex-wrap items-center gap-3 mb-12">
                    {/* Prev day */}
                    <button
                        onClick={() => shiftDay(-1)}
                        className="p-3 rounded-2xl bg-zinc-900/50 border border-white/5 hover:bg-zinc-800/50 hover:border-white/10 transition-all text-zinc-400 hover:text-white"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Quick presets */}
                    {[
                        { label: 'Today', value: today },
                        { label: 'Yesterday', value: yesterday },
                        { label: '2 Days Ago', value: toDateString(new Date(Date.now() - 2 * 86400000)) },
                        { label: '3 Days Ago', value: toDateString(new Date(Date.now() - 3 * 86400000)) },
                        { label: '7 Days Ago', value: toDateString(new Date(Date.now() - 7 * 86400000)) },
                    ].map(preset => (
                        <button
                            key={preset.value}
                            onClick={() => selectDate(preset.value)}
                            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                selectedDate === preset.value
                                    ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                                    : 'bg-zinc-900/50 border border-white/5 text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                            }`}
                        >
                            {preset.label}
                        </button>
                    ))}

                    {/* Calendar picker */}
                    <div className="relative" ref={calendarRef}>
                        <button
                            onClick={() => setShowCalendar(v => !v)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                showCalendar
                                    ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                                    : 'bg-zinc-900/50 border border-white/5 text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                            }`}
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            Pick Date
                        </button>

                        {showCalendar && (
                            <div className="absolute top-full mt-3 left-0 z-50 p-4 bg-zinc-900 border border-white/10 rounded-[1.5rem] shadow-2xl shadow-black/50">
                                <input
                                    type="date"
                                    max={today}
                                    value={selectedDate}
                                    onChange={e => {
                                        if (e.target.value) selectDate(e.target.value);
                                    }}
                                    className="bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none focus:border-blue-500/50 transition-colors [color-scheme:dark]"
                                />
                            </div>
                        )}
                    </div>

                    {/* Next day (disabled if today) */}
                    <button
                        onClick={() => shiftDay(1)}
                        disabled={selectedDate >= today}
                        className="p-3 rounded-2xl bg-zinc-900/50 border border-white/5 hover:bg-zinc-800/50 hover:border-white/10 transition-all text-zinc-400 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Loading indicator */}
                    {fetching && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 animate-pulse ml-2">
                            Loading...
                        </span>
                    )}
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-16">
                    <StatCard label="Total Visits" value={totalVisits} />
                    <StatCard label="Unique IPs" value={uniqueIPs} />
                    <StatCard label="Top Countries" value={top3Countries} />
                </div>

                {/* Section Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Activity className="w-5 h-5 text-blue-400" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
                        Sessions — {formatDisplayDate(selectedDate)}
                    </h2>
                </div>

                {/* Visitor Table */}
                <div className="bg-zinc-900/30 border border-white/5 rounded-[2rem] overflow-hidden">
                    {visits.length === 0 ? (
                        <div className="py-20 text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">
                                No visits recorded for {formatDisplayDate(selectedDate)}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Time</th>
                                        <th className="text-left px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Location</th>
                                        <th className="text-left px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Browser</th>
                                        <th className="text-left px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">OS</th>
                                        <th className="text-left px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Device</th>
                                        <th className="text-left px-6 py-5 text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Auth</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visits.map((v, i) => (
                                        <tr key={v.id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                                            <td className="px-6 py-4 text-xs text-zinc-400 whitespace-nowrap">{formatDate(v.created_at)}</td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-xs text-white font-semibold">{v.city ?? '—'}</p>
                                                    <p className="text-[10px] text-zinc-500">{v.country ?? 'Unknown'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-zinc-300">{v.browser ?? '—'}</td>
                                            <td className="px-6 py-4 text-xs text-zinc-300">{v.os ?? '—'}</td>
                                            <td className="px-6 py-4"><DeviceBadge type={v.device_type} /></td>
                                            <td className="px-6 py-4">
                                                {v.is_authenticated
                                                    ? <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">Yes</span>
                                                    : <span className="text-[10px] font-black uppercase tracking-wider text-zinc-600">—</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
