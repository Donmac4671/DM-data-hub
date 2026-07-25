import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Mail,
  Phone,
  Smartphone,
  ShieldCheck,
  Wallet,
  ShoppingBag,
  Save,
  Sun,
  Moon,
  LogOut,
  RotateCcw,
  LogIn,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ProfileViewProps {
  onOpenTopUp?: () => void;
  setActiveTab?: (tab: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onOpenTopUp, setActiveTab }) => {
  const {
    currentUser,
    updateUserProfile,
    activeRole,
    switchRole,
    theme,
    toggleTheme,
    logout,
    resetEverything,
  } = useApp();

  const [fullName, setFullName] = useState(currentUser.fullName || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber || '');
  const [momoNumber, setMomoNumber] = useState(currentUser.momoNumber || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      fullName,
      email,
      phoneNumber,
      momoNumber,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const isAdmin = currentUser.role === 'admin' || currentUser.email === 'donmacdatahub@gmail.com';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg uppercase tracking-tight shrink-0">
              {currentUser.fullName
                ? currentUser.fullName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
                : 'DM'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-black text-xl sm:text-2xl tracking-tight text-white">{currentUser.fullName}</h1>
                {isAdmin && (
                  <span className="bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-rose-500">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">{currentUser.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="inline-flex items-center space-x-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Account Active</span>
                </span>
              </div>
            </div>
          </div>

          {onOpenTopUp && (
            <button
              onClick={onOpenTopUp}
              className="w-full sm:w-auto px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2"
            >
              <Wallet className="w-4 h-4" />
              <span>Top Up Wallet</span>
            </button>
          )}
        </div>
      </div>

      {/* Account Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Wallet Balance</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              GHS {currentUser.walletBalance.toFixed(2)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Spent</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              GHS {currentUser.totalSpent.toFixed(2)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Orders Completed</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              {currentUser.ordersCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Profile Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">Profile Management</h2>
            <p className="text-xs text-slate-500 mt-0.5">Update your contact information and default MoMo wallet number</p>
          </div>
          {isSaved && (
            <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved!</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Email Address
                </label>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                  Unchangeable
                </span>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  disabled
                  readOnly
                  value={email}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed select-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Default Mobile Money Number
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={momoNumber}
                  onChange={e => setMomoNumber(e.target.value)}
                  placeholder="e.g. 0549358359"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Preferences & Quick Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
          Preferences & Account Settings
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700" />
              )}
              <div>
                <p className="font-bold text-xs text-slate-900 dark:text-white">Theme Mode</p>
                <p className="text-[11px] text-slate-500">Currently: <span className="font-bold uppercase text-amber-500">{theme} Mode</span></p>
              </div>
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-500">Switch</span>
          </button>

          {/* Role Switcher if Admin */}
          {isAdmin && (
            <button
              onClick={() => {
                const targetRole = activeRole === 'admin' ? 'customer' : 'admin';
                switchRole(targetRole);
                if (setActiveTab) setActiveTab(targetRole === 'admin' ? 'admin' : 'dashboard');
              }}
              className="flex items-center justify-between p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-5 h-5 text-rose-500" />
                <div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white">Portal Role</p>
                  <p className="text-[11px] text-slate-500">Active: <span className="font-bold uppercase text-rose-500">{activeRole} Mode</span></p>
                </div>
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-500">Switch</span>
            </button>
          )}

          {/* Reset System State */}
          <button
            onClick={resetEverything}
            className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <RotateCcw className="w-5 h-5 text-rose-500" />
              <div>
                <p className="font-bold text-xs text-slate-900 dark:text-white">Reset Fresh State</p>
                <p className="text-[11px] text-slate-500">Clear local transaction cache</p>
              </div>
            </div>
          </button>

          {/* Sign Out */}
          <button
            onClick={logout}
            className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <LogOut className="w-5 h-5 text-slate-500" />
              <div>
                <p className="font-bold text-xs text-slate-900 dark:text-white">Sign Out</p>
                <p className="text-[11px] text-slate-500">Log out of your session</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
