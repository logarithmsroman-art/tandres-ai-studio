import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import youtubedl from 'youtube-dl-exec';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

// Set up ffmpeg path from the installer
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

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
            // We use the URL later for youtube-dl or assume it's a relative path
            if (!url.startsWith('http')) {
                inputPath = path.join(process.cwd(), 'public', url);
            } else {
                inputPath = url; // Pass to youtube-dl
            }
        }

        if (action === 'download-video') {
            if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

            console.log('[video-edit] Starting download:', url);
            const outFile = path.join(downloadsDir, `video-${runId}.mp4`);

            await youtubedl(url, {
                output: outFile,
                format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                noCheckCertificates: true,
                preferFreeFormats: true,
            });

            console.log('[video-edit] Download finished:', outFile);
            return NextResponse.json({
                success: true,
                url: `/downloads/video-${runId}.mp4`,
                type: 'video'
            });

        } else if (action === 'extract-audio') {
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
            // Handle both URL and File through inputPath
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

        } else if (action === 'magic-extract') {
            if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

            console.log('[video-edit] Starting magic extract for:', url);
            const videoOutFile = path.join(downloadsDir, `video-${runId}.mp4`);
            const audioOutFile = path.join(downloadsDir, `audio-${runId}.mp3`);

            await youtubedl(url, {
                output: videoOutFile,
                format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                noCheckCertificates: true,
                preferFreeFormats: true,
            });

            await new Promise((resolve, reject) => {
                ffmpeg(videoOutFile)
                    .output(audioOutFile)
                    .noVideo()
                    .audioCodec('libmp3lame')
                    .on('end', resolve)
                    .on('error', reject)
                    .run();
            });

            console.log('[video-edit] Magic extract finished');
            return NextResponse.json({
                success: true,
                videoUrl: `/downloads/video-${runId}.mp4`,
                audioUrl: `/downloads/audio-${runId}.mp3`
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
                    // Assume it's a relative path to public
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

            console.log('[video-edit] Resolving stream URL for:', url);
            const info: any = await youtubedl(url, {
                dumpSingleJson: true,
                noCheckCertificates: true,
                noWarnings: true,
                preferFreeFormats: true,
            });

            return NextResponse.json({
                success: true,
                title: info.title,
                thumbnail: info.thumbnail,
                streamUrl: info.url,
                formats: info.formats?.filter((f: any) => f.url).map((f: any) => ({
                    url: f.url,
                    ext: f.ext,
                    note: f.format_note,
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
