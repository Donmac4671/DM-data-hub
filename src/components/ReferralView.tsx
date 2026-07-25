import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Share2, Copy, Check, Users, Gift, TrendingUp } from 'lucide-react';

export const ReferralView: React.FC = () => {
  const { currentUser } = useApp();
  const [copied, setCopied] = useState(false);

  const referralLink = `https://donmac.app/ref/${currentUser.referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center space-x-2">
          <Share2 className="w-6 h-6 text-amber-500" />
          <span>Refer & Earn Program</span>
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">Invite friends to Donmac Data Hub and earn GHS 2.00 for every top-up!</p>
      </div>

      <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-amber-600/10 border border-amber-500/30 space-y-4">
        <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">Your Unique Referral Link</h3>
        <div className="flex items-center space-x-2 bg-white dark:bg-zinc-900 p-2.5 rounded-2xl border border-amber-500/30">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 bg-transparent font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 px-2 focus:outline-none"
          />
          <button
            onClick={copyLink}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl flex items-center space-x-1"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase">Referred Customers</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-0.5">14 Users</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase">Total Earned Bonuses</p>
            <p className="text-2xl font-black text-emerald-500 mt-0.5">
              GHS {currentUser.totalReferralEarnings.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
