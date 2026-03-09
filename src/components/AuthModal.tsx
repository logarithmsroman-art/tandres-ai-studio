'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight, Github, Chrome } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Logo from '@/components/Logo';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`
                    }
                });
                if (error) throw error;
                alert('Check your email for the confirmation link!');
            }
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden pointer-events-auto"
                        >
                            {/* Premium Background Glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-purple-600/20 blur-[80px] rounded-full pointer-events-none" />

                            <button
                                onClick={onClose}
                                className="absolute top-8 right-8 text-white/20 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="relative z-10">
                                <header className="mb-10 text-center">
                                    <Logo size="lg" className="mb-6 mx-auto" />
                                    <h2 className="text-3xl font-bold tracking-tight mb-2">
                                        {isLogin ? 'Welcome Back' : 'Create Account'}
                                    </h2>
                                    <p className="text-white/40 text-sm">
                                        {isLogin ? 'Log in to access your AI studio credits.' : 'Join Tandres Simplicity and start creating.'}
                                    </p>
                                </header>

                                <form onSubmit={handleAuth} className="flex flex-col gap-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-1">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                            <input
                                                required
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="name@example.com"
                                                className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-6 text-white text-sm focus:outline-none focus:border-purple-500/40 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-1">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                            <input
                                                required
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full h-14 bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-6 text-white text-sm focus:outline-none focus:border-purple-500/40 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-red-400 text-xs font-medium">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        disabled={loading}
                                        className="mt-4 h-14 bg-white text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-white/90 active:scale-[0.98] transition-all shadow-xl shadow-white/5 disabled:opacity-50"
                                    >
                                        {loading ? 'Processing...' : (
                                            <>
                                                {isLogin ? 'Log In' : 'Sign Up'}
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>

                                <div className="mt-8 flex items-center gap-4 text-white/10">
                                    <div className="h-[1px] flex-grow bg-white/5" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">OR</span>
                                    <div className="h-[1px] flex-grow bg-white/5" />
                                </div>

                                <div className="mt-8 grid grid-cols-2 gap-4">
                                    <button className="h-14 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/[0.06] transition-all group">
                                        <Chrome className="w-4 h-4 text-white/40 group-hover:text-white" />
                                        <span className="text-xs font-bold">Google</span>
                                    </button>
                                    <button className="h-14 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/[0.06] transition-all group">
                                        <Github className="w-4 h-4 text-white/40 group-hover:text-white" />
                                        <span className="text-xs font-bold">GitHub</span>
                                    </button>
                                </div>

                                <p className="mt-10 text-center text-xs text-white/30">
                                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                                    <button
                                        onClick={() => setIsLogin(!isLogin)}
                                        className="text-white font-black uppercase tracking-widest ml-1 hover:text-purple-400 transition-colors"
                                    >
                                        {isLogin ? 'Sign Up' : 'Log In'}
                                    </button>
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
