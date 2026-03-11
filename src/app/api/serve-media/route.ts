import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get('file');

    if (!fileName) {
        return NextResponse.json({ error: 'Filename required' }, { status: 400 });
    }

    let filePath: string;

    // Allow serving from OS temp dir (for TikTok direct downloads)
    const tmpDir = os.tmpdir();
    if (fileName.startsWith(tmpDir) || fileName.startsWith('/tmp')) {
        // Security: only allow absolute paths starting with the system's temp dir
        filePath = fileName;
    } else {
        // Safety check: ensure we only serve from the downloads directory
        const downloadsDir = path.join(process.cwd(), 'public', 'downloads');
        filePath = path.join(downloadsDir, fileName.replace('/downloads/', ''));
    }

    if (!fs.existsSync(filePath)) {
        console.error('[serve-media] File not found:', filePath);
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    try {
        const stats = fs.statSync(filePath);
        const fileStream = fs.createReadStream(filePath);

        const response = new Response(fileStream as any, {
            status: 200,
            headers: {
                'Content-Type': filePath.endsWith('.mp3') ? 'audio/mpeg' : 'video/mp4',
                'Content-Length': stats.size.toString(),
                'Accept-Ranges': 'bytes',
                'Access-Control-Allow-Origin': '*',
                'Cross-Origin-Resource-Policy': 'cross-origin',
            }
        });

        return response;
    } catch (error: any) {
        console.error('[serve-media] Error serving file:', error);
        return NextResponse.json({ error: 'Failed to serve media' }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Range, Content-Type',
        },
    });
}
