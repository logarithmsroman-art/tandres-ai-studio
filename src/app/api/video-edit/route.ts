import { NextRequest, NextResponse } from 'next/server';
import youtubedl from 'youtube-dl-exec';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
// Removed unused mirrors import

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
            // Log access or handle metadata if needed
        }

        if (action === 'resolve-url') {
            if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

            const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
            const isTikTok = url.includes('tiktok.com') || url.includes('vt.tiktok.com');
            const isLocal = process.env.NODE_ENV === 'development';
            let railwayUrl = process.env.RAILWAY_URL || '';

            if (railwayUrl && !railwayUrl.startsWith('http')) {
                railwayUrl = `https://${railwayUrl}`;
            }

            // 1. Get User Profile and Tier
            let tier = 'free';
            let tiktokUnits = 0;
            if (userId) {
                const { createClient } = require('@supabase/supabase-js');
                const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
                const { data: profile } = await sb.from('profiles').select('*').eq('id', userId).single();
                if (profile) {
                    const now = new Date();
                    const expiry = profile.plan_expires_at ? new Date(profile.plan_expires_at) : null;
                    if (expiry && expiry > now) {
                        tier = profile.subscription_tier || 'free';
                    } else {
                        tier = 'free'; // Explicitly set when plan is null or expired
                    }
                    tiktokUnits = profile.tiktok_extractions_remaining || 0;
                }
            }

            // 2. Define Limits
            const limits = {
                free: { yt_ig: 1800, tiktok: 90 },
                starter: { yt_ig: 3600, tiktok: 300 },
                pro: { yt_ig: 7200, tiktok: 600 }
            };
            const userLimits = limits[tier as keyof typeof limits] || limits.free;

            try {
                let mediaInfo: any = null;
                const isTikTok = url.includes('tiktok.com') || url.includes('vt.tiktok.com');
                let ytDlpError = '';
                try {
                    if (railwayUrl) {
                        const res = await fetch(`${railwayUrl}/resolve`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url }),
                            signal: AbortSignal.timeout(25000)
                        });
                        const data = await res.json();
                        if (data.success) {
                            mediaInfo = data;
                        } else {
                            throw new Error(data.error || 'Server error');
                        }
                    } else {
                        const youtubedl = require('youtube-dl-exec').default || require('youtube-dl-exec');
                        const info = await youtubedl(url, { dumpSingleJson: true, noWarnings: true });
                        mediaInfo = { success: true, title: info.title, duration: info.duration, thumbnail: info.thumbnail, formats: info.formats };
                    }
                } catch (err: any) {
                    console.error('Final Extraction Failure:', err.message);
                    throw new Error(`COULD NOT RESOLVE VIDEO: ${err.message}`);
                }

                const duration = Number(mediaInfo.duration) || 0;
                if (duration <= 0) {
                    return NextResponse.json({ error: "Could not determine video length. For security, extraction is restricted." }, { status: 400 });
                }

                let maxDuration = isTikTok ? userLimits.tiktok : userLimits.yt_ig;
                const isPaid = tier !== 'free';
                const isTikTokFallback = isTikTok && isPaid && tiktokUnits <= 0;

                if (isTikTokFallback) maxDuration = 90;

                if (duration > maxDuration) {
                    const limitText = maxDuration >= 3600 
                        ? `${maxDuration / 3600} ${maxDuration / 3600 === 1 ? 'hour' : 'hours'}` 
                        : (maxDuration >= 60 ? `${maxDuration / 60} minutes` : `${maxDuration} seconds`);
                    
                    return NextResponse.json({
                        error: `Video is too long (${Math.round(duration / 60)} minutes). Your current plan limit is ${limitText}.`,
                        isDurationError: true,
                        tier
                    }, { status: 403 });
                }

                if (isTikTok && isPaid && tiktokUnits > 0 && !isTikTokFallback) {
                    const { createClient } = require('@supabase/supabase-js');
                    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
                    await sb.from('profiles').update({ tiktok_extractions_remaining: Math.max(0, tiktokUnits - 1) }).eq('id', userId);
                }

                const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || '';
                const makeProxyUrl = (targetUrl: string) => {
                    if (!targetUrl) return '';
                    // Use GCP stream proxy for TikTok page URLs, but wrapped in HTTPS via our own proxy
                    if (isTikTok && (targetUrl.includes('tiktok.com/@') || targetUrl.includes('vt.tiktok.com'))) {
                        const directStream = `${railwayUrl}/api/stream?url=${encodeURIComponent(targetUrl)}`;
                        return workerUrl ? `${workerUrl}?url=${encodeURIComponent(directStream)}` : `/api/proxy?url=${encodeURIComponent(directStream)}`;
                    }
                    return workerUrl ? `${workerUrl}?url=${encodeURIComponent(targetUrl)}` : `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
                };

                return NextResponse.json({
                    success: true,
                    title: mediaInfo.title,
                    thumbnail: mediaInfo.thumbnail,
                    streamUrl: mediaInfo.streamUrl || mediaInfo.url, // Trust the server's calculated streamUrl
                    duration: mediaInfo.duration || duration,
                    isTikTokFallback,
                    formats: mediaInfo.formats?.filter((f: any) => f.url).map((f: any) => ({
                        url: f.url,
                        ext: f.ext,
                        note: f.format_note || f.quality || 'Auto',
                    }))
                });
            } catch (e: any) {
                return NextResponse.json({ error: `Resolution failed: ${e.message}` }, { status: 502 });
            }

        } else if (action === 'extract-audio') {
            if (!inputPath) return NextResponse.json({ error: 'Input required' }, { status: 400 });
            const outFile = path.join(downloadsDir, `audio-${runId}.mp3`);
            await new Promise((resolve, reject) => {
                ffmpeg(inputPath!).output(outFile).noVideo().audioCodec('libmp3lame').on('end', resolve).on('error', reject).run();
            });
            return NextResponse.json({ success: true, url: `/downloads/audio-${runId}.mp3`, type: 'audio' });

        } else if (action === 'trim-audio') {
            if (!inputPath) return NextResponse.json({ error: 'Input required' }, { status: 400 });
            const outFile = path.join(downloadsDir, `trimmed-${runId}.mp3`);
            await new Promise((resolve, reject) => {
                ffmpeg(inputPath!).setStartTime(startTime).setDuration(duration).output(outFile).audioCodec('libmp3lame').on('end', resolve).on('error', reject).run();
            });
            return NextResponse.json({ success: true, url: `/downloads/trimmed-${runId}.mp3`, type: 'audio' });

        } else if (action === 'merge-audio') {
            if (!fileUrls || fileUrls.length === 0) return NextResponse.json({ error: 'fileUrls required' }, { status: 400 });
            const outFile = path.join(downloadsDir, `merged-${runId}.mp3`);
            const command = ffmpeg();
            for (const fUrl of fileUrls) {
                const p = fUrl.startsWith('/downloads') ? path.join(process.cwd(), 'public', fUrl) : (fUrl.startsWith('http') ? fUrl : path.join(process.cwd(), 'public', fUrl));
                if (fs.existsSync(p as string) || (p as string).startsWith('http')) command.input(p as string);
            }
            await new Promise((resolve, reject) => { command.on('end', resolve).on('error', reject).mergeToFile(outFile, downloadsDir); });
            return NextResponse.json({ success: true, url: `/downloads/merged-${runId}.mp3`, type: 'audio' });

        } else {
            return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('[video-edit] Error:', error);
        return NextResponse.json({ error: error?.message || 'Failed processing video/audio.' }, { status: 500 });
    }
}
