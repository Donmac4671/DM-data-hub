import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Trash2, ShoppingBag, Wallet, Smartphone, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ShoppingCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: any) => void;
  onOpenTopUp: () => void;
}

export const ShoppingCartDrawer: React.FC<ShoppingCartDrawerProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
  onOpenTopUp,
}) => {
  const { cart, removeFromCart, clearCart, currentUser, placeOrder } = useApp();
  const [recipientPhone, setRecipientPhone] = useState('0241234567');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = () => {
    setErrorMessage(null);
    const targetPhone = cart[0]?.recipientPhone || currentUser.phoneNumber || '';
    const res = placeOrder(targetPhone, 'wallet');
    if (!res.success) {
      setErrorMessage(res.message);
    } else {
      if (res.order) {
        onOrderSuccess(res.order);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md h-full shadow-2xl border-l border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between overflow-y-auto">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                Shopping Cart ({cart.length})
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="py-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-bold">Your cart is empty</p>
                <p className="text-xs mt-1">Select data packages from the dashboard to order.</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100">{item.packageName}</h4>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">To: {item.recipientPhone}</p>
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400 mt-1 block">
                      GHS {item.price.toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => removeFromCart(index)}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Checkout Summary */}
        {cart.length > 0 && (
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
            {/* Payment Method - Donmac Wallet Only */}
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-2">
                Payment Method
              </label>
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Wallet className="w-5 h-5 text-amber-500" />
                  <div>
                    <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 block">Donmac Wallet</span>
                    <span className="text-[11px] text-zinc-500 font-mono">Available Balance: GHS {currentUser.walletBalance.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTopUp();
                  }}
                  className="px-2.5 py-1 bg-amber-500 text-black text-[10px] font-black uppercase rounded-lg hover:bg-amber-400"
                >
                  Top Up
                </button>
              </div>
            </div>

            {/* Error banner if insufficient balance */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-500/30 rounded-xl text-xs text-rose-700 dark:text-rose-300 space-y-2">
                <p>{errorMessage}</p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenTopUp();
                  }}
                  className="w-full py-2 bg-amber-500 text-black font-extrabold rounded-lg text-xs"
                >
                  Top Up Wallet Now
                </button>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-zinc-500">Total Amount:</span>
              <span className="font-black text-xl text-amber-600 dark:text-amber-400">
                GHS {total.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2"
            >
              <span>Confirm & Dispatch Order</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
