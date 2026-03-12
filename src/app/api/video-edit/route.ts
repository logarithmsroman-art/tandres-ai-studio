import { NextRequest, NextResponse } from 'next/server';
import youtubedl from 'youtube-dl-exec';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { mirroredResolve } from '@/lib/mirrors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
    try {
        let action: string = '';
        let url: string = '';
        let userId: string = '';
        let fileUrls: string[] = [];
        let startTime: number = 0;
        let duration: number = 10;
        let inputPath: string | null = null;
        let uploadedFile: File | null = null;

        const contentType = req.headers.get('content-type') || '';
        
        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            action = formData.get('action') as string;
            url = (formData.get('url') || formData.get('fileUrl')) as string;
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
            url = body.url || body.fileUrl;
            userId = body.userId;
            fileUrls = body.fileUrls || [];
            startTime = Number(body.startTime) || 0;
            duration = Number(body.duration) || 10;
        }

        const downloadsDir = path.join(process.cwd(), 'public', 'downloads');
        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
        }

        const runId = crypto.randomUUID().slice(0, 8);

        if (uploadedFile) {
            const buffer = Buffer.from(await uploadedFile.arrayBuffer());
            const ext = path.extname(uploadedFile.name) || (uploadedFile.type.includes('video') ? '.mp4' : '.mp3');
            inputPath = path.join(downloadsDir, `upload-${runId}${ext}`);
            fs.writeFileSync(inputPath, buffer);
        } else if (url && (url.startsWith('http') || url.startsWith('https'))) {
            inputPath = url;
        }

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

            if (isTikTok && userProfile && tier !== 'free' && action !== 'resolve-url') {
                const { createClient } = require('@supabase/supabase-js');
                const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
                await sb.from('profiles').update({
                    tiktok_extractions_remaining: Math.max(0, userProfile.tiktok_extractions_remaining - 1)
                }).eq('id', userId);
            }
        }

        if (action === 'extract-audio') {
            if (!inputPath) return NextResponse.json({ error: 'Input file or URL required' }, { status: 400 });
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
            return NextResponse.json({
                success: true,
                url: `/downloads/audio-${runId}.mp3`,
                type: 'audio'
            });

        } else if (action === 'trim-audio') {
            if (!inputPath) return NextResponse.json({ error: 'Input required' }, { status: 400 });
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
            return NextResponse.json({
                success: true,
                url: `/downloads/trimmed-${runId}.mp3`,
                type: 'audio'
            });

        } else if (action === 'merge-audio') {
            if (!fileUrls || fileUrls.length === 0) return NextResponse.json({ error: 'fileUrls array is required' }, { status: 400 });
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
                }
            }
            await new Promise((resolve, reject) => {
                command.on('end', resolve).on('error', reject).mergeToFile(outFile, downloadsDir);
            });
            return NextResponse.json({
                success: true,
                url: `/downloads/merged-${runId}.mp3`,
                type: 'audio'
            });

        } else if (action === 'resolve-url') {
            if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

            const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
            const isTikTok = url.includes('tiktok.com') || url.includes('vt.tiktok.com');
            const isLocal = process.env.NODE_ENV === 'development';
            const railwayUrl = process.env.RAILWAY_URL || '';

            if (isTikTok) {
                if (railwayUrl && !isLocal) {
                    return NextResponse.json({
                        success: true,
                        title: 'TikTok Video',
                        thumbnail: '',
                        streamUrl: `${railwayUrl}/api/stream?url=${encodeURIComponent(url)}`,
                    });
                }
                const { mkdtemp } = await import('fs/promises');
                const os = await import('os');
                const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'tiktok-'));
                const outputPath = path.join(tmpDir, 'video.mp4');
                await youtubedl(url, {
                    noWarnings: true,
                    format: 'best[ext=mp4]/best',
                    output: outputPath,
                    addHeader: [
                        'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                        'Referer:https://www.tiktok.com/',
                    ],
                });
                return NextResponse.json({
                    success: true,
                    title: 'TikTok Video',
                    thumbnail: '',
                    streamUrl: `/api/serve-media?file=${encodeURIComponent(outputPath)}`,
                    isDownloaded: true,
                });
            }

            if (isYouTube && !isLocal && railwayUrl) {
                return NextResponse.json({
                    success: true,
                    title: 'YouTube Video',
                    thumbnail: '',
                    streamUrl: `${railwayUrl}/api/stream?url=${encodeURIComponent(url)}`,
                });
            }

            if (isYouTube && !isLocal) {
                try {
                    const data = await mirroredResolve(url);
                    return NextResponse.json(data);
                } catch (e: any) {
                    return NextResponse.json({ error: 'YouTube extraction is temporarily unavailable.' }, { status: 503 });
                }
            }

            // Default handler for Instagram and others (Instagram, Facebook, etc.)
            let info: any = null;
            
            // PRODUCTION: Use Railway as detective (Fixes python3 error)
            if (!isLocal && railwayUrl) {
                try {
                    const res = await fetch(`${railwayUrl}/resolve`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url }),
                        signal: AbortSignal.timeout(12000) // 12-second timeout
                    });
                    const data = await res.json();
                    if (data.success) {
                        info = {
                            title: data.title,
                            thumbnail: data.thumbnail,
                            url: data.rawUrl,
                            formats: data.formats
                        };
                    } else if (data.error) {
                        throw new Error(`Railway Detective Error: ${data.error}`);
                    }
                } catch (e: any) {
                    console.error('[video-edit] Railway detective failed for Instagram:', e);
                    return NextResponse.json({ error: `Failed to find video link. (${e.message})` }, { status: 502 });
                }
            }

            // LOCAL/FALLBACK: Only runs on your computer (where you have python3)
            if (!info && isLocal) {
                info = await youtubedl(url, {
                    dumpSingleJson: true,
                    noWarnings: true,
                    preferFreeFormats: true,
                    addHeader: [
                        'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                        'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                        'Accept-Language:en-US,en;q=0.9',
                        'Referer:https://www.instagram.com/'
                    ]
                });
            } else if (!info) {
                 return NextResponse.json({ error: 'Instagram resolution is only available via Railway in production.' }, { status: 500 });
            }

            const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || '';
            const makeProxyUrl = (targetUrl: string) => {
                if (!targetUrl) return '';
                return workerUrl ? `${workerUrl}?url=${encodeURIComponent(targetUrl)}` : `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
            };

            return NextResponse.json({
                success: true,
                title: info.title,
                thumbnail: info.thumbnail,
                streamUrl: makeProxyUrl(info.url),
                formats: info.formats?.filter((f: any) => f.url).map((f: any) => ({
                    url: makeProxyUrl(f.url),
                    ext: f.ext,
                    note: f.format_note || f.quality || 'Auto',
                    acodec: f.acodec,
                    vcodec: f.vcodec
                }))
            });

        } else {
            return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('[video-edit] Error:', error);
        return NextResponse.json({ error: error?.message || 'Failed processing video/audio.' }, { status: 500 });
    }
}
