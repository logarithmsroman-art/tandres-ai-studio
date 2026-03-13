const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec').default || require('youtube-dl-exec');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { chromium } = require('playwright');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Helper to expand shortlinks
const expandUrl = (shortUrl) => {
    if (!shortUrl || typeof shortUrl !== 'string' || !shortUrl.startsWith('http')) return Promise.resolve(shortUrl);
    return new Promise((resolve) => {
        const client = shortUrl.startsWith('https') ? https : http;
        try {
            client.get(shortUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1' }
            }, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    resolve(res.headers.location);
                } else { resolve(shortUrl); }
            }).on('error', () => resolve(shortUrl));
        } catch (e) { resolve(shortUrl); }
    });
};

const tryTikWM = async (url) => {
    console.log('[GCP] Level 1: (TikWM)');
    try {
        const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        if (json.code === 0 && json.data) {
            return { title: json.data.title, thumbnail: json.data.cover, url: json.data.play, duration: json.data.duration, success: true };
        }
    } catch (e) { }
    return null;
};

const tryCobalt = async (url) => {
    const instances = [
        'https://api.cobalt.tools',
        'https://cobalt.hypernotion.net',
        'https://api.cobalt.cool'
    ];
    for (const inst of instances) {
        console.log(`[GCP] Level 2: (Cobalt) -> ${inst}`);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000); // Fast 4s timeout
            const res = await fetch(inst, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ url, videoQuality: '720' }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            const data = await res.json();
            if (data.url || data.stream) return { title: 'Cobalt Media', url: data.url || data.stream, success: true, duration: 30 };
        } catch (e) { }
    }
    return null;
};

const tryPlaywright = async (url) => {
    console.log('[GCP] Level 3: (AI Master Fallback) Activating Browser...');
    let browser;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 720 }
        });
        const page = await context.newPage();
        
        let videoUrl = null;
        page.on('request', request => {
            const reqUrl = request.url();
            if (reqUrl.includes('.mp4') || reqUrl.includes('googlevideo.com/videoplayback')) videoUrl = reqUrl;
        });

        await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
        if (!videoUrl) {
            videoUrl = await page.evaluate(() => {
                const video = document.querySelector('video');
                return video ? video.src : null;
            });
        }

        if (videoUrl) {
            console.log('[GCP] Level 3: AI BROWSER SUCCESS!');
            return { title: 'AI Extracted Media', url: videoUrl, success: true, duration: 30 };
        }
    } catch (e) { console.log('[GCP] Level 3: Failed:', e.message); }
    finally { if (browser) await browser.close(); }
    return null;
};

app.post('/resolve', async (req, res) => {
    const { url } = req.body;
    console.log('\n-----------------------------');
    console.log('[GCP] REQUEST:', url);
    try {
        let finalUrl = await expandUrl(url);
        let result = null;

        if (finalUrl.includes('tiktok.com')) result = await tryTikWM(finalUrl);

        // Level 0: yt-dlp
        if (!result) {
            console.log('[GCP] Level 0: (yt-dlp)');
            try {
                const info = await youtubedl(finalUrl, { dumpSingleJson: true, noWarnings: true });
                let bestUrl = info.url;
                if (!bestUrl && info.formats) {
                    const formats = info.formats.filter(f => f.url && f.vcodec !== 'none');
                    if (formats.length > 0) bestUrl = formats[0].url;
                }
                if (bestUrl) result = { title: info.title, url: bestUrl, duration: info.duration, success: true };
            } catch (e) { console.log('[GCP] Level 0: Blocked.'); }
        }

        // Level 2: Cobalt
        if (!result) result = await tryCobalt(finalUrl);

        // Level 3: Playwright AI
        if (!result) result = await tryPlaywright(finalUrl);

        if (result && result.url) {
            console.log('[GCP] STATUS: SUCCESS');
            const host = req.headers.host ? req.headers.host.split(':')[0] : '34.30.156.248';
            res.json({ ...result, streamUrl: `http://${host}:3001/stream?url=${encodeURIComponent(result.url)}` });
        } else {
            console.error('[GCP] STATUS: TOTAL FAILURE');
            res.status(500).json({ error: 'All extraction methods failed.' });
        }
    } catch (err) {
        console.error('[GCP] Crash:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.get('/stream', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).send('No URL provided');
    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' };
    if (req.headers.range) headers['Range'] = req.headers.range;
    const client = videoUrl.startsWith('https') ? https : http;
    client.get(videoUrl, { headers }, (proxyRes) => {
        if (proxyRes.statusCode === 206) res.status(206); else res.status(proxyRes.statusCode || 200);
        res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'video/mp4');
        if (proxyRes.headers['content-length']) res.setHeader('Content-Length', proxyRes.headers['content-length']);
        if (proxyRes.headers['content-range']) res.setHeader('Content-Range', proxyRes.headers['content-range']);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');
        proxyRes.pipe(res);
    }).on('error', (err) => {
        console.error('[GCP] Stream Error:', err.message);
        res.status(500).send('Stream error');
    });
});

app.listen(PORT, () => console.log(`🚀 Dedicated Extractor PRO UNLOCKED on port ${PORT}`));
