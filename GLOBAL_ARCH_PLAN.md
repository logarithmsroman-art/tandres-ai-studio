# 🚀 Global Video Studio: Million-User Architecture ($0 Cost)

This plan moves the fragile "Tunnel" out of Vercel and into **Cloudflare**, while keeping the "Brain" on **Railway**. This fixes the TikTok 403 Forbidden and YouTube bot detection permanently.

## Phase 1: Infrastructure Setup
1. **Cloudflare DNS**: Go to Vercel Domain settings. Change Nameservers to the ones provided by Cloudflare (e.g., `lorna.ns.cloudflare.com`).
2. **Railway Extractor**: Ensure `yt-dlp` is running on your Railway instance to handle the heavy-duty link resolution. **Railway: (Already mostly set up, very fast, free for 5,000 links/mo)**.
3. **Cloudflare Worker**: Create a new Worker (e.g., `proxy.tandres.workers.dev`) to handle the heavy video streaming.

## Phase 2: The "Golden Tunnel" (Cloudflare Worker)
We will deploy a small bit of code to Cloudflare that acts as the "VIP Bridge."
- **Headers**: It will automatically inject `Range: bytes=0-` and a valid Browser `User-Agent`.
- **Bandwidth**: Because it is Cloudflare, you pay **$0** for the GBs of video passing through.

## Phase 3: Railway API (The Resolver)
Update the `api/video-edit` route on Railway:
- **Action**: `resolve-url`
- **Logic**: Use `yt-dlp` to get the raw stream URL.
- **Output**: Return that URL to the browser, but prepended with your Cloudflare Worker address.

## Phase 4: Frontend Lab Integration
Update [VideoEditTab.tsx](file:///Users/macpro/Documents/web-me/tandres-simplicity-ai-studio/src/components/VideoEditTab.tsx):
- **Fetch Logic**: When the Lab wants to download a video, it will call: `https://your-worker.workers.dev/?url=[TIKTOK_URL]`.
- **Processing**: The stream flows through the Worker into the Browser's RAM. `FFmpeg.wasm` then processes it for free.

## ✅ Why this works:
1. **No 403 Errors**: TikTok trusts Cloudflare IPs.
2. **No 10s Limits**: Cloudflare Workers can stream for minutes without timing out.
3. **No Bandwidth Bills**: Vercel charges for bandwidth; Cloudflare Workers (on the free tier) do not.
4. **Stable Extraction**: Railway handles `yt-dlp` perfectly without the Vercel "Serverless" restrictions. Since it only "Resolves" links (3-second tasks), your monthly $1 credit covers approx. **5,000 links/mo for $0**.
