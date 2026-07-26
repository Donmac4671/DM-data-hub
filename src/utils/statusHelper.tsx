import React from 'react';

export function renderStatusBadge(status: string) {
  const norm = status ? status.toLowerCase() : '';

  let label = status;
  let bgClass = '';
  let textClass = '';
  let glowClass = '';

  if (norm === 'delivered' || norm === 'completed') {
    label = 'delivered';
    bgClass = 'bg-emerald-500/20 border-emerald-500/50';
    textClass = 'text-emerald-400 font-extrabold uppercase';
    glowClass = 'shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse';
  } else if (norm === 'pending' || norm === 'processing') {
    label = norm;
    bgClass = 'bg-amber-500/20 border-amber-500/50';
    textClass = 'text-amber-400 font-extrabold uppercase';
    glowClass = 'shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse';
  } else if (norm === 'waiting') {
    label = 'waiting';
    bgClass = 'bg-sky-500/20 border-sky-500/50';
    textClass = 'text-sky-400 font-extrabold uppercase';
    glowClass = 'shadow-[0_0_12px_rgba(14,165,233,0.5)] animate-pulse';
  } else {
    label = norm || 'failed';
    bgClass = 'bg-rose-500/20 border-rose-500/50';
    textClass = 'text-rose-400 font-extrabold uppercase';
    glowClass = 'shadow-[0_0_12px_rgba(244,63,94,0.5)] animate-pulse';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] tracking-wider border ${bgClass} ${textClass} ${glowClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-ping" />
      {label}
    </span>
  );
}
