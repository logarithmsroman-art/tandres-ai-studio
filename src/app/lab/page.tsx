'use client';

import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Beaker, Upload, Play, Download, Loader2,
    CheckCircle2, AlertCircle, Scissors, Plus,
    Music, Video, Zap, Trash2, Clock, Link as LinkIcon,
    Globe, ShieldCheck, Cpu
} from 'lucide-react';

type ToolType = 'audio-extractor' | 'video-extractor' | 'trimmer' | 'joiner' | 'magic-sync';

interface StreamInfo {
    title: string;
    thumbnail: string;
    url: string;
    formats?: any[];
}

export default function LabPage() {
    const [loaded, setLoaded] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentTool, setCurrentTool] = useState<ToolType>('audio-extractor');

    // Inputs
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [pastedUrl, setPastedUrl] = useState('');
    const [isResolving, setIsResolving] = useState(false);
    const [resolvedInfo, setResolvedInfo] = useState<StreamInfo | null>(null);

    // Params
    const [startTime, setStartTime] = useState('00:00:00');
    const [duration, setDuration] = useState('00:00:10');

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
            setError('Failed to initialize local engine. Ensure COOP/COEP headers are enabled.');
        }
    };

    const resolveUrl = async () => {
        if (!pastedUrl) return;

        // Validation for TikTok Slideshows
        if (pastedUrl.includes('tiktok.com') && pastedUrl.includes('/photo/')) {
            setError("TikTok Photo Slideshows are not supported yet. Please use a Video link.");
            return;
        }

        setIsResolving(true);
        setError(null);
        try {
            // Special handling for vt.tiktok redirects: passed to server
            const res = await fetch('/api/video-edit', {
                method: 'POST',
                body: JSON.stringify({ action: 'resolve-url', url: pastedUrl })
            });
            const data = await res.json();
            if (data.success) {
                setResolvedInfo({
                    title: data.title,
                    thumbnail: data.thumbnail,
                    url: data.streamUrl,
                    formats: data.formats
                });
            } else {
                throw new Error(data.error || 'Failed to resolve link');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsResolving(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            if (currentTool === 'joiner') {
                setSelectedFiles(prev => [...prev, ...newFiles]);
            } else if (currentTool === 'magic-sync') {
                setSelectedFiles(prev => [...prev.slice(0, 1), newFiles[0]].filter(Boolean));
            } else {
                setSelectedFiles([newFiles[0]]);
                setResolvedInfo(null); // Clear URL if file is selected
            }
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const runEngine = async () => {
        const hasInput = selectedFiles.length > 0 || (resolvedInfo && resolvedInfo.url);
        if (!hasInput || !loaded) return;

        setProcessing(true);
        setProgress(0);
        setError(null);
        setOutputUrl(null);

        try {
            const ffmpeg = ffmpegRef.current;
            if (!ffmpeg) return;

            // Get the input source
            let inputSource: any;
            let inputName = 'input.mp4';
            let fileExt = '.mp4';

            if (selectedFiles.length > 0) {
                inputSource = await fetchFile(selectedFiles[0]);
                fileExt = selectedFiles[0].name.substring(selectedFiles[0].name.lastIndexOf('.')) || '.mp4';
                inputName = 'input' + fileExt;
            } else if (resolvedInfo) {
                // Use our proxy to bypass CORS
                const proxyUrl = `/api/proxy?url=${encodeURIComponent(resolvedInfo.url)}`;
                inputSource = await fetchFile(proxyUrl);
                inputName = 'input.mp4';
            }

            await ffmpeg.writeFile(inputName, inputSource);

            if (currentTool === 'audio-extractor') {
                const outputName = 'output.mp3';
                await ffmpeg.exec(['-i', inputName, '-vn', '-acodec', 'libmp3lame', outputName]);
                const data = await ffmpeg.readFile(outputName);
                setOutputUrl(URL.createObjectURL(new Blob([data as any], { type: 'audio/mp3' })));
            }

            else if (currentTool === 'video-extractor') {
                // Just pass through or remux to mp4 if needed
                const outputName = 'video-out.mp4';
                await ffmpeg.exec(['-i', inputName, '-c', 'copy', outputName]);
                const data = await ffmpeg.readFile(outputName);
                setOutputUrl(URL.createObjectURL(new Blob([data as any], { type: 'video/mp4' })));
            }

            else if (currentTool === 'trimmer') {
                const outputName = 'trimmed' + fileExt;
                await ffmpeg.exec(['-ss', startTime, '-i', inputName, '-t', duration, '-c', 'copy', outputName]);
                const data = await ffmpeg.readFile(outputName);
                const type = fileExt.includes('mp3') ? 'audio/mp3' : 'video/mp4';
                setOutputUrl(URL.createObjectURL(new Blob([data as any], { type })));
            }

            else if (currentTool === 'joiner') {
                const filterInputs = [];
                // Handle files (URL support for joiner is complex, sticking to files for now)
                for (let i = 0; i < selectedFiles.length; i++) {
                    const name = `file${i}.mp3`;
                    await ffmpeg.writeFile(name, await fetchFile(selectedFiles[i]));
                    filterInputs.push('-i', name);
                }
                const filterComplex = `concat=n=${selectedFiles.length}:v=0:a=1[a]`;
                await ffmpeg.exec([...filterInputs, '-filter_complex', filterComplex, '-map', '[a]', 'joined.mp3']);
                const data = await ffmpeg.readFile('joined.mp3');
                setOutputUrl(URL.createObjectURL(new Blob([data as any], { type: 'audio/mp3' })));
            }

            else if (currentTool === 'magic-sync') {
                // Video from URL/File + Custom Audio from File
                const audioFile = selectedFiles.find(f => f.type.startsWith('audio'));
                if (!audioFile) throw new Error('Please upload an audio file to sync');

                await ffmpeg.writeFile('aud.mp3', await fetchFile(audioFile));
                await ffmpeg.exec([
                    '-i', inputName,
                    '-i', 'aud.mp3',
                    '-c:v', 'copy',
                    '-map', '0:v:0',
                    '-map', '1:a:0',
                    '-shortest',
                    'synced.mp4'
                ]);

                const data = await ffmpeg.readFile('synced.mp4');
                setOutputUrl(URL.createObjectURL(new Blob([data as any], { type: 'video/mp4' })));
            }

            setProcessing(false);
        } catch (err: any) {
            console.error('Processing error:', err);
            setError(err.message || 'Processing failed. The link might be blocked by browser security (CORS).');
            setProcessing(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const tools = [
        { id: 'audio-extractor', name: 'Audio Ext', icon: Music, desc: 'Link or File to MP3' },
        { id: 'video-extractor', name: 'Video Ext', icon: Video, desc: 'Download MP4' },
        { id: 'trimmer', name: 'Cutter', icon: Scissors, desc: 'Clip sections' },
        { id: 'joiner', name: 'Joiner', icon: Plus, desc: 'Merge multiple' },
        { id: 'magic-sync', name: 'Magic Sync', icon: Zap, desc: 'A+V Fusion' },
    ];

    return (
        <div className="min-h-screen bg-[#060606] text-white p-6 font-sans pb-32 selection:bg-purple-500/30">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl shadow-xl shadow-purple-900/20 border border-white/10">
                            <Beaker className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic">Multimedia Fusion Suite</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-md border border-purple-500/20">Experimental Lab</span>
                                <span className="text-zinc-500 text-sm font-medium">Powered by Zero-Cost browser engine</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all duration-1000 ${loaded ? 'border-green-500/30 bg-green-500/5 text-green-400' : 'border-zinc-800 bg-zinc-900/50 text-zinc-500'}`}>
                            <div className={`w-2 h-2 rounded-full ${loaded ? 'bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]' : 'bg-zinc-700'}`} />
                            <span className="text-xs font-black uppercase tracking-widest">Engine: {loaded ? 'Online' : 'Loading...'}</span>
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
                                setResolvedInfo(null);
                                setPastedUrl('');
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
                            <p className="text-[9px] font-bold uppercase opacity-50 tracking-tighter line-clamp-1">{tool.desc}</p>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Left Panel: Inputs & Configuration */}
                    <div className="xl:col-span-8 flex flex-col gap-6">
                        <div className="bg-[#0e0e0e] border border-white/5 rounded-[40px] p-8 lg:p-12 shadow-2xl relative overflow-hidden">
                            <div className="relative space-y-10">

                                {/* URL SECTION */}
                                {currentTool !== 'joiner' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2">
                                                <Globe className="w-3 h-3" /> External Link Source
                                            </h3>
                                            {resolvedInfo && <span className="text-[10px] font-black text-green-500 uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Stream Resolved</span>}
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
                                                {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Link'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    {/* FILE SECTION */}
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2">
                                            <Upload className="w-3 h-3" /> Local Upload
                                        </h3>
                                        <div className="space-y-3">
                                            <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-zinc-900 hover:border-purple-500/40 rounded-3xl bg-zinc-900/20 transition-all cursor-pointer group">
                                                <input type="file" multiple={currentTool === 'joiner'} onChange={handleFileSelect} className="hidden" />
                                                <Plus className="w-8 h-8 mb-3 text-zinc-700 group-hover:text-purple-500 transition-colors" />
                                                <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Pick Files</p>
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

                                    {/* PARAMS SECTION */}
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2">
                                            <Zap className="w-3 h-3" /> Parameters
                                        </h3>
                                        <div className="p-8 bg-zinc-900/50 rounded-3xl border border-white/5 space-y-6">
                                            {currentTool === 'trimmer' && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black uppercase text-zinc-600 ml-1">Start Time</label>
                                                        <input type="text" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-black border border-white/5 rounded-xl p-3 text-xs font-mono outline-none focus:border-purple-500" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black uppercase text-zinc-600 ml-1">Duration</label>
                                                        <input type="text" value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-black border border-white/5 rounded-xl p-3 text-xs font-mono outline-none focus:border-purple-500" />
                                                    </div>
                                                </div>
                                            )}

                                            <button
                                                onClick={runEngine}
                                                disabled={processing || (!selectedFiles.length && !resolvedInfo)}
                                                className="group relative w-full py-5 bg-white text-black rounded-2xl overflow-hidden font-black uppercase tracking-[0.2em] text-xs transition-all hover:bg-zinc-200 disabled:opacity-20 active:scale-95"
                                            >
                                                <div className="relative z-10 flex items-center justify-center gap-3">
                                                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                                                    {processing ? 'Processing...' : 'Engage Suite'}
                                                </div>
                                            </button>
                                        </div>
                                    </div>
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
                                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-purple-400 animate-pulse">Engaging Local Processing Unit</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Output & Live Preview */}
                    <div className="xl:col-span-4 space-y-6">
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
                                        <div className="aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center relative group">
                                            {currentTool === 'video-extractor' || (currentTool === 'magic-sync') || (currentTool === 'trimmer' && selectedFiles[0]?.type.startsWith('video')) ? (
                                                <video src={outputUrl} controls className="w-full h-full object-contain" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="p-6 bg-purple-500/10 rounded-full border border-purple-500/20">
                                                        <Music className="w-10 h-10 text-purple-400" />
                                                    </div>
                                                    <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Audio Ready</p>
                                                    <audio src={outputUrl} controls className="w-64 h-10 brightness-75 scale-90" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            <a
                                                href={outputUrl}
                                                download={`fusion-lab-${Date.now()}`}
                                                className="w-full py-5 bg-green-500 hover:bg-green-400 text-black text-center rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-green-900/20 flex items-center justify-center gap-2"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download Output
                                            </a>
                                            <button
                                                onClick={() => setOutputUrl(null)}
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
                                        <p className="text-[10px] uppercase font-black tracking-widest">Awaiting Command</p>
                                        <p className="text-[9px] mt-2 leading-relaxed max-w-[200px] font-bold">Process a link or file to see the interactive preview here.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </section>

                        {/* Lab Metrics */}
                        <section className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-zinc-900/30 border border-white/5 rounded-3xl">
                                <Cpu className="w-4 h-4 text-purple-500 mb-3" />
                                <p className="text-[9px] font-black uppercase text-zinc-600 mb-1">Local Load</p>
                                <p className="text-sm font-bold tracking-tighter italic">LPU Engaged</p>
                            </div>
                            <div className="p-6 bg-zinc-900/30 border border-white/5 rounded-3xl">
                                <ShieldCheck className="w-4 h-4 text-blue-500 mb-3" />
                                <p className="text-[9px] font-black uppercase text-zinc-600 mb-1">Privacy Stat</p>
                                <p className="text-sm font-bold tracking-tighter italic">End-to-End</p>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer Warnings */}
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
        </div>
    );
}
