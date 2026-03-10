'use client';

import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import { motion, AnimatePresence } from 'framer-motion';
import { Beaker, Upload, Play, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LabPage() {
    const [loaded, setLoaded] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
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

    const processFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !loaded) return;

        setProcessing(true);
        setProgress(0);
        setError(null);
        setOutputUrl(null);

        try {
            const ffmpeg = ffmpegRef.current;
            if (!ffmpeg) return;

            const inputName = 'input' + (file.name.substring(file.name.lastIndexOf('.')) || '.mp4');
            const outputName = 'output.mp3';

            // Write the file to memory
            await ffmpeg.writeFile(inputName, await fetchFile(file));

            // Run extraction
            // -i: input
            // -vn: disable video
            // -ab: bitrate
            // -ar: frequency
            await ffmpeg.exec(['-i', inputName, '-vn', '-acodec', 'libmp3lame', outputName]);

            // Read the result
            const data = await ffmpeg.readFile(outputName);
            const blob = new Blob([data as any], { type: 'audio/mp3' });
            const url = URL.createObjectURL(blob);

            setOutputUrl(url);
            setProcessing(false);
        } catch (err: any) {
            console.error('Processing error:', err);
            setError('Processing failed. The file might be too large for the browser memory.');
            setProcessing(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex items-center gap-4">
                    <div className="p-3 bg-purple-600/20 rounded-2xl border border-purple-500/30">
                        <Beaker className="w-8 h-8 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight uppercase">Zero-Cost Lab</h1>
                        <p className="text-zinc-500 font-medium">Testing Browser-Side Media Processing (FFmpeg.wasm)</p>
                    </div>
                </header>

                {/* Status Alert */}
                <AnimatePresence>
                    {!loaded && !error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center gap-3 text-zinc-400"
                        >
                            <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                            Initializing Local Engine... (Downloading WASM core)
                        </motion.div>
                    )}

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400"
                        >
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Lab Bench */}
                <main className={`transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    <div className="bg-[#111] border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[100px] rounded-full" />

                        <div className="relative space-y-8">
                            {/* Upload Area */}
                            <div className="space-y-4">
                                <label className="block">
                                    <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest ml-1">Step 1: Feed the Engine</span>
                                    <div className="mt-2 group relative cursor-pointer outline-none">
                                        <input
                                            type="file"
                                            accept="video/*,audio/*"
                                            onChange={processFile}
                                            disabled={processing}
                                            className="hidden"
                                            id="lab-upload"
                                        />
                                        <label
                                            htmlFor="lab-upload"
                                            className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-800 hover:border-purple-500/50 rounded-2xl bg-zinc-900/30 transition-all group-hover:bg-zinc-900/50"
                                        >
                                            <Upload className={`w-12 h-12 mb-4 transition-transform ${processing ? 'scale-0' : 'group-hover:-translate-y-1'}`} />
                                            <p className="font-bold text-lg">{processing ? 'Engines Running...' : 'Drop a file to extract'}</p>
                                            <p className="text-sm text-zinc-500 mt-1">Video or Audio (Max 50MB recommended)</p>
                                        </label>

                                        {/* Simple Progress Bar */}
                                        {processing && (
                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
                                                <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden mb-4">
                                                    <motion.div
                                                        className="h-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <p className="font-black text-2xl tracking-tighter text-white">{progress}%</p>
                                                <p className="text-xs uppercase tracking-widest text-zinc-400 mt-2 flex items-center gap-2">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    Processing on your device
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </label>
                            </div>

                            {/* Result Area */}
                            <AnimatePresence>
                                {outputUrl && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-4 p-6 bg-green-500/5 border border-green-500/20 rounded-2xl"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-500/20 rounded-lg">
                                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                                </div>
                                                <span className="font-bold">Extraction Successful!</span>
                                            </div>
                                            <a
                                                href={outputUrl}
                                                download="lab-output.mp3"
                                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-xl font-bold transition-all text-sm shadow-lg shadow-green-900/20"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download MP3
                                            </a>
                                        </div>
                                        <audio src={outputUrl} controls className="w-full mt-4 brightness-90 contrast-125" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-zinc-900/30 border border-white/5 rounded-2xl">
                            <h3 className="font-bold text-sm uppercase tracking-widest text-purple-400 mb-2">How it works</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                This page is using your computer's own CPU. We sent you a copy of FFmpeg disguised as a website script.
                                No data moved to Railway or Supabase. It's 100% private and 0% cost to us.
                            </p>
                        </div>
                        <div className="p-6 bg-zinc-900/30 border border-white/5 rounded-2xl">
                            <h3 className="font-bold text-sm uppercase tracking-widest text-blue-400 mb-2">The Catch</h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                This is slower for large files. If the page reloads, the "engine" has to be downloaded again.
                                It works best for small clips and audio trimming.
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
