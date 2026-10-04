import React from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function BookLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #faf9f5)',
        color: 'var(--text, #1c1917)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Anek Bangla', 'Noto Serif Bengali', system-ui, sans-serif",
      }}
    >
      {/* Top Bar Skeleton */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          width: '100%',
          backdropFilter: 'blur(12px)',
          background: 'var(--header-bg, rgba(250,249,245,0.9))',
          borderBottom: '1px solid var(--border, #e7e5e4)',
        }}
      >
        <div style={{ maxWidth: '896px', margin: '0 auto', padding: '0 20px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface-subtle, #e7e5e4)', animation: 'pulse 1.4s infinite' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ width: '140px', height: '14px', borderRadius: '6px', background: 'var(--surface-subtle, #e7e5e4)', animation: 'pulse 1.4s infinite' }} />
              <div style={{ width: '80px', height: '10px', borderRadius: '6px', background: 'var(--surface-subtle, #e7e5e4)', opacity: 0.6, animation: 'pulse 1.4s infinite' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '64px', height: '28px', borderRadius: '8px', background: 'var(--surface-subtle, #e7e5e4)', animation: 'pulse 1.4s infinite' }} />
            <div style={{ width: '80px', height: '28px', borderRadius: '8px', background: 'var(--surface-subtle, #e7e5e4)', animation: 'pulse 1.4s infinite' }} />
          </div>
        </div>
      </header>

      {/* Main Skeleton Canvas */}
      <main style={{ maxWidth: '672px', margin: '0 auto', padding: '48px 20px 96px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Animated Magical Loading Icon Centerpiece */}
        <div style={{ marginBottom: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--accent-bg, #fef3c7)', border: '1px solid var(--accent-border, #fde68a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LoadingSpinner variant="magical" size="lg" />
            </div>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text, #1c1917)', margin: '0 0 6px' }}>
            বইয়ের পাতা খোলা হচ্ছে...
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted, #78716c)', maxWidth: '380px', margin: 0 }}>
            অধ্যায় ও অনূদিত বিষয়বস্তু লোড হচ্ছে, ক্ষণিক অপেক্ষা করুন।
          </p>
        </div>

        {/* Shimmering Reading Skeleton Content Lines */}
        <div style={{ width: '100%', maxWidth: '560px', opacity: 0.75, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ height: '14px', background: 'var(--surface-subtle, #e7e5e4)', borderRadius: '999px', width: '100%', animation: 'pulse 1.4s infinite' }} />
          <div style={{ height: '14px', background: 'var(--surface-subtle, #e7e5e4)', borderRadius: '999px', width: '95%', animation: 'pulse 1.4s infinite' }} />
          <div style={{ height: '14px', background: 'var(--surface-subtle, #e7e5e4)', borderRadius: '999px', width: '92%', animation: 'pulse 1.4s infinite' }} />
          <div style={{ height: '14px', background: 'var(--surface-subtle, #e7e5e4)', borderRadius: '999px', width: '88%', animation: 'pulse 1.4s infinite' }} />
          
          <div style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ height: '14px', background: 'var(--surface-subtle, #e7e5e4)', borderRadius: '999px', width: '100%', animation: 'pulse 1.4s infinite' }} />
            <div style={{ height: '14px', background: 'var(--surface-subtle, #e7e5e4)', borderRadius: '999px', width: '97%', animation: 'pulse 1.4s infinite' }} />
            <div style={{ height: '14px', background: 'var(--surface-subtle, #e7e5e4)', borderRadius: '999px', width: '90%', animation: 'pulse 1.4s infinite' }} />
          </div>
        </div>
      </main>
    </div>
  );
}
