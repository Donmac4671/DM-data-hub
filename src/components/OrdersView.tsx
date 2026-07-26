import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Order } from '../types';
import { ShoppingBag, Download, RefreshCw } from 'lucide-react';
import { OrderFilterBar, OrderFiltersState, filterOrders } from './OrderFilterBar';
import { renderStatusBadge } from '../utils/statusHelper';

interface OrdersViewProps {
  onSelectReceiptOrder: (order: Order) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ onSelectReceiptOrder }) => {
  const { orders, currentUser, reorderOrder, claimOrderRefund } = useApp();

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [filters, setFilters] = useState<OrderFiltersState>({
    searchQuery: '',
    statusFilter: 'all',
    networkFilter: 'all',
    startDate: '',
    endDate: '',
  });

  const handleFilterChange = (updated: Partial<OrderFiltersState>) => {
    setFilters(prev => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      statusFilter: 'all',
      networkFilter: 'all',
      startDate: '',
      endDate: '',
    });
  };

  const userOrders = currentUser.role === 'admin'
    ? orders
    : orders.filter(o => o.userId === currentUser.id || o.userEmail.toLowerCase() === currentUser.email.toLowerCase());

  const filteredOrders = filterOrders(userOrders, filters);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center space-x-2">
            <ShoppingBag className="w-6 h-6 text-amber-500" />
            <span>Order History</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">Track your data dispatches and download receipts</p>
        </div>
      </div>

      {/* Filter Bar */}
      <OrderFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        totalResultsCount={filteredOrders.length}
      />

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
            <ShoppingBag className="w-12 h-12 text-zinc-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No orders found</p>
          </div>
        ) : (
          filteredOrders.map(ord => (
            <div
              key={ord.id}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 gap-2">
                <div className="flex items-center space-x-3">
                  <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">{ord.orderNumber}</span>
                  {renderStatusBadge(ord.status)}
                </div>

                <span className="text-xs text-zinc-400 font-mono">
                  {new Date(ord.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Items */}
              <div className="space-y-2">
                {ord.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-zinc-800 dark:text-zinc-200">{item.packageName}</p>
                      <p className="text-[11px] text-zinc-500 font-mono">Recipient: {item.recipientPhone}</p>
                    </div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">GHS {item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-400">Total: </span>
                  <span className="font-black text-amber-600 dark:text-amber-400">GHS {ord.totalAmount.toFixed(2)}</span>
                </div>

                <div className="flex items-center space-x-2">
                  {ord.status === 'failed' && (
                    <button
                      onClick={() => claimOrderRefund(ord.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold flex items-center space-x-1 animate-pulse shadow-lg shadow-rose-500/20"
                    >
                      <span>Claim Refund</span>
                    </button>
                  )}

                  <button
                    onClick={() => reorderOrder(ord)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reorder</span>
                  </button>

                  <button
                    onClick={() => onSelectReceiptOrder(ord)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-extrabold flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Receipt</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
