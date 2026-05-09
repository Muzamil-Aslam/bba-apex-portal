import React from 'react';

export default function LoadingSpinner({ fullScreen = false, size = 'md', text = '' }) {
  const sizes = { sm: 'w-6 h-6 border-2', md: 'w-10 h-10 border-3', lg: 'w-16 h-16 border-4' };
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`${sizes[size]} border-maroon-100 border-t-maroon rounded-full animate-spin`} style={{ borderTopColor: '#800000', borderWidth: size === 'sm' ? 2 : size === 'md' ? 3 : 4 }}></div>
      {text && <p className="text-gray-500 text-sm font-body animate-pulse">{text}</p>}
    </div>
  );
  if (fullScreen) return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-maroon-100 rounded-full animate-spin mx-auto mb-4" style={{ borderTopColor: '#800000' }}></div>
        <p className="text-maroon font-heading font-semibold text-lg">BBA Apex</p>
        <p className="text-gray-400 text-sm font-body mt-1">Loading...</p>
      </div>
    </div>
  );
  return spinner;
}
