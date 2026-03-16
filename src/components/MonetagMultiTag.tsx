'use client';
import 'client-only';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Script from 'next/script';

export default function MonetagMultiTag() {
    // null = still checking, true = show ads, false = hide ads
    const [shouldShowAds, setShouldShowAds] = useState<boolean | null>(null);

    useEffect(() => {
        const checkStatus = async (user: any) => {
            if (!user) {
                // Not logged in → show ads
                setShouldShowAds(true);
                return;
            }
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('credits, subscription_tier')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    const isPaidSub = profile.subscription_tier && profile.subscription_tier !== 'free';
                    const hasGoldCredits = (profile.credits || 0) > 0;
                    // Hide ads if user has any gold credits OR a paid subscription
                    setShouldShowAds(!(isPaidSub || hasGoldCredits));
                } else {
                    setShouldShowAds(true);
                }
            } catch (e) {
                console.warn('Ad check failed:', e);
                setShouldShowAds(true);
            }
        };

        // Initial check
        supabase.auth.getUser().then(({ data: { user } }) => checkStatus(user));

        // Listen for login/logout changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            checkStatus(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (shouldShowAds === null || shouldShowAds === false) return null;

    return (
        <Script
            id="monetag-multitag"
            src="https://nap5k.com/tag.min.js"
            data-zone="10730532"
            strategy="afterInteractive"
        />
    );
}
