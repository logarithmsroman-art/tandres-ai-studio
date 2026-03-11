import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

// Set up ffmpeg path from the installer
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

// --- STEALTH MIRROR RESOLVER CONFIG ---
const MIRRORS = [
    'https://api.cobalt.tools/api/json',
    'https://api.v2.cobalt.tools/api/json',
    'https://cobalt-api.l-m.workers.dev/api/json',
    'https://co.wuk.sh/api/json'
];

async function mirroredResolve(url: string, isAudioOnly = false) {
    let lastError = null;

    for (const mirror of MIRRORS) {
        try {
            console.log(`[stealth-mirror] Trying mirror: ${mirror}`);
            const response = await fetch(mirror, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
                },
                body: JSON.stringify({
                    url: url,
                    videoQuality: '1080',
                    audioFormat: isAudioOnly ? 'mp3' : 'best',
                    downloadMode: isAudioOnly ? 'audio' : 'video',
                    filenameStyle: 'nerdy',
                    isAudioOnly: isAudioOnly
                }),
                signal: AbortSignal.timeout(10000) // 10s timeout per mirror
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.text || `Mirror returned ${response.status}`);
            }

            const data = await response.json();

            // Success! Map the mirror response to our studio's internal format
            if (data.status === 'stream' || data.status === 'picker' || data.url) {
                return {
                    success: true,
                    title: data.text || 'Extracted Resource',
                    thumbnail: '', // Optional: some mirrors provide this
                    streamUrl: data.url || (data.picker && data.picker[0]?.url),
                    formats: data.picker?.map((p: any) => ({
                        url: p.url,
                        ext: p.ext || 'mp4',
                        note: p.quality || 'Auto'
                    })) || []
                };
            }

            throw new Error('No stream found in mirror response');
        } catch (err: any) {
            console.warn(`[stealth-mirror] Mirror ${mirror} failed:`, err.message);
            lastError = err;
            continue; // Try next mirror
        }
    }

    throw lastError || new Error('All stealth mirrors are currently saturated. Please try again in 5 minutes.');
}

