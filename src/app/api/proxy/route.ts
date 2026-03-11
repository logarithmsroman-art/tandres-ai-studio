import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    try {
        console.log('[proxy-api] Proxying:', targetUrl);

        // Forward critical headers - Standardized for TikTok 403 Bypass
        const forwardHeaders: any = {
            'User-Agent': req.headers.get('user-agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Referer': 'https://www.tiktok.com/',
            'Origin': 'https://www.tiktok.com',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
        };

        // CRITICAL: TikTok often requires a Range header to initiate a stream
        const range = req.headers.get('range');
        forwardHeaders['Range'] = range || 'bytes=0-';

        const response = await fetch(targetUrl, {
            headers: forwardHeaders,
            cache: 'no-store',
            redirect: 'follow'
        });

        if (!response.ok && response.status !== 206) {
            console.error('[proxy-api] Target error:', response.status, response.statusText);
            throw new Error(`Failed to fetch from target: ${response.status} ${response.statusText}`);
        }

        // Forward the stream with necessary headers
        const headers = new Headers();
        headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');

        const contentLength = response.headers.get('Content-Length');
        if (contentLength) {
            headers.set('Content-Length', contentLength);
        }

        const contentRange = response.headers.get('Content-Range');
        if (contentRange) {
            headers.set('Content-Range', contentRange);
        }

        // CRITICAL FOR FFMPEG.WASM & CORS
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
        headers.set('Accept-Ranges', 'bytes');

        // Return the body stream
        return new Response(response.body, {
            status: response.status,
            headers,
        });
    } catch (error: any) {
        console.error('[proxy-api] Error:', error);
        return NextResponse.json({ error: `Proxy Error: ${error.message}` }, { status: 500 });
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
