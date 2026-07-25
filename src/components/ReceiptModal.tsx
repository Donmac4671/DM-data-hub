import React from 'react';
import { Order } from '../types';
import { X, Printer, Download, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <span className="font-bold text-xs text-zinc-400">Official Receipt</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Area */}
        <div className="p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4 font-mono text-xs">
          <div className="text-center space-y-1">
            <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100 font-sans">
              DONMAC DATA HUB
            </h3>
            <p className="text-[10px] text-zinc-400 font-sans">Ghana Telecom Data & MoMo Services</p>
            <span className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] uppercase mt-1 ${
              order.status === 'completed'
                ? 'bg-emerald-500/10 text-emerald-500'
                : order.status === 'failed'
                ? 'bg-rose-500/10 text-rose-500'
                : 'bg-amber-500/10 text-amber-500'
            }`}>
              {order.status === 'completed'
                ? 'COMPLETED & DELIVERED'
                : order.status === 'failed'
                ? 'ORDER FAILED'
                : 'PENDING (DELIVERY 3-30 MINS)'}
            </span>
            <p className="text-[9px] text-amber-600 dark:text-amber-400 font-sans italic mt-1">
              * Note: Data delivery takes 3 to 30 minutes. Status is updated accordingly by admin.
            </p>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-dashed border-zinc-300 dark:border-zinc-700 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-400">Order #:</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Customer:</span>
              <span className="text-zinc-800 dark:text-zinc-200">{order.userName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Date:</span>
              <span className="text-zinc-800 dark:text-zinc-200">{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Payment:</span>
              <span className="text-zinc-800 dark:text-zinc-200 uppercase">{order.paymentMethod}</span>
            </div>
          </div>

          <div className="py-2 border-t border-b border-dashed border-zinc-300 dark:border-zinc-700 space-y-2">
            <p className="font-bold text-zinc-400 uppercase text-[10px]">Items Purchased:</p>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-[11px]">
                <div>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">{item.packageName}</p>
                  <p className="text-[10px] text-zinc-400">To: {item.recipientPhone}</p>
                </div>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">GHS {item.price.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-sm font-bold pt-1">
            <span className="text-zinc-500">Total Paid:</span>
            <span className="text-amber-500 text-base font-black">GHS {order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-bold text-xs flex items-center justify-center space-x-1.5 text-zinc-800 dark:text-zinc-200"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
