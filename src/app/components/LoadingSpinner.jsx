'use client';

import React from 'react';

/**
 * Reusable Loading Spinner & Icon Component
 * 
 * @param {string} variant - 'spinner' | 'magical' | 'book' | 'dots' | 'inline'
 * @param {string} size - 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 * @param {string} label - Optional text label (e.g. 'লোড হচ্ছে...')
 * @param {string} color - Optional color override (defaults to amber/gold theme)
 * @param {string} className - Optional container className
 */
export default function LoadingSpinner({
  variant = 'magical',
  size = 'md',
  label = '',
  color = 'amber',
  className = '',
}) {
  // Size mappings
  const sizeMap = {
    xs: { icon: 'w-3.5 h-3.5', text: 'text-[11px]', container: 'gap-1.5' },
    sm: { icon: 'w-4 h-4', text: 'text-xs', container: 'gap-2' },
    md: { icon: 'w-7 h-7', text: 'text-sm', container: 'gap-2.5' },
    lg: { icon: 'w-12 h-12', text: 'text-base', container: 'gap-3.5' },
    xl: { icon: 'w-16 h-16', text: 'text-lg', container: 'gap-4' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Simple Inline Spinner (ideal for buttons)
  if (variant === 'inline' || variant === 'spinner') {
    return (
      <span
        role="status"
        aria-live="polite"
        className={`inline-flex items-center ${currentSize.container} ${className}`}
      >
        <svg
          className={`animate-spin ${currentSize.icon} text-current`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3.5"
          />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {label && <span className={`${currentSize.text} font-medium`}>{label}</span>}
      </span>
    );
  }

  // Bouncing Dots Variant
  if (variant === 'dots') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`inline-flex items-center ${currentSize.container} ${className}`}
      >
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" />
        </div>
        {label && <span className={`${currentSize.text} text-stone-600 font-medium`}>{label}</span>}
      </div>
    );
  }

  // Book flipping icon variant
  if (variant === 'book') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`flex flex-col items-center justify-center ${currentSize.container} ${className}`}
      >
        <div className="relative">
          {/* Glowing aura */}
          <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full blur-md opacity-30 animate-pulse" />
          
          <div className="relative bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-700/60 rounded-2xl p-3 shadow-md flex items-center justify-center">
            <span className="text-3xl animate-bounce">📖</span>
          </div>
        </div>

        {label && (
          <p className={`${currentSize.text} text-stone-700 dark:text-stone-300 font-medium tracking-wide animate-pulse`}>
            {label}
          </p>
        )}
      </div>
    );
  }

  // Magical Harry Potter Themed Dual-Ring Glow Loader (Default: 'magical')
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center ${currentSize.container} ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {/* Soft Golden Ambience Glow */}
        <div className="absolute -inset-3 bg-amber-400/20 dark:bg-amber-400/15 rounded-full blur-lg animate-pulse" />

        {/* Outer Counter-Rotating Subtle Ring */}
        <div
          className={`${currentSize.icon} rounded-full border-2 border-dashed border-amber-400/40 dark:border-amber-500/30 animate-[spin_4s_linear_infinite_reverse]`}
        />

        {/* Fast Swirling Golden Arc Ring */}
        <div className={`absolute ${currentSize.icon}`}>
          <svg
            className="animate-spin w-full h-full text-amber-600 dark:text-amber-400"
            viewBox="0 0 50 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="25"
              cy="25"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="80"
              strokeDashoffset="60"
              className="opacity-90"
            />
          </svg>
        </div>

        {/* Central Magical Lightning Bolt ⚡ */}
        <div className="absolute flex items-center justify-center">
          <span className="text-xs sm:text-sm drop-shadow-sm select-none animate-pulse">
            ⚡
          </span>
        </div>
      </div>

      {/* Accompanying Label */}
      {label && (
        <span className={`${currentSize.text} font-medium text-stone-700 dark:text-stone-300 tracking-wide select-none`}>
          {label}
        </span>
      )}
    </div>
  );
}
