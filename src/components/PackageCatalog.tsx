import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NetworkId, DataPackage } from '../types';
import { Wifi, Search, Star, Zap, ShoppingCart, Filter } from 'lucide-react';
import { matchDataPackage } from '../utils/search';
import { validateGhanaNetworkPhone } from '../lib/networkValidator';

export const PackageCatalog: React.FC = () => {
  const { packages, favorites, toggleFavorite, addToCart, networks, showToast } = useApp();

  const [selectedNetwork, setSelectedNetwork] = useState<NetworkId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc'>('default');

  const [selectedPkgForModal, setSelectedPkgForModal] = useState<DataPackage | null>(null);
  const [recipientPhoneInput, setRecipientPhoneInput] = useState('');

  const filteredPackages = packages.filter(pkg => {
    if (pkg.status === 'hidden') return false;
    if (selectedNetwork !== 'all' && pkg.network !== selectedNetwork) return false;
    return matchDataPackage(pkg, searchQuery);
  });

  if (sortBy === 'price_asc') {
    filteredPackages.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price_desc') {
    filteredPackages.sort((a, b) => b.price - a.price);
  }

  const handleOpenPhoneModal = (pkg: DataPackage) => {
    setSelectedPkgForModal(pkg);
    setRecipientPhoneInput('');
  };

  const handleConfirmAddToCart = () => {
    if (!selectedPkgForModal) return;
    const validation = validateGhanaNetworkPhone(recipientPhoneInput, selectedPkgForModal.network);
    if (!validation.isValid) {
      showToast('Network Mismatch Error', validation.errorMessage || 'Invalid recipient phone number.', 'error');
      return;
    }
    const cleanPhone = validation.normalizedPhone || recipientPhoneInput.trim();
    addToCart({
      packageId: selectedPkgForModal.id,
      packageName: selectedPkgForModal.name,
      network: selectedPkgForModal.network,
      price: selectedPkgForModal.price,
      dataAmount: selectedPkgForModal.dataAmount,
      recipientPhone: cleanPhone,
    });
    setSelectedPkgForModal(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center space-x-2">
            <Wifi className="w-6 h-6 text-amber-500" />
            <span>Data Packages Catalog</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">Explore bundles for MTN Ghana, Telecel, and AirtelTigo iShare & Big Time</p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by network (MTN, Telecel, AT), plan (1GB, 2GB)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300"
          >
            <option value="default">Default Sort</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Network Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedNetwork('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedNetwork === 'all'
              ? 'bg-amber-500 text-black shadow-md'
              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
          }`}
        >
          All Networks
        </button>

        {networks.map(net => (
          <button
            key={net.id}
            onClick={() => setSelectedNetwork(net.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all ${
              selectedNetwork === net.id
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${net.online ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span>{net.name}</span>
          </button>
        ))}
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredPackages.map(pkg => {
          const isFav = favorites.includes(pkg.id);
          return (
            <div
              key={pkg.id}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                    {pkg.network}
                  </span>
                  <button onClick={() => toggleFavorite(pkg.id)}>
                    <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500 text-amber-500' : 'text-zinc-400'}`} />
                  </button>
                </div>
                <h3 className="font-extrabold text-lg text-zinc-900 dark:text-zinc-100 mt-2">{pkg.name}</h3>
                <p className="text-xs text-zinc-500 font-medium">{pkg.validity}</p>
                <p className="text-[11px] text-zinc-400 mt-2">{pkg.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="font-black text-amber-500 text-base">GHS {pkg.price.toFixed(2)}</span>
                <button
                  onClick={() => handleOpenPhoneModal(pkg)}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow transition-transform active:scale-95"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recipient Phone Modal */}
      {selectedPkgForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 max-w-sm w-full p-6 shadow-2xl space-y-4 rounded-2xl">
            <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
              Recipient Phone Number
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter phone number to receive <strong className="text-amber-500">{selectedPkgForModal.name}</strong>:
            </p>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 block mb-1">
                Data Recipient Phone Number
              </label>
              <input
                type="tel"
                value={recipientPhoneInput}
                onChange={e => setRecipientPhoneInput(e.target.value)}
                placeholder="e.g. 024XXXXXXX"
                autoFocus
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 rounded-xl"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPkgForModal(null)}
                className="flex-1 py-2.5 border border-slate-300 dark:border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAddToCart}
                className="flex-1 py-2.5 bg-amber-500 text-black font-black text-xs uppercase tracking-wider rounded-xl hover:bg-amber-400"
              >
                Confirm & Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
