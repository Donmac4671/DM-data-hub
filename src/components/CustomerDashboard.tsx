import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NetworkId, DataPackage } from '../types';
import { renderStatusBadge } from '../utils/statusHelper';
import { GreetingBanner } from './GreetingBanner';
import { matchDataPackage } from '../utils/search';
import { validateGhanaNetworkPhone } from '../lib/networkValidator';
import {
  Wallet,
  PlusCircle,
  FileCheck,
  ShoppingBag,
  Zap,
  TrendingUp,
  Search,
  Star,
  Check,
  MessageCircle,
  ArrowRight,
  Download,
  AlertTriangle,
  Info,
  HelpCircle,
  Flame,
  Radio,
  BookOpen
} from 'lucide-react';

interface CustomerDashboardProps {
  onOpenTopUp: () => void;
  onOpenClaim: () => void;
  setActiveTab: (tab: string) => void;
  onSelectReceiptOrder: (order: any) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  onOpenTopUp,
  onOpenClaim,
  setActiveTab,
  onSelectReceiptOrder,
}) => {
  const {
    currentUser,
    networks,
    packages,
    favorites,
    toggleFavorite,
    addToCart,
    orders,
    announcements,
    showToast,
  } = useApp();

  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId>('mtn');
  const [searchQuery, setSearchQuery] = useState('');

  // Stats Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.createdAt.startsWith(todayStr));
  const todaySpending = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  
  // Calculate today's data volume purchased (extract numbers from items like "1 GB", "5 GB")
  const todayDataGB = todayOrders.reduce((sum, o) => {
    return sum + o.items.reduce((itemSum, item) => {
      const match = item.dataAmount.match(/(\d+(\.\d+)?)/);
      return itemSum + (match ? parseFloat(match[0]) : 0);
    }, 0);
  }, 0);

  // Filtered packages
  const filteredPackages = packages.filter(pkg => {
    if (pkg.status === 'hidden') return false;
    if (pkg.network !== selectedNetwork) return false;
    return matchDataPackage(pkg, searchQuery);
  });

  // Favorite Packages
  const favoritePackages = packages.filter(p => favorites.includes(p.id) && p.status !== 'hidden');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Live Time & Greeting Banner */}
      <GreetingBanner />

      {/* Announcement Banners Ticker */}
      {announcements.filter(a => a.active).map(ann => (
        <div
          key={ann.id}
          className={`p-4 rounded-2xl border flex items-start space-x-3 text-xs leading-relaxed ${
            ann.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
              : ann.type === 'warning' || ann.type === 'urgent'
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500/30 text-amber-900 dark:text-amber-100'
              : 'bg-blue-50 dark:bg-blue-950/30 border-blue-500/30 text-blue-900 dark:text-blue-100'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <p className="font-bold">{ann.title}</p>
            <p className="mt-0.5 opacity-90">{ann.content}</p>
          </div>
        </div>
      ))}

      {/* Top Banner & Wallet Overview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Balance Hero Card */}
        <div className="lg:col-span-2 relative bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 p-6 sm:p-8 flex flex-col justify-between min-h-[220px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                AVAILABLE WALLET BALANCE
              </span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 border border-emerald-200 dark:border-emerald-800">
                INSTANT AUTO-CREDIT
              </span>
            </div>
            <div className="mt-3 flex items-baseline space-x-2">
              <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-slate-900 dark:text-white">
                ₵ {currentUser.walletBalance.toFixed(2)}
              </h1>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-2">
              Send MoMo top-up with your reference code for instant automated wallet credit.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenTopUp}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white font-bold text-xs uppercase tracking-widest px-6 py-3 transition-colors border border-slate-900 dark:border-white flex items-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>TOP UP WALLET</span>
            </button>

            <button
              onClick={onOpenClaim}
              className="border border-slate-300 dark:border-slate-700 hover:border-slate-900 text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-widest px-6 py-3 transition-colors flex items-center space-x-2 bg-white dark:bg-slate-900"
            >
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>CLAIM PAYMENT</span>
            </button>
          </div>
        </div>

        {/* Today's Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
          <div className="bg-slate-900 text-white p-5 border border-slate-900 flex flex-col justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Today's Orders</p>
            <div className="flex justify-between items-baseline mt-2">
              <p className="text-3xl font-black">{todayOrders.length}</p>
              <ShoppingBag className="w-5 h-5 text-slate-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Spending</p>
            <div className="flex justify-between items-baseline mt-2">
              <p className="text-3xl font-black italic text-slate-900 dark:text-white">₵ {todaySpending.toFixed(2)}</p>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Data Volume</p>
            <div className="flex justify-between items-baseline mt-2">
              <p className="text-3xl font-black text-blue-600">{todayDataGB.toFixed(1)} GB</p>
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Network Tabs & Quick Buy Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Quick Buy Data Packages</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Select network category: MTN, Telecel, AirtelTigo iShare, or AirtelTigo Big Time
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search packages..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Network Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {networks.map(net => {
            const isSelected = selectedNetwork === net.id;
            return (
              <button
                key={net.id}
                onClick={() => setSelectedNetwork(net.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${net.online ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span>{net.name}</span>
                {!net.online && <span className="text-[10px] text-rose-500 font-extrabold">(Offline)</span>}
              </button>
            );
          })}
        </div>

        {/* Favorites section if available */}
        {favoritePackages.length > 0 && selectedNetwork === 'all' && searchQuery === '' && (
          <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl space-y-3">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>Your Favorite Packages</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {favoritePackages.map(pkg => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          </div>
        )}

        {/* Package Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredPackages.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <Info className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No packages found</p>
              <p className="text-xs text-zinc-500 mt-1">Try selecting a different network or clear your search.</p>
            </div>
          ) : (
            filteredPackages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)
          )}
        </div>
      </div>

      {/* Quick How-To Guides Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => setActiveTab('guides')}
          className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 cursor-pointer transition-all group flex items-start space-x-4"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-amber-500 transition-colors">
              How to Top Up via Mobile Money
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Step-by-step instructions on generating reference codes and getting instant automated credits.
            </p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('guides')}
          className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 cursor-pointer transition-all group flex items-start space-x-4"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-blue-500 transition-colors">
              How to buy data
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Learn how non-expiry data transfers work across MTN, Telecel, and AirtelTigo bundles.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">Recent Orders</h3>
            <p className="text-xs text-zinc-500">Your latest data purchase history</p>
          </div>
          <button
            onClick={() => setActiveTab('orders')}
            className="text-xs font-bold text-amber-500 hover:underline flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase font-semibold text-[10px]">
                <th className="py-3 px-2">Order #</th>
                <th className="py-3 px-2">Items</th>
                <th className="py-3 px-2">Recipient</th>
                <th className="py-3 px-2">Amount</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {orders.slice(0, 5).map(ord => (
                <tr key={ord.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td className="py-3 px-2 font-bold text-zinc-900 dark:text-zinc-100">{ord.orderNumber}</td>
                  <td className="py-3 px-2 text-zinc-600 dark:text-zinc-300">
                    {ord.items.map(i => i.packageName).join(', ')}
                  </td>
                  <td className="py-3 px-2 font-mono text-zinc-500">{ord.items[0]?.recipientPhone || '-'}</td>
                  <td className="py-3 px-2 font-bold text-zinc-900 dark:text-zinc-100">GHS {ord.totalAmount.toFixed(2)}</td>
                  <td className="py-3 px-2">
                    {renderStatusBadge(ord.status)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => onSelectReceiptOrder(ord)}
                      className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500 hover:text-black transition-colors"
                      title="Download Receipt"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Sub-component for individual Package Card
const PackageCard: React.FC<{ pkg: DataPackage }> = ({ pkg }) => {
  const { favorites, toggleFavorite, addToCart, networks, showToast } = useApp();
  const [recipientPhone, setRecipientPhone] = useState('');
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  const isFavorite = favorites.includes(pkg.id);
  const netObj = networks.find(n => n.id === pkg.network);
  const isOffline = pkg.status === 'offline' || (netObj && !netObj.online);

  const handleBuyClick = () => {
    setRecipientPhone('');
    setShowPhoneModal(true);
  };

  const confirmAddToCart = () => {
    const validation = validateGhanaNetworkPhone(recipientPhone, pkg.network);
    if (!validation.isValid) {
      showToast('Network Mismatch Error', validation.errorMessage || 'Invalid recipient phone number.', 'error');
      return;
    }
    const cleanPhone = validation.normalizedPhone || recipientPhone.trim();
    addToCart({
      packageId: pkg.id,
      packageName: pkg.name,
      network: pkg.network,
      price: pkg.price,
      dataAmount: pkg.dataAmount,
      recipientPhone: cleanPhone,
    });
    setShowPhoneModal(false);
  };

  const networkBorderClass =
    pkg.network === 'mtn'
      ? 'border-t-4 border-t-[#FFCC00]'
      : pkg.network === 'telecel'
      ? 'border-t-4 border-t-[#E60000]'
      : 'border-t-4 border-t-[#004F9F]';

  return (
    <div className={`relative p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all flex flex-col justify-between ${networkBorderClass} ${
      isOffline ? 'opacity-50' : 'hover:border-slate-400 dark:hover:border-slate-700'
    }`}>
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between">
          <span className={`text-[9px] font-black uppercase px-2 py-0.5 border ${
            pkg.network === 'mtn'
              ? 'bg-[#FFCC00] text-black border-[#e5b800]'
              : pkg.network === 'telecel'
              ? 'bg-[#E60000] text-white border-[#cc0000]'
              : 'bg-[#004F9F] text-white border-[#003c7a]'
          }`}>
            {netObj?.logoText || pkg.network}
          </span>

          <button
            onClick={() => toggleFavorite(pkg.id)}
            className="p-1 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-blue-600 text-blue-600' : 'text-slate-300'}`} />
          </button>
        </div>

        <div className="mt-3">
          <h4 className="font-black text-lg text-slate-900 dark:text-white tracking-tight uppercase">{pkg.name}</h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{pkg.validity}</p>
        </div>

        {pkg.description && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">{pkg.description}</p>
        )}
      </div>

      {/* Bottom Price & Buy Action */}
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">PRICE</span>
          <span className="text-base font-black text-slate-900 dark:text-white">₵ {pkg.price.toFixed(2)}</span>
        </div>

        <button
          disabled={isOffline}
          onClick={handleBuyClick}
          className={`px-3.5 py-2 text-[10px] font-black uppercase tracking-widest transition-all border ${
            isOffline
              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white border-slate-900 dark:border-white'
          }`}
        >
          <span>{isOffline ? 'OFFLINE' : 'BUY DATA'}</span>
        </button>
      </div>

      {/* Recipient Phone Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
              Recipient Number
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Who should receive <strong className="text-blue-600 underline">{pkg.name}</strong>?
            </p>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                Ghana MoMo / Data Phone Number
              </label>
              <input
                type="tel"
                value={recipientPhone}
                onChange={e => setRecipientPhone(e.target.value)}
                placeholder="e.g. 0241234567"
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setShowPhoneModal(false)}
                className="flex-1 py-2.5 border border-slate-300 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmAddToCart}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest border border-slate-900"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
