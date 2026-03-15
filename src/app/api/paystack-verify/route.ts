import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { reference, userId, type, credits, planName, months } = body;

        if (!reference || !userId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log(`[paystack-verify] Verifying reference: ${reference} for user: ${userId}`);

        // Verify with Paystack
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
        });

        const data = await response.json();

        if (data.status && data.data.status === 'success') {
            console.log('[paystack-verify] Payment confirmed by Paystack. Processing reward...');

            if (type === 'subscription') {
                const tiktokAllotment = planName === 'pro' ? 500 : 200;
                const durationDays = (months || 1) * 30;

                // Fetch current profile to check if a plan is already active
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('plan_expires_at')
                    .eq('id', userId)
                    .single();

                const now = new Date();
                const currentExpiry = profile?.plan_expires_at ? new Date(profile.plan_expires_at) : null;
                const isPlanActive = currentExpiry && currentExpiry > now;

                if (isPlanActive) {
                    const { error: queueError } = await supabase
                        .from('subscription_queue')
                        .insert({
                            user_id: userId,
                            tier: planName,
                            tiktok_allotment: tiktokAllotment,
                            duration_days: durationDays,
                            status: 'pending'
                        });

                    if (queueError) throw queueError;
                    return NextResponse.json({ success: true, status: 'queued', plan: planName });
                } else {
                    const newExpiry = new Date();
                    newExpiry.setDate(newExpiry.getDate() + durationDays);

                    const { error: updateError } = await supabase
                        .from('profiles')
                        .upsert({
                            id: userId,
                            subscription_tier: planName,
                            plan_started_at: new Date().toISOString(),
                            plan_expires_at: newExpiry.toISOString(),
                            tiktok_extractions_remaining: tiktokAllotment,
                            updated_at: new Date().toISOString()
                        });

                    if (updateError) throw updateError;
                    return NextResponse.json({ success: true, status: 'activated', plan: planName, expires: newExpiry });
                }

            } else if (type === 'silver_credits') {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('free_credits')
                    .eq('id', userId)
                    .single();

                const currentSilver = profile?.free_credits || 0;
                const newSilver = currentSilver + (credits || 500);

                const { error: updateError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: userId,
                        free_credits: newSilver,
                        updated_at: new Date().toISOString()
                    });

                if (updateError) throw updateError;
                return NextResponse.json({ success: true, newSilver });

            } else {
                // Type is 'credit' (Gold Credits)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('credits')
                    .eq('id', userId)
                    .single();

                const currentCredits = profile?.credits || 0;
                const newCredits = currentCredits + (credits || 10); // Default to 10 if missing

                const { error: updateError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: userId,
                        credits: newCredits,
                        updated_at: new Date().toISOString()
                    });

                if (updateError) throw updateError;
                return NextResponse.json({ success: true, newCredits });
            }
        } else {
            return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('[paystack-verify] Error:', error);
        return NextResponse.json({ error: error.message || 'Verification Error' }, { status: 500 });
    }
}
