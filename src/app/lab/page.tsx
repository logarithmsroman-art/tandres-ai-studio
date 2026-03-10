'use client';

import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Beaker, Upload, Play, Download, Loader2,
    CheckCircle2, AlertCircle, Scissors, Plus,
    Music, Video, Zap, Trash2, Clock
} from 'lucide-react';

type ToolType = 'extractor' | 'trimmer' | 'joiner' | 'magic-sync';

export default function LabPage() {
    const [loaded, setLoaded] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [currentTool, setCurrentTool] = useState<ToolType>('extractor');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    // For Trimmer
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            if (currentTool === 'joiner') {
                setSelectedFiles(prev => [...prev, ...newFiles]);
            } else if (currentTool === 'magic-sync') {
                setSelectedFiles(prev => [...prev.slice(0, 1), newFiles[0]].filter(Boolean));
            } else {
                setSelectedFiles([newFiles[0]]);
            }
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const runEngine = async () => {
        if (selectedFiles.length === 0 || !loaded) return;

        setProcessing(true);
        setProgress(0);
        setError(null);
        setOutputUrl(null);

        try {
            const ffmpeg = ffmpegRef.current;
            if (!ffmpeg) return;

            if (currentTool === 'extractor') {
                const file = selectedFiles[0];
                const inputName = 'input' + (file.name.substring(file.name.lastIndexOf('.')) || '.mp4');
                const outputName = 'output.mp3';
                await ffmpeg.writeFile(inputName, await fetchFile(file));
                await ffmpeg.exec(['-i', inputName, '-vn', '-acodec', 'libmp3lame', outputName]);
                const data = await ffmpeg.readFile(outputName);
                const url = URL.createObjectURL(new Blob([data as any], { type: 'audio/mp3' }));
                setOutputUrl(url);
            }

            else if (currentTool === 'trimmer') {
                const file = selectedFiles[0];
                const inputName = 'input' + (file.name.substring(file.name.lastIndexOf('.')) || '.mp4');
                const outputName = 'trimmed' + (file.name.substring(file.name.lastIndexOf('.')) || '.mp4');
                await ffmpeg.writeFile(inputName, await fetchFile(file));
                // -ss: start, -t: duration
                await ffmpeg.exec(['-ss', startTime, '-i', inputName, '-t', duration, '-c', 'copy', outputName]);
                const data = await ffmpeg.readFile(outputName);
                const url = URL.createObjectURL(new Blob([data as any], { type: file.type }));
                setOutputUrl(url);
            }

            else if (currentTool === 'joiner') {
                if (selectedFiles.length < 2) throw new Error('Need at least 2 files to join');
                const filterInputs = [];
                for (let i = 0; i < selectedFiles.length; i++) {
                    const name = `file${i}.mp3`;
                    await ffmpeg.writeFile(name, await fetchFile(selectedFiles[i]));
                    filterInputs.push('-i', name);
                }

                // Concat audio filter
                const filterComplex = `concat=n=${selectedFiles.length}:v=0:a=1[a]`;
                await ffmpeg.exec([...filterInputs, '-filter_complex', filterComplex, '-map', '[a]', 'joined.mp3']);

                const data = await ffmpeg.readFile('joined.mp3');
                const url = URL.createObjectURL(new Blob([data as any], { type: 'audio/mp3' }));
                setOutputUrl(url);
            }

            else if (currentTool === 'magic-sync') {
                if (selectedFiles.length < 2) throw new Error('Need 1 video and 1 audio file');
                const videoFile = selectedFiles.find(f => f.type.startsWith('video'));
                const audioFile = selectedFiles.find(f => f.type.startsWith('audio'));
                if (!videoFile || !audioFile) throw new Error('Please select both a video and an audio file');

                await ffmpeg.writeFile('vid.mp4', await fetchFile(videoFile));
                await ffmpeg.writeFile('aud.mp3', await fetchFile(audioFile));

                // Combine: -i video -i audio -c:v copy -map 0:v:0 -map 1:a:0 -shortest
                await ffmpeg.exec([
                    '-i', 'vid.mp4',
                    '-i', 'aud.mp3',
                    '-c:v', 'copy',
                    '-map', '0:v:0',
                    '-map', '1:a:0',
                    '-shortest',
                    'synced.mp4'
                ]);

                const data = await ffmpeg.readFile('synced.mp4');
                const url = URL.createObjectURL(new Blob([data as any], { type: 'video/mp4' }));
                setOutputUrl(url);
            }

            setProcessing(false);
        } catch (err: any) {
            console.error('Processing error:', err);
            setError(err.message || 'Processing failed. Check console for details.');
            setProcessing(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const tools = [
        { id: 'extractor', name: 'Extractor', icon: Music, desc: 'Audio from Video' },
        { id: 'trimmer', name: 'Cutter', icon: Scissors, desc: 'Clip parts' },
        { id: 'joiner', name: 'Joiner', icon: Plus, desc: 'Merge Audio' },
        { id: 'magic-sync', name: 'Magic Sync', icon: Zap, desc: 'Overlay Audio' },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans pb-32">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-600/20 rounded-2xl border border-purple-500/30">
                            <Beaker className="w-8 h-8 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight uppercase">Zero-Cost Lab</h1>
                            <p className="text-zinc-500 font-medium">Browser-Side Multimedia Suite</p>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <div className={`px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${loaded ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-zinc-800 text-zinc-500'}`}>
                            <div className={`w-2 h-2 rounded-full ${loaded ? 'bg-green-500 animate-pulse' : 'bg-zinc-700'}`} />
                            Engine: {loaded ? 'Active' : 'Warming up...'}
                        </div>
                    </div>
                </header>

                {/* Tool Switcher */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => {
                                setCurrentTool(tool.id as ToolType);
                                setSelectedFiles([]);
                                setOutputUrl(null);
                            }}
                            className={`p-4 rounded-2xl border transition-all text-left flex flex-col gap-2 ${currentTool === tool.id
                                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-900/40'
                                    : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-zinc-700'
                                }`}
                        >
                            <tool.icon className={`w-5 h-5 ${currentTool === tool.id ? 'text-white' : 'text-purple-400'}`} />
                            <div>
                                <p className="font-black text-sm uppercase">{tool.name}</p>
                                <p className="text-[10px] opacity-60 font-medium uppercase tracking-tighter">{tool.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentTool}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#111] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
                    >
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[100px] rounded-full" />

                        <div className="relative space-y-8">
                            {/* Inputs section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <section className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Inputs</h3>

                                    <div className="space-y-3">
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                accept={currentTool === 'magic-sync' ? 'video/*,audio/*' : 'video/*,audio/*'}
                                                multiple={currentTool === 'joiner'}
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                id="lab-upload"
                                            />
                                            <label
                                                htmlFor="lab-upload"
                                                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-800 hover:border-purple-500/50 rounded-2xl bg-zinc-900/30 transition-all cursor-pointer"
                                            >
                                                <Upload className="w-8 h-8 mb-3 text-zinc-600" />
                                                <p className="font-bold text-sm tracking-tight">Add Files</p>
                                            </label>
                                        </div>

                                        {/* File List */}
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                            {selectedFiles.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        {file.type.startsWith('video') ? <Video className="w-4 h-4 text-blue-400 shrink-0" /> : <Music className="w-4 h-4 text-purple-400 shrink-0" />}
                                                        <span className="text-xs font-medium truncate">{file.name}</span>
                                                    </div>
                                                    <button onClick={() => removeFile(idx)} className="p-1.5 hover:bg-red-500/20 text-zinc-600 hover:text-red-400 rounded-lg">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Parameters</h3>

                                    <div className="p-6 bg-zinc-900/30 rounded-2xl border border-white/5 space-y-6">
                                        {currentTool === 'trimmer' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-zinc-600 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> Start
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={startTime}
                                                        onChange={(e) => setStartTime(e.target.value)}
                                                        className="w-full bg-black/50 border border-zinc-800 rounded-lg p-2 text-sm font-mono focus:border-purple-500 outline-none"
                                                        placeholder="00:00:00"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase text-zinc-600 flex items-center gap-1">
                                                        <Zap className="w-3 h-3" /> Duration
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={duration}
                                                        onChange={(e) => setDuration(e.target.value)}
                                                        className="w-full bg-black/50 border border-zinc-800 rounded-lg p-2 text-sm font-mono focus:border-purple-500 outline-none"
                                                        placeholder="00:00:10"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {currentTool === 'extractor' && (
                                            <p className="text-xs text-zinc-500 italic">Extraction converts any video into a optimized 128kbps MP3 automatically.</p>
                                        )}

                                        {currentTool === 'joiner' && (
                                            <p className="text-xs text-zinc-500 italic">Joining will merge all selected audio files in sequence. Files should be same format for best results.</p>
                                        )}

                                        {currentTool === 'magic-sync' && (
                                            <p className="text-xs text-zinc-500 italic">Upload 1 Video + 1 Audio. The audio will replace the original video sound.</p>
                                        )}

                                        <button
                                            onClick={runEngine}
                                            disabled={processing || selectedFiles.length === 0}
                                            className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-20 flex items-center justify-center gap-2"
                                        >
                                            {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                                            {processing ? 'Processing...' : 'Execute Task'}
                                        </button>
                                    </div>
                                </section>
                            </div>

                            {/* Status Overlay while processing */}
                            <AnimatePresence>
                                {processing && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50 rounded-3xl"
                                    >
                                        <div className="w-72 h-3 bg-zinc-900 rounded-full overflow-hidden mb-6 border border-white/5">
                                            <motion.div
                                                className="h-full bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.8)]"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <p className="font-black text-6xl tracking-tighter text-white mb-2">{progress}%</p>
                                        <p className="text-xs uppercase tracking-[0.4em] font-black text-purple-400">Zero-Cost Processing</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Simple Alert for Error */}
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400">
                                    <AlertCircle className="w-5 h-5" />
                                    <span className="text-sm font-bold uppercase tracking-tight">{error}</span>
                                </div>
                            )}

                            {/* Detailed Results */}
                            <AnimatePresence>
                                {outputUrl && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-8 bg-zinc-900 border border-green-500/30 rounded-3xl space-y-6"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-green-500/20 rounded-2xl shadow-inner">
                                                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black uppercase tracking-tighter text-xl">Work Complete</h4>
                                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Processed at zero cost locally</p>
                                                </div>
                                            </div>
                                            <a
                                                href={outputUrl}
                                                download={`lab-res-${Date.now()}`}
                                                className="flex items-center gap-3 px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-green-900/40"
                                            >
                                                <Download className="w-5 h-5" />
                                                GET FILE
                                            </a>
                                        </div>

                                        <div className="p-1 bg-black/40 rounded-2xl border border-white/5">
                                            {currentTool === 'magic-sync' || (selectedFiles[0]?.type.startsWith('video') && currentTool === 'trimmer') ? (
                                                <video src={outputUrl} controls className="w-full rounded-xl aspect-video" />
                                            ) : (
                                                <audio src={outputUrl} controls className="w-full h-12" />
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Footer Meta */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
                    <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black uppercase text-purple-400 mb-1">CPU Status</p>
                        <p className="text-xs font-medium">Using User Device CPU (PWA-Engine)</p>
                    </div>
                    <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black uppercase text-blue-400 mb-1">Server Bill</p>
                        <p className="text-xs font-medium">₦0.00 (Zero Marginal Cost)</p>
                    </div>
                    <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black uppercase text-green-400 mb-1">Privacy</p>
                        <p className="text-xs font-medium">Data stays on this device</p>
                    </div>
                </div>
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
            `}</style>
        </div>
    );
}
