const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec').default || require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { mkdtemp, rm } = require('fs/promises');
const https = require('https');
const http = require('http');

// Helper to expand shortlinks (vt.tiktok.com -> tiktok.com/@user/video/123)
const expandUrl = (shortUrl) => {
    return new Promise((resolve) => {
        const client = shortUrl.startsWith('https') ? https : http;
        client.get(shortUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
            }
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                resolve(res.headers.location);
            } else {
                resolve(shortUrl);
            }
        }).on('error', () => resolve(shortUrl));
    });
};

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Public Cobalt API instances as rotated fallbacks
const COBALT_INSTANCES = [
    'https://api.cobalt.tools',
    'https://cobalt.qewertyy.dev',
    'https://api.vxtwitter.com' // Sometimes works as redirector
];

// Helper: Try TikWM API for TikTok
const tryTikWM = async (url) => {
    try {
        const response = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const result = await response.json();
        if (result.code === 0 && result.data) {
            return {
                title: result.data.title || 'TikTok Video',
                thumbnail: result.data.cover,
                url: result.data.play,
                duration: result.data.duration
            };
        }
    } catch (e) { console.error('TikWM Error:', e.message); }
    return null;
};

// Helper: Try Cobalt API for YouTube/Instagram/TikTok
const tryCobalt = async (url) => {
    for (const instance of COBALT_INSTANCES) {
        try {
            const response = await fetch(instance, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ url, videoQuality: '720', filenameStyle: 'basic' })
            });
            const data = await response.json();
            if (data.url || data.stream) {
                return {
                    title: 'Video',
                    url: data.url || data.stream,
                    thumbnail: '',
                    duration: 0
                };
            }
        } catch (e) { console.log(`Cobalt Instance ${instance} failed:`, e.message); }
    }
    return null;
};

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'Tandres Extractor PRO', version: '2.0.0' });
});

// Main extraction/stream endpoint
app.get('/stream', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    let finalUrl = url;
    if (url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com')) {
        finalUrl = await expandUrl(url);
    }

    // Special Case: Direct stream from TikWM or Cobalt results
    if (url.includes('tikwm.com') || url.includes('cobalt')) {
         return res.redirect(url);
    }

    let tmpDir = null;
    try {
        tmpDir = await mkdtemp(path.join(os.tmpdir(), 'tandres-'));
        const outputPath = path.join(tmpDir, 'video.mp4');
        const isTikTok = finalUrl.includes('tiktok.com');

        const ytDlpOptions = {
            noWarnings: true,
            format: 'best[ext=mp4]/best',
            output: outputPath,
            addHeader: [
                'User-Agent:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                `Referer:${isTikTok ? 'https://www.tiktok.com/' : 'https://www.youtube.com/'}`
            ],
        };

        const cookiesPath = path.join(process.cwd(), 'cookies.txt');
        if (fs.existsSync(cookiesPath)) ytDlpOptions.cookies = cookiesPath;

        try {
            await youtubedl(finalUrl, ytDlpOptions);
            const stat = fs.statSync(outputPath);
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Length', stat.size);
            const fileStream = fs.createReadStream(outputPath);
            fileStream.pipe(res);
            fileStream.on('end', () => rm(tmpDir, { recursive: true, force: true }).catch(() => {}));
        } catch (err) {
            // Fallback to proxying the direct URL if yt-dlp fails but we have a raw URL from resolve
            console.error('yt-dlp failed, falling back to direct redirect');
            res.redirect(finalUrl);
        }
    } catch (e) {
        if (tmpDir) await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
        res.status(500).json({ error: e.message });
    }
});

// Resolution Endpoint (Metadata)
app.post('/resolve', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        let finalUrl = await expandUrl(url);
        const isTikTok = finalUrl.includes('tiktok.com');
        const isInstagram = finalUrl.includes('instagram.com');

        let data = null;

        // Level 1: Try TikWM for TikTok
        if (isTikTok) {
            data = await tryTikWM(finalUrl);
        }

        // Level 2: Try yt-dlp
        if (!data) {
            try {
                const ytDlpOptions = {
                    dumpSingleJson: true,
                    noWarnings: true,
                    addHeader: [
                        'User-Agent:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                        `Referer:${finalUrl.includes('youtube') ? 'https://www.youtube.com/' : 'https://www.tiktok.com/'}`
                    ]
                };
                const cookiesPath = path.join(process.cwd(), 'cookies.txt');
                if (fs.existsSync(cookiesPath)) ytDlpOptions.cookies = cookiesPath;

                const info = await youtubedl(finalUrl, ytDlpOptions);
                data = {
                    title: info.title,
                    thumbnail: info.thumbnail,
                    url: info.url,
                    duration: info.duration
                };
            } catch (e) { console.log('yt-dlp resolve failed, trying Level 3 fallback...'); }
        }

        // Level 3: Try Cobalt API (YouTube/Instagram)
        if (!data) {
            data = await tryCobalt(finalUrl);
        }

        if (!data) throw new Error('All extraction methods failed.');

        const externalIp = '34.30.156.248'; // Hardcoded for this specific server context
        const streamUrl = `http://${externalIp}:3001/stream?url=${encodeURIComponent(data.url)}`;

        res.json({
            success: true,
            title: data.title,
            thumbnail: data.thumbnail,
            duration: data.duration || 0,
            streamUrl: streamUrl
        });

    } catch (error) {
        console.error('Full Resolution Failure:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Dedicated Extractor running on port ${PORT}`));

