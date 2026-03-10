import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
        return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    try {
        const response = await fetch(targetUrl);

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
