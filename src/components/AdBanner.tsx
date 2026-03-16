'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdBanner() {
    const containerRef = useRef<HTMLDivElement>(null);
    const scriptLoaded = useRef(false);
    // null = still checking, true = show ads, false = hide
    const [shouldShow, setShouldShow] = useState<boolean | null>(null);

    useEffect(() => {
        const check = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setShouldShow(true); return; }
            const { data: profile } = await supabase
                .from('profiles')
                .select('credits, subscription_tier')
                .eq('id', user.id)
                .single();
            if (profile) {
                const isPaid = profile.subscription_tier && profile.subscription_tier !== 'free';
                const hasCredits = (profile.credits || 0) > 0;
                setShouldShow(!(isPaid || hasCredits));
            } else {
                setShouldShow(true);
            }
        };
        check();
    }, []);

    useEffect(() => {
        if (shouldShow === null) return; // Wait for definite answer
        if (shouldShow && typeof window !== 'undefined' && !scriptLoaded.current && containerRef.current) {
            const script = document.createElement('script');
            script.innerHTML = `(function(s){s.dataset.zone='10730424',s.src='https://nap5k.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))`;
            containerRef.current.appendChild(script);
            scriptLoaded.current = true;
        }
    }, [shouldShow]);

    // Don't render anything until we know for sure
    if (shouldShow !== true) return null;

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
