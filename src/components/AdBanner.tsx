'use client';

import Script from 'next/script';

export default function AdBanner() {
    return (
        <div className="w-full bg-zinc-900/40 border border-white/5 rounded-3xl p-4 min-h-[100px] flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-2 left-4 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20">Sponsored</span>
            </div>
            
            {/* Monetag Banner Integration */}
            <div id="monetag-banner-container" className="w-full h-full flex items-center justify-center">
                <Script id="monetag-push-banner" strategy="afterInteractive">
                    {`(function(s){s.dataset.zone='10730532',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`}
                </Script>
            </div>
        </div>
    );
}
