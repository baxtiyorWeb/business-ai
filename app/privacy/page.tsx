import React from "react";
import Link from "next/link";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | NicheFX",
  description: "Privacy Policy and Data Protection guidelines for NicheFX.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Header / Navbar */}
      <header className="border-b border-slate-800/80 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 flex items-center justify-between">
          <Link
            href="/billing"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Platform
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-white">NicheFX</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
              Privacy
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 mb-4">
            <Lock className="h-3.5 w-3.5" />
            <span>Privacy Policy</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Privacy Policy & Data Protection
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Last Updated: August 28, 2026 • Effective Immediately
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-300 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-base">1.</span> Introduction
            </h2>
            <p>
              At NicheFX (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), protecting your personal privacy and maintaining your trust is our highest priority. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our AI software platform and related services.
            </p>
          </section>

          <hr className="border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-base">2.</span> Information We Collect
            </h2>
            <p>We collect information to provide and improve our services efficiently:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li><strong>Account Data:</strong> Name, email address, profile picture, and authentication credentials when you register via Supabase Auth or OAuth providers (Google).</li>
              <li><strong>Usage & Generation Data:</strong> Prompt inputs, saved business ideas, chatbot history, and generation count records to manage subscription limits.</li>
              <li><strong>Payment & Billing Data:</strong> Payment details (credit card info, billing address, tax IDs) are processed directly and securely by our Merchant of Record, <strong>Paddle.com</strong>. We do not store raw credit card credentials on our servers.</li>
              <li><strong>Technical Logs:</strong> IP address, browser type, device information, and session tokens for security auditing.</li>
            </ul>
          </section>

          <hr className="border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-base">3.</span> How We Use Your Information
            </h2>
            <p>We utilize collected data strictly for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>To provide, operate, and maintain NicheFX AI generation features.</li>
              <li>To process payments, billing, and subscription management via Paddle.</li>
              <li>To prevent fraudulent activity, security abuses, or unauthorized access.</li>
              <li>To communicate service updates, receipts, and customer support responses.</li>
            </ul>
          </section>

          <hr className="border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-base">4.</span> Third-Party Service Providers
            </h2>
            <p>
              We share data only with trusted infrastructure partners necessary to deliver our application:
            </p>
            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs text-slate-300">
                <span className="font-bold text-white block mb-1">Paddle.com</span>
                Merchant of Record for checkout, tax handling, and subscription billing.
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-xs text-slate-300">
                <span className="font-bold text-white block mb-1">Supabase</span>
                Secure cloud database and user session authentication provider.
              </div>
            </div>
          </section>

          <hr className="border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-base">5.</span> Data Rights & Choices (GDPR & CCPA)
            </h2>
            <p>Depending on your location, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>Access, export, or request a copy of your personal data stored in NicheFX.</li>
              <li>Request the complete deletion of your account and associated generation data.</li>
              <li>Opt-out of optional marketing communications at any time.</li>
            </ul>
          </section>

          <hr className="border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-base">6.</span> Security & Retention
            </h2>
            <p>
              We implement industry-standard encryption protocols (HTTPS/TLS in transit, AES-256 at rest) to safeguard your data. We retain user account information as long as your account remains active or as required by financial auditing laws.
            </p>
          </section>

          <hr className="border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono text-base">7.</span> Contact Us
            </h2>
            <p>
              For privacy requests, data deletion inquiries, or protection details, please email our privacy team:
            </p>
            <p className="font-mono text-xs text-emerald-400">
              baxtiyorqurbonnazarov33@gmail.com
            </p>
          </section>
        </div>

        {/* Footer legal bar */}
        <div className="mt-8 text-center text-xs text-slate-500 flex flex-wrap items-center justify-center gap-4">
          <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
          <span>•</span>
          <Link href="/privacy" className="text-slate-300 font-semibold underline underline-offset-4">Privacy Policy</Link>
          <span>•</span>
          <Link href="/refund" className="hover:text-slate-300 transition-colors">Refund & Cancellation Policy</Link>
        </div>
      </main>
    </div>
  );
}
