import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service key for server-side credit updates
);

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(req: Request) {
    try {
        const { reference, userId, credits } = await req.json();

        if (!reference || !userId || !credits) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log(`[paystack-verify] Verifying reference: ${reference} for user: ${userId}`);

        // Verify with Paystack
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
        });

        const data = await response.json();

        if (data.status && data.data.status === 'success') {
            // Payment confirmed by Paystack!
            // Upsert profile to handle cases where the trigger might have missed or it's a first-time setup
            const { data: profile, error: fetchError } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', userId)
                .maybeSingle();

            if (fetchError) {
                console.error('[paystack-verify] Fetch error:', fetchError);
                throw fetchError;
            }

            const currentCredits = profile?.credits || 0;
            const newCredits = currentCredits + credits;

            console.log(`[paystack-verify] Updating user ${userId}: ${currentCredits} -> ${newCredits}`);

            const { error: upsertError } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    credits: newCredits,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });

            if (upsertError) {
                console.error('[paystack-verify] Upsert error:', upsertError);
                throw upsertError;
            }

            return NextResponse.json({ success: true, newCredits });
        } else {
            return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('[paystack-verify] Error:', error);
        return NextResponse.json({ error: error.message || 'Verification Error' }, { status: 500 });
    }
}
