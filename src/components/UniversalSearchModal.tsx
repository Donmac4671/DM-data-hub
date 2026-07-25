import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, X, Wifi, ShoppingBag, BookOpen } from 'lucide-react';
import { matchDataPackage } from '../utils/search';

export const UniversalSearchModal: React.FC<{
  setActiveTab: (tab: string) => void;
}> = ({ setActiveTab }) => {
  const { isSearchOpen, setIsSearchOpen, packages, orders } = useApp();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsSearchOpen]);

  if (!isSearchOpen) return null;

  const matchedPackages = packages.filter(p => matchDataPackage(p, query));

  const matchedOrders = orders.filter(o =>
    o.orderNumber.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-xl w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden space-y-4 p-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <Search className="w-5 h-5 text-amber-500" />
          <input
            type="text"
            autoFocus
            placeholder="Type to search packages, orders, guides..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none"
          />
          <button onClick={() => setIsSearchOpen(false)}>
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-3 text-xs">
          {query.trim() && (
            <>
              <div>
                <p className="font-bold text-zinc-400 uppercase text-[10px] mb-1">Matched Packages</p>
                {matchedPackages.slice(0, 4).map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveTab('packages');
                      setIsSearchOpen(false);
                    }}
                    className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer flex justify-between font-bold"
                  >
                    <span>{p.name} ({p.dataAmount})</span>
                    <span className="text-amber-500">GHS {p.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div>
                <p className="font-bold text-zinc-400 uppercase text-[10px] mb-1">Matched Orders</p>
                {matchedOrders.slice(0, 4).map(o => (
                  <div
                    key={o.id}
                    onClick={() => {
                      setActiveTab('orders');
                      setIsSearchOpen(false);
                    }}
                    className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer flex justify-between font-bold"
                  >
                    <span>{o.orderNumber}</span>
                    <span className="text-emerald-500">{o.status}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
