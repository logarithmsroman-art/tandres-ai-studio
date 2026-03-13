'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import VideoEditTab from '@/components/VideoEditTab';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const PaymentModal = dynamic(() => import('@/components/PaymentModal'), { ssr: false });

export default function LabPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };
        getUser();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-black py-12 px-6 lg:px-12">
            <VideoEditTab 
                userId={user?.id} 
                onOpenPayment={() => setIsPaymentOpen(true)}
                refreshTrigger={refreshTrigger}
            />
            {user && (
                <PaymentModal
                    isOpen={isPaymentOpen}
                    onClose={() => setIsPaymentOpen(false)}
                    userEmail={user.email!}
                    userId={user.id}
                    onSuccess={() => {
                        setRefreshTrigger(prev => prev + 1);
                    }}
                />
            )}
        </main>
    );
}
