import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Wifi,
  Wallet,
  ShoppingBag,
  HelpCircle,
  BookOpen,
  Share2,
  ShieldAlert,
  Headphones,
  FileText,
  Users,
  FileCheck,
  User
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenTopUp: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenTopUp,
}) => {
  const { activeRole, unreadNotificationsCount } = useApp();

  const navItems = activeRole === 'admin' 
    ? [
        { id: 'admin', label: 'Admin Dashboard', icon: ShieldAlert },
        { id: 'users', label: 'Users Management', icon: Users },
        { id: 'claims', label: 'Verified Txn IDs', icon: FileCheck },
        { id: 'complaints', label: 'Complaints', icon: Headphones },
        { id: 'orders', label: 'All Orders', icon: ShoppingBag },
        { id: 'wallet', label: 'Wallet Logs', icon: Wallet },
        { id: 'profile', label: 'My Profile', icon: User },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'wallet', label: 'Wallet & Top-Up', icon: Wallet },
        { id: 'orders', label: 'Order History', icon: ShoppingBag },
        { id: 'complaints', label: 'Complaints', icon: Headphones },
        { id: 'guides', label: 'How-To Guides', icon: BookOpen },
        { id: 'profile', label: 'My Profile', icon: User },
      ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 space-y-6 shrink-0 transition-colors min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <p className="px-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Navigation
        </p>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isAdminItem = item.id === 'admin';

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border ${
                isActive
                  ? isAdminItem
                    ? 'bg-rose-600 text-white border-rose-700'
                    : 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                  : isAdminItem
                  ? 'text-rose-600 dark:text-rose-400 border-transparent hover:border-rose-200 dark:hover:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                  : 'text-slate-600 dark:text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quick MoMo Top Up Banner Box */}
      <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="p-4 bg-slate-900 text-white border border-slate-900 dark:border-slate-700">
          <div className="flex items-center space-x-2 font-black text-xs uppercase tracking-wider text-blue-400">
            <Wallet className="w-4 h-4" />
            <span>Instant MoMo</span>
          </div>
          <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
            Auto-credited in seconds using your unique reference code.
          </p>
          <button
            onClick={onOpenTopUp}
            className="w-full mt-3 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest py-2 px-3 border border-blue-500 transition-colors"
          >
            Top Up Wallet
          </button>
        </div>
      </div>
    </aside>
  );
};
