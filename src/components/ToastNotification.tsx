import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { toastMessage } = useApp();

  if (!toastMessage) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-amber-500 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/30 bg-emerald-50/90 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-100',
    error: 'border-rose-500/30 bg-rose-50/90 dark:bg-rose-950/80 text-rose-900 dark:text-rose-100',
    info: 'border-amber-500/30 bg-amber-50/90 dark:bg-amber-950/80 text-amber-900 dark:text-amber-100',
  };

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className={`p-4 rounded-xl border shadow-xl backdrop-blur-md flex items-start space-x-3 ${borders[toastMessage.type]}`}>
        {icons[toastMessage.type]}
        <div className="flex-1 text-sm">
          <p className="font-semibold leading-snug">{toastMessage.title}</p>
          {toastMessage.desc && <p className="text-xs opacity-90 mt-0.5">{toastMessage.desc}</p>}
        </div>
      </div>
    </div>
  );
};
