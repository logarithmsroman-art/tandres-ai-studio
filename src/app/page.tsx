'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UnifiedMediaStudio from '@/components/UnifiedMediaStudio';
import AuthModal from '@/components/AuthModal';
import dynamic from 'next/dynamic';
import Logo from '@/components/Logo';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { Sparkles, Clock, ShieldCheck, Layers, BadgeCheck } from 'lucide-react';
import AdGate from '@/components/AdGate';
import Link from 'next/link';

const PaymentModal = dynamic(() => import('@/components/PaymentModal'), { ssr: false });

type Profile = {
  credits: number;
  free_credits: number;
  subscription_tier: string;
  plan_expires_at: string | null;
  tiktok_extractions_remaining: number;
};

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nextPlan, setNextPlan] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [showAdForCredits, setShowAdForCredits] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2800);

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setNextPlan(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    // 1. Fetch Profile Data
    const { data: profData, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profError && profData) {
      setProfile(profData);
    }

    // 2. Fetch Next Queued Plan (for Dashboard trust)
    const { data: queueData } = await supabase
      .from('subscription_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1);

    if (queueData && queueData.length > 0) {
      setNextPlan(queueData[0]);
    } else {
      setNextPlan(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-purple-500/30 overflow-x-hidden">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loader"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="relative flex flex-col items-center">
              {/* Logo Glow */}
              <motion.div
                className="absolute -inset-20 bg-purple-600/30 blur-[120px] rounded-full"
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 4, repeat: Infinity }}
              />

              {/* Minimalist Animated Logo Icon */}
              <Logo size="xl" className="mb-12" />

              {/* Text Animation */}
              <div className="flex flex-col items-center gap-2">
                <motion.h1
                  className="text-4xl md:text-5xl font-light tracking-[0.25em] uppercase text-center relative pointer-events-none"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  Tandres Simplicity
                </motion.h1>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1 }}
                  className="text-xs uppercase font-black tracking-[0.8em] text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 pl-2"
                >
                  AI Studio
                </motion.span>
              </div>

              {/* Loading Bar */}
              <div className="mt-16 w-64 h-[1px] bg-white/10 relative overflow-hidden rounded-full">
                <motion.div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.2, ease: [0.45, 0, 0.55, 1] }}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col min-h-screen"
          >
            {/* Header / Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-black/40 backdrop-blur-3xl">
              <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
                <div className="flex items-center gap-4 group cursor-pointer">
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                      filter: ['drop-shadow(0 0 0px rgba(168,85,247,0))', 'drop-shadow(0 0 15px rgba(168,85,247,0.4))', 'drop-shadow(0 0 0px rgba(168,85,247,0))']
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Logo size="sm" glow={false} />
                  </motion.div>
                  <div className="flex flex-col">
                    <span className="font-bold tracking-tight text-white/90 leading-none group-hover:text-white transition-colors text-sm md:text-base">Tandres Simplicity</span>
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-purple-400 mt-1"
                    >
                      AI Studio
                    </motion.span>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:gap-8">
                  {user ? (
                    <>
                      <div className="flex items-center gap-2 md:gap-4">
                        <Link
                          href="/dashboard"
                          className="hidden lg:block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors"
                        >
                          Dashboard
                        </Link>

                        <div className="flex items-center gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                          <div className="flex items-center gap-1.5 border-r border-white/5 pr-2 md:pr-4">
                            <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-purple-500 animate-pulse" />
                            <span className="text-[8px] md:text-[10px] font-black text-white uppercase tracking-widest leading-none">
                              {profile?.credits ?? 0} <span className="hidden sm:inline">Gold</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-zinc-600" />
                            <span className="text-[8px] md:text-[10px] font-black text-white/60 uppercase tracking-widest leading-none">
                              {profile?.free_credits ?? 0} <span className="hidden sm:inline">Silver</span>
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setIsPaymentOpen(true)}
                          className="bg-white text-black h-9 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl shadow-2xl hover:bg-white/90 transition-all active:scale-95 group flex items-center gap-2 uppercase tracking-wider text-[10px] md:text-xs font-black"
                        >
                          <Zap className="w-3 md:w-3.5 h-3 md:h-3.5 fill-black" />
                          <span className="hidden xs:inline">Top Up</span>
                        </button>
                        
                        <button
                          onClick={() => setIsLogoutConfirmOpen(true)}
                          className="h-9 md:h-12 w-9 md:w-12 border border-white/5 rounded-xl flex items-center justify-center text-white/20 hover:text-white transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsAuthOpen(true)}
                      className="bg-white/[0.03] border border-white/5 text-white text-[10px] md:text-xs font-black px-6 md:px-8 py-3 md:py-3.5 rounded-xl md:rounded-2xl hover:bg-white/[0.08] hover:border-white/20 transition-all active:scale-95 uppercase tracking-widest"
                    >
                      Enter Studio
                    </button>
                  )}
                </div>
              </div>
            </nav>

            {/* Dashboard Content */}
            <div className="flex-grow pt-32 pb-20 px-8 relative overflow-hidden">
              {/* Persistent Floating Blobs */}
              <div className="absolute inset-0 pointer-events-none z-0">
                <motion.div
                  animate={{
                    x: [0, 100, -50, 0],
                    y: [0, -50, 100, 0],
                    scale: [1, 1.2, 0.9, 1]
                  }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full"
                />
                <motion.div
                  animate={{
                    x: [0, -120, 80, 0],
                    y: [0, 100, -60, 0],
                    scale: [1, 0.8, 1.1, 1]
                  }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-600/5 blur-[150px] rounded-full"
                />
              </div>

              {/* Dynamic Mouse Glow */}
              <motion.div
                className="fixed pointer-events-none z-10 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full"
                animate={{
                  x: mousePos.x - 300,
                  y: mousePos.y - 300,
                }}
                transition={{ type: 'spring', damping: 50, stiffness: 200, mass: 0.5 }}
              />

              <header className="mb-24 text-center max-w-4xl mx-auto relative z-20">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="inline-block py-2 px-6 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-black tracking-widest text-[10px] uppercase mb-8 shadow-2xl shadow-purple-500/20"
                    >
                      Creative Intelligence Suite
                    </motion.span>
                  </motion.div>

                  <h1 className="text-7xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.95] perspective-1000">
                    <motion.span
                      initial={{ opacity: 0, filter: 'blur(20px)', y: 20 }}
                      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                      className="block hover:scale-[1.02] transition-transform duration-500 cursor-default"
                    >
                      Your local ideas,
                    </motion.span>
                    <motion.span
                      initial={{ opacity: 0, filter: 'blur(20px)', y: 20 }}
                      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                      transition={{ duration: 0.8, delay: 0.7 }}
                      className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 block pb-2"
                    >
                      supercharged.
                    </motion.span>
                  </h1>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="text-white/40 text-sm md:text-xl leading-relaxed max-w-2xl mx-auto font-medium px-4"
                  >
                    Professional grade AI media tools for elite digital artists and global content creators. High fidelity, zero complexity.
                  </motion.p>
                </motion.div>
              </header>

              <div className="relative z-10">
                {/* Dedicated Studio Status Dashboard - Removed as per user request */}

                <UnifiedMediaStudio
                  userId={user?.id}
                />
              </div>
            </div>

            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

            {user && (
              <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                userEmail={user.email!}
                userId={user.id}
                currentTier={profile?.subscription_tier}
                onSuccess={() => fetchProfile(user.id)}
              />
            )}



            <AnimatePresence>
              {isLogoutConfirmOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsLogoutConfirmOpen(false)}
                    className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md"
                  />
                  <div className="fixed inset-0 z-[101] flex items-center justify-center p-6 pointer-events-none">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl pointer-events-auto"
                    >
                      <div className="mb-8 flex justify-center">
                        <div className="h-16 w-16 bg-red-500/10 rounded-[1.2rem] flex items-center justify-center text-red-500">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold tracking-tight text-center mb-3">Confirm Logout</h3>
                      <p className="text-white/40 text-sm text-center mb-10 leading-relaxed font-medium">Are you sure you want to sign out? You will need to login again to access your credits.</p>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setIsLogoutConfirmOpen(false)}
                          className="h-14 rounded-2xl border border-white/5 bg-white/[0.03] text-sm font-bold uppercase tracking-widest text-white/50 hover:bg-white/5 hover:text-white transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            supabase.auth.signOut();
                            setIsLogoutConfirmOpen(false);
                          }}
                          className="h-14 rounded-2xl bg-white text-black text-sm font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
                        >
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  </div>
                </>
              )}
            </AnimatePresence>

            <footer className="py-12 px-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 grayscale opacity-40">
                <span className="text-xs font-bold tracking-widest uppercase">Tandres Simplicity AI Studio</span>
              </div>
              <div className="flex items-center gap-8 text-[10px] uppercase font-bold tracking-[0.2em] text-white/20">
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">API Docs</a>
                <span>&copy; 2026 Tandres Simplicity</span>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Zap({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  )
}
