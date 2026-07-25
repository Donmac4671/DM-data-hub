import React from 'react';

interface DMLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const DMLogo: React.FC<DMLogoProps> = ({
  className = '',
  size = 'md'
}) => {
  const sizeMap = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl'
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-[2.5px] shadow-lg shadow-amber-500/20 shrink-0 select-none ${sizeMap[size]} ${className}`}
    >
      <div className="w-full h-full bg-slate-950 dark:bg-slate-950 rounded-full flex items-center justify-center border border-amber-400/40 shadow-inner">
        <span className="font-black tracking-tighter bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent font-mono leading-none">
          DM
        </span>
      </div>
    </div>
  );
};

export default DMLogo;
