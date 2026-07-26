import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, FileCheck, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

interface ClaimPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClaimPaymentModal: React.FC<ClaimPaymentModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { submitPaymentClaim, claimPaymentWithTxnId, showToast } = useApp();

  const [momoTxnId, setMomoTxnId] = useState('');
  const [amount, setAmount] = useState('');
  const [momoNumber, setMomoNumber] = useState('');
  const [claimStatusMsg, setClaimStatusMsg] = useState<{ success: boolean; message: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTxnId = momoTxnId.trim();
    if (!cleanTxnId) return;

    const parsedAmount = parseFloat(amount) || 0;

    // 1. Attempt Auto-Crediting via SMS Webhook logs first
    const autoResult = claimPaymentWithTxnId(cleanTxnId);

    if (autoResult.success) {
      // Validate that the matched transaction amount exactly matches the claimed amount (or close to within 0.01)
      const matchedAmt = autoResult.amount || 0;
      if (Math.abs(matchedAmt - parsedAmount) > 0.01) {
        setClaimStatusMsg({
          success: false,
          message: `Transaction ID exists but the amount entered (GHS ${parsedAmount.toFixed(2)}) does not match the actual payment amount received.`,
        });
        setSubmitted(true);
        return;
      }

      setClaimStatusMsg({
        success: true,
        message: autoResult.message,
      });
    } else {
      // 2. Submit payment claim with actual entered amount - This will do security check and trigger blocking in AppContext if invalid
      const subResult = submitPaymentClaim({
        momoTxnId: cleanTxnId,
        amount: parsedAmount,
        momoNumber: momoNumber.trim() || 'Submitted by Customer',
      });

      if (subResult && !subResult.success) {
        setClaimStatusMsg({
          success: false,
          message: subResult.message,
        });
      } else {
        setClaimStatusMsg({
          success: true,
          message: `Claim for GHS ${parsedAmount.toFixed(2)} (Txn ID: ${cleanTxnId}) submitted successfully! Wallet credited instantly.`,
        });
      }
    }

    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">Claim Payment</h3>
              <p className="text-xs text-zinc-500">Enter MoMo Transaction ID</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          claimStatusMsg?.success ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Claim Approved</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-sm mx-auto leading-relaxed">
                {claimStatusMsg?.message}
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setMomoTxnId('');
                  onClose();
                }}
                className="mt-4 px-6 py-2.5 bg-amber-500 text-black font-extrabold rounded-xl text-xs"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="text-center py-6 space-y-3 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Claim Denied</h4>
              <p className="text-xs text-rose-600 dark:text-rose-400 max-w-sm mx-auto leading-relaxed font-bold">
                {claimStatusMsg?.message}
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                }}
                className="mt-4 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-extrabold rounded-xl text-xs"
              >
                Try Again
              </button>
            </div>
          )
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                MoMo Transaction ID *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 202607238910"
                value={momoTxnId}
                onChange={e => setMomoTxnId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Amount Paid (GHS) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="e.g. 100.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Sender Phone No.
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 0240001122"
                  value={momoNumber}
                  onChange={e => setMomoNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 uppercase tracking-wider"
            >
              Verify & Claim Payment
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
