'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Download, Scissors, Music, Zap, Trash2, ArrowRight, CheckCircle2, AlertCircle, FileAudio, Layout, Upload, Plus, Play, Pause, GripVertical, Trash, Volume2 } from 'lucide-react';

type VideoAction = 'download-video' | 'extract-audio' | 'trim-audio' | 'magic-extract' | 'merge-audio';

interface VideoEditTabProps {
    userId?: string;
    onSuccess?: () => void;
}

export default function VideoEditTab({ userId, onSuccess }: VideoEditTabProps) {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ url?: string; videoUrl?: string; audioUrl?: string; type?: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [action, setAction] = useState<VideoAction>('download-video');
    const [showLimitAlert, setShowLimitAlert] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
    const [startTime, setStartTime] = useState(0);
    const [duration, setDuration] = useState(10);
    const [totalDuration, setTotalDuration] = useState(0);
    const [tracks, setTracks] = useState<{ id: string; file: File; url: string; name: string }[]>([]);
    const [isPlayingAll, setIsPlayingAll] = useState(false);
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const multiFileInputRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const trackRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

    // Track daily usage (10 ops limit)
    const checkDailyLimit = () => {
        const today = new Date().toDateString();
        const stats = JSON.parse(localStorage.getItem('tandres_usage_stats') || '{}');
        if (stats.date !== today) {
            return { count: 0, date: today };
        }
        return stats;
    };

    const incrementUsage = () => {
        const stats = checkDailyLimit();
        stats.count += 1;
        localStorage.setItem('tandres_usage_stats', JSON.stringify(stats));
    };

    const actions = [
        { id: 'download-video', label: 'Video Extractor', icon: <Download className="w-5 h-5" />, desc: 'Save and download high-quality videos from any URL.' },
        { id: 'extract-audio', label: 'Audio Extractor', icon: <Music className="w-5 h-5" />, desc: 'Instantly pull the MP3 track from any video file.' },
        { id: 'trim-audio', label: 'Audio Cut', icon: <Scissors className="w-5 h-5" />, desc: 'Cut out any part of your song or audio perfectly.' },
        { id: 'magic-extract', label: 'Magic Sync (A+V)', icon: <Zap className="w-5 h-5" />, desc: 'Download a video and extract its master audio track in one click.' },
        { id: 'merge-audio', label: 'Audio Joiner', icon: <Layout className="w-5 h-5" />, desc: 'Join multiple audios together to play one after the other.' }
    ];

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl); // Cleanup old URL

            const pUrl = URL.createObjectURL(selectedFile);
            setFile(selectedFile);
            setFilePreviewUrl(pUrl);
            setUrl(''); // Clear URL if file is selected
            setStartTime(0);
        }
    };

    const handleSeek = (time: number) => {
        setStartTime(time);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    };

    const handleTrackAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const validTracks: { id: string; file: File; url: string; name: string }[] = [];
        let hasTooLong = false;

        for (const file of files) {
            // Create a temporary audio element to check duration
            const duration = await new Promise<number>((resolve) => {
                const audio = new Audio();
                audio.src = URL.createObjectURL(file);
                audio.onloadedmetadata = () => {
                    URL.revokeObjectURL(audio.src);
                    resolve(audio.duration);
                };
            });

            if (duration > 90) {
                hasTooLong = true;
                continue;
            }

            validTracks.push({
                id: Math.random().toString(36).substr(2, 9),
                file: file,
                url: URL.createObjectURL(file),
                name: file.name
            });
        }

        if (hasTooLong) {
            setError("Some tracks were skipped. Max duration per track is 1 minute 30 seconds.");
        }

        if (validTracks.length > 0) {
            setTracks([...tracks, ...validTracks]);
        }
    };

    const handleTrackRemove = (id: string, url: string) => {
        URL.revokeObjectURL(url);
        setTracks(tracks.filter(t => t.id !== id));
    };

    const moveTrack = (index: number, direction: 'up' | 'down') => {
        const newTracks = [...tracks];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= tracks.length) return;
        [newTracks[index], newTracks[targetIndex]] = [newTracks[targetIndex], newTracks[index]];
        setTracks(newTracks);
    };

    const togglePlayAll = () => {
        if (isPlayingAll) {
            Object.values(trackRefs.current).forEach(audio => audio?.pause());
            setIsPlayingAll(false);
            setPreviewIndex(null);
        } else {
            if (tracks.length === 0) return;
            setIsPlayingAll(true);
            setPreviewIndex(0);
            const firstAudio = trackRefs.current[tracks[0].id];
            if (firstAudio) {
                firstAudio.currentTime = 0;
                firstAudio.play();
            }
        }
    };

    const handleTrackEnd = (index: number) => {
        if (!isPlayingAll) return;

        const nextIndex = index + 1;
        if (nextIndex < tracks.length) {
            setPreviewIndex(nextIndex);
            const nextAudio = trackRefs.current[tracks[nextIndex].id];
            if (nextAudio) {
                nextAudio.currentTime = 0;
                nextAudio.play();
            }
        } else {
            setIsPlayingAll(false);
            setPreviewIndex(null);
        }
    };
    const handleAction = async () => {
        if (!url && !file && tracks.length === 0) return;

        // Reset result immediately on run
        setResult(null);
        setError(null);
        setShowLimitAlert(false);

        // Guest Limit Check
        if (!userId && localStorage.getItem('tandres_guest_used')) {
            setShowLimitAlert(true);
            setError('Guest limit reached. Please login to use Studio tools.');
            return;
        }

        // Daily Actions Limit (10)
        const usage = checkDailyLimit();
        if (usage.count >= 10) {
            setError('Daily limit of 10 studio actions reached. Come back tomorrow!');
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('action', action);
            formData.append('userId', userId || '');

            if (action === 'trim-audio') {
                formData.append('startTime', startTime.toString());
                formData.append('duration', duration.toString());
            }

            if (action === 'merge-audio') {
                tracks.forEach(track => {
                    formData.append('files', track.file);
                });
            } else if (file) {
                formData.append('file', file);
            } else {
                formData.append('url', url);
            }

            const res = await fetch('/api/video-edit', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Server error');
            setResult(data);
            incrementUsage();

            // Mark guest try as used
            if (!userId) {
                localStorage.setItem('tandres_guest_used', 'true');
            }

            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-12 max-w-5xl mx-auto relative">
            {/* Floating Limit Alert */}
            <AnimatePresence>
                {showLimitAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -50, scale: 0.9 }}
                        className="fixed top-8 right-8 z-[100] w-96 bg-blue-600 border border-blue-400 p-8 rounded-[2rem] shadow-2xl flex flex-col gap-4 group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                                <Zap className="w-6 h-6 animate-pulse" />
                            </div>
                            <div>
                                <h4 className="font-black uppercase tracking-widest text-white text-sm">Limit Reached</h4>
                                <p className="text-white/60 text-[10px] font-bold">Log in to unlock the Studio</p>
                            </div>
                            <button onClick={() => setShowLimitAlert(false)} className="ml-auto text-white/40 hover:text-white transition-colors">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-white text-sm font-medium leading-relaxed">
                            You've exhausted your free guest limits. Login to continue using our AI Voice and Video extraction tools.
                        </p>
                        <button
                            onClick={() => {
                                setShowLimitAlert(false);
                                // Trigger auth modal via global event or state if possible, 
                                // but for now just hide and let user click ENTER STUDIO
                            }}
                            className="bg-white text-blue-600 h-12 rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                            Log In Now
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Section: Action Selector Layout */}
            <div className="flex flex-col gap-8">
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-white/30 ml-2">Studio Tools</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {actions.map((act) => (
                        <button
                            key={act.id}
                            onClick={() => {
                                setAction(act.id as VideoAction);
                                setFile(null); // Reset file when changing tools
                                setUrl('');
                            }}
                            className={`group flex flex-col p-6 rounded-3xl border transition-all text-left relative overflow-hidden active:scale-95 ${action === act.id ? 'bg-blue-600 border-blue-500 shadow-xl shadow-blue-900/40 text-white translate-y-[-4px]' : 'bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/10 hover:border-white/20'}`}
                        >
                            <div className={`mb-6 h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${action === act.id ? 'bg-white shadow-xl shadow-blue-500/20 text-blue-600 animate-[bounce_1.5s_infinite]' : 'bg-white/5 text-white shadow-black/20 group-hover:scale-110'}`}>
                                {act.icon}
                            </div>
                            <span className={`font-bold text-sm tracking-tight mb-2 ${action === act.id ? 'text-white' : 'text-white/60'}`}>{act.label}</span>
                            <p className={`text-[10px] leading-relaxed font-medium uppercase tracking-widest ${action === act.id ? 'text-blue-100/60' : 'text-white/20'}`}>Select Tool</p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-[1px] w-full bg-white/5" />

            {/* Input Section */}
            <div className="p-12 bg-white/[0.01] border border-white/5 rounded-[3rem] relative overflow-hidden backdrop-blur-xl">
                <div className="relative z-10 flex flex-col gap-10">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            <h3 className="text-3xl font-bold tracking-tight">Active: {actions.find(a => a.id === action)?.label}</h3>
                        </div>
                        <p className="text-white/30 text-lg leading-relaxed max-w-2xl">{actions.find(a => a.id === action)?.desc}</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-black uppercase tracking-widest text-white/20 ml-4 mb-2">
                            {action === 'trim-audio' ? 'Audio Link or Upload File' :
                                action === 'extract-audio' ? 'Video Link or Upload File' : 'Video Link'}
                        </label>
                        <div className="flex flex-col md:flex-row gap-4">
                            {action === 'merge-audio' ? (
                                <div className="flex-grow flex flex-col gap-6">
                                    {/* Track List */}
                                    <div className="flex flex-col gap-3">
                                        {tracks.map((track, idx) => (
                                            <motion.div
                                                layout
                                                key={track.id}
                                                className={`flex items-center gap-4 p-4 border rounded-2xl transition-all duration-500 ${previewIndex === idx ? 'bg-blue-500/10 border-blue-500/40 shadow-lg shadow-blue-500/10 scale-[1.02]' : 'bg-white/[0.03] border-white/10'}`}
                                            >
                                                <div className="flex flex-col bg-white/5 rounded-lg overflow-hidden border border-white/5">
                                                    <button
                                                        onClick={() => moveTrack(idx, 'up')}
                                                        className="p-2 text-white/20 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-0"
                                                        disabled={idx === 0}
                                                        title="Move Up"
                                                    >
                                                        <GripVertical className="w-4 h-4 rotate-180" />
                                                    </button>
                                                    <div className="h-[1px] w-full bg-white/5" />
                                                    <button
                                                        onClick={() => moveTrack(idx, 'down')}
                                                        className="p-2 text-white/20 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-0"
                                                        disabled={idx === tracks.length - 1}
                                                        title="Move Down"
                                                    >
                                                        <GripVertical className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${previewIndex === idx ? 'bg-blue-500 text-white animate-pulse' : 'bg-blue-500/10 text-blue-400'}`}>
                                                    {previewIndex === idx ? <Volume2 className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                                                </div>

                                                <div className="flex flex-col flex-grow min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-blue-500 opacity-40">Track {idx + 1}</span>
                                                        <span className="text-white font-bold text-sm truncate">{track.name}</span>
                                                    </div>
                                                    <audio
                                                        ref={el => { trackRefs.current[track.id] = el }}
                                                        src={track.url}
                                                        onEnded={() => handleTrackEnd(idx)}
                                                        className="h-6 w-full opacity-40 hover:opacity-100 transition-opacity mt-2"
                                                        controls
                                                    />
                                                </div>

                                                <button
                                                    onClick={() => handleTrackRemove(track.id, track.url)}
                                                    className="p-3 text-white/20 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash className="w-5 h-5" />
                                                </button>
                                            </motion.div>
                                        ))}

                                        {tracks.length === 0 && (
                                            <div className="h-40 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center gap-4 text-white/20">
                                                <Upload className="w-10 h-10" />
                                                <p className="text-sm font-bold uppercase tracking-[0.2em]">Add first track to start</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-4">
                                        <input
                                            type="file"
                                            ref={multiFileInputRef}
                                            onChange={handleTrackAdd}
                                            multiple
                                            hidden
                                            accept="audio/*"
                                        />
                                        <button
                                            onClick={() => multiFileInputRef.current?.click()}
                                            className="h-20 flex-grow bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center gap-4 text-blue-400 font-black uppercase tracking-widest text-sm hover:bg-blue-500/20 transition-all"
                                        >
                                            <Plus className="w-6 h-6" /> Add Audios
                                        </button>

                                        {tracks.length > 1 && (
                                            <button
                                                onClick={togglePlayAll}
                                                className={`h-20 px-10 rounded-2xl border transition-all flex items-center gap-4 font-black uppercase tracking-widest text-sm ${isPlayingAll ? 'bg-white text-black border-white' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                                            >
                                                {isPlayingAll ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                                                {isPlayingAll ? 'Mute Preview' : 'Mix Preview'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-grow flex flex-col md:flex-row gap-4">
                                    {!file ? (
                                        <input
                                            type="text"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            placeholder={
                                                action === 'trim-audio' ? "Paste Audio URL or select file..." :
                                                    action === 'download-video' ? "Paste Video URL (YouTube, TikTok, etc)..." :
                                                        "Paste video link here..."
                                            }
                                            className="flex-grow h-20 bg-white/[0.03] border border-white/10 rounded-2xl px-10 text-white font-medium placeholder:text-white/10 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/[0.02] transition-all text-lg shadow-inner ring-1 ring-white/5"
                                        />
                                    ) : (
                                        <div className="flex-grow h-20 bg-blue-500/10 border border-blue-500/40 rounded-2xl px-8 flex items-center justify-between shadow-inner ring-1 ring-blue-500/20">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                                                    <FileAudio className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-sm truncate max-w-[200px]">{file.name}</span>
                                                    <span className="text-white/30 text-[10px] uppercase font-black tracking-widest">Ready to process</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setFile(null)}
                                                className="text-white/20 hover:text-red-400 transition-colors p-2"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}

                                    {action !== 'magic-extract' && action !== 'download-video' && !file && (
                                        <>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileSelect}
                                                hidden
                                                accept="video/*,audio/*"
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="h-20 w-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all group shrink-0"
                                                title="Upload Local File"
                                            >
                                                <Upload className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            <button
                                disabled={(!url && !file && tracks.length === 0) || loading}
                                onClick={handleAction}
                                className={`h-20 px-12 rounded-2xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-4 transition-all active:scale-95 shadow-22 shadow-blue-900/20 ${((!url && !file && tracks.length === 0) || loading) ? 'bg-white/5 text-white/20 cursor-not-allowed grayscale' : 'bg-white text-black hover:-translate-y-1 hover:shadow-white/10 active:translate-y-0 group overflow-hidden'}`}
                            >
                                {loading ? (
                                    'Processing...'
                                ) : (
                                    <>
                                        Run Engine <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>

                        {action === 'trim-audio' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="flex flex-col gap-10 p-10 bg-blue-500/[0.03] border border-blue-500/20 rounded-[2.5rem]"
                            >
                                {file && filePreviewUrl && (
                                    <div className="flex flex-col gap-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Listen & Adjust</span>
                                                <p className="text-white/60 text-xs font-medium">Use the player or the slider to find your cut point.</p>
                                            </div>
                                            <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-widest leading-none">
                                                {Math.floor(startTime)}s / {Math.floor(totalDuration)}s
                                            </div>
                                        </div>

                                        <audio
                                            ref={audioRef}
                                            src={filePreviewUrl}
                                            onLoadedMetadata={(e) => setTotalDuration(e.currentTarget.duration)}
                                            onTimeUpdate={(e) => setStartTime(e.currentTarget.currentTime)}
                                            controls
                                            className="w-full h-12 rounded-xl"
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="flex flex-col gap-6">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-center mb-2 px-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Where to start?</label>
                                                <span className="text-white/40 text-[10px] font-bold">{Math.floor(startTime)} Seconds</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max={totalDuration || 100}
                                                step="1"
                                                value={startTime}
                                                onChange={(e) => handleSeek(Number(e.target.value))}
                                                className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                            />
                                            {/* Precise input for those who want it */}
                                            <div className="mt-4">
                                                <input
                                                    type="number"
                                                    value={Math.floor(startTime)}
                                                    onChange={(e) => handleSeek(Number(e.target.value))}
                                                    className="w-24 h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-white font-bold text-sm focus:outline-none focus:border-blue-500/50"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-6">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-center mb-2 px-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-blue-400">How many seconds?</label>
                                                <span className="text-white/40 text-[10px] font-bold">{duration} Seconds long</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max={totalDuration ? totalDuration - startTime : 60}
                                                step="1"
                                                value={duration}
                                                onChange={(e) => setDuration(Number(e.target.value))}
                                                className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                            />
                                            <div className="mt-4">
                                                <input
                                                    type="number"
                                                    value={duration}
                                                    onChange={(e) => setDuration(Number(e.target.value))}
                                                    className="w-24 h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-white font-bold text-sm focus:outline-none focus:border-blue-500/50"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-3">
                                    <AlertCircle className="w-4 h-4 text-white/20" />
                                    <p className="text-[10px] text-white/30 font-medium">Dragging the "Where to start" slider will also move the audio player so you can listen as you pick.</p>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Dynamic Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
            </div>

            {/* Result Section */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-16 border-2 border-dashed border-blue-500/10 rounded-[3rem] flex flex-col items-center justify-center gap-10 text-center bg-blue-500/[0.01]"
                    >
                        <div className="flex gap-2">
                            <motion.div className="w-3 h-3 rounded-full bg-blue-500" animate={{ y: [0, -10, 0] }} transition={{ duration: 1, repeat: Infinity }} />
                            <motion.div className="w-3 h-3 rounded-full bg-blue-500/70" animate={{ y: [0, -10, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
                            <motion.div className="w-3 h-3 rounded-full bg-blue-500/40" animate={{ y: [0, -10, 0] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <h4 className="text-2xl font-bold tracking-tight">Studio Engine Running...</h4>
                            <p className="text-white/25 max-w-md mx-auto leading-relaxed">Please don't refresh. We are communicating with local FFmpeg nodes to process your requests.</p>
                        </div>
                    </motion.div>
                )}

                {result && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col gap-8 p-12 bg-white/[0.03] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden relative"
                    >
                        <header className="flex items-center gap-6">
                            <div className="h-16 w-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <div>
                                <h4 className="text-3xl font-bold tracking-tight italic uppercase">Processing Complete</h4>
                                <p className="text-white/30 text-sm font-medium">Exporting output to local downloads...</p>
                            </div>
                        </header>

                        {/* Media Preview */}
                        <div className="relative z-10 w-full">
                            {(result.videoUrl || (result.url && result.type === 'video')) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full aspect-video bg-black/60 rounded-[2rem] overflow-hidden border border-white/10 shadow-inner group relative"
                                >
                                    <video
                                        src={result.videoUrl || result.url}
                                        controls
                                        className="w-full h-full object-contain"
                                    />
                                </motion.div>
                            )}
                            {(result.audioUrl || (result.url && result.type === 'audio')) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full p-8 bg-white/[0.03] border border-white/10 rounded-3xl mt-4"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        <Music className="w-5 h-5 text-blue-400" />
                                        <span className="text-xs font-black uppercase tracking-widest text-white/40">Audio Preview</span>
                                    </div>
                                    <audio
                                        src={result.audioUrl || result.url}
                                        controls
                                        className="w-full custom-audio-player"
                                    />
                                </motion.div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 relative z-10">
                            {(result.url || result.videoUrl) && (
                                <div className="p-8 bg-black/40 border border-white/5 rounded-3xl flex flex-col gap-6">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Standard Export</span>
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-lg">{(result.videoUrl || result.type === 'video') ? 'Video MP4' : 'Audio MP3'}</span>
                                        <a
                                            href={result.videoUrl || result.url}
                                            download
                                            className="bg-white text-black px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform"
                                        >
                                            Download
                                            <Download className="w-3.5 h-3.5 fill-black" />
                                        </a>
                                    </div>
                                </div>
                            )}
                            {result.audioUrl && (
                                <div className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-3xl flex flex-col gap-6 ring-1 ring-blue-500/10">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Audio Magic Track</span>
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-lg">MP3 Track</span>
                                        <a
                                            href={result.audioUrl}
                                            download
                                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform"
                                        >
                                            Download
                                            <Download className="w-3.5 h-3.5 fill-white" />
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Animated Waves Decor */}
                        <div className="absolute -bottom-10 right-0 w-full h-1/2 bg-blue-600/5 blur-[100px] pointer-events-none" />
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-8 bg-red-500/5 border border-red-500/10 rounded-3xl flex items-center gap-4 text-red-100/40 text-sm font-medium"
                    >
                        <div className="h-10 w-10 bg-red-500/20 rounded-xl flex items-center justify-center text-red-400 shrink-0">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
