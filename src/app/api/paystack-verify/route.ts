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
                // Determine tiktok allocation
                const tiktokAdd = planName === 'pro' ? 500 : 200;

                // Fetch current profile to check existing expiry and tiktok balance
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('plan_expires_at, tiktok_extractions_remaining')
                    .eq('id', userId)
                    .single();

                let currentExpiry = profile?.plan_expires_at ? new Date(profile.plan_expires_at) : new Date();
                if (currentExpiry < new Date()) currentExpiry = new Date(); // If expired, start from now

                // Add x months to expiry
                const newExpiry = new Date(currentExpiry);
                newExpiry.setMonth(newExpiry.getMonth() + (months || 1));

                const currentTiktok = profile?.tiktok_extractions_remaining || 0;
                const newTiktok = currentTiktok + tiktokAdd;

                const { error: upsertError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: userId,
                        subscription_tier: planName,
                        plan_started_at: new Date().toISOString(),
                        plan_expires_at: newExpiry.toISOString(),
                        tiktok_extractions_remaining: newTiktok,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'id' });

                if (upsertError) throw upsertError;
                return NextResponse.json({ success: true, plan: planName, expires: newExpiry });

            } else {
                // Type is 'credit' or legacy
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('credits')
                    .eq('id', userId)
                    .single();

                const currentCredits = profile?.credits || 0;
                const newCredits = currentCredits + (credits || 0);

                const { error: upsertError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: userId,
                        credits: newCredits,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'id' });

                if (upsertError) throw upsertError;
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
