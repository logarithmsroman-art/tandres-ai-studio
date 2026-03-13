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
    } catch (e) {
        // Fallback to SnapTik logic later if needed
    }
    return null;
};

const tryCobalt = async (url) => {
    const instances = [
        'https://api.cobalt.tools',
        'https://cobalt.qewertyy.dev',
        'https://cobalt.hypernotion.net',
        'https://api.vxtwitter.com',
        'https://cobalt-api.zeit.top',
        'https://cobalt.instatus.com',
        'https://cobalt.draco.sh',
        'https://cobalt.peroxaan.com',
        'https://cobalt.dev',
        'https://api.cobalt.blackcloud.tk'
    ];
    
    // User Agents to mimic different browsers
    const uas = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    ];

    for (const inst of instances) {
        console.log(`[GCP] Level 2: Trying -> ${inst}`);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); 

            const res = await fetch(inst, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Accept': 'application/json',
                    'User-Agent': uas[Math.floor(Math.random() * uas.length)]
                },
                body: JSON.stringify({ url, videoQuality: '720', filenameStyle: 'basic' }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            const data = await res.json();
            if (data.url || data.stream) {
                console.log(`[GCP] SUCCESS via ${inst}`);
                return { title: 'Extracted Media', url: data.url || data.stream, success: true, duration: 30 };
            }
        } catch (e) { }
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

        // 1. TikTok Logic
        if (finalUrl.includes('tiktok.com')) {
            result = await tryTikWM(finalUrl);
        }

        // 2. Main Engine (yt-dlp) - try EVERY format if primary fails
        if (!result) {
            console.log('[GCP] Level 0: Main Engine (yt-dlp)...');
            try {
                const cookiePath = fs.existsSync('/home/akindunbisulaiman00040/tandres-ai-studio/cookies.txt') 
                    ? '/home/akindunbisulaiman00040/tandres-ai-studio/cookies.txt' 
                    : '/home/akindunbisulaiman00040/tandres-ai-studio/cookie/www.youtube.com_cookies.txt';
                
                const options = {
                    dumpSingleJson: true, noWarnings: true,
                    addHeader: ['User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36']
                };
                if (fs.existsSync(cookiePath)) options.cookies = cookiePath;

                const info = await youtubedl(finalUrl, options);
                
                // Find best playable URL
                let bestUrl = info.url;
                if (!bestUrl && info.formats) {
                    const formats = info.formats.filter(f => f.url && f.vcodec !== 'none').sort((a,b) => (b.height || 0) - (a.height || 0));
                    if (formats.length > 0) bestUrl = formats[0].url;
                }

                if (bestUrl) {
                    result = { title: info.title, thumbnail: info.thumbnail, url: bestUrl, duration: info.duration, success: true };
                }
            } catch (e) { console.log('[GCP] Main Engine Blocked.'); }
        }

        // 3. Fallback Rotation
        if (!result) {
            console.log('[GCP] Main Engine Failed. ACTIVATING BYPASS ARMY...');
            result = await tryCobalt(finalUrl);
        }

        // Final Response
        if (result && result.url) {
            console.log('[GCP] EXTRACTION SUCCESSFUL');
            const host = req.headers.host ? req.headers.host.split(':')[0] : '34.30.156.248';
            res.json({
                ...result,
                streamUrl: `http://${host}:3001/stream?url=${encodeURIComponent(result.url)}`
            });
        } else {
            console.error('[GCP] ALL METHODS FAILED.');
            res.status(500).json({ error: 'Failed to extract video. The platform is currently blocking all access. Please try a different link.' });
        }
    } catch (err) {
        console.error('[GCP] Internal Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});


// Stream Proxy (Full Proxy for bypassing browser blocks)
app.get('/stream', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).send('No URL');

    console.log('[GCP] Proxying Stream for:', videoUrl.substring(0, 50));

    const isTikTok = videoUrl.includes('tiktok') || videoUrl.includes('tikwm');
    const isYouTube = videoUrl.includes('googlevideo') || videoUrl.includes('youtube');

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Referer': isTikTok ? 'https://www.tiktok.com/' : (isYouTube ? 'https://www.youtube.com/' : 'https://www.instagram.com/')
    };

    // Forward the 'Range' header to support video seeking (scrubbing thru the video)
    if (req.headers.range) {
        headers['Range'] = req.headers.range;
    }

    const client = videoUrl.startsWith('https') ? https : http;

    client.get(videoUrl, { headers }, (proxyRes) => {
        // Forward essential headers
        if (proxyRes.statusCode === 206) res.status(206);
        else res.status(proxyRes.statusCode);

        res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'video/mp4');
        if (proxyRes.headers['content-length']) res.setHeader('Content-Length', proxyRes.headers['content-length']);
        if (proxyRes.headers['content-range']) res.setHeader('Content-Range', proxyRes.headers['content-range']);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');

        proxyRes.pipe(res);
    }).on('error', (err) => {
        console.error('[GCP] Proxy Error:', err.message);
        res.status(500).send('Stream error');
    });
});

app.listen(PORT, () => console.log(`🚀 Dedicated Extractor PRO UNLOCKED on port ${PORT}`));