export async function POST(req: Request) {
    try {
        const contentType = req.headers.get('content-type') || '';
        let startTime = 0;
        let duration = 10;
        let action: string;
        let url: string | null = null;
        let userId: string | null = null;
        let uploadedFile: File | null = null;
        let inputPath: string | null = null;
        let fileUrls: string[] = [];

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            action = formData.get('action') as string;
            url = formData.get('url') as string;
            userId = formData.get('userId') as string;
            uploadedFile = formData.get('file') as File;
            const multiFiles = formData.getAll('files') as File[];
            startTime = Number(formData.get('startTime')) || 0;
            duration = Number(formData.get('duration')) || 10;

            if (multiFiles && multiFiles.length > 0) {
                for (const f of multiFiles) {
                    const buffer = Buffer.from(await f.arrayBuffer());
                    const fId = crypto.randomUUID().slice(0, 4);
                    const ext = path.extname(f.name) || '.mp3';
                    const p = path.join(process.cwd(), 'public', 'downloads', `track-${fId}${ext}`);
                    fs.writeFileSync(p, buffer);
                    fileUrls.push(`/downloads/track-${fId}${ext}`);
                }
            }
        } else {
            const body = await req.json();
            action = body.action;
            url = body.url || body.fileUrl; // Handle old JSON field names
            userId = body.userId;
            fileUrls = body.fileUrls || [];
            startTime = Number(body.startTime) || 0;
            duration = Number(body.duration) || 10;
        }

        // Ensure downloads directory exists
        const downloadsDir = path.join(process.cwd(), 'public', 'downloads');
        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
        }

        const runId = crypto.randomUUID().slice(0, 8);

        // If a file was uploaded, save it to the downloads dir first
        if (uploadedFile) {
            const buffer = Buffer.from(await uploadedFile.arrayBuffer());
            const ext = path.extname(uploadedFile.name) || (uploadedFile.type.includes('video') ? '.mp4' : '.mp3');
            inputPath = path.join(downloadsDir, `upload-${runId}${ext}`);
            fs.writeFileSync(inputPath, buffer);
            console.log('[video-edit] File uploaded and saved to:', inputPath);
        } else if (url && (url.startsWith('http') || url.startsWith('https'))) {
            if (!url.startsWith('http')) {
                inputPath = path.join(process.cwd(), 'public', url);
            } else {
                inputPath = url; // Pass to resolve or processing
            }
        }

        // --- SUBSCRIPTION & TIKTOK VALIDATION ---
        if (url && (action === 'extract-audio' || action === 'resolve-url')) {
            let tier = 'free';
            let userProfile: any = null;
            let isTikTok = url.includes('tiktok.com');

            if (userId) {
                const { createClient } = require('@supabase/supabase-js');
                const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
                const { data } = await sb.from('profiles').select('*').eq('id', userId).single();
                userProfile = data;
                if (userProfile?.subscription_tier) tier = userProfile.subscription_tier;
            }

            // Deduct TikTok count ONLY if this is the actual extraction action, not just a resolve
            if (isTikTok && userProfile && tier !== 'free' && action !== 'resolve-url') {
                const { createClient } = require('@supabase/supabase-js');
                const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
                await sb.from('profiles').update({
                    tiktok_extractions_remaining: Math.max(0, userProfile.tiktok_extractions_remaining - 1)
                }).eq('id', userId);
                console.log(`[video-edit] Deducted TikTok balance for user ${userId}. Remaining: ${userProfile.tiktok_extractions_remaining - 1}`);
            }
        }
        // --- END VALIDATION ---

        if (action === 'extract-audio') {
            if (!inputPath) return NextResponse.json({ error: 'Input file or URL required' }, { status: 400 });

            console.log('[video-edit] Extracting audio from:', inputPath);
            const outFile = path.join(downloadsDir, `audio-${runId}.mp3`);

            await new Promise((resolve, reject) => {
                ffmpeg(inputPath!)
                    .output(outFile)
                    .noVideo()
                    .audioCodec('libmp3lame')
                    .on('end', resolve)
                    .on('error', reject)
                    .run();
            });

            console.log('[video-edit] Extraction finished:', outFile);
            return NextResponse.json({
                success: true,
                url: `/downloads/audio-${runId}.mp3`,
                type: 'audio'
            });

        } else if (action === 'trim-audio') {
            if (!inputPath) return NextResponse.json({ error: 'Input required' }, { status: 400 });

            console.log('[video-edit] Trimming audio:', inputPath, 'start:', startTime, 'duration:', duration);
            const outFile = path.join(downloadsDir, `trimmed-${runId}.mp3`);

            await new Promise((resolve, reject) => {
                ffmpeg(inputPath!)
                    .setStartTime(startTime)
                    .setDuration(duration)
                    .output(outFile)
                    .audioCodec('libmp3lame')
                    .on('end', resolve)
                    .on('error', reject)
                    .run();
            });

            console.log('[video-edit] Trim finished:', outFile);
            return NextResponse.json({
                success: true,
                url: `/downloads/trimmed-${runId}.mp3`,
                type: 'audio'
            });

        } else if (action === 'merge-audio') {
            if (!fileUrls || !Array.isArray(fileUrls) || fileUrls.length === 0) {
                return NextResponse.json({ error: 'fileUrls array is required' }, { status: 400 });
            }

            console.log('[video-edit] Merging audio files:', fileUrls.length);
            const outFile = path.join(downloadsDir, `merged-${runId}.mp3`);

            const command = ffmpeg();
            for (const fileUrl of fileUrls) {
                let p = fileUrl;
                if (fileUrl.startsWith('/downloads')) {
                    p = path.join(process.cwd(), 'public', fileUrl);
                } else if (!fileUrl.startsWith('http')) {
                    p = path.join(process.cwd(), 'public', fileUrl);
                }

                if (fs.existsSync(p)) {
                    command.input(p);
                } else {
                    console.error('[video-edit] File not found for merge:', p);
                }
            }

            await new Promise((resolve, reject) => {
                command
                    .on('end', resolve)
                    .on('error', reject)
                    .mergeToFile(outFile, downloadsDir);
            });

            console.log('[video-edit] Merge finished:', outFile);
            return NextResponse.json({
                success: true,
                url: `/downloads/merged-${runId}.mp3`,
                type: 'audio'
            });

        } else if (action === 'resolve-url') {
            if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

            console.log('[video-edit] Engaging Stealth Mirror for:', url);
            const data = await mirroredResolve(url);
            return NextResponse.json(data);

        } else {
            return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('[video-edit] Error:', error);
        return NextResponse.json({ error: error?.message || 'Failed processing video/audio.' }, { status: 500 });
    }
}
