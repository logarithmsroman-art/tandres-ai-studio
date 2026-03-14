'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function MonetagMultiTag() {
    const [shouldShowAds, setShouldShowAds] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return; // Keep true for guests

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('credits, subscription_tier')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    const isPaidSub = profile.subscription_tier && profile.subscription_tier !== 'free';
                    const hasGoldCredits = (profile.credits || 0) > 0;
                    
                    if (isPaidSub || hasGoldCredits) {
                        setShouldShowAds(false);
                    }
                }
            } catch (e) {
                console.warn("Ad check failed:", e);
            }
        };

        checkStatus();
    }, []);

    useEffect(() => {
        if (shouldShowAds && typeof window !== 'undefined') {
            const script = document.createElement('script');
            // Using the official aggressive multitag snippet with the zone provided
            script.innerHTML = `(function(s,u,z,p){s.src=u,s.setAttribute('data-zone',z),p.appendChild(s);})(document.createElement('script'),'https://nap5k.com/tag.min.js',10730532,document.body||document.documentElement)`;
            document.head.appendChild(script);
        }
    }, [shouldShowAds]);

    return null;
}
