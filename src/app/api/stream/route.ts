import { NextRequest, NextResponse } from 'next/server';
import youtubedl from 'youtube-dl-exec';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { mkdtemp, rm } from 'fs/promises';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min max for Railway

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const isTikTok = url.includes('tiktok.com');
    const referer = isTikTok ? 'https://www.tiktok.com/' : 'https://www.instagram.com/';

    console.log('[stream] Downloading via yt-dlp:', url.substring(0, 80));

    let tmpDir: string | null = null;
    let outputPath: string | null = null;

    try {
        tmpDir = await mkdtemp(path.join(os.tmpdir(), 'tandres-'));
        outputPath = path.join(tmpDir, 'video.mp4');

        await youtubedl(url as string, {
            noWarnings: true,
            format: 'best[ext=mp4]/best',
            output: outputPath,
            addHeader: [
                'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                `Referer:${referer}`,
            ],
        });

        if (!fs.existsSync(outputPath)) {
            throw new Error('Download failed — yt-dlp produced no output');
        }

        const stat = fs.statSync(outputPath);
        console.log(`[stream] Download complete: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);

        // Read the file and stream it
        const fileBuffer = fs.readFileSync(outputPath);

        // Cleanup temp directory
        rm(tmpDir, { recursive: true, force: true }).catch(console.error);
        tmpDir = null;

        return new Response(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'video/mp4',
                'Content-Length': stat.size.toString(),
                'Content-Disposition': 'inline; filename="video.mp4"',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Cross-Origin-Resource-Policy': 'cross-origin',
                'Cache-Control': 'no-cache',
            },
        });
    } catch (error: any) {
        console.error('[stream] Error:', error.message);
        if (tmpDir) {
            rm(tmpDir, { recursive: true, force: true }).catch(console.error);
        }
        return NextResponse.json({ error: error.message || 'Download failed' }, {
            status: 500,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    }
}

export async function OPTIONS() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Range',
        }
    });
}
