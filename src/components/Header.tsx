import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AuthModal } from './AuthModal';
import { DMLogo } from './DMLogo';
import {
  Wallet,
  Bell,
  Sun,
  Moon,
  ShoppingCart,
  PlusCircle,
  ShieldAlert,
  X,
  CheckCheck,
  Radio,
  ChevronDown,
  LogOut,
  User
} from 'lucide-react';

interface HeaderProps {
  onOpenTopUp: () => void;
  onOpenCart: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTopUp,
  onOpenCart,
  activeTab,
  setActiveTab,
}) => {
  const {
    currentUser,
    activeRole,
    switchRole,
    isAuthenticated,
    theme,
    toggleTheme,
    networks,
    cart,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    clearAllNotifications,
    setIsSearchOpen,
    logout,
    resetEverything,
  } = useApp();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <header className="sticky top-0 z-[100] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors w-full">
      {/* Click outside overlay for popovers */}
      {(showNotifMenu || showRoleMenu) && (
        <div
          className="fixed inset-0 z-[105] bg-black/5 dark:bg-black/20"
          onClick={() => {
            setShowNotifMenu(false);
            setShowRoleMenu(false);
          }}
        />
      )}

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-1">
          {/* Brand Logo & Network Status Indicator */}
          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center space-x-2 sm:space-x-3 text-left group"
            >
              <DMLogo size="md" className="group-hover:scale-105 transition-transform" />
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-base sm:text-xl tracking-tighter uppercase italic text-slate-900 dark:text-white">
                    Donmac <span className="text-amber-500 dark:text-amber-400 not-italic">Data Hub</span>
                  </span>
                  {activeRole === 'admin' && (
                    <span className="bg-rose-600 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 border border-rose-700 rounded-sm">
                      ADMIN
                    </span>
                  )}
                </div>
              </div>
            </button>

            {/* Network Mini Badges */}
            <div className="hidden lg:flex items-center space-x-1.5 ml-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              {networks.map(net => (
                <div
                  key={net.id}
                  title={`${net.name}: ${net.online ? 'ONLINE' : 'OFFLINE'}`}
                  className={`flex items-center space-x-1 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider border ${
                    net.online
                      ? 'bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                      : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${net.online ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span>{net.logoText}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {/* Wallet Balance Pill */}
            <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 sm:p-1 pl-1.5 sm:pl-3 border border-slate-900 dark:border-slate-700 shrink-0">
              <div className="flex items-center space-x-1 mr-1 sm:mr-2">
                <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" />
                <span className="text-[10px] sm:text-xs font-black text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                  ₵ {currentUser.walletBalance.toFixed(2)}
                </span>
              </div>
              <button
                onClick={onOpenTopUp}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-1.5 sm:px-2.5 py-1 sm:py-1.5 transition-colors flex items-center space-x-1"
              >
                <PlusCircle className="w-3 h-3" />
                <span className="hidden sm:inline">Top Up</span>
              </button>
            </div>

            {/* Cart Trigger */}
            <button
              onClick={onOpenCart}
              className="relative p-1.5 sm:p-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] font-black w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center border border-white">
                  {cart.length}
                </span>
              )}
            </button>

            {/* Notifications Bell */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-1.5 sm:p-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Notifications"
              >
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[8px] font-black w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center border border-white">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-72 sm:w-96 bg-white dark:bg-slate-900 shadow-2xl border border-slate-900 dark:border-slate-700 p-4 z-[120] animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-blue-600" />
                      <h4 className="font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white">Notifications</h4>
                    </div>
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:underline flex items-center space-x-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Mark Read</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 py-3">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-center text-slate-400 py-6 font-bold uppercase tracking-wider">No notifications yet</p>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => markNotificationAsRead(notif.id)}
                          className={`p-3 border text-xs cursor-pointer transition-colors ${
                            notif.read
                              ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                              : 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-600 text-slate-900 dark:text-white font-medium'
                          }`}
                        >
                          <p className="font-extrabold uppercase text-[11px] text-slate-900 dark:text-white">{notif.title}</p>
                          <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">{notif.message}</p>
                          <p className="text-[9px] font-mono font-bold text-slate-400 mt-1.5">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Switcher - Always Visible on Mobile & Desktop */}
            <button
              onClick={toggleTheme}
              className="p-1.5 sm:p-2 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 rounded-none bg-slate-50 dark:bg-slate-800"
              title="Toggle Light/Dark Theme"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-900" />}
            </button>

            {/* Account & Profile Switcher Dropdown */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center space-x-1 p-1 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Account profile settings"
              >
                <div className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center font-black text-[9px] sm:text-[10px] tracking-wider ${
                  (currentUser.role === 'admin' || currentUser.email === 'donmacdatahub@gmail.com')
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-900 text-white'
                }`}>
                  {(currentUser.role === 'admin' || currentUser.email === 'donmacdatahub@gmail.com')
                    ? 'AD' 
                    : (currentUser.fullName
                        ? currentUser.fullName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
                        : 'US')
                  }
                </div>
                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 dark:text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 shadow-2xl border border-slate-900 dark:border-slate-700 p-3 z-[120] animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 mb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logged In Profile</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white truncate mt-0.5">{currentUser.fullName}</p>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        setActiveTab('profile');
                      }}
                      className={`w-full flex items-center justify-between p-2.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
                        activeTab === 'profile'
                          ? 'bg-amber-500 text-slate-950 border-amber-500'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <User className="w-3.5 h-3.5 text-amber-500" />
                        <span>Profile Settings</span>
                      </div>
                    </button>

                    {/* Admin View Option - Restricted to Admin Accounts Only */}
                    {(currentUser.role === 'admin' || currentUser.email === 'donmacdatahub@gmail.com') && (
                      <button
                        onClick={() => {
                          switchRole('admin');
                          setShowRoleMenu(false);
                          setActiveTab('admin');
                        }}
                        className={`w-full flex items-center justify-between p-2.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
                          activeRole === 'admin'
                            ? 'bg-rose-600 text-white border-rose-700'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                          <span>Admin Control Panel</span>
                        </div>
                        {activeRole === 'admin' && <span className="w-1.5 h-1.5 bg-white" />}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center space-x-2 p-2.5 text-xs font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-800 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </header>
  );
};
