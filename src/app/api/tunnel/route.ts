import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Use Node.js for streaming large files
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get('url');
    const headerParam = req.nextUrl.searchParams.get('h');

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let customHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': 'https://www.tiktok.com/',
        'Range': req.headers.get('Range') || 'bytes=0-',
    };

    if (headerParam) {
        try {
            const decoded = JSON.parse(Buffer.from(headerParam, 'base64').toString());
            customHeaders = { ...customHeaders, ...decoded };
            // Ensure Range is still set from incoming request if not in decoded
            if (req.headers.get('Range')) {
                customHeaders['Range'] = req.headers.get('Range')!;
            }
        } catch (e) {
            console.error('[tunnel] Header decode failed:', e);
        }
    }

    console.log('[tunnel] Streaming video from:', url.substring(0, 80) + '...');

    try {
        const response = await fetch(url, {
            headers: customHeaders
        });

        if (!response.ok && response.status !== 206) {
            console.error('[tunnel] TikTok rejected stream:', response.status);
            return NextResponse.json({ error: `TikTok rejected stream: ${response.status}` }, { status: response.status });
        }

        // Create a streaming response
        const stream = response.body;
        const headers = new Headers(response.headers);

        // Ensure CORS and necessary headers for FFmpeg.wasm
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
        headers.set('Cache-Control', 'no-cache');

        return new Response(stream, {
            status: response.status,
            statusText: response.statusText,
            headers: headers
        });
    } catch (error: any) {
        console.error('[tunnel] Critical Stream Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function OPTIONS() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Range',
            'Access-Control-Max-Age': '86400',
        }
    });
}
