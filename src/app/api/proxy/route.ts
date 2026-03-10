import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    try {
        console.log('[proxy-api] Proxying:', targetUrl);

        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Referer': 'https://www.tiktok.com/',
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch from target: ${response.statusText}`);
        }

        // Forward the stream with necessary headers
        const headers = new Headers();
        headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
        headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

        // Return the body stream
        return new Response(response.body, {
            status: 200,
            headers,
        });
    } catch (error: any) {
        console.error('[proxy-api] Error:', error);
        return NextResponse.json({ error: 'Failed to proxy media stream' }, { status: 500 });
    }
}
