import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, Calendar, Sun, Moon, CloudSun } from 'lucide-react';

export const GreetingBanner: React.FC = () => {
  const { currentUser } = useApp();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  let greeting = 'Good Morning';
  let Icon = Sun;

  if (hours >= 12 && hours < 17) {
    greeting = 'Good Afternoon';
    Icon = CloudSun;
  } else if (hours >= 17 || hours < 5) {
    greeting = 'Good Evening';
    Icon = Moon;
  }

  const formattedDate = time.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
      <div className="flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
            {greeting}, <span className="text-amber-600 dark:text-amber-400">{currentUser.fullName}</span>
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Welcome to Donmac Data Hub • High-Speed Auto Dispatches
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4 text-xs font-mono font-extrabold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl self-start md:self-auto">
        <div className="flex items-center space-x-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span>{formattedDate}</span>
        </div>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <div className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400">
          <Clock className="w-3.5 h-3.5" />
          <span>{formattedTime}</span>
        </div>
      </div>
    </div>
  );
};
