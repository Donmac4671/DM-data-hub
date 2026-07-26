import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Megaphone, X, Bell, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const AnnouncementModal: React.FC = () => {
  const { announcements, isAuthenticated } = useApp();
  const [activeAnn, setActiveAnn] = useState<any | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    // Find active announcement that has not been dismissed in this in-memory session
    // Resetting/refreshing/re-logging-in will show the announcement again.
    const active = announcements.find(a => a.active && !dismissedIds.includes(a.id));
    setActiveAnn(active || null);
  }, [announcements, dismissedIds, isAuthenticated]);

  if (!activeAnn) return null;

  const handleDismiss = () => {
    const updated = [...dismissedIds, activeAnn.id];
    setDismissedIds(updated);
    setActiveAnn(null);
  };

  const getThemeColors = (type: string) => {
    switch (type) {
      case 'urgent':
        return {
          bg: 'bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400',
          iconBg: 'bg-rose-600 text-white',
          badge: 'bg-rose-600 text-white',
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400',
          iconBg: 'bg-amber-500 text-black',
          badge: 'bg-amber-500 text-black',
        };
      case 'success':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
          iconBg: 'bg-emerald-600 text-white',
          badge: 'bg-emerald-600 text-white',
        };
      default:
        return {
          bg: 'bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400',
          iconBg: 'bg-blue-600 text-white',
          badge: 'bg-blue-600 text-white',
        };
    }
  };

  const colors = getThemeColors(activeAnn.type);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 max-w-lg w-full p-6 sm:p-7 shadow-2xl rounded-3xl space-y-5 relative overflow-hidden">
        {/* Top Glow Bar */}
        <div className={`h-1.5 w-full absolute top-0 left-0 right-0 ${colors.iconBg}`} />

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${colors.iconBg}`}>
              <Megaphone className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${colors.badge}`}>
                  {activeAnn.type || 'NOTICE'}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  ANNOUNCEMENT
                </span>
              </div>
              <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white mt-0.5 leading-snug">
                {activeAnn.title}
              </h3>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-sans">
          {activeAnn.content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[10px] text-slate-400 font-mono">
            Published: {new Date(activeAnn.createdAt).toLocaleDateString()}
          </span>
          <button
            onClick={handleDismiss}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-transform"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;
