'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Script from 'next/script';

export default function MonetagMultiTag() {
    const [shouldShowAds, setShouldShowAds] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setShouldShowAds(true); // Show to guests
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('credits, subscription_tier')
                .eq('id', user.id)
                .single();

            if (profile) {
                const isPaidSub = profile.subscription_tier && profile.subscription_tier !== 'free';
                const hasGoldCredits = (profile.credits || 0) > 0;
                
                // Only show ads if user is NOT a paid sub AND has NO gold credits
                setShouldShowAds(!isPaidSub && !hasGoldCredits);
            } else {
                setShouldShowAds(true);
            }
        };

        checkStatus();
    }, []);

    if (!mounted || !shouldShowAds) return null;

    return (
        <>
            {/* 
                NOTE: Replace '10730532' with your actual MultiTag Zone ID if it's different.
                MultiTag is a site-wide background ad format (Popunder, Push, etc.)
            */}
            <Script
                id="monetag-multitag"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        (function(s,u,z,p){s.src=u,s.setAttribute('data-zone',z),p.appendChild(s);})(document.createElement('script'),'https://go.onemobads.com/tag.min.js',10730532,document.body||document.documentElement)
                    `,
                }}
            />
        </>
    );
}
