const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec').default || require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { mkdtemp, rm } = require('fs/promises');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Helper to expand shortlinks (vt.tiktok.com -> tiktok.com/@user/video/123)
const expandUrl = (shortUrl) => {
    return new Promise((resolve) => {
        const client = shortUrl.startsWith('https') ? https : http;
        client.get(shortUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1' }
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                resolve(res.headers.location);
            } else { resolve(shortUrl); }
        }).on('error', () => resolve(shortUrl));
    });
};

// FAST Fallbacks
const tryTikWM = async (url) => {
    try {
        const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        if (json.code === 0 && json.data) {
            return { title: json.data.title, thumbnail: json.data.cover, url: json.data.play, duration: json.data.duration, success: true };
        }
    } catch (e) { console.log('TikWM fail'); }
    return null;
};

const tryCobalt = async (url) => {
    const instances = ['https://api.cobalt.tools', 'https://cobalt.qewertyy.dev'];
    for (const inst of instances) {
        try {
            const res = await fetch(inst, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ url, videoQuality: '720' })
            });
            const data = await res.json();
            if (data.url || data.stream) return { title: 'Video', url: data.url || data.stream, success: true, duration: 30 }; // Default duration if missing
        } catch (e) { }
    }
    return null;
};

// Resolve Endpoint
app.post('/resolve', async (req, res) => {
    const { url } = req.body;
    console.log('[GCP] Resolving:', url);
    try {
        let finalUrl = await expandUrl(url);
        let result = null;

        // Priority 1: TikWM for TikTok (Fastest)
        if (finalUrl.includes('tiktok.com')) {
            result = await tryTikWM(finalUrl);
        }

        // Priority 2: yt-dlp (Most accurate)
        if (!result) {
            try {
                const info = await youtubedl(finalUrl, {
                    dumpSingleJson: true, noWarnings: true,
                    addHeader: ['User-Agent:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'],
                    cookies: path.join(process.cwd(), 'cookies.txt')
                });
                result = { title: info.title, thumbnail: info.thumbnail, url: info.url, duration: info.duration, success: true };
            } catch (e) { console.log('yt-dlp failed'); }
        }

        // Priority 3: Cobalt (Reliable fallback)
        if (!result) {
            result = await tryCobalt(finalUrl);
        }

        if (result) {
            const externalIp = '34.30.156.248';
            res.json({
                ...result,
                streamUrl: `http://${externalIp}:3001/stream?url=${encodeURIComponent(result.url)}`
            });
        } else {
            res.status(500).json({ error: 'All extraction methods failed' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Stream Proxy
app.get('/stream', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send('No URL');
    // If it's already a direct link we found, just redirect
    if (url.includes('tikwm.com') || url.includes('cobalt') || url.includes('googlevideo') || url.includes('tiktokv.com')) {
        return res.redirect(url);
    }
    res.redirect(url); // Default to redirect for speed
});

app.listen(PORT, () => console.log(`🚀 Dedicated Extractor running on port ${PORT}`));


