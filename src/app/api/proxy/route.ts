import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    // 1. Verify Authentication via Authorization Header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return NextResponse.json({ error: 'Auth header missing.' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { createClient } = require('@supabase/supabase-js');
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: { user }, error: authError } = await sb.auth.getUser(token);

    if (authError || !user) {
        return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 });
    }

    try {
        console.log('[proxy] Tunneling Media:', targetUrl);

        // Map external public IP calls to internal localhost to bypass GCP Firewalls
        let finalTarget = targetUrl;
        if (targetUrl.includes('34.30.156.248:3001')) {
            finalTarget = targetUrl.replace('34.30.156.248:3001', 'localhost:3001');
        }

        const forwardHeaders: any = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Referer': 'https://www.instagram.com/',
        };

        const range = req.headers.get('range');
        if (range) forwardHeaders['Range'] = range;

        const response = await fetch(finalTarget, {
            headers: forwardHeaders,
            redirect: 'follow'
        });

        if (!response.ok && response.status !== 206) {
            console.error('[proxy] Target fail:', response.status);
            throw new Error(`Target returned ${response.status}`);
        }

        const headers = new Headers();
        headers.set('Content-Type', response.headers.get('Content-Type') || 'video/mp4');
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Accept-Ranges', 'bytes');
        
        const contentLen = response.headers.get('Content-Length');
        if (contentLen) headers.set('Content-Length', contentLen);
        
        const contentRange = response.headers.get('Content-Range');
        if (contentRange) headers.set('Content-Range', contentRange);

        return new Response(response.body, {
            status: response.status,
            headers,
        });
    } catch (error: any) {
        console.error('[proxy] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
