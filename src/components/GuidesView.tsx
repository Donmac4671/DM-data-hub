import React from 'react';
import { BookOpen, Wallet, Zap, ArrowRight, Smartphone, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const GuidesView: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center space-x-2">
          <BookOpen className="w-6 h-6 text-amber-500" />
          <span>Platform Guides & Tutorials</span>
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">How to top up your wallet automatically and purchase data bundles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Guide 1: How to Top Up Wallet */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">1. How to Top Up Wallet via MoMo</h3>
              <p className="text-xs text-zinc-500">Instant Automated Credit in Seconds</p>
            </div>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
              <span className="font-bold text-amber-500 block mb-0.5">Step 1: Click "Top Up Wallet"</span>
              Enter the amount you want to fund (e.g. GHS 50 or GHS 100) and your Mobile Money phone number.
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
              <span className="font-bold text-amber-500 block mb-0.5">Step 2: Copy Reference Code</span>
              The app generates a unique reference code like <strong className="font-mono text-amber-500">DMH-482917</strong>.
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
              <span className="font-bold text-amber-500 block mb-0.5">Step 3: Send Payment on Phone</span>
              Dial *170# or *110# → Send Money to Mobile Money <strong className="font-mono">0549358359</strong> (Name: <strong className="font-mono">Osei Michael</strong>). Paste the reference code <strong className="font-mono">DMH-482917</strong> into the MoMo reference field!
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-100 rounded-xl">
              <span className="font-bold block mb-0.5">Step 4: Instant Automated Credit!</span>
              The telco SMS Webhook detects your payment and credits your wallet automatically within 3 seconds!
            </div>
          </div>
        </div>

        {/* Guide 2: How to Buy Data Packages */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">2. How to buy data</h3>
              <p className="text-xs text-zinc-500">MTN (90 Days), Telecel (60 Days), AT iShare (60 Days), AT Big Time (Non-expiry)</p>
            </div>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
              <span className="font-bold text-blue-500 block mb-0.5">Step 1: Choose Your Package</span>
              Browse Quick Buy on the dashboard or Package Catalog. Select your preferred network tab (MTN, Telecel, AT iShare, AT Big Time).
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
              <span className="font-bold text-blue-500 block mb-0.5">Step 2: Enter Recipient Number</span>
              Enter the phone number that should receive the data bundle (you can send data to family & friends!).
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700/60">
              <span className="font-bold text-blue-500 block mb-0.5">Step 3: Pay via Wallet</span>
              Click "Confirm & Dispatch". Payment is deducted from your wallet balance instantly.
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-100 rounded-xl">
              <span className="font-bold block mb-0.5">Step 4: Download Receipt</span>
              Your data is dispatched immediately to the target line! Click "Download Receipt" in order history anytime.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
