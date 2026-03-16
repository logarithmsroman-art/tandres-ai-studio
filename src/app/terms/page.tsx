'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-[#050505] text-white selection:bg-purple-500/30">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/5 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2" />
            </div>

            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-black/40 backdrop-blur-3xl">
                <div className="max-w-4xl mx-auto px-8 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-4 group">
                        <div className="p-2.5 bg-zinc-900 border border-white/10 rounded-xl group-hover:border-purple-500/50 transition-all">
                            <ArrowLeft className="w-5 h-5 text-white/40 group-hover:text-white" />
                        </div>
                        <Logo size="sm" glow={false} />
                    </Link>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Legal</span>
                </div>
            </nav>

            <div className="pt-32 pb-24 px-6 relative z-10">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-16"
                    >
                        <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.4em] block mb-4">Legal Document</span>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic uppercase mb-6">Terms of Service</h1>
                        <p className="text-white/30 text-sm">Last updated: March 2026 &nbsp;·&nbsp; Effective immediately</p>
                    </motion.div>

                    <div className="prose prose-invert max-w-none space-y-12 text-white/70 leading-relaxed">

                        <Section title="1. Acceptance of Terms">
                            <p>By accessing or using Tandres Simplicity AI Studio ("the Platform", "we", "us", or "our") at <strong className="text-white">tandresai.online</strong>, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Platform.</p>
                            <p>These terms apply to all users including visitors, registered users, and users with paid plans or credits.</p>
                        </Section>

                        <Section title="2. Description of Service">
                            <p>Tandres Simplicity AI Studio is an AI-powered media production platform that provides the following services:</p>
                            <ul>
                                <li>Audio and video extraction from YouTube, Instagram, TikTok, and other sources</li>
                                <li>AI voice cloning and synthesis</li>
                                <li>Audio and video trimming, joining, and editing</li>
                                <li>Magic Sync (AI-assisted audio-visual synchronisation)</li>
                                <li>A credit and subscription system for accessing premium tools</li>
                            </ul>
                        </Section>

                        <Section title="3. User Accounts">
                            <p>To access most features, you must create an account using a valid email address and password. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
                            <p>You must be at least <strong className="text-white">13 years old</strong> to use this Platform. By registering, you confirm you meet this age requirement.</p>
                            <p>We reserve the right to suspend or terminate accounts that violate these Terms.</p>
                        </Section>

                        <Section title="4. Credits and Subscriptions">
                            <p><strong className="text-white">Gold Credits</strong> are a premium in-app currency used to access AI tools. They are purchased with real money and are non-refundable once used. Gold Credits do not expire.</p>
                            <p><strong className="text-white">Silver Credits</strong> are earned or purchased and used for standard Lab tool access. They do not expire.</p>
                            <p><strong className="text-white">Lab Subscriptions</strong> (Starter Lab, Pro Studio) grant time-limited access to the full Lab suite. Subscription benefits expire at the end of the purchased period.</p>
                            <p>All purchases are processed in Nigerian Naira (₦) via Paystack. Purchases are final and non-refundable except where required by law.</p>
                        </Section>

                        <Section title="5. Acceptable Use">
                            <p>You agree NOT to use the Platform to:</p>
                            <ul>
                                <li>Extract, download, or reproduce copyrighted content without proper authorisation from the rights holder</li>
                                <li>Process content that involves minors in inappropriate contexts</li>
                                <li>Create deepfakes, AI-generated media, or synthetic voices intended to deceive, defame, or harass any individual</li>
                                <li>Reverse-engineer, scrape, or attempt to access our systems unauthorised</li>
                                <li>Sell, redistribute, or commercially exploit the Platform's outputs without our written consent</li>
                                <li>Violate any applicable local or international laws</li>
                            </ul>
                            <p>We are not responsible for any third-party content you choose to process using our tools. You bear full legal responsibility for your use of the Platform.</p>
                        </Section>

                        <Section title="6. Voice Cloning Disclaimer">
                            <p>The AI Voice Cloning tool is provided <strong className="text-white">strictly for educational, entertainment, and personal creative purposes</strong>. By using this feature, you explicitly agree that:</p>
                            <ul>
                                <li>You will not use the tool to scam, defraud, or maliciously deceive any individual or organisation.</li>
                                <li>You will not clone the voice of any individual without their explicit consent, unless for legal parody.</li>
                                <li>You will not use cloned voices to bypass biometric security systems or commit identity theft.</li>
                            </ul>
                            <p>Tandres Simplicity AI Studio bears <strong className="text-red-400">zero liability</strong> for any misuse of the Voice Cloning feature. If you use our technology to scam or impersonate people, you do so entirely at your own legal risk. We reserve the right to permanently ban your account and cooperate with law enforcement if we suspect malicious use.</p>
                        </Section>

                        <Section title="7. Copyright and Intellectual Property">
                            <p>You retain ownership of any original content you upload. By uploading content, you grant us a non-exclusive, royalty-free licence to process and store that content for the sole purpose of providing the service.</p>
                            <p>The Platform, its design, code, branding, and AI models are the intellectual property of Tandres Simplicity. You may not copy, reproduce, or distribute any part of the Platform without written permission.</p>
                            <p><strong className="text-white">Important:</strong> Many of the content sources our tools can access (e.g., YouTube, TikTok, Instagram) are governed by their own Terms of Service. You are solely responsible for ensuring your use complies with those platforms' rules and applicable copyright law.</p>
                        </Section>

                        <Section title="8. Advertising">
                            <p>Free-tier users may be shown advertisements powered by Monetag and other ad networks. Users with active Gold Credits or a paid Lab Subscription will not be shown ads.</p>
                            <p>Ad networks may use cookies and device identifiers to deliver relevant ads. See our Privacy Policy for more information.</p>
                        </Section>

                        <Section title="9. Limitation of Liability">
                            <p>The Platform is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, error-free, or that the AI outputs will meet your expectations.</p>
                            <p>To the fullest extent permitted by law, Tandres Simplicity shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform.</p>
                        </Section>

                        <Section title="10. Changes to Terms">
                            <p>We reserve the right to update these Terms at any time. Continued use of the Platform after any changes constitutes acceptance of the new Terms.</p>
                        </Section>

                        <Section title="11. Contact">
                            <p>For any questions regarding these Terms, contact us at: <strong className="text-purple-400">support@tandresai.online</strong></p>
                        </Section>
                    </div>

                    <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <Link href="/privacy" className="text-purple-400 text-sm font-bold hover:text-purple-300 transition-colors">
                            Read our Privacy Policy →
                        </Link>
                        <Link href="/" className="text-white/20 text-sm hover:text-white transition-colors">
                            ← Back to Studio
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="pb-8 border-b border-white/5"
        >
            <h2 className="text-xl font-black uppercase tracking-tight text-white mb-5">{title}</h2>
            <div className="space-y-4 text-white/60 text-sm leading-relaxed [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:space-y-2">
                {children}
            </div>
        </motion.section>
    );
}
