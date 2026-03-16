'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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

    useEffect(() => {
        // CRITICAL: Only act once we have a DEFINITE answer (not null)
        // This ensures the script is NEVER injected before we know the user's status
        if (shouldShowAds === null) return;

        if (shouldShowAds === true && typeof window !== 'undefined' && !document.getElementById('monetag-script')) {
            // User confirmed free/no-credits → inject ad script
            const script = document.createElement('script');
            script.id = 'monetag-script';
            script.innerHTML = `(function(s,u,z,p){s.src=u,s.setAttribute('data-zone',z),p.appendChild(s);})(document.createElement('script'),'https://nap5k.com/tag.min.js',10730532,document.body||document.documentElement)`;
            document.head.appendChild(script);
        } else if (shouldShowAds === false) {
            // User has credits or paid sub → remove ad script if it somehow got in
            const existingScript = document.getElementById('monetag-script');
            if (existingScript) existingScript.remove();
        }
    }, [shouldShowAds]);

    return null;
}
