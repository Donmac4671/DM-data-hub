import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Wifi,
  Wallet,
  ShoppingBag,
  ShieldAlert,
  Menu,
  Headphones,
  User
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { activeRole } = useApp();

  const items = activeRole === 'admin'
    ? [
        { id: 'admin', label: 'Admin', icon: ShieldAlert },
        { id: 'orders', label: 'Orders', icon: ShoppingBag },
        { id: 'wallet', label: 'Wallet', icon: Wallet },
        { id: 'complaints', label: 'Support', icon: Headphones },
        { id: 'profile', label: 'Profile', icon: User },
      ]
    : [
        { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
        { id: 'wallet', label: 'Wallet', icon: Wallet },
        { id: 'orders', label: 'Orders', icon: ShoppingBag },
        { id: 'complaints', label: 'Support', icon: Headphones },
        { id: 'profile', label: 'Profile', icon: User },
      ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-2 px-3 transition-colors">
      <div className="flex items-center justify-around">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isAdmin = item.id === 'admin';

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center space-y-1 px-3 py-1 transition-colors ${
                isActive
                  ? isAdmin
                    ? 'text-rose-600 font-black uppercase tracking-wider'
                    : 'text-slate-900 dark:text-white font-black uppercase tracking-wider'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
