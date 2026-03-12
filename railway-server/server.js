const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec').default || require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { mkdtemp, unlink, rm } = require('fs/promises');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'Tandres Railway Extractor', version: '1.0.0' });
});

// Main TikTok/Instagram video download endpoint
// Usage: GET /stream?url=https://www.tiktok.com/...
app.get('/stream', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    console.log('[railway] New extraction request:', url.substring(0, 80));

    let tmpDir = null;
    let outputPath = null;

    try {
        tmpDir = await mkdtemp(path.join(os.tmpdir(), 'tandres-'));
        outputPath = path.join(tmpDir, 'video.mp4');

        const isTikTok = url.includes('tiktok.com');
        const referer = isTikTok ? 'https://www.tiktok.com/' : 'https://www.instagram.com/';

        console.log('[railway] Downloading via yt-dlp...');
        const ytDlpOptions = {
            noWarnings: true,
            format: 'best[ext=mp4]/best',
            output: outputPath,
            addHeader: [
                'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                `Referer:${referer}`,
            ],
        };
        
        const cookiesPath = path.join(process.cwd(), 'cookies.txt');
        if (fs.existsSync(cookiesPath)) {
            ytDlpOptions.cookies = cookiesPath;
        }

        await youtubedl(url, ytDlpOptions);

        if (!fs.existsSync(outputPath)) {
            throw new Error('Download failed — file not found after yt-dlp');
        }

        const stat = fs.statSync(outputPath);
        console.log(`[railway] Download complete. Size: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);

        // Stream the video back to the browser
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Content-Disposition', 'inline; filename="video.mp4"');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Accept-Ranges', 'bytes');

        const fileStream = fs.createReadStream(outputPath);
        fileStream.pipe(res);

        // Cleanup after stream ends
        fileStream.on('end', async () => {
            try {
                await rm(tmpDir, { recursive: true, force: true });
                console.log('[railway] Temp files cleaned up');
            } catch (e) {
                console.error('[railway] Cleanup error:', e.message);
            }
        });

    } catch (error) {
        console.error('[railway] Error:', error.message);
        // Cleanup on error
        if (tmpDir) {
            try { await rm(tmpDir, { recursive: true, force: true }); } catch (e) { }
        }
        if (!res.headersSent) {
            res.status(500).json({ error: error.message || 'Extraction failed' });
        }
    }
});

// Resolve URL only (returns metadata without downloading)
app.post('/resolve', async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        const isTikTok = url.includes('tiktok.com');
        const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
        const referer = isTikTok ? 'https://www.tiktok.com/' : (isYouTube ? 'https://www.youtube.com/' : 'https://www.instagram.com/');

        const ytDlpOptions = {
            dumpSingleJson: true,
            noWarnings: true,
            noCheckCertificates: true,
            addHeader: [
                'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                `Referer:${referer}`,
            ],
        };

        const cookiesPath = path.join(process.cwd(), 'cookies.txt');
        if (fs.existsSync(cookiesPath)) {
            ytDlpOptions.cookies = cookiesPath;
        }

        const info = await youtubedl(url, ytDlpOptions);

        const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN
            ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
            : `http://localhost:${PORT}`;

        res.json({
            success: true,
            title: info.title || 'Video',
            thumbnail: info.thumbnail || '',
            rawUrl: info.url,
            formats: info.formats,
            streamUrl: `${baseUrl}/stream?url=${encodeURIComponent(url)}`,
        });
    } catch (error) {
        console.error('[railway] Resolve error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚂 Tandres Railway Extractor running on port ${PORT}`);
});
