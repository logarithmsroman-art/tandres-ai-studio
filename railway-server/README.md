# Tandres Railway Extractor

A lightweight Node.js server that handles TikTok and Instagram video extraction using `yt-dlp`.

## Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select this repository
4. Set **Root Directory** to `railway-server`
5. Railway will auto-detect Node.js and run `npm start`

## Environment Variables (set in Railway dashboard)

None required — the server is self-contained.

## Endpoints

- `GET /` — Health check
- `GET /stream?url=<TIKTOK_URL>` — Downloads and streams a TikTok/Instagram video
- `POST /resolve` — Returns metadata + stream URL without downloading
