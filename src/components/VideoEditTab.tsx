'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Beaker, Upload, Play, Download, Loader2,
    CheckCircle2, AlertCircle, Scissors, Plus,
    Music, Video, Zap, Trash2, Clock, Link as LinkIcon,
    Globe, Pause, SkipForward, Flag, Sparkles, ArrowLeft, Crown
} from 'lucide-react';
import AdGate from './AdGate';
import AdBanner from './AdBanner';
import LabSubscriptions from './LabSubscriptions';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type ToolType = 'audio-extractor' | 'video-extractor' | 'trimmer' | 'joiner' | 'magic-sync';

interface StreamInfo {
    title: string;
    thumbnail: string;
    url: string;
    formats?: any[];
}

export default function VideoEditTab({ 
    userId, 
    onOpenPayment, 
    refreshTrigger, 
    onSuccess 
}: { 
    userId?: string, 
    onOpenPayment?: () => void,
    refreshTrigger?: number,
    onSuccess?: () => void 
}) {
    const [loaded, setLoaded] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [outputAudioUrl, setOutputAudioUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentTool, setCurrentTool] = useState<ToolType>('audio-extractor');
    const [showAd, setShowAd] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [isSpending, setIsSpending] = useState(false);
    const [systemLocks, setSystemLocks] = useState<any[]>([]);

    // Inputs
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [pastedUrl, setPastedUrl] = useState('');
    const [isResolving, setIsResolving] = useState(false);
    const [resolvedInfo, setResolvedInfo] = useState<StreamInfo | null>(null);

    // Trimmer state (CapCut-style)
    const [trimAudioUrl, setTrimAudioUrl] = useState<string | null>(null);
    const [trimDuration, setTrimDuration] = useState(0);
    const [trimCurrentTime, setTrimCurrentTime] = useState(0);
    const [trimPlaying, setTrimPlaying] = useState(false);
    const [markStart, setMarkStart] = useState<number | null>(null);
    const [markEnd, setMarkEnd] = useState<number | null>(null);

    // New Subscription state
    const [showSubscriptions, setShowSubscriptions] = useState(false);
    const [durationLimitError, setDurationLimitError] = useState<any>(null);
    const [isTikTokFallback, setIsTikTokFallback] = useState(false);
    const trimAudioRef = useRef<HTMLAudioElement>(null);
    const trimWaveformRef = useRef<HTMLCanvasElement>(null);
    const trimProgressRef = useRef<HTMLDivElement>(null);

    // Joiner state (CapCut-style)
    const [joinerTracks, setJoinerTracks] = useState<{ id: string; file: File; url: string; name: string; duration: number }[]>([]);
    const [joinerPlayingId, setJoinerPlayingId] = useState<string | null>(null);
    const [joinerPreviewPlaying, setJoinerPreviewPlaying] = useState(false);
    const [joinerPreviewIndex, setJoinerPreviewIndex] = useState(0);
    const joinerAudioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

    const ffmpegRef = useRef<FFmpeg | null>(null);

    const load = async () => {
        try {
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
            if (!ffmpegRef.current) {
                ffmpegRef.current = new FFmpeg();
            }
            const ffmpeg = ffmpegRef.current;

            ffmpeg.on('log', ({ message }) => {
                console.log('[FFmpeg Lab]', message);
            });

            ffmpeg.on('progress', ({ progress }) => {
                setProgress(Math.round(progress * 100));
            });

            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });

            setLoaded(true);
        } catch (err: any) {
            console.error('Failed to load FFmpeg:', err);
            setError('Failed to initialize processing engine. Please refresh and try again.');
        }
    };

    const fetchProfile = async () => {
        if (!userId) return;
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (profile) {
            const now = new Date();
            const expiry = profile.plan_expires_at ? new Date(profile.plan_expires_at) : null;
            
            // Auto-activate queued plan if current one is expired
            if (!expiry || expiry <= now) {
                const { data: queue } = await supabase
                    .from('subscription_queue')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: true })
                    .limit(1)
                    .single();
                
                if (queue) {
                    const newExpiry = new Date();
                    newExpiry.setDate(newExpiry.getDate() + queue.duration_days);
                    
                    const { data: updatedProfile, error: updateError } = await supabase
                        .from('profiles')
                        .update({
                            subscription_tier: queue.tier,
                            plan_expires_at: newExpiry.toISOString(),
                            plan_started_at: new Date().toISOString(),
                            tiktok_extractions_remaining: queue.tiktok_allotment
                        })
                        .eq('id', userId)
                        .select()
                        .single();
                        
                    if (!updateError) {
                        await supabase.from('subscription_queue').update({ status: 'active' }).eq('id', queue.id);
                        setProfile(updatedProfile);
                        return;
                    }
                }
            }
            setProfile(profile);
        }
    };

    const awardCredit = async () => {
        if (!userId) return;
        try {
            const res = await fetch('/api/free-credits', {
                method: 'POST',
                body: JSON.stringify({ userId, action: 'get' })
            });
            const data = await res.json();
            if (data.success) {
                fetchProfile();
            }
        } catch (e) {
            console.error('Failed to award credit:', e);
        }
    };

    const handleEarnCredits = async () => {
        setShowAd(true);
    };

    const resolveUrl = async () => {
        if (!pastedUrl) return;

        // Check for locks
        const lockId = currentTool === 'audio-extractor' ? 'audio_link' : 'video_link';
        const lock = systemLocks.find(l => l.id === lockId);
        if (lock?.is_locked) {
            setError(lock.lock_message || "This tool is under maintenance.");
            return;
        }

        if (pastedUrl.includes('tiktok.com') && pastedUrl.includes('/photo/')) {
            setError("TikTok Photo Slideshows are not supported yet. Please use a Video link.");
            return;
        }

        setIsResolving(true);
        setError(null);
        setResolvedInfo(null);

        const isYouTube = pastedUrl.includes('youtube.com') || pastedUrl.includes('youtu.be');
        const isInstagram = pastedUrl.includes('instagram.com');
        const isAudioOnly = currentTool === 'audio-extractor' || currentTool === 'trimmer';
        const isLocal = window.location.hostname === 'localhost';

        try {
            // STRATEGY: 
            // 1. ALL LINKS: Use our stable server-side API (Railway Detective + Cloudflare Courier)
            const res = await fetch('/api/video-edit', {
                method: 'POST',
                body: JSON.stringify({ action: 'resolve-url', url: pastedUrl, userId })
            });
            const data = await res.json();
            if (res.ok) {
                setResolvedInfo({
                    title: data.title,
                    thumbnail: data.thumbnail,
                    url: data.streamUrl,
                    formats: data.formats
                });
                setIsTikTokFallback(data.isTikTokFallback || false);
            } else if (res.status === 403 && data.isDurationError) {
                setDurationLimitError(data);
                setError(data.error);
            } else {
                throw new Error(data.error || 'Failed to resolve link.');
            }
        } catch (err: any) {
            console.error('Resolution error:', err);
            setError(err.message || "Failed to link. Please try a different link or check if it's private.");
        } finally {
            setIsResolving(false);
        }
    };

    // === TRIMMER FUNCTIONS ===
    const handleTrimFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (trimAudioUrl) URL.revokeObjectURL(trimAudioUrl);
        const url = URL.createObjectURL(file);
        setTrimAudioUrl(url);
        setSelectedFiles([file]);
        setMarkStart(null);
        setMarkEnd(null);
        setTrimCurrentTime(0);
    };

    const toggleTrimPlay = () => {
        if (!trimAudioRef.current) return;
        if (trimPlaying) {
            trimAudioRef.current.pause();
        } else {
            trimAudioRef.current.play();
        }
        setTrimPlaying(!trimPlaying);
    };

    const handleTrimSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!trimProgressRef.current || !trimAudioRef.current) return;
        const rect = trimProgressRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = x / rect.width;
        const time = pct * trimDuration;
        trimAudioRef.current.currentTime = time;
        setTrimCurrentTime(time);
    };

    const handleMarkStart = () => {
        setMarkStart(trimCurrentTime);
        if (markEnd !== null && trimCurrentTime >= markEnd) {
            setMarkEnd(null);
        }
    };

    const handleMarkEnd = () => {
        if (markStart === null) {
            setError("Mark the start point first.");
            return;
        }
        if (trimCurrentTime <= markStart) {
            setError("End point must be after the start point.");
            return;
        }
        setMarkEnd(trimCurrentTime);
    };

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // === JOINER FUNCTIONS ===
    const handleJoinerAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const newTracks: typeof joinerTracks = [];

        for (const file of files) {
            const dur = await new Promise<number>((resolve) => {
                const audio = new Audio();
                audio.src = URL.createObjectURL(file);
                audio.onloadedmetadata = () => {
                    const d = audio.duration;
                    URL.revokeObjectURL(audio.src);
                    resolve(d);
                };
            });

            newTracks.push({
                id: Math.random().toString(36).substr(2, 9),
                file,
                url: URL.createObjectURL(file),
                name: file.name,
                duration: dur
            });
        }

        setJoinerTracks(prev => [...prev, ...newTracks]);
    };

    const removeJoinerTrack = (id: string) => {
        const track = joinerTracks.find(t => t.id === id);
        if (track) URL.revokeObjectURL(track.url);
        setJoinerTracks(prev => prev.filter(t => t.id !== id));
    };

    const toggleJoinerTrackPlay = (id: string) => {
        const audio = joinerAudioRefs.current[id];
        if (!audio) return;

        if (joinerPlayingId === id) {
            audio.pause();
            setJoinerPlayingId(null);
        } else {
            // Stop any currently playing
            if (joinerPlayingId) {
                joinerAudioRefs.current[joinerPlayingId]?.pause();
            }
            audio.currentTime = 0;
            audio.play();
            setJoinerPlayingId(id);
        }
    };

    const playJoinerPreview = () => {
        if (joinerTracks.length === 0) return;

        if (joinerPreviewPlaying) {
            // Stop all
            Object.values(joinerAudioRefs.current).forEach(a => a?.pause());
            setJoinerPreviewPlaying(false);
            setJoinerPlayingId(null);
            return;
        }

        setJoinerPreviewPlaying(true);
        setJoinerPreviewIndex(0);
        const first = joinerAudioRefs.current[joinerTracks[0].id];
        if (first) { first.currentTime = 0; first.play(); }
        setJoinerPlayingId(joinerTracks[0].id);
    };

    const handleJoinerTrackEnd = (trackId: string) => {
        if (!joinerPreviewPlaying) {
            setJoinerPlayingId(null);
            return;
        }
        const idx = joinerTracks.findIndex(t => t.id === trackId);
        const nextIdx = idx + 1;
        if (nextIdx < joinerTracks.length) {
            setJoinerPreviewIndex(nextIdx);
            const next = joinerAudioRefs.current[joinerTracks[nextIdx].id];
            if (next) { next.currentTime = 0; next.play(); }
            setJoinerPlayingId(joinerTracks[nextIdx].id);
        } else {
            setJoinerPreviewPlaying(false);
            setJoinerPlayingId(null);
        }
    };

    // === FILE SELECT (for audio extractor) ===
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setSelectedFiles([newFiles[0]]);
            setResolvedInfo(null);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // === MAIN ENGINE ===
    const runEngine = async () => {
        const hasInput = selectedFiles.length > 0 || (resolvedInfo && resolvedInfo.url) || joinerTracks.length > 0;
        if (!hasInput || !loaded) return;
        if (!userId) {
            setError("Please login to process.");
            return;
        }

        setOutputAudioUrl(null);

        // 1. Check System Locks (The "Kill Switch")
        try {
            const { data: locks } = await supabase.from('system_locks').select('*');
            const toolId = currentTool === 'audio-extractor' ? (selectedFiles.length > 0 ? 'audio_upload' : 'audio_link') : 
                          currentTool === 'video-extractor' ? 'video_link' : 
                          currentTool === 'trimmer' ? 'audio_trimmer' :
                          currentTool === 'joiner' ? 'audio_joiner' :
                          currentTool.replace('-', '_');
            
            const toolLock = locks?.find(l => l.id === toolId);
            if (toolLock?.is_locked) {
                setError(toolLock.lock_message || "This tool is under maintenance.");
                return;
            }
        } catch (e) {
            console.warn("Lock check failed, proceeding with caution.");
        }

        // 2. Optimized Ad Logic (Strict check for Free Tier)
        const isFree = !profile?.subscription_tier || profile.subscription_tier === 'free';

        if (isFree) {
            const silverCredits = profile?.free_credits || 0;
            if (silverCredits > 0) {
                setIsSpending(true);
                try {
                    await fetch('/api/free-credits', {
                        method: 'POST',
                        body: JSON.stringify({ userId, action: 'spend' })
                    });
                    fetchProfile();
                    executeEngine();
                } catch (e: any) {
                    setError(e.message);
                } finally {
                    setIsSpending(false);
                }
                return;
            } else {
                setShowAd(true);
                return;
            }
        }

        executeEngine();
    };

    const executeEngine = async () => {
        setProcessing(true);
        try {
            const ffmpeg = ffmpegRef.current;
            if (!ffmpeg) return;

            let inputSource: any;
            let inputName = 'input.mp4';
            let fileExt = '.mp4';

            if (currentTool !== 'joiner') {
                if (selectedFiles.length > 0) {
                    inputSource = await fetchFile(selectedFiles[0]);
                    fileExt = selectedFiles[0].name.substring(selectedFiles[0].name.lastIndexOf('.')) || '.mp4';
                    inputName = 'input' + fileExt;
                } else if (resolvedInfo) {
                    const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || '';
                    const urlStr = resolvedInfo.url;
                    const isTikTok = urlStr.includes('tiktok.com') || urlStr.includes('byteoversea.com');
                    const isInternal = urlStr.startsWith('/downloads');
                    const isTunneled = urlStr.includes('/api/tunnel');
                    const isFullyQualified = urlStr.startsWith('http');
                    const alreadyWrapped = workerUrl && urlStr.startsWith(workerUrl);

                    let fetchUrl = '';
                    
                    if (urlStr.startsWith('/api/')) {
                        fetchUrl = urlStr;
                    } else if (urlStr.startsWith('/downloads')) {
                        fetchUrl = `/api/serve-media?file=${encodeURIComponent(urlStr)}`;
                    } else {
                        // All external links (including port 3001) MUST go through our local /api/proxy to avoid CORS failures
                        fetchUrl = `/api/proxy?url=${encodeURIComponent(urlStr)}`;
                    }

                    const fRes = await fetch(fetchUrl);
                    if (!fRes.ok) {
                        const errData = await fRes.json().catch(() => ({}));
                        throw new Error(errData.error || `Source fetch failed: ${fRes.status}`);
                    }
                    inputSource = await fetchFile(await fRes.blob());
                    inputName = 'input.mp4';
                }
                await ffmpeg.writeFile(inputName, inputSource);
            }

            if (currentTool === 'audio-extractor') {
                const outputName = 'output.mp3';
                await ffmpeg.exec(['-i', inputName, '-vn', '-acodec', 'libmp3lame', outputName]);
                const data = await ffmpeg.readFile(outputName);
                setOutputUrl(URL.createObjectURL(new Blob([data as any], { type: 'audio/mp3' })));
            }

            else if (currentTool === 'video-extractor') {
                const outputName = 'video-out.mp4';
                await ffmpeg.exec(['-i', inputName, '-c', 'copy', outputName]);
                const data = await ffmpeg.readFile(outputName);
                setOutputUrl(URL.createObjectURL(new Blob([data as any], { type: 'video/mp4' })));
            }

            else if (currentTool === 'trimmer') {
                if (markStart === null || markEnd === null) {
                    throw new Error('Please mark both start and end points before processing.');
                }
                const ss = markStart.toFixed(2);
                const dur = (markEnd - markStart).toFixed(2);
                const outputName = 'trimmed.mp3';
                await ffmpeg.exec(['-ss', ss, '-i', inputName, '-t', dur, '-acodec', 'libmp3lame', outputName]);
                const data = await ffmpeg.readFile(outputName);
                setOutputUrl(URL.createObjectURL(new Blob([data as any], { type: 'audio/mp3' })));
            }

            else if (currentTool === 'joiner') {
                const filterInputs: string[] = [];
                for (let i = 0; i < joinerTracks.length; i++) {
                    const name = `file${i}.mp3`;
                    await ffmpeg.writeFile(name, await fetchFile(joinerTracks[i].file));
                    filterInputs.push('-i', name);
                }
                const filterComplex = `concat=n=${joinerTracks.length}:v=0:a=1[a]`;
                await ffmpeg.exec([...filterInputs, '-filter_complex', filterComplex, '-map', '[a]', 'joined.mp3']);
                const data = await ffmpeg.readFile('joined.mp3');
                setOutputUrl(URL.createObjectURL(new Blob([data as any], { type: 'audio/mp3' })));
            }

            else if (currentTool === 'magic-sync') {
                // Extract both video and audio separately
                const videoOut = 'video-out.mp4';
                const audioOut = 'audio-out.mp3';
                await ffmpeg.exec(['-i', inputName, '-c', 'copy', videoOut]);
                await ffmpeg.exec(['-i', inputName, '-vn', '-acodec', 'libmp3lame', audioOut]);
                const videoData = await ffmpeg.readFile(videoOut);
                const audioData = await ffmpeg.readFile(audioOut);
                setOutputUrl(URL.createObjectURL(new Blob([videoData as any], { type: 'video/mp4' })));
                setOutputAudioUrl(URL.createObjectURL(new Blob([audioData as any], { type: 'audio/mp3' })));
            }

            setProcessing(false);
        } catch (err: any) {
            console.error('Processing error:', err);
            setError(err.message || 'Processing failed. Please try again.');
            setProcessing(false);
        }
    };

    const fetchLocks = async () => {
        const { data } = await supabase.from('system_locks').select('*');
        if (data) setSystemLocks(data);
    };

    useEffect(() => {
        load();
        fetchProfile();
        fetchLocks();
    }, [userId, refreshTrigger]);

    const tools = [
        { id: 'audio-extractor', name: 'Audio Extraction', icon: Music, desc: 'Extract crystal-clear audio from any video link or local file.' },
        { id: 'video-extractor', name: 'Video Extraction', icon: Video, desc: 'Extract high-quality video directly from YouTube, Instagram, or TikTok.' },
        { id: 'trimmer', name: 'Audio Trimmer', icon: Scissors, desc: 'Clip your audio tracks with studio-level accuracy.' },
        { id: 'joiner', name: 'Audio Joiner', icon: Plus, desc: 'Seamlessly merge multiple audio tracks into a single masterpiece.' },
        { id: 'magic-sync', name: 'Magic Sync', icon: Zap, desc: 'Extract audio and video from any link at once.' },
    ];

    // Should show URL input? (not for trimmer or joiner)
    const showUrlInput = currentTool !== 'trimmer' && currentTool !== 'joiner';
    // Should show local upload? (not for video-extractor or magic-sync)
    const showLocalUpload = currentTool !== 'video-extractor' && currentTool !== 'magic-sync' && currentTool !== 'joiner' && currentTool !== 'trimmer';

    // Determine button label
    const isExtractionTool = currentTool === 'audio-extractor' || currentTool === 'video-extractor' || currentTool === 'magic-sync';
    const actionButtonLabel = isExtractionTool ? 'Extract Now' : 'Process Now';

    // Can run?
    const canRun = (() => {
        if (currentTool === 'joiner') return joinerTracks.length >= 2;
        if (currentTool === 'trimmer') return selectedFiles.length > 0 && markStart !== null && markEnd !== null;
        return selectedFiles.length > 0 || !!resolvedInfo;
    })();

    return (
        <div className="w-full text-white font-sans selection:bg-purple-500/30">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <Link
                            href="/"
                            className="p-4 bg-zinc-900 border border-white/5 rounded-2xl hover:bg-white/5 transition-colors group"
                        >
                            <ArrowLeft className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic">The Lab</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-md border border-purple-500/20">Studio</span>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Nigeria</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowSubscriptions(true)}
                            className="bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 flex items-center gap-2"
                        >
                            <Crown className="w-3.5 h-3.5 text-purple-400" />
                            Subscriptions
                        </motion.button>

                        <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all duration-1000 ${loaded ? 'border-green-500/30 bg-green-500/5 text-green-400' : 'border-zinc-800 bg-zinc-900/50 text-zinc-500'}`}>
                            <div className={`w-2 h-2 rounded-full ${loaded ? 'bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]' : 'bg-zinc-700'}`} />
                            <span className="text-xs font-black uppercase tracking-widest">{loaded ? 'Ready' : 'Initalizing engine'}</span>
                        </div>
                    </div>
                </header>

                {/* Main Tool Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => {
                                setCurrentTool(tool.id as ToolType);
                                setSelectedFiles([]);
                                setOutputUrl(null);
                                setOutputAudioUrl(null);
                                setResolvedInfo(null);
                                setPastedUrl('');
                                setTrimAudioUrl(null);
                                setMarkStart(null);
                                setMarkEnd(null);
                                setJoinerTracks([]);
                            }}
                            className={`group p-5 rounded-3xl border transition-all relative overflow-hidden ${currentTool === tool.id
                                ? 'bg-zinc-900 border-purple-500 text-white shadow-2xl shadow-purple-900/20'
                                : 'bg-zinc-900/30 border-white/5 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-900/50'
                                }`}
                        >
                            {currentTool === tool.id && (
                                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/10 blur-2xl rounded-full" />
                            )}
                            <tool.icon className={`w-6 h-6 mb-4 transition-colors ${currentTool === tool.id ? 'text-purple-400' : 'group-hover:text-zinc-300'}`} />
                            <p className="font-black text-xs uppercase tracking-widest mb-1">{tool.name}</p>
                            <p className="text-[9px] font-bold uppercase opacity-50 tracking-tighter line-clamp-2">{tool.desc}</p>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Left Panel: Inputs & Configuration */}
                    <div className="xl:col-span-8 flex flex-col gap-6">
                        <div className="bg-[#0e0e0e] border border-white/5 rounded-[40px] p-8 lg:p-12 shadow-2xl relative overflow-hidden">
                            <div className="relative space-y-10">

                                {/* URL SECTION — only for extraction tools */}
                                {showUrlInput && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2">
                                                <Globe className="w-3 h-3" /> Paste Link
                                            </h3>
                                            {resolvedInfo && <span className="text-[10px] font-black text-green-500 uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ready</span>}
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                                <input
                                                    type="text"
                                                    value={pastedUrl}
                                                    onChange={(e) => setPastedUrl(e.target.value)}
                                                    placeholder="Paste TikTok, YouTube, IG link..."
                                                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:border-purple-500 focus:bg-zinc-900 outline-none transition-all"
                                                />
                                            </div>
                                            <button
                                                onClick={resolveUrl}
                                                disabled={!pastedUrl || isResolving}
                                                className="px-6 bg-purple-600 hover:bg-purple-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-30 flex items-center gap-2"
                                            >
                                                {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Extract'}
                                            </button>
                                        </div>
                                        {isTikTokFallback && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center gap-3 text-blue-400"
                                            >
                                                <AlertCircle className="w-4 h-4" />
                                                <span className="text-xs font-bold">
                                                    TikTok links are currently being processed via a fallback method. This may take longer.
                                                </span>
                                            </motion.div>
                                        )}
                                    </div>
                                )}

                                {/* LOCAL UPLOAD — only for audio extractor */}
                                {showLocalUpload && (
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2">
                                            <Upload className="w-3 h-3" /> Or Upload File
                                        </h3>
                                        <div className="space-y-3">
                                            <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-zinc-900 hover:border-purple-500/40 rounded-3xl bg-zinc-900/20 transition-all cursor-pointer group">
                                                <input type="file" onChange={handleFileSelect} className="hidden" accept="video/*,audio/*" />
                                                <Plus className="w-8 h-8 mb-3 text-zinc-700 group-hover:text-purple-500 transition-colors" />
                                                <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Pick File</p>
                                            </label>

                                            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                                {selectedFiles.map((f, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-white/5">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            {f.type.startsWith('video') ? <Video className="w-3.5 h-3.5 text-blue-400" /> : <Music className="w-3.5 h-3.5 text-purple-400" />}
                                                            <span className="text-[10px] font-black uppercase truncate">{f.name}</span>
                                                        </div>
                                                        <button onClick={() => removeFile(i)} className="p-1 hover:text-red-400 transition-colors">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* === AUDIO TRIMMER (CapCut-Style) === */}
                                {currentTool === 'trimmer' && (
                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2">
                                            <Upload className="w-3 h-3" /> Upload Audio File
                                        </h3>
                                        <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-zinc-900 hover:border-purple-500/40 rounded-3xl bg-zinc-900/20 transition-all cursor-pointer group">
                                            <input type="file" onChange={handleTrimFileSelect} className="hidden" accept="audio/*" />
                                            <Plus className="w-8 h-8 mb-3 text-zinc-700 group-hover:text-purple-500 transition-colors" />
                                            <p className="text-xs font-black uppercase tracking-widest text-zinc-500">
                                                {trimAudioUrl ? 'Change File' : 'Pick Audio File'}
                                            </p>
                                        </label>

                                        {/* CapCut-Style Studio Player */}
                                        {trimAudioUrl && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="p-8 bg-zinc-900/60 border border-white/5 rounded-[2rem] space-y-6"
                                            >
                                                <audio
                                                    ref={trimAudioRef}
                                                    src={trimAudioUrl}
                                                    onLoadedMetadata={(e) => setTrimDuration(e.currentTarget.duration)}
                                                    onTimeUpdate={(e) => setTrimCurrentTime(e.currentTarget.currentTime)}
                                                    onEnded={() => setTrimPlaying(false)}
                                                    className="hidden"
                                                />

                                                {/* Time Display */}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-lg font-black tracking-tighter tabular-nums">{formatTime(trimCurrentTime)}</span>
                                                    <span className="text-sm text-zinc-500 font-bold tabular-nums">{formatTime(trimDuration)}</span>
                                                </div>

                                                {/* Visual Timeline / Waveform Bar */}
                                                <div
                                                    ref={trimProgressRef}
                                                    onClick={handleTrimSeek}
                                                    className="relative h-16 bg-zinc-800 rounded-2xl cursor-pointer overflow-hidden group border border-white/5"
                                                >
                                                    {/* Mark Start region */}
                                                    {markStart !== null && (
                                                        <div
                                                            className="absolute top-0 bottom-0 bg-green-500/20 border-l-2 border-green-500 z-10"
                                                            style={{ left: `${(markStart / trimDuration) * 100}%`, width: markEnd !== null ? `${((markEnd - markStart) / trimDuration) * 100}%` : '2px' }}
                                                        />
                                                    )}
                                                    {/* Mark End line */}
                                                    {markEnd !== null && (
                                                        <div
                                                            className="absolute top-0 bottom-0 border-r-2 border-red-500 z-10"
                                                            style={{ left: `${(markEnd / trimDuration) * 100}%` }}
                                                        />
                                                    )}

                                                    {/* Playhead */}
                                                    <div
                                                        className="absolute top-0 bottom-0 w-0.5 bg-white z-20 shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                                                        style={{ left: `${(trimCurrentTime / trimDuration) * 100}%` }}
                                                    >
                                                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
                                                    </div>

                                                    {/* Fake waveform visualization */}
                                                    <div className="absolute inset-0 flex items-center justify-around px-1 opacity-30">
                                                        {Array.from({ length: 80 }).map((_, i) => (
                                                            <div
                                                                key={i}
                                                                className="w-[2px] bg-purple-400 rounded-full"
                                                                style={{ height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 20}%` }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Controls */}
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={toggleTrimPlay}
                                                        className="h-14 w-14 bg-white text-black rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
                                                    >
                                                        {trimPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                                                    </button>

                                                    <button
                                                        onClick={handleMarkStart}
                                                        className={`flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${markStart !== null ? 'bg-green-500/20 border border-green-500/40 text-green-400' : 'bg-zinc-800 border border-white/5 text-zinc-400 hover:bg-zinc-700'}`}
                                                    >
                                                        <Flag className="w-4 h-4" />
                                                        {markStart !== null ? `Start: ${formatTime(markStart)}` : 'Mark Start'}
                                                    </button>

                                                    <button
                                                        onClick={handleMarkEnd}
                                                        className={`flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${markEnd !== null ? 'bg-red-500/20 border border-red-500/40 text-red-400' : 'bg-zinc-800 border border-white/5 text-zinc-400 hover:bg-zinc-700'}`}
                                                    >
                                                        <Flag className="w-4 h-4" />
                                                        {markEnd !== null ? `End: ${formatTime(markEnd)}` : 'Mark End'}
                                                    </button>
                                                </div>

                                                {/* Selection Info */}
                                                {markStart !== null && markEnd !== null && (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-between"
                                                    >
                                                        <span className="text-xs font-black uppercase tracking-widest text-purple-400">
                                                            Selected: {formatTime(markStart)} → {formatTime(markEnd)}
                                                        </span>
                                                        <span className="text-xs font-bold text-white/60">
                                                            Duration: {formatTime(markEnd - markStart)}
                                                        </span>
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        )}
                                    </div>
                                )}

                                {/* === AUDIO JOINER (CapCut-Style) === */}
                                {currentTool === 'joiner' && (
                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2">
                                            <Music className="w-3 h-3" /> Audio Tracks
                                        </h3>

                                        {/* Track List — side by side */}
                                        {joinerTracks.length > 0 ? (
                                            <div className="flex flex-wrap gap-4">
                                                {joinerTracks.map((track, idx) => (
                                                    <motion.div
                                                        key={track.id}
                                                        layout
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className={`flex-1 min-w-[200px] max-w-[300px] p-6 rounded-3xl border transition-all ${joinerPlayingId === track.id ? 'bg-purple-500/10 border-purple-500/40 shadow-lg shadow-purple-500/10' : 'bg-zinc-900/50 border-white/5'}`}
                                                    >
                                                        <div className="flex items-center justify-between mb-4">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Track {idx + 1}</span>
                                                            <button onClick={() => removeJoinerTrack(track.id)} className="p-1 text-zinc-600 hover:text-red-400 transition-colors">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                        <p className="text-xs font-bold truncate mb-3 text-white/80">{track.name}</p>
                                                        <p className="text-[9px] text-zinc-600 font-bold mb-4">{formatTime(track.duration)}</p>

                                                        <audio
                                                            ref={el => { joinerAudioRefs.current[track.id] = el; }}
                                                            src={track.url}
                                                            onEnded={() => handleJoinerTrackEnd(track.id)}
                                                            className="hidden"
                                                        />

                                                        <button
                                                            onClick={() => toggleJoinerTrackPlay(track.id)}
                                                            className={`w-full h-10 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${joinerPlayingId === track.id ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                                                        >
                                                            {joinerPlayingId === track.id ? <><Pause className="w-3 h-3" /> Playing</> : <><Play className="w-3 h-3 ml-0.5" /> Preview</>}
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="h-40 border-2 border-dashed border-zinc-900 rounded-3xl flex flex-col items-center justify-center gap-4 text-zinc-700">
                                                <Plus className="w-10 h-10" />
                                                <p className="text-xs font-black uppercase tracking-widest">Add audio files to start</p>
                                            </div>
                                        )}

                                        {/* Add + Preview Buttons */}
                                        <div className="flex gap-4">
                                            <label className="flex-1 h-14 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center gap-3 text-purple-400 font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-purple-500/20 transition-all">
                                                <input type="file" multiple onChange={handleJoinerAdd} className="hidden" accept="audio/*" />
                                                <Plus className="w-5 h-5" /> Add Audios
                                            </label>

                                            {joinerTracks.length >= 2 && (
                                                <button
                                                    onClick={playJoinerPreview}
                                                    className={`h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all ${joinerPreviewPlaying ? 'bg-white text-black' : 'bg-zinc-800 border border-white/5 text-zinc-400 hover:bg-zinc-700'}`}
                                                >
                                                    {joinerPreviewPlaying ? <><Pause className="w-4 h-4" /> Stop</> : <><Play className="w-4 h-4" /> Live Preview</>}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ACTION BUTTON — not for trimmer/joiner which have it inline */}
                                <div className="space-y-4">
                                    <button
                                        onClick={runEngine}
                                        disabled={processing || !canRun}
                                        className="group relative w-full py-5 bg-white text-black rounded-2xl overflow-hidden font-black uppercase tracking-[0.2em] text-xs transition-all hover:bg-zinc-200 disabled:opacity-20 active:scale-95"
                                    >
                                        <div className="relative z-10 flex items-center justify-center gap-3">
                                            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                                            {processing ? 'Processing...' : actionButtonLabel}
                                        </div>
                                    </button>

                                    {profile?.subscription_tier === 'free' && (
                                        <div className="flex flex-col gap-3 mt-4 px-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Zap className="w-3 h-3 text-purple-400" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                                                        {profile?.free_credits || 0} Silver Credits
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={handleEarnCredits}
                                                    className="text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                                                >
                                                    <Sparkles className="w-3 h-3 animate-pulse" />
                                                    Earn More
                                                </button>
                                            </div>
                                            <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">
                                                {profile?.free_credits > 0 ? "Skip the next ad gate by using 1 Silver credit." : "Watch an ad to unlock this action."}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Progress Visualizer */}
                                <AnimatePresence>
                                    {processing && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-black/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center"
                                        >
                                            <div className="w-80 h-1.5 bg-zinc-900 rounded-full overflow-hidden mb-8 border border-white/5">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-[0_0_20px_rgba(168,85,247,0.6)]"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <h2 className="text-7xl font-black tracking-tighter mb-4 italic">{progress}%</h2>
                                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-purple-400 animate-pulse">Processing your media...</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Output & Live Preview */}
                    <div className="xl:col-span-4 space-y-6">
                        {profile?.subscription_tier === 'free' && <AdBanner />}
                        <section className="bg-zinc-900/50 border border-white/5 rounded-[40px] p-8 space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Live Workspace</h3>

                            <AnimatePresence mode="wait">
                                {outputUrl ? (
                                    <motion.div
                                        key="result"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="space-y-6"
                                    >
                                        {/* Video Preview */}
                                        {(currentTool === 'video-extractor' || currentTool === 'magic-sync') && (
                                            <div className="aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center relative group">
                                                <video src={outputUrl} controls className="w-full h-full object-contain" />
                                            </div>
                                        )}

                                        {/* Audio Preview — for audio tools AND magic-sync */}
                                        {(currentTool === 'audio-extractor' || currentTool === 'trimmer' || currentTool === 'joiner') && (
                                            <div className="p-6 bg-zinc-900/60 border border-white/5 rounded-3xl space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                                        <Music className="w-5 h-5 text-purple-400" />
                                                    </div>
                                                    <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Audio Preview</span>
                                                </div>
                                                <audio src={outputUrl} controls className="w-full" />
                                            </div>
                                        )}

                                        {/* Magic Sync — show both video + audio */}
                                        {currentTool === 'magic-sync' && outputAudioUrl && (
                                            <div className="p-6 bg-zinc-900/60 border border-white/5 rounded-3xl space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                                        <Music className="w-5 h-5 text-purple-400" />
                                                    </div>
                                                    <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Audio Preview</span>
                                                </div>
                                                <audio src={outputAudioUrl} controls className="w-full" />
                                            </div>
                                        )}

                                        {/* Download Buttons */}
                                        <div className="grid grid-cols-1 gap-3">
                                            <a
                                                href={outputUrl}
                                                download={`lab-${currentTool}-${Date.now()}`}
                                                className="w-full py-5 bg-green-500 hover:bg-green-400 text-black text-center rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-green-900/20 flex items-center justify-center gap-2"
                                            >
                                                <Download className="w-4 h-4" />
                                                {currentTool === 'magic-sync' ? 'Download Video' : 'Download Output'}
                                            </a>

                                            {currentTool === 'magic-sync' && outputAudioUrl && (
                                                <a
                                                    href={outputAudioUrl}
                                                    download={`lab-audio-${Date.now()}`}
                                                    className="w-full py-5 bg-purple-500 hover:bg-purple-400 text-white text-center rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-purple-900/20 flex items-center justify-center gap-2"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Download Audio
                                                </a>
                                            )}

                                            <button
                                                onClick={() => { setOutputUrl(null); setOutputAudioUrl(null); }}
                                                className="w-full py-5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                                            >
                                                Start Over
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="placeholder"
                                        className="aspect-square lg:aspect-video bg-zinc-900/50 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-zinc-700 p-8 text-center"
                                    >
                                        <div className="p-4 bg-zinc-800 rounded-2xl mb-4">
                                            <Play className="w-6 h-6 opacity-30 fill-current" />
                                        </div>
                                        <p className="text-[10px] uppercase font-black tracking-widest">Awaiting Input</p>
                                        <p className="text-[9px] mt-2 leading-relaxed max-w-[200px] font-bold">Process a link or file to see the preview here.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </section>
                    </div>
                </div>

                {/* Error Toast */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 p-5 bg-red-500/10 border border-red-500/30 rounded-3xl backdrop-blur-2xl flex items-center gap-4 text-red-400 z-[100] shadow-2xl"
                    >
                        <AlertCircle className="w-6 h-6" />
                        <span className="text-xs font-black uppercase tracking-widest">{error}</span>
                        <button onClick={() => setError(null)} className="ml-4 p-2 hover:bg-white/5 rounded-lg"><Plus className="w-4 h-4 rotate-45" /></button>
                    </motion.div>
                )}
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #27272a;
                    border-radius: 10px;
                }
                audio::-webkit-media-controls-enclosure {
                    background-color: transparent !important;
                }
                ::-webkit-scrollbar {
                  width: 6px;
                }
                ::-webkit-scrollbar-track {
                  background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                  background: #222;
                  border-radius: 20px;
                }
            `}</style>
            {/* Ad Integration */}
            <AdGate
                isOpen={showAd}
                onClose={() => setShowAd(false)}
                onComplete={() => {
                    const canRunNow = canRun;
                    if (canRunNow) {
                        executeEngine();
                    } else {
                        awardCredit();
                    }
                }}
            />

            {showSubscriptions && (
                <LabSubscriptions 
                    userId={userId || ''} 
                    onClose={() => setShowSubscriptions(false)} 
                    onPurchase={(plan) => {
                        onOpenPayment?.();
                        setShowSubscriptions(false);
                    }}
                />
            )}

            <AnimatePresence>
                {durationLimitError && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
                    >
                        <motion.div 
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full text-center"
                        >
                            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Clock className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Limit Reached</h3>
                            <p className="text-zinc-400 mb-8 text-sm">
                                {durationLimitError.error}
                            </p>
                            <div className="space-y-3">
                                <button 
                                    onClick={() => { setShowSubscriptions(true); setDurationLimitError(null); }}
                                    className="w-full py-4 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl shadow-lg transition-all"
                                >
                                    Upgrade Studio
                                </button>
                                <button 
                                    onClick={() => setDurationLimitError(null)}
                                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
