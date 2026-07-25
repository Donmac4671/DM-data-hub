import React from 'react';
import { Wifi, ShieldCheck, Lock, Headphones, BookOpen, FileText, ExternalLink } from 'lucide-react';
import { DMLogo } from './DMLogo';

interface FooterProps {
  setActiveTab: (tab: string) => void;
  activeTab: string;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab, activeTab }) => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t-2 border-slate-900 dark:border-slate-800 transition-colors mt-12 text-slate-700 dark:text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Brand Info */}
          <div className="md:col-span-1 space-y-3">
            <div
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center space-x-2.5 cursor-pointer group"
            >
              <DMLogo size="sm" className="group-hover:scale-105 transition-transform" />
              <div>
                <span className="font-black text-sm tracking-tight uppercase text-slate-900 dark:text-white block">
                  Donmac Data
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400 block -mt-1">
                  Hub Ghana
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Ghana's premier automated high-speed data & airtime dispatch platform. Supporting Telecel, MTN, and AT networks with instant MoMo wallet auto-crediting.
            </p>

            <div className="flex items-center space-x-2 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Network APIs Active • 99.9% Uptime</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h3 className="font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
              Quick Navigation
            </h3>
            <ul className="space-y-2 text-xs font-bold uppercase tracking-wider">
              <li>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                    activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Dashboard Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('packages')}
                  className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                    activeTab === 'packages' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Data Package Catalog
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('wallet')}
                  className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                    activeTab === 'wallet' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Wallet & MoMo Top-Up
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('guides')}
                  className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center space-x-1 ${
                    activeTab === 'guides' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <BookOpen className="w-3 h-3" />
                  <span>How-To Guides</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Support & Legal */}
          <div className="space-y-3">
            <h3 className="font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
              Legal & Support
            </h3>
            <ul className="space-y-2 text-xs font-bold uppercase tracking-wider">
              <li>
                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center space-x-1.5 ${
                    activeTab === 'privacy' ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Privacy Policy</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('terms')}
                  className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center space-x-1.5 ${
                    activeTab === 'terms' ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span>Terms of Service</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('complaints')}
                  className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center space-x-1.5 ${
                    activeTab === 'complaints' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5 text-emerald-600" />
                  <span>24/7 Support Center</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Trust & Security */}
          <div className="space-y-3">
            <h3 className="font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
              Security & Guarantee
            </h3>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>256-Bit SSL Encrypted</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                All transactions are encrypted and secured under Ghanaian telecom regulations and Data Protection laws.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <p>© {new Date().getFullYear()} Donmac Data Hub Ghana. All rights reserved.</p>

          <div className="flex items-center space-x-4 font-bold text-[11px]">
            <button
              onClick={() => setActiveTab('privacy')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Privacy
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('terms')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Terms
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('complaints')}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Help & Support
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
