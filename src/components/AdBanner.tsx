'use client';

import { useEffect, useRef } from 'react';

export default function AdBanner() {
    const containerRef = useRef<HTMLDivElement>(null);
    const scriptLoaded = useRef(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && !scriptLoaded.current && containerRef.current) {
            const script = document.createElement('script');
            script.innerHTML = `(function(s){s.dataset.zone='10730532',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`;
            containerRef.current.appendChild(script);
            scriptLoaded.current = true;
        }
    }, []);

    return (
        <div className="w-full bg-zinc-900/40 border border-white/5 rounded-3xl p-4 min-h-[100px] flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-2 left-4 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20">Sponsored</span>
            </div>
            
            <div ref={containerRef} className="w-full h-full flex items-center justify-center min-h-[50px]" />
        </div>
    );
}
