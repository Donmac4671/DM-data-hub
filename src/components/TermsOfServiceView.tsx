import React from 'react';
import { FileCheck, ShieldAlert, CheckCircle2, ArrowLeft, Scale, CreditCard, AlertTriangle, HelpCircle } from 'lucide-react';

interface TermsOfServiceViewProps {
  onBackToDashboard?: () => void;
}

export const TermsOfServiceView: React.FC<TermsOfServiceViewProps> = ({ onBackToDashboard }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Terms of Service
              </h1>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                Donmac Data Hub • Last Updated: January 1, 2026
              </p>
            </div>
          </div>

          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2 text-xs font-extrabold uppercase tracking-wider transition-colors border border-slate-900 dark:border-slate-700 self-start sm:self-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          )}
        </div>

        <p className="mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          Welcome to Donmac Data Hub. By accessing or using our website, wallet services, and data package distribution system, you agree to be bound by these Terms of Service. Please read them carefully before making transactions.
        </p>
      </div>

      {/* Terms Content Sections */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-8 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>1. Account Registration & Eligibility</span>
          </div>
          <p>
            To utilize Donmac Data Hub services, users must create an account with an active email address and valid Ghanaian mobile number.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
            <li>You are responsible for maintaining the confidentiality of your login credentials and account security PIN.</li>
            <li>All activities performed under your registered account are deemed authorized by you.</li>
            <li>Accounts engaging in fraudulent transactions or system exploitation will be suspended immediately without prior notice.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>2. Wallet Top-Ups & Payments</span>
          </div>
          <p>
            Wallet balances can be funded via Mobile Money (MTN MoMo, Telecel Cash, AT Money) using automated reference codes or manual transaction claim verification:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
            <li>Wallet top-ups are non-refundable once credited to your account balance, but can be used to purchase any available data package.</li>
            <li>Users must specify the exact Reference Code during MoMo transfers to ensure immediate auto-crediting.</li>
            <li>Manual claim submissions require valid MoMo Transaction IDs for admin verification.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
            <FileCheck className="w-4 h-4 shrink-0" />
            <span>3. Package Delivery & Network Validity</span>
          </div>
          <p>
            Donmac Data Hub dispatches data bundles instantly via direct API connections with Ghanaian telecommunication providers:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
            <li>Users must double-check target recipient phone numbers prior to order placement. Data sent to an incorrect number provided by the user cannot be recalled.</li>
            <li>In the rare event of network API downtime or delayed delivery beyond 10 minutes, users may lodge a ticket in the Complaints tab for priority resolution or automated refund.</li>
            <li>Bundle validity periods (Non-Expiry or Expiry) are subject to the respective telecom operator guidelines.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>4. Prohibited Activities</span>
          </div>
          <p>
            Users are explicitly prohibited from engaging in automated scraping, reverse engineering, submitting forged Mobile Money IDs, or using automated bots to disrupt service performance.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>5. Limitation of Liability</span>
          </div>
          <p>
            Donmac Data Hub is not liable for temporary service interruptions caused by telecom network outages, maintenance windows, or circumstances beyond our reasonable control.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>6. Amendments & Contact</span>
          </div>
          <p>
            We reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of updated terms. For support or dispute resolution, submit a ticket in the app or contact <strong className="text-slate-900 dark:text-white">donmacdatahub@gmail.com</strong> or call <strong className="text-slate-900 dark:text-white">+233549358359</strong>.
          </p>
        </section>
      </div>
    </div>
  );
};
