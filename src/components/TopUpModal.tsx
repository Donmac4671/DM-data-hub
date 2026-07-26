import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PendingTopUpRequest } from '../types';
import {
  X,
  Wallet,
  Copy,
  Check,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Smartphone
} from 'lucide-react';
// FIXED: Use the correct path based on your file structure
// Option A: If supabaseClient.ts is in src/
import { createPendingTopUpInSupabase } from '../supabaseClient';
// Option B: If supabaseClient.ts is in src/lib/
// import { createPendingTopUpInSupabase } from '../lib/supabaseClient';
// Option C: If supabaseClient.ts is in src/utils/
// import { createPendingTopUpInSupabase } from '../utils/supabaseClient';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose }) => {
  const { generateTopUpReference, user } = useApp();

  const [activeStep, setActiveStep] = useState<'amount' | 'instructions'>('amount');
  const [amountInput, setAmountInput] = useState<number>(50);
  const [momoNumberInput, setMomoNumberInput] = useState<string>('0549358359');
  const [pendingReq, setPendingReq] = useState<PendingTopUpRequest | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerateRef = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountInput < 1) {
      setError('Please enter a valid amount (minimum GHS 1.00)');
      return;
    }

    if (!user) {
      setError('Please log in to top up your wallet');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Step 1: Generate reference code
      const req = generateTopUpReference(amountInput, momoNumberInput);
      
      // Step 2: Save to Supabase
      await createPendingTopUpInSupabase(
        req.referenceCode,
        req.amount,
        user.email,
        user.fullName || 'Customer'
      );

      // Step 3: Update local state
      setPendingReq(req);
      setActiveStep('instructions');
    } catch (err: any) {
      console.error('Error generating top-up reference:', err);
      setError(err.message || 'Failed to generate reference. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">Wallet Top-Up</h3>
              <p className="text-xs text-zinc-500">Instant Mobile Money Wallet Funding</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-medium flex items-center space-x-2">
            <X className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Navigation Tabs inside modal */}
        <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800/60 p-1 text-xs font-bold">
          <button
            onClick={() => setActiveStep('amount')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeStep === 'amount'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            1. Amount
          </button>
          <button
            disabled={!pendingReq}
            onClick={() => pendingReq && setActiveStep('instructions')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeStep === 'instructions'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow'
                : 'text-zinc-500 disabled:opacity-40'
            }`}
          >
            2. Payment Instructions
          </button>
        </div>

        {/* STEP 1: Enter Amount */}
        {activeStep === 'amount' && (
          <form onSubmit={handleGenerateRef} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Top-Up Amount (GHS)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-zinc-400 text-sm">
                  GHS
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={amountInput}
                  onChange={e => setAmountInput(parseFloat(e.target.value) || 0)}
                  className="w-full pl-14 pr-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-extrabold text-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                  disabled={isGenerating}
                />
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[20, 50, 100, 200].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmountInput(amt)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    amountInput === amt
                      ? 'bg-amber-500 text-black border-amber-500 font-black'
                      : 'bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
                  disabled={isGenerating}
                >
                  GHS {amt}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Your Mobile Money Number
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="tel"
                  required
                  value={momoNumberInput}
                  onChange={e => setMomoNumberInput(e.target.value)}
                  placeholder="e.g. 0549358359"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-bold text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                  disabled={isGenerating}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Generating Reference...</span>
                </>
              ) : (
                <>
                  <span>Generate Payment Reference</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Instructions & Reference Code */}
        {activeStep === 'instructions' && pendingReq && (
          <div className="space-y-4 animate-in fade-in">
            {/* Reference Box */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">
                Your Unique Payment Reference Code:
              </span>
              <div className="flex items-center justify-between bg-white dark:bg-zinc-950 p-3 rounded-xl border border-amber-500/20">
                <span className="font-mono text-xl font-black text-amber-500 tracking-wider">
                  {pendingReq.referenceCode}
                </span>
                <button
                  onClick={() => copyToClipboard(pendingReq.referenceCode, 'refCode')}
                  className="px-3 py-1.5 bg-amber-500 text-black rounded-lg text-xs font-bold flex items-center space-x-1 hover:bg-amber-400 transition-colors"
                >
                  {copiedField === 'refCode' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'refCode' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">
                Please enter this reference code in the reference/reason field when transferring payment.
              </p>
            </div>

            {/* Merchant Details */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-700">
                <span className="text-zinc-500">Merchant MoMo Number:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">0549358359</span>
                  <button
                    onClick={() => copyToClipboard('0549358359', 'momoNum')}
                    className="p-1 text-amber-500 hover:text-amber-400"
                  >
                    {copiedField === 'momoNum' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-700">
                <span className="text-zinc-500">Account Name:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">Donmac Data Hub (Osei Michael)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Amount to Transfer:</span>
                <span className="font-extrabold text-amber-500">GHS {pendingReq.amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-2 text-xs">
              <p className="font-bold text-zinc-900 dark:text-zinc-100">MoMo Transfer Steps:</p>
              <ol className="list-decimal list-inside space-y-1.5 text-zinc-600 dark:text-zinc-400 pl-1 leading-relaxed">
                <li>Dial <strong>*170#</strong> (MTN) or <strong>*110#</strong> (Telecel / AirtelTigo).</li>
                <li>Select <strong>Transfer Money</strong> → <strong>Mobile Money User</strong>.</li>
                <li>Enter MoMo Number: <strong>0549358359</strong>.</li>
                <li>Enter Amount: <strong>GHS {pendingReq.amount.toFixed(2)}</strong>.</li>
                <li><strong className="text-amber-500">CRITICAL:</strong> Enter Reference: <strong>{pendingReq.referenceCode}</strong>.</li>
                <li>Confirm with your MoMo PIN.</li>
              </ol>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>I Have Sent Payment / Done</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
