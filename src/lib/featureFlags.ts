import { SupabaseClient } from '@supabase/supabase-js';

export type FeatureFlags = {
    showSilver: boolean;
};

export async function getFeatureFlags(supabase: SupabaseClient): Promise<FeatureFlags> {
    const { data } = await supabase
        .from('system_locks')
        .select('id, is_locked')
        .in('id', ['feature_silver']);

    const isLocked = (id: string) => data?.find((r: any) => r.id === id)?.is_locked ?? true;

    return {
        showSilver: !isLocked('feature_silver'),
    };
}
