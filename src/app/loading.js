import React from 'react';
import LoadingSpinner from './components/LoadingSpinner';

export default function Loading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #faf9f5)',
        color: 'var(--text, #1c1917)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Anek Bangla', 'Noto Serif Bengali', system-ui, sans-serif",
      }}
    >
      {/* Background magical ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '33%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '280px',
          height: '280px',
          background: 'rgba(245, 158, 11, 0.12)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '380px',
          width: '100%',
          background: 'var(--surface, #ffffff)',
          border: '1px solid var(--border, #e7e5e4)',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: 'var(--card-shadow, 0 4px 20px rgba(0,0,0,0.08))',
        }}
      >
        {/* Loading Icon */}
        <div style={{ marginBottom: '24px' }}>
          <LoadingSpinner variant="magical" size="xl" />
        </div>

        {/* Text Details */}
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text, #1c1917)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          অক্ষরমালা ডিজিটাল পাঠাগার
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted, #78716c)', margin: '0 0 24px' }}>
          বইয়ের তাক ও অধ্যায়সমূহ গোছানো হচ্ছে...
        </p>

        {/* Shimmer loading bar */}
        <div style={{ width: '100%', height: '6px', borderRadius: '999px', overflow: 'hidden', background: 'var(--surface-subtle, #f3f0eb)', border: '1px solid var(--border-subtle, #e7e5e4)' }}>
          <div style={{ height: '100%', width: '45%', borderRadius: '999px', background: 'linear-gradient(90deg, #f59e0b, #d97706)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>

        {/* Subtitle Badge */}
        <div style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--accent-text, #92400e)', background: 'var(--accent-bg, #fef3c7)', padding: '4px 12px', borderRadius: '999px', border: '1px solid var(--accent-border, #fde68a)' }}>
          <span>⚡ জাদুকরী পাঠের অভিজ্ঞতা প্রস্তুত হচ্ছে</span>
        </div>
      </div>
    </div>
  );
}
