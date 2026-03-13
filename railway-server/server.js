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

// Helper to expand shortlinks
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

// BYPASS LAYER 1: TikWM (TikTok Only)
const tryTikWM = async (url) => {
    console.log('[GCP] Level 1: Trying TikWM...');
    try {
        const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        if (json.code === 0 && json.data) {
            return { title: json.data.title, thumbnail: json.data.cover, url: json.data.play, duration: json.data.duration, success: true };
        }
    } catch (e) { console.log('[GCP] TikWM fail'); }
    return null;
};

// BYPASS LAYER 2: Cobalt Rotation (YouTube / Instagram / TikTok)
const tryCobalt = async (url) => {
    const instances = [
        'https://api.cobalt.tools',
        'https://cobalt.qewertyy.dev',
        'https://api.vxtwitter.com',
        'https://cobalt-api.zeit.top',
        'https://cobalt.hypernotion.net',
        'https://cobalt.instatus.com'
    ];
    for (const inst of instances) {
        console.log(`[GCP] Level 2: Trying Instance -> ${inst}`);
        try {
            const res = await fetch(inst, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ url, videoQuality: '720', filenameStyle: 'basic' })
            });
            const data = await res.json();
            if (data.url || data.stream) {
                console.log(`[GCP] SUCCESS via ${inst}`);
                return { title: 'Tandres Extracted Video', url: data.url || data.stream, success: true, duration: 30 };
            }
        } catch (e) { console.log(`[GCP] Instance ${inst} skipped`); }
    }
    return null;
};

// Resolve Endpoint
app.post('/resolve', async (req, res) => {
    const { url } = req.body;
    console.log('\n-----------------------------');
    console.log('[GCP] INCOMING:', url);
    try {
        let finalUrl = await expandUrl(url);
        let result = null;

        // 1. TikTok Priority
        if (finalUrl.includes('tiktok.com')) {
            result = await tryTikWM(finalUrl);
        }

        // 2. Main Extraction Engine (yt-dlp)
        if (!result) {
            console.log('[GCP] Running Main Engine (yt-dlp)...');
            try {
                // Find cookies in GCP folder structure
                const cookiePath = '/home/akindunbisulaiman00040/tandres-ai-studio/cookie/www.youtube.com_cookies.txt';
                const options = {
                    dumpSingleJson: true, noWarnings: true,
                    addHeader: ['User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36']
                };
                if (fs.existsSync(cookiePath)) {
                    console.log('[GCP] Found Cookies File!');
                    options.cookies = cookiePath;
                }

                const info = await youtubedl(finalUrl, options);
                result = { title: info.title, thumbnail: info.thumbnail, url: info.url, duration: info.duration, success: true };
            } catch (e) { 
                console.log('[GCP] Main Engine Blocked (Rate Limited)');
            }
        }

        // 3. Fallback Rotation (The Tank)
        if (!result) {
            console.log('[GCP] Main Engine Failed. ACTIVATING BYPASS ROTATION...');
            result = await tryCobalt(finalUrl);
        }

        if (result) {
            console.log('[GCP] EXTRACTION SUCCESSFUL');
            const externalIp = '34.30.156.248';
            res.json({
                ...result,
                streamUrl: `http://${externalIp}:3001/stream?url=${encodeURIComponent(result.url)}`
            });
        } else {
            console.error('[GCP] ALL METHODS FAILED - Platform is likely under heavy protection.');
            res.status(500).json({ error: 'All extraction methods failed' });
        }
    } catch (err) {
        console.error('[GCP] System Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Stream Proxy (Redirect only for speed)
app.get('/stream', async (req, res) => {
    if (!req.query.url) return res.status(400).send('No URL');
    res.redirect(req.query.url); 
});

app.listen(PORT, () => console.log(`🚀 Dedicated Extractor PRO UNLOCKED on port ${PORT}`));




