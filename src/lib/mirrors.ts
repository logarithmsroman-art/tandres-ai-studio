/**
 * Cobalt / Stealth Mirrors for YouTube Extraction
 * This allows $0 cost extraction by utilizing community-hosted Cobalt instances.
 */

const MIRRORS = [
    'https://api.cobalt.tools',
    'https://cobalt.meowing.de',
    'https://cobalt.canine.tools',
    'https://cobalt.directory'
];

export async function mirroredResolve(url: string) {
    let lastError = null;

    for (const mirror of MIRRORS) {
        try {
            console.log(`[mirrors] Trying mirror: ${mirror}`);
            const res = await fetch(mirror, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    url: url,
                    videoQuality: '720',
                    audioFormat: 'mp3',
                    downloadMode: 'auto'
                }),
                // Cobalt usually responds quickly or fails
                signal: AbortSignal.timeout(10000)
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.text || `Mirror returned ${res.status}`);
            }

            const data = await res.json();
            
            // Cobalt returns a direct stream URL in data.url
            if (data && data.url) {
                return {
                    success: true,
                    title: data.filename || 'YouTube Video',
                    thumbnail: '',
                    streamUrl: data.url,
                    isMirror: true
                };
            }
        } catch (e: any) {
            console.warn(`[mirrors] Mirror ${mirror} failed:`, e.message);
            lastError = e;
            continue;
        }
    }

    throw lastError || new Error('All extraction mirrors are currently saturated.');
}
