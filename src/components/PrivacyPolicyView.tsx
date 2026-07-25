import React from 'react';
import { ShieldCheck, Lock, Eye, FileText, ArrowLeft, Mail, Phone, Server } from 'lucide-react';

interface PrivacyPolicyViewProps {
  onBackToDashboard?: () => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onBackToDashboard }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-600/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Privacy Policy
              </h1>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                Donmac Data Hub • Effective Date: January 1, 2026
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
          At Donmac Data Hub, we prioritize your data privacy and security above all else. This Privacy Policy details how we collect, use, process, and safeguard your personal information when you use our web platform and automated data dispatch services in compliance with the Data Protection Act of Ghana (Act 843).
        </p>
      </div>

      {/* Main Content Sections */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-8 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-black uppercase tracking-wider text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
            <FileText className="w-4 h-4 shrink-0" />
            <span>1. Information We Collect</span>
          </div>
          <p>
            To facilitate instant data bundle dispatches and wallet top-ups, we collect necessary user details including:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
            <li><strong className="text-slate-900 dark:text-white">Personal Identification:</strong> Full Name, Email Address, and Mobile Phone Number.</li>
            <li><strong className="text-slate-900 dark:text-white">Transaction Logs:</strong> Mobile Money transaction references, top-up amounts, target bundle recipient numbers, and timestamp logs.</li>
            <li><strong className="text-slate-900 dark:text-white">Technical Data:</strong> IP addresses, browser types, device information, and active session identifiers for fraud prevention.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-black uppercase tracking-wider text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
            <Eye className="w-4 h-4 shrink-0" />
            <span>2. How We Use Your Information</span>
          </div>
          <p>
            We strictly use your personal data to deliver and improve our services:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
            <li>Processing automated data & airtime top-ups across Telecel, MTN, and AT networks.</li>
            <li>Verifying Mobile Money payments and crediting your Donmac Data Hub account wallet.</li>
            <li>Sending real-time transaction notifications, order confirmations, and system alerts.</li>
            <li>Preventing fraudulent transactions and ensuring network API integrity.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-black uppercase tracking-wider text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
            <Lock className="w-4 h-4 shrink-0" />
            <span>3. Data Protection & Security</span>
          </div>
          <p>
            We implement enterprise-grade security protocols to prevent unauthorized access, alteration, or disclosure of your data:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
            <li>All HTTP communications are encrypted via SSL/TLS (256-bit encryption).</li>
            <li>Sensitives details such as passwords and security PINs are stored securely using salted cryptographic hashes.</li>
            <li>Mobile Money PINs are <strong className="text-slate-900 dark:text-white">NEVER</strong> requested, handled, or stored by Donmac Data Hub. All MoMo prompts are handled directly by telecom networks.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-black uppercase tracking-wider text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
            <Server className="w-4 h-4 shrink-0" />
            <span>4. Third-Party Sharing</span>
          </div>
          <p>
            Donmac Data Hub does not sell, rent, or trade your personal information to third parties. Data is shared exclusively with partner telecom operators (MTN Ghana, Telecel Ghana, AT Ghana) solely for order fulfillment purposes.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-black uppercase tracking-wider text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
            <Mail className="w-4 h-4 shrink-0" />
            <span>5. Contact Our Data Protection Officer</span>
          </div>
          <p>
            If you have questions regarding this Privacy Policy or wish to exercise your data subject rights under Act 843, please contact our support team:
          </p>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 font-mono text-xs">
            <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>Email: donmacdatahub@gmail.com</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Support Line: +233549358359</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
