import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function parseUserAgent(ua: string) {
    // Browser — check in order to avoid misidentification (Edge contains "Chrome", etc.)
    let browser = 'Other';
    if (/Edg\//i.test(ua)) browser = 'Edge';
    else if (/OPR\//i.test(ua)) browser = 'Opera';
    else if (/Chrome\//i.test(ua)) browser = 'Chrome';
    else if (/Firefox\//i.test(ua)) browser = 'Firefox';
    else if (/Safari\//i.test(ua)) browser = 'Safari';

    // OS
    let os = 'Other';
    if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
    else if (/Mac OS X/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua)) os = 'Linux';

    // Device type
    let deviceType = 'desktop';
    if (/Mobi|Android.*Mobile/i.test(ua)) deviceType = 'mobile';
    else if (/iPad|Tablet/i.test(ua)) deviceType = 'tablet';

    return { browser, os, deviceType };
}

export async function POST(req: Request) {
    try {
        // Extract IP address
        const forwarded = req.headers.get('x-forwarded-for');
        const realIp = req.headers.get('x-real-ip');
        const cfIp = req.headers.get('cf-connecting-ip');
        const ip = (forwarded ? forwarded.split(',')[0].trim() : null) ?? realIp ?? cfIp ?? null;

        // Parse User-Agent
        const ua = req.headers.get('user-agent') ?? '';
        const { browser, os, deviceType } = parseUserAgent(ua);

        // Optional auth — check if visitor is logged in
        let isAuthenticated = false;
        let userId: string | null = null;
        const authHeader = req.headers.get('Authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabase.auth.getUser(token);
            if (user) {
                isAuthenticated = true;
                userId = user.id;
            }
        }

        // IP Geolocation — ip-api.com (free, no API key)
        let country: string | null = null;
        let region: string | null = null;
        let city: string | null = null;
        if (ip && ip !== '127.0.0.1' && ip !== '::1') {
            try {
                const geoRes = await fetch(
                    `http://ip-api.com/json/${ip}?fields=status,country,regionName,city`,
                    { signal: AbortSignal.timeout(3000) }
                );
                if (geoRes.ok) {
                    const geo = await geoRes.json();
                    if (geo.status === 'success') {
                        country = geo.country ?? null;
                        region = geo.regionName ?? null;
                        city = geo.city ?? null;
                    }
                }
            } catch {
                // Geolocation failed — continue without location data
            }
        }

        // Insert visitor log
        await supabase.from('visitor_logs').insert({
            ip_address: ip,
            country,
            region,
            city,
            browser,
            os,
            device_type: deviceType,
            is_authenticated: isAuthenticated,
            user_id: userId,
        });

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('[track-visit] Error:', error);
        return NextResponse.json({ ok: true }); // Never surface errors to caller
    }
}
