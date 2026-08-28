import React from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, ShieldCheck, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Refund & Cancellation Policy | NicheFX",
  description: "Refund and Subscription Cancellation Policy for NicheFX.",
};

export default function RefundPage() {
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
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 font-medium">
              Refunds
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-semibold text-violet-400 mb-4">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refund & Cancellation Policy</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Refund & Subscription Policy
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Last Updated: August 28, 2026 • Effective Immediately
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-slate-300 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-violet-400 font-mono text-base">1.</span> Overview & Merchant Notice
            </h2>
            <p>
              At NicheFX, we strive to ensure total customer satisfaction with our AI content platform. All subscription payments and refunds for NicheFX are managed by our authorized Merchant of Record, <strong>Paddle.com Market Ltd (&quot;Paddle&quot;)</strong>.
            </p>
          </section>

          <hr className="border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-violet-400 font-mono text-base">2.</span> 14-Day Money-Back Guarantee
            </h2>
            <p>
              We offer a hassle-free <strong>14-day money-back guarantee</strong> for first-time paid plan subscribers (Starter or Pro).
            </p>
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-violet-400" /> Refund Eligibility:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-300">
                <li>You submit your refund request within 14 days of your initial subscription purchase.</li>
                <li>Your generation usage during the 14-day window has not exceeded 20% of your plan&apos;s monthly quota.</li>
                <li>The purchase was made directly on NicheFX via Paddle Checkout.</li>
              </ul>
            </div>
          </section>

          <hr className="border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-violet-400 font-mono text-base">3.</span> Subscription Cancellation
            </h2>
            <p>
              You may cancel your NicheFX subscription at any time without penalty or cancellation fees:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li><strong>How to Cancel:</strong> Navigate to your <strong>Billing Page</strong> inside NicheFX and click &quot;Manage Subscription&quot; to open the Paddle Customer Portal, or email support@nichefx.app.</li>
              <li><strong>Access After Cancellation:</strong> Upon cancellation, your paid plan benefits will remain active until the end of your current paid billing period. You will not be charged for subsequent cycles.</li>
            </ul>
          </section>

          <hr className="border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-violet-400 font-mono text-base">4.</span> How to Request a Refund
            </h2>
            <p>
              To request a refund, please choose one of the following methods:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-slate-300">
              <li>
                <strong>Via Email:</strong> Send an email to <span className="font-mono text-xs text-violet-400">support@nichefx.app</span> with your registered email address and receipt number.
              </li>
              <li>
                <strong>Via Paddle Buyer Support:</strong> Contact Paddle directly at <a href="https://paddle.net" target="_blank" rel="noreferrer" className="text-violet-400 underline">paddle.net</a> or via your receipt email.
              </li>
            </ol>
          </section>

          <hr className="border-slate-800" />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-violet-400 font-mono text-base">5.</span> Refund Processing Time
            </h2>
            <p>
              Once approved, refunds are issued immediately by Paddle to the original payment method (Credit Card, PayPal, Apple Pay, Google Pay). Refunds typically appear on your financial statement within 3 to 10 business days depending on your issuing bank.
            </p>
          </section>
        </div>

        {/* Footer legal bar */}
        <div className="mt-8 text-center text-xs text-slate-500 flex flex-wrap items-center justify-center gap-4">
          <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
          <span>•</span>
          <Link href="/refund" className="text-slate-300 font-semibold underline underline-offset-4">Refund & Cancellation Policy</Link>
        </div>
      </main>
    </div>
  );
}
