'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-[#050505] text-white selection:bg-purple-500/30">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-600/5 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2" />
            </div>

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
                        <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] block mb-4">Legal Document</span>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter italic uppercase mb-6">Privacy Policy</h1>
                        <p className="text-white/30 text-sm">Last updated: March 2026 &nbsp;·&nbsp; Effective immediately</p>
                    </motion.div>

                    <div className="prose prose-invert max-w-none space-y-12 text-white/70 leading-relaxed">

                        <Section title="1. Who We Are">
                            <p>Tandres Simplicity AI Studio ("we", "us", "our") operates at <strong className="text-white">tandresai.online</strong>. This Privacy Policy explains how we collect, use, and protect your personal information when you use our Platform.</p>
                        </Section>

                        <Section title="2. Information We Collect">
                            <p><strong className="text-white">Account Information:</strong> When you register, we collect your email address and encrypted password. We do not store your password in plain text.</p>
                            <p><strong className="text-white">Usage Data:</strong> We collect information about how you use the Platform, including which tools you use, how many credits you spend, and your subscription history. This helps us improve the service.</p>
                            <p><strong className="text-white">Uploaded Media:</strong> Audio and video files you upload are stored temporarily for processing only. Files are automatically deleted after processing completes. We do not permanently store your media files beyond what is necessary to deliver the service.</p>
                            <p><strong className="text-white">Payment Information:</strong> Payments are processed by our secure third-party payment providers. We do not store your card details directly on our servers. The provider's Privacy Policy governs your payment data. We only receive a transaction reference and status confirmation.</p>
                            <p><strong className="text-white">Device & Technical Data:</strong> We may collect your IP address, browser type, and device identifiers for security, fraud prevention, and analytics purposes.</p>
                        </Section>

                        <Section title="3. How We Use Your Information">
                            <p>We use your personal information to:</p>
                            <ul>
                                <li>Create and manage your account and credit balance</li>
                                <li>Process your purchases and verify payments</li>
                                <li>Deliver the AI media tools and services you request</li>
                                <li>Send you transactional emails (e.g., payment confirmations, account alerts)</li>
                                <li>Detect and prevent fraud and abuse</li>
                                <li>Improve and maintain the Platform</li>
                                <li>Comply with legal obligations</li>
                            </ul>
                            <p>We do <strong className="text-white">not</strong> sell your personal data to third parties.</p>
                        </Section>

                        <Section title="4. Advertising and Third-Party Ad Networks">
                            <p>Free-tier users (with zero Gold Credits and no paid subscription) may be shown advertisements through our partnered ad networks.</p>
                            <p>These ad networks may use cookies, web beacons, and device identifiers to serve ads relevant to your interests. This may involve tracking your browsing behaviour across websites.</p>
                            <p>Users with <strong className="text-white">Gold Credits or a paid Lab Subscription are never shown ads</strong> on the Platform.</p>
                            <p>You can opt out of interest-based advertising through your browser settings or via the ad network's opt-out tools.</p>
                        </Section>

                        <Section title="5. Data Storage and Security">
                            <p>Your account data is stored securely using enterprise-grade encrypted databases, providing encryption at rest and in transit (TLS/SSL).</p>
                            <p>We implement strict database security rules to ensure users can only access their own data. Your credit balance and account details cannot be modified directly from the browser by unauthorised users.</p>
                            <p>While we take security seriously, no system is 100% secure. Please use a strong, unique password for your account.</p>
                        </Section>

                        <Section title="6. Cookies">
                            <p>We use essential cookies to keep you logged in and maintain your session. Ad networks may set additional cookies for advertising purposes.</p>
                            <p>You can control cookies through your browser settings. Disabling cookies may affect how certain features of the Platform function.</p>
                        </Section>

                        <Section title="7. Your Rights">
                            <p>You have the right to:</p>
                            <ul>
                                <li><strong className="text-white">Access</strong> — Request a copy of the personal data we hold about you</li>
                                <li><strong className="text-white">Correction</strong> — Request correction of inaccurate data</li>
                                <li><strong className="text-white">Deletion</strong> — Request deletion of your account and associated data</li>
                                <li><strong className="text-white">Portability</strong> — Request your data in a portable format</li>
                            </ul>
                            <p>To exercise these rights, email us at <strong className="text-purple-400">support@tandresai.online</strong>.</p>
                        </Section>

                        <Section title="8. Children's Privacy">
                            <p>The Platform is not directed at children under 13. We do not knowingly collect personal information from children. If you believe a child has registered, contact us immediately and we will delete the account.</p>
                        </Section>

                        <Section title="9. Changes to This Policy">
                            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by displaying a notice on the Platform. Your continued use after changes constitutes acceptance.</p>
                        </Section>

                        <Section title="10. Contact Us">
                            <p>For privacy-related enquiries, contact us at: <strong className="text-purple-400">support@tandresai.online</strong></p>
                        </Section>

                    </div>

                    <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <Link href="/terms" className="text-purple-400 text-sm font-bold hover:text-purple-300 transition-colors">
                            Read our Terms of Service →
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
