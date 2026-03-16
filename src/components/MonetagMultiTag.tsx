'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function MonetagMultiTag() {
    const [shouldShowAds, setShouldShowAds] = useState(true);

    useEffect(() => {
        const checkStatus = async (user: any) => {
            if (!user) {
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
                    
                    // If they have credits OR a paid sub, hide ads
                    if (isPaidSub || hasGoldCredits) {
                        setShouldShowAds(false);
                    } else {
                        setShouldShowAds(true);
                    }
                }
            } catch (e) {
                console.warn("Ad check failed:", e);
                setShouldShowAds(true);
            }
        };

        // Initial check
        supabase.auth.getUser().then(({ data: { user } }) => checkStatus(user));

        // Listen for log in/out/updates
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            checkStatus(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        // Only inject script if we should show ads AND it hasn't been injected yet
        if (shouldShowAds && typeof window !== 'undefined' && !document.getElementById('monetag-script')) {
            const script = document.createElement('script');
            script.id = 'monetag-script';
            script.innerHTML = `(function(s,u,z,p){s.src=u,s.setAttribute('data-zone',z),p.appendChild(s);})(document.createElement('script'),'https://nap5k.com/tag.min.js',10730532,document.body||document.documentElement)`;
            document.head.appendChild(script);
        } else if (!shouldShowAds) {
            // Remove ad script if user is now premium/has credits
            const existingScript = document.getElementById('monetag-script');
            if (existingScript) existingScript.remove();
        }
    }, [shouldShowAds]);

    return null;
}
