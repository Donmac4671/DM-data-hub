import React from 'react';
import { Search, Calendar, RotateCcw, ChevronDown } from 'lucide-react';
import { Order, OrderStatus } from '../types';

export interface OrderFiltersState {
  searchQuery: string;
  statusFilter: string;
  networkFilter: string;
  startDate: string;
  endDate: string;
}

interface OrderFilterBarProps {
  filters: OrderFiltersState;
  onFilterChange: (updated: Partial<OrderFiltersState>) => void;
  onReset?: () => void;
  totalResultsCount?: number;
}

export const filterOrders = (orders: Order[], filters: OrderFiltersState): Order[] => {
  return orders.filter(ord => {
    // 1. Status Filter
    if (filters.statusFilter && filters.statusFilter !== 'all') {
      if (ord.status !== filters.statusFilter) return false;
    }

    // 2. Network Filter
    if (filters.networkFilter && filters.networkFilter !== 'all') {
      const net = filters.networkFilter.toLowerCase();
      const matchNetwork = ord.items.some(item => {
        if (net === 'mtn') return item.network === 'mtn';
        if (net === 'telecel') return item.network === 'telecel';
        if (net === 'at' || net === 'airteltigo') {
          return item.network === 'airteltigo_ishare' || item.network === 'airteltigo_bigtime';
        }
        return item.network === net;
      });
      if (!matchNetwork) return false;
    }

    // 3. Search Query (phone number, order #, package name, user email)
    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.trim().toLowerCase();
      const matchOrderNum = ord.orderNumber.toLowerCase().includes(q);
      const matchEmail = ord.userEmail.toLowerCase().includes(q);
      const matchItems = ord.items.some(
        i => i.recipientPhone.includes(q) || i.packageName.toLowerCase().includes(q)
      );
      if (!matchOrderNum && !matchEmail && !matchItems) return false;
    }

    // 4. Start Date Filter
    if (filters.startDate) {
      const orderDate = new Date(ord.createdAt);
      const start = new Date(`${filters.startDate}T00:00:00`);
      if (!isNaN(start.getTime()) && orderDate < start) return false;
    }

    // 5. End Date Filter
    if (filters.endDate) {
      const orderDate = new Date(ord.createdAt);
      const end = new Date(`${filters.endDate}T23:59:59.999`);
      if (!isNaN(end.getTime()) && orderDate > end) return false;
    }

    return true;
  });
};

export const OrderFilterBar: React.FC<OrderFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  totalResultsCount,
}) => {
  const isFiltered =
    filters.searchQuery.trim() !== '' ||
    filters.statusFilter !== 'all' ||
    filters.networkFilter !== 'all' ||
    filters.startDate !== '' ||
    filters.endDate !== '';

  return (
    <div className="w-full bg-slate-900/90 dark:bg-zinc-950/90 border border-slate-800 dark:border-zinc-800 p-2.5 sm:p-3 rounded-2xl shadow-lg backdrop-blur-md space-y-2">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-400" />
          <input
            type="text"
            placeholder="Search by phone number..."
            value={filters.searchQuery}
            onChange={e => onFilterChange({ searchQuery: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 dark:bg-zinc-900/90 border border-slate-700/60 dark:border-zinc-800 text-slate-100 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* All Statuses Dropdown */}
        <div className="relative min-w-[130px] sm:min-w-[150px]">
          <select
            value={filters.statusFilter}
            onChange={e => onFilterChange({ statusFilter: e.target.value })}
            className="w-full appearance-none pl-3.5 pr-8 py-2 bg-slate-800/80 dark:bg-zinc-900/90 border border-slate-700/60 dark:border-zinc-800 text-slate-100 dark:text-zinc-100 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer transition-all"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="delivered">Delivered</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="waiting">Waiting</option>
            <option value="failed">Failed</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* All Networks Dropdown */}
        <div className="relative min-w-[130px] sm:min-w-[150px]">
          <select
            value={filters.networkFilter}
            onChange={e => onFilterChange({ networkFilter: e.target.value })}
            className="w-full appearance-none pl-3.5 pr-8 py-2 bg-slate-800/80 dark:bg-zinc-900/90 border border-slate-700/60 dark:border-zinc-800 text-slate-100 dark:text-zinc-100 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer transition-all"
          >
            <option value="all">All Networks</option>
            <option value="mtn">MTN Ghana</option>
            <option value="telecel">Telecel Ghana</option>
            <option value="at">AT Ghana</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Start Date Picker */}
        <div className="relative flex items-center bg-slate-800/80 dark:bg-zinc-900/90 border border-slate-700/60 dark:border-zinc-800 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-100 dark:text-zinc-100 min-w-[140px]">
          <Calendar className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
          <input
            type="date"
            value={filters.startDate}
            onChange={e => onFilterChange({ startDate: e.target.value })}
            className="bg-transparent border-none text-slate-100 dark:text-zinc-100 text-xs font-medium focus:outline-none cursor-pointer w-full"
            title="Start Date"
          />
        </div>

        {/* End Date Picker */}
        <div className="relative flex items-center bg-slate-800/80 dark:bg-zinc-900/90 border border-slate-700/60 dark:border-zinc-800 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-100 dark:text-zinc-100 min-w-[140px]">
          <Calendar className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
          <input
            type="date"
            value={filters.endDate}
            onChange={e => onFilterChange({ endDate: e.target.value })}
            className="bg-transparent border-none text-slate-100 dark:text-zinc-100 text-xs font-medium focus:outline-none cursor-pointer w-full"
            title="End Date"
          />
        </div>

        {/* Reset Filters Button */}
        {isFiltered && onReset && (
          <button
            onClick={onReset}
            className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center space-x-1 transition-colors"
            title="Clear active filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Results Count Banner if filtered */}
      {isFiltered && totalResultsCount !== undefined && (
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1 pt-1 border-t border-slate-800">
          <span>Showing {totalResultsCount} matching order{totalResultsCount === 1 ? '' : 's'}</span>
          <span className="text-amber-400 font-bold">Filtered Results</span>
        </div>
      )}
    </div>
  );
};
