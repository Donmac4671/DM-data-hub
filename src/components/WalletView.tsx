import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Wallet, PlusCircle, FileCheck, ArrowUpRight, ArrowDownLeft, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface WalletViewProps {
  onOpenTopUp: () => void;
  onOpenClaim: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({ onOpenTopUp, onOpenClaim }) => {
  const { currentUser, walletTransactions, claims, pendingTopUpRequests } = useApp();
  const [activeTab, setActiveTab] = useState<'transactions' | 'claims' | 'pending'>('transactions');

  const isAdmin = currentUser.role === 'admin';
  const displayTransactions = isAdmin
    ? walletTransactions
    : walletTransactions.filter(t => t.userId === currentUser.id);

  const displayClaims = isAdmin
    ? claims
    : claims.filter(c => c.userId === currentUser.id || c.userEmail.toLowerCase() === currentUser.email.toLowerCase());

  const displayPending = isAdmin
    ? pendingTopUpRequests
    : pendingTopUpRequests.filter(r => r.userId === currentUser.id || r.userEmail.toLowerCase() === currentUser.email.toLowerCase());

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white border border-zinc-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Donmac Mobile Money Wallet
          </span>
          <h2 className="text-4xl font-black mt-2">
            GHS {currentUser.walletBalance.toFixed(2)}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Instant automated wallet funding via MoMo SMS Webhook.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={onOpenTopUp}
            className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Top Up Wallet</span>
          </button>

          <button
            onClick={onOpenClaim}
            className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs border border-zinc-700 flex items-center justify-center space-x-1.5"
          >
            <FileCheck className="w-4 h-4 text-amber-400" />
            <span>Claim Payment</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1.5 text-xs font-bold">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            activeTab === 'transactions'
              ? 'bg-amber-500 text-black shadow'
              : 'text-zinc-600 dark:text-zinc-400'
          }`}
        >
          Transaction History ({displayTransactions.length})
        </button>

        <button
          onClick={() => setActiveTab('claims')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            activeTab === 'claims'
              ? 'bg-amber-500 text-black shadow'
              : 'text-zinc-600 dark:text-zinc-400'
          }`}
        >
          Payment Claims ({displayClaims.length})
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-black shadow'
              : 'text-zinc-600 dark:text-zinc-400'
          }`}
        >
          Top-Up Requests ({displayPending.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'transactions' && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3">
          {displayTransactions.length === 0 ? (
            <p className="text-xs text-center py-8 text-zinc-500">No transactions recorded yet.</p>
          ) : (
            displayTransactions.map(tx => (
              <div
                key={tx.id}
                className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                      tx.amount >= 0
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-rose-500/10 text-rose-500'
                    }`}
                  >
                    {tx.amount >= 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-extrabold text-zinc-900 dark:text-zinc-100">{tx.description}</p>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      {new Date(tx.createdAt).toLocaleString()} {tx.momoTxnId ? `• Txn: ${tx.momoTxnId}` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-black text-sm block ${
                      tx.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    {tx.amount >= 0 ? '+' : ''}GHS {tx.amount.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-zinc-400">Bal: GHS {tx.balanceAfter.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'claims' && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3">
          {displayClaims.length === 0 ? (
            <p className="text-xs text-center py-8 text-zinc-500">No payment claims submitted.</p>
          ) : (
            displayClaims.map(c => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                      MoMo Txn: {c.momoTxnId}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        c.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : c.status === 'rejected'
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}
                    >
                      {c.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Submitted on {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-black text-sm text-amber-500">GHS {c.amount.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3">
          {displayPending.length === 0 ? (
            <p className="text-xs text-center py-8 text-zinc-500">No pending top-up reference requests.</p>
          ) : (
            displayPending.map(r => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-mono font-black text-amber-500 text-sm">{r.referenceCode}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Pay to: {r.momoNumberToPay}</p>
                </div>

                <div className="text-right">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 block">GHS {r.amount.toFixed(2)}</span>
                  <span
                    className={`text-[10px] font-bold ${
                      r.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'
                    }`}
                  >
                    {r.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
