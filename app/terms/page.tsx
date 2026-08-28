import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, FileText } from "lucide-react";

export const metadata = {
  title: "Terms of Service | NicheFX",
  description: "Terms of Service and Conditions for NicheFX AI Platform.",
};

export default function TermsPage() {
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
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium">
              Legal
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-400 mb-4">
            <FileText className="h-3.5 w-3.5" />
            <span>Terms of Service</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Terms of Service & Usage Conditions
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Last Updated: August 28, 2026 • Effective Immediately
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-300 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400 font-mono text-base">1.</span> Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, or using NicheFX (&quot;the Platform&quot;), operated by NicheFX Inc. (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must discontinue using our services immediately.
            </p>
          </section>

          <hr className="border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400 font-mono text-base">2.</span> Account Registration & Security
            </h2>
            <p>
              To access certain features of NicheFX, including AI content generation, workspace saving, and subscription plans, you must register for an account. You agree to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>Provide accurate, current, and complete information during registration.</li>
              <li>Maintain the confidentiality of your account credentials.</li>
              <li>Notify us immediately of any unauthorized access or security breaches.</li>
              <li>Accept full responsibility for all activities conducted under your account.</li>
            </ul>
          </section>

          <hr className="border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400 font-mono text-base">3.</span> Subscriptions, Billing & Payments
            </h2>
            <p>
              NicheFX offers both free and paid subscription plans (Starter, Pro). 
            </p>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400 space-y-2">
              <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> Merchant of Record Notice:
              </p>
              <p>
                Our order process and payment processing are conducted by our online reseller and Merchant of Record, <strong>Paddle.com Market Ltd (&quot;Paddle&quot;)</strong>. Paddle handles all customer service inquiries, tax calculations, and payment processing for NicheFX subscriptions.
              </p>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>Paid subscriptions are billed on a recurring monthly cycle in advance.</li>
              <li>Prices are displayed in USD ($) and exclude applicable local sales taxes or VAT unless stated otherwise.</li>
              <li>You may cancel your subscription at any time through your Account Billing page or Paddle Customer Portal.</li>
            </ul>
          </section>

          <hr className="border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400 font-mono text-base">4.</span> Artificial Intelligence Content & Ownership
            </h2>
            <p>
              NicheFX utilizes advanced AI language and vision models to generate business ideas, copywriting, and media content (&quot;Generated Outputs&quot;).
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li><strong>Ownership:</strong> Subject to compliance with these Terms, you retain full commercial rights and ownership of the outputs generated through your paid NicheFX account.</li>
              <li><strong>Acceptable Use:</strong> You agree not to use the Platform to generate illegal, fraudulent, harmful, defamatory, or abusive content.</li>
              <li><strong>AI Limitations:</strong> Generated outputs are created by probabilistic AI models and are provided for informational and creative assistance. We recommend reviewing output accuracy prior to commercial deployment.</li>
            </ul>
          </section>

          <hr className="border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400 font-mono text-base">5.</span> Termination & Service Modifications
            </h2>
            <p>
              We reserve the right to suspend or terminate your account if you violate these Terms or engage in fraudulent activities. We also reserve the right to modify, upgrade, or temporarily suspend features of the Platform for scheduled maintenance.
            </p>
          </section>

          <hr className="border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400 font-mono text-base">6.</span> Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, NicheFX and its officers, directors, and employees shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of or inability to use the Platform.
            </p>
          </section>

          <hr className="border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-indigo-400 font-mono text-base">7.</span> Contact Us
            </h2>
            <p>
              If you have any questions regarding these Terms of Service, please contact our support team at:
            </p>
            <p className="font-mono text-xs text-indigo-400">
              support@nichefx.app
            </p>
          </section>
        </div>

        {/* Footer legal bar */}
        <div className="mt-8 text-center text-xs text-slate-500 flex flex-wrap items-center justify-center gap-4">
          <Link href="/terms" className="text-slate-300 font-semibold underline underline-offset-4">Terms of Service</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
          <span>•</span>
          <Link href="/refund" className="hover:text-slate-300 transition-colors">Refund & Cancellation Policy</Link>
        </div>
      </main>
    </div>
  );
}
