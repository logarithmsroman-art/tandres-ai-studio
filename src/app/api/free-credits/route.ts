import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
    try {
        const { userId, action } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'Auth required' }, { status: 401 });
        }

        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('free_credits, subscription_tier')
            .eq('id', userId)
            .single();

        if (fetchError || !profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        if (action === 'get') {
            // Watch ad = Gain 1 credit
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    free_credits: (profile.free_credits || 0) + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (updateError) throw updateError;
            return NextResponse.json({ success: true, free_credits: (profile.free_credits || 0) + 1 });
        }

        if (action === 'spend') {
            // Spend 1 credit
            if ((profile.free_credits || 0) <= 0) {
                return NextResponse.json({ error: 'Insufficent free credits' }, { status: 403 });
            }

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    free_credits: Math.max(0, (profile.free_credits || 0) - 1),
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (updateError) throw updateError;
            return NextResponse.json({ success: true, free_credits: Math.max(0, (profile.free_credits || 0) - 1) });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('[free-credits] API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
