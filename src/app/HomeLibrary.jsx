'use client';

import React, { useState, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import LoadingSpinner from './components/LoadingSpinner';
import { loadAllReadingProgress, formatRelativeTime } from '../lib/readingProgress';
import Image from 'next/image';

// Helper to convert English numbers to Bengali numerals
const toBengaliNumber = (num) => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (digit) => bengaliDigits[Number(digit)]);
};

// ─── Client Theme Palettes (Day / Night Mode) ─────────────────────────────────
export const CLIENT_THEMES = {
  light: {
    id: 'light',
    isDark: false,
    bg: 'var(--bg, #faf9f5)',
    headerBg: 'var(--header-bg, rgba(250,249,245,0.94))',
    surface: 'var(--surface, #ffffff)',
    surfaceSubtle: 'var(--surface-subtle, #fafaf8)',
    surfaceAlt: 'var(--surface-alt, #f3f0eb)',
    heroBg: 'var(--hero-bg, linear-gradient(135deg, #fdfbf7 0%, #f7f2ea 100%))',
    heroBorder: 'var(--hero-border, #ede5d8)',
    border: 'var(--border, #e7e5e4)',
    borderSubtle: 'var(--border-subtle, #f3f0eb)',
    borderFocus: 'var(--border-focus, #f59e0b)',
    text: 'var(--text, #1c1917)',
    textMuted: 'var(--text-muted, #78716c)',
    textSubtle: 'var(--text-subtle, #9ca3af)',
    accent: 'var(--accent, #f59e0b)',
    accentHover: 'var(--accent-hover, #d97706)',
    accentText: 'var(--accent-text, #92400e)',
    accentBg: 'var(--accent-bg, #fef3c7)',
    accentBorder: 'var(--accent-border, #fde68a)',
    badgeGreenBg: 'var(--badge-green-bg, #f0fdf4)',
    badgeGreenText: 'var(--badge-green-text, #166534)',
    badgeGreenBorder: 'var(--badge-green-border, #bbf7d0)',
    cardShadow: 'var(--card-shadow, 0 1px 3px rgba(0,0,0,0.05))',
    cardHoverShadow: 'var(--card-hover-shadow, 0 8px 26px rgba(180,120,20,0.16))',
    cardHoverBorder: 'var(--card-hover-border, #f59e0b)',
    inputBg: 'var(--input-bg, #ffffff)',
    inputBorder: 'var(--input-border, #d1d5db)',
    buttonPrimaryBg: 'var(--button-primary-bg, #1c1917)',
    buttonPrimaryText: 'var(--button-primary-text, #ffffff)',
    buttonPrimaryHover: 'var(--button-primary-hover, #d97706)',
    pillBg: 'var(--pill-bg, #ffffff)',
    pillBorder: 'var(--pill-border, #e7e5e4)',
    pillText: 'var(--pill-text, #44403c)',
    pillCountBg: 'var(--pill-count-bg, #f3f0eb)',
    pillCountText: 'var(--pill-count-text, #78716c)',
    selectBg: 'var(--select-bg, #fafaf9)',
    selectBorder: 'var(--select-border, #d1d5db)',
    navTabActiveBg: 'var(--nav-tab-active-bg, #ffffff)',
    navTabActiveText: 'var(--nav-tab-active-text, #1c1917)',
    navTabActiveShadow: 'var(--nav-tab-active-shadow, 0 1px 4px rgba(0,0,0,0.12))',
    navTabInactiveText: 'var(--nav-tab-inactive-text, #6b7280)',
    navContainerBg: 'var(--nav-container-bg, rgba(120,113,108,0.1))',
  },
  dark: {
    id: 'dark',
    isDark: true,
    bg: 'var(--bg, #0c0e14)',
    headerBg: 'var(--header-bg, rgba(12,14,20,0.95))',
    surface: 'var(--surface, #151823)',
    surfaceSubtle: 'var(--surface-subtle, #1b2030)',
    surfaceAlt: 'var(--surface-alt, #1f2436)',
    heroBg: 'var(--hero-bg, linear-gradient(135deg, #131622 0%, #1a1e2e 100%))',
    heroBorder: 'var(--hero-border, #282d42)',
    border: 'var(--border, #252a3d)',
    borderSubtle: 'var(--border-subtle, #1c2030)',
    borderFocus: 'var(--border-focus, #fbbf24)',
    text: 'var(--text, #f3f4f6)',
    textMuted: 'var(--text-muted, #94a3b8)',
    textSubtle: 'var(--text-subtle, #64748b)',
    accent: 'var(--accent, #fbbf24)',
    accentHover: 'var(--accent-hover, #f59e0b)',
    accentText: 'var(--accent-text, #fde68a)',
    accentBg: 'var(--accent-bg, rgba(251,191,36,0.16))',
    accentBorder: 'var(--accent-border, rgba(251,191,36,0.35))',
    badgeGreenBg: 'var(--badge-green-bg, rgba(34,197,94,0.14))',
    badgeGreenText: 'var(--badge-green-text, #4ade80)',
    badgeGreenBorder: 'var(--badge-green-border, rgba(34,197,94,0.3))',
    cardShadow: 'var(--card-shadow, 0 2px 8px rgba(0,0,0,0.4))',
    cardHoverShadow: 'var(--card-hover-shadow, 0 10px 30px rgba(251,191,36,0.2))',
    cardHoverBorder: 'var(--card-hover-border, #fbbf24)',
    inputBg: 'var(--input-bg, #11131c)',
    inputBorder: 'var(--input-border, #282e42)',
    buttonPrimaryBg: 'var(--button-primary-bg, #fbbf24)',
    buttonPrimaryText: 'var(--button-primary-text, #0f1117)',
    buttonPrimaryHover: 'var(--button-primary-hover, #f59e0b)',
    pillBg: 'var(--pill-bg, #181c28)',
    pillBorder: 'var(--pill-border, #282e42)',
    pillText: 'var(--pill-text, #cbd5e1)',
    pillCountBg: 'var(--pill-count-bg, #222838)',
    pillCountText: 'var(--pill-count-text, #94a3b8)',
    selectBg: 'var(--select-bg, #131622)',
    selectBorder: 'var(--select-border, #282e42)',
    navTabActiveBg: 'var(--nav-tab-active-bg, #fbbf24)',
    navTabActiveText: 'var(--nav-tab-active-text, #0f1117)',
    navTabActiveShadow: 'var(--nav-tab-active-shadow, 0 2px 8px rgba(251,191,36,0.25))',
    navTabInactiveText: 'var(--nav-tab-inactive-text, #94a3b8)',
    navContainerBg: 'var(--nav-container-bg, rgba(255,255,255,0.06))',
  },
};

// ─── Reusable Hover Components ───────────────────────────────────────────────
function HoverLink({ href, onClick, baseStyle, hoverStyle, children, title, className = '' }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onClick={onClick}
      title={title}
      className={className}
      style={{ ...baseStyle, ...(hovered ? hoverStyle : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </Link>
  );
}

function HoverButton({ onClick, baseStyle, hoverStyle, children, title, disabled, type = 'button', className = '' }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={className}
      style={{ ...baseStyle, ...(hovered && !disabled ? hoverStyle : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
}

// ─── Book Card Component ─────────────────────────────────────────────────────
function BookCard({
  book,
  tag,
  bengaliTitle,
  englishTitle,
  navigatingBookSlug,
  setNavigatingBookSlug,
  expandedBookSlug,
  toggleExpandChapters,
  theme = CLIENT_THEMES.light,
  readingProgress = null,
  onOpenChapters,
}) {
  const T = theme;
  const slug = book?.slug;
  const chapters = book?.chapters || [];
  const chapCount = book?.chaptersCount || chapters.length || 0;
  const titleDisplay = bengaliTitle || book?.title;
  const isNavigating = navigatingBookSlug === slug;
  const isExpanded = expandedBookSlug === slug;
  const authorDisplay = book?.author && book.author !== 'অজানা' ? book.author : null;
  const seriesDisplay = tag || (book?.series && book.series !== 'সাধারণ সংকলন' ? book.series : null);

  return (
    <div
      className="book-card"
      style={{
        position: 'relative',
        zIndex: isExpanded ? 20 : 1,
        background: book.image ? 'transparent' : T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: '20px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        overflow: 'hidden',
        transition: 'box-shadow 0.25s, transform 0.25s, border-color 0.25s, background-color 0.25s',
        boxShadow: T.cardShadow,
        fontFamily: "'Anek Bangla', 'Noto Serif Bengali', system-ui, sans-serif",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = T.cardHoverShadow;
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.borderColor = T.cardHoverBorder;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = T.cardShadow;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = T.border;
      }}
    >
      {/* Background Image Layer (only when book.image exists) */}
      {book.image && (
        <div
          aria-hidden='true'
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("${book.image}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      )}
      {book.image && (
        <div
          aria-hidden='true'
          style={{
            position: 'absolute',
            inset: 0,
            background: T.isDark
              ? 'linear-gradient(160deg, rgba(10,12,20,0.82) 0%, rgba(10,12,20,0.72) 60%, rgba(10,12,20,0.88) 100%)'
              : 'linear-gradient(160deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.76) 60%, rgba(255,255,255,0.9) 100%)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}
      {/* z-index wrapper so card content is above bg */}
      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
        <div className="book-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '12px', minHeight: '30px' }}>
          {seriesDisplay ? (
            <span
              className="book-card-series-tag"
              style={{
                fontSize: '13px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '8px',
                background: T.accentBg,
                color: T.accentText,
                border: `1px solid ${T.accentBorder}`,
                maxWidth: '140px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={seriesDisplay}
            >
              📚 {seriesDisplay.includes('(') ? seriesDisplay.split('(')[0].trim() : seriesDisplay}
            </span>
          ) : (
            <span style={{ display: 'inline-block', height: '1px' }} />
          )}
          <span
            className="book-card-chap-count"
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: T.badgeGreenText,
              background: T.badgeGreenBg,
              padding: '4px 10px',
              borderRadius: '999px',
              border: `1px solid ${T.badgeGreenBorder}`,
              marginLeft: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {chapCount > 0 ? `${toBengaliNumber(chapCount)} অধ্যায়` : 'প্রস্তুত'}
          </span>
        </div>

        <h4
          className="book-card-title"
          style={{
            fontSize: '20px',
            fontWeight: 800,
            color: T.text,
            lineHeight: 1.35,
            margin: '0 0 6px',
            minHeight: '54px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          title={titleDisplay}
        >
          {titleDisplay}
        </h4>

        {englishTitle ? (
          <p style={{ fontSize: '14px', color: T.textSubtle, fontStyle: 'italic', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {englishTitle}
          </p>
        ) : null}

        <div style={{ minHeight: '26px', marginTop: '2px', display: 'flex', alignItems: 'center' }}>
          {authorDisplay ? (
            <p
              className="book-card-author"
              style={{
                fontSize: '15px',
                color: T.textMuted,
                fontWeight: 600,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <span style={{ color: T.accent }}>✍️</span> {authorDisplay}
            </p>
          ) : (
            <span style={{ fontSize: '14px', color: T.textSubtle, opacity: 0.6 }}>✍️ অজানা লেখক</span>
          )}
        </div>

        {/* Card Bottom */}
        <div className="book-card-bottom" style={{ marginTop: 'auto', paddingTop: '10px', borderTop: `1px solid ${T.borderSubtle}` }}>
          {/* Reading progress badge */}
          {readingProgress && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span className="book-card-progress-text" style={{ fontSize: '12px', fontWeight: 700, color: T.textMuted }}>
                  📍 {Math.round(readingProgress.overallPct || 0)}% সম্পন্ন
                </span>
                <span className="book-card-progress-time" style={{ fontSize: '11px', color: T.textSubtle }}>
                  {formatRelativeTime(readingProgress.savedAt)}
                </span>
              </div>
              <div style={{ height: '4px', background: T.borderSubtle, borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round(readingProgress.overallPct || 0)}%`, background: T.accent, borderRadius: '999px', transition: 'width 0.4s' }} />
              </div>
            </div>
          )}
          {slug ? (
            <>
              <HoverLink
                href={readingProgress ? `/read/${slug}?chapter=${readingProgress.chapterNumber || 1}` : `/read/${slug}`}
                onClick={() => setNavigatingBookSlug(slug)}
                title={`${titleDisplay} পড়ুন`}
                className="book-card-read-btn"
                baseStyle={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 700,
                  background: isNavigating ? T.accentHover : T.buttonPrimaryBg,
                  color: T.buttonPrimaryText,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  cursor: isNavigating ? 'wait' : 'pointer',
                  gap: '6px',
                  boxSizing: 'border-box',
                }}
                hoverStyle={{ background: T.accentHover, color: '#ffffff', boxShadow: `0 4px 14px ${T.accent}55` }}
              >
                {isNavigating ? (
                  <LoadingSpinner variant="inline" size="xs" label="লোড হচ্ছে..." />
                ) : readingProgress ? (
                  <>📖 পড়া জারি রাখুন →</>
                ) : (
                  <>পড়া শুরু করুন ({toBengaliNumber(chapCount)} অধ্যায়) →</>
                )}
              </HoverLink>

              {/* Expandable Chapter List */}
              {chapters.length > 0 ? (
                <div style={{ marginTop: '6px', position: 'relative' }}>
                  <HoverButton
                    className="book-card-chapters-btn"
                    onClick={() => {
                      if (onOpenChapters) {
                        onOpenChapters(book);
                      } else if (toggleExpandChapters) {
                        toggleExpandChapters(slug);
                      }
                    }}
                    baseStyle={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      color: T.isDark ? '#e2e8f0' : '#5c4a32',
                      background: T.surfaceSubtle,
                      border: `1px solid ${T.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      boxSizing: 'border-box',
                    }}
                    hoverStyle={{ background: T.accentBg, color: T.accentText, borderColor: T.accentBorder }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '15px' }}>📑</span>
                      <span>অধ্যায়সমূহ দেখুন ({toBengaliNumber(chapters.length)} টি)</span>
                    </span>
                    <span
                      style={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        fontSize: '12px',
                      }}
                    >
                      ▼
                    </span>
                  </HoverButton>

                  {isExpanded && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '6px',
                        zIndex: 50,
                        maxHeight: '220px',
                        overflowY: 'auto',
                        borderRadius: '12px',
                        border: `1px solid ${T.border}`,
                        background: T.surface,
                        padding: '4px',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                      }}
                    >
                      {chapters.map((chap) => (
                        <HoverLink
                          key={chap.chapterNumber}
                          href={`/read/${slug}?chapter=${chap.chapterNumber}`}
                          onClick={() => setNavigatingBookSlug(`${slug}-ch${chap.chapterNumber}`)}
                          baseStyle={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            marginBottom: '3px',
                            fontSize: '15px',
                            textDecoration: 'none',
                            color: T.text,
                            background: T.surfaceSubtle,
                            border: `1px solid ${T.borderSubtle}`,
                            transition: 'all 0.15s',
                          }}
                          hoverStyle={{
                            background: T.accentBg,
                            borderColor: T.accentBorder,
                            color: T.accentText,
                            transform: 'translateX(3px)',
                          }}
                        >
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              flex: 1,
                              fontWeight: 500,
                            }}
                          >
                            {chap.chapterTitle || `অধ্যায় ${toBengaliNumber(chap.chapterNumber)}`}
                          </span>
                          <span
                            style={{
                              flexShrink: 0,
                              fontSize: '14px',
                              color: T.accentText,
                              fontWeight: 700,
                              background: T.accentBg,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              marginLeft: '8px',
                              border: `1px solid ${T.accentBorder}`,
                            }}
                          >
                            পড়ুন →
                          </span>
                        </HoverLink>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: T.textSubtle,
                    background: T.surfaceSubtle,
                    border: `1px dashed ${T.border}`,
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxSizing: 'border-box',
                  }}
                >
                  <span>📑</span>
                  <span>কোনো অধ্যায় যুক্ত নেই</span>
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                height: '92px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
                background: T.surfaceSubtle,
                border: `1px dashed ${T.borderSubtle}`,
                color: T.textSubtle,
                fontSize: '14px',
                fontWeight: 600,
                boxSizing: 'border-box',
              }}
            >
              শীঘ্রই আসছে
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Chapter Selection Modal Component ─────────────────────────────────────────
function ChapterModal({
  book,
  onClose,
  theme = CLIENT_THEMES.light,
  readingProgress = null,
  navigatingBookSlug,
  setNavigatingBookSlug,
}) {
  if (!book) return null;
  const T = theme;
  const chapters = book?.chapters || [];
  const chapCount = book?.chaptersCount || chapters.length || 0;
  const slug = book?.slug;

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '85vh',
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: '24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeUp 0.25s ease',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: `1px solid ${T.borderSubtle}`,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
            background: T.surfaceSubtle,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: '6px',
                  background: T.accentBg,
                  color: T.accentText,
                  border: `1px solid ${T.accentBorder}`,
                }}
              >
                📑 সূচিপত্র
              </span>
              <span style={{ fontSize: '13px', color: T.textMuted, fontWeight: 600 }}>
                {toBengaliNumber(chapCount)} টি অধ্যায়
              </span>
            </div>
            <h3 style={{ fontSize: '19px', fontWeight: 800, color: T.text, margin: '0 0 3px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {book.title}
            </h3>
            {book.author && book.author !== 'অজানা' && (
              <p style={{ fontSize: '14px', color: T.accent, margin: 0, fontWeight: 600 }}>
                ✍️ {book.author}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              color: T.textMuted,
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: 'bold',
              flexShrink: 0,
              transition: 'all 0.15s',
            }}
            title="বন্ধ করুন"
          >
            ✕
          </button>
        </div>

        {/* Modal Chapters List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', maxHeight: 'calc(85vh - 140px)' }}>
          {chapters.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: T.textMuted }}>
              কোনো অধ্যায় পাওয়া যায়নি
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {chapters.map((chap) => {
                const isCurrent = readingProgress && (readingProgress.chapterNumber === chap.chapterNumber || readingProgress.chapterIdx === (chap.chapterNumber - 1));
                const chapNavKey = `${slug}-ch${chap.chapterNumber}`;
                const isNav = navigatingBookSlug === chapNavKey;

                return (
                  <Link
                    key={chap.chapterNumber}
                    href={`/read/${slug}?chapter=${chap.chapterNumber}`}
                    onClick={() => {
                      if (setNavigatingBookSlug) setNavigatingBookSlug(chapNavKey);
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      color: isCurrent ? T.accentText : T.text,
                      background: isCurrent ? T.accentBg : T.surfaceSubtle,
                      border: `1px solid ${isCurrent ? T.accentBorder : T.borderSubtle}`,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = T.accent;
                      e.currentTarget.style.transform = 'translateX(3px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isCurrent ? T.accentBorder : T.borderSubtle;
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flex: 1 }}>
                      <span
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: isCurrent ? T.accent : T.surface,
                          color: isCurrent ? '#000' : T.textMuted,
                          fontSize: '13px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          border: `1px solid ${isCurrent ? T.accent : T.border}`,
                        }}
                      >
                        {toBengaliNumber(chap.chapterNumber)}
                      </span>
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: '14.5px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {chap.chapterTitle || `অধ্যায় ${toBengaliNumber(chap.chapterNumber)}`}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '10px' }}>
                      {isCurrent && (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: T.accentText, background: 'rgba(251,191,36,0.25)', padding: '2px 8px', borderRadius: '999px' }}>
                          চলমান
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: T.accentText,
                          background: T.accentBg,
                          padding: '4px 10px',
                          borderRadius: '8px',
                          border: `1px solid ${T.accentBorder}`,
                        }}
                      >
                        {isNav ? 'লোড হচ্ছে...' : 'পড়ুন →'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: `1px solid ${T.borderSubtle}`,
            background: T.surfaceSubtle,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <HoverButton
            onClick={onClose}
            baseStyle={{
              padding: '7px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              color: T.text,
              background: T.surface,
              border: `1px solid ${T.border}`,
              cursor: 'pointer',
            }}
            hoverStyle={{ borderColor: T.accent }}
          >
            বন্ধ করুন
          </HoverButton>
        </div>
      </div>
    </div>
  );
}

// ─── Series Books Horizontal Scroll Row Component ─────────────────────────────
function SeriesBookRow({
  books = [],
  seriesName,
  sharedCardProps,
  getProgress,
  onOpenChapters,
  theme,
}) {
  const scrollRef = React.useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 12);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 12);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollState, { passive: true });
      window.addEventListener('resize', updateScrollState);
      const timer = setTimeout(updateScrollState, 200);
      return () => {
        el.removeEventListener('scroll', updateScrollState);
        window.removeEventListener('resize', updateScrollState);
        clearTimeout(timer);
      };
    }
  }, [updateScrollState, books]);

  const handleScroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 310 * 2;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="series-books-wrapper">
      {/* Desktop Left Scroll Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll('left')}
          className="series-scroll-arrow series-scroll-arrow-left"
          title="পূর্ববর্তী বইসমূহ দেখুন"
          aria-label="বামে স্ক্রোল করুন"
          style={{
            background: theme.surface,
            borderColor: theme.border,
            color: theme.text,
          }}
        >
          ‹
        </button>
      )}

      {/* Desktop Right Scroll Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll('right')}
          className="series-scroll-arrow series-scroll-arrow-right"
          title="পরবর্তী বইসমূহ দেখুন"
          aria-label="ডানে স্ক্রোল করুন"
          style={{
            background: theme.surface,
            borderColor: theme.border,
            color: theme.text,
          }}
        >
          ›
        </button>
      )}

      {/* Scrollable Books Container */}
      <div
        ref={scrollRef}
        className="series-books-scroll-row"
      >
        {books.map((book) => (
          <div
            key={book.slug || book.title}
            className="series-book-card-item"
          >
            <BookCard
              book={book}
              tag={seriesName}
              bengaliTitle={book.title}
              englishTitle={null}
              readingProgress={getProgress(book)}
              onOpenChapters={onOpenChapters}
              {...sharedCardProps}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Library Component ───────────────────────────────────────────────────
export default function HomeLibrary({
  diskBooks = [],
  initialSeries = [],
  initialAuthors = [],
  isDatabaseConnected = false,
}) {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'all-books'
  const [selectedSeriesName, setSelectedSeriesName] = useState(null);
  const [selectedAuthor, setSelectedAuthor] = useState('all');
  const [selectedSeriesFilter, setSelectedSeriesFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [booksList, setBooksList] = useState(diskBooks);
  const [seriesList, setSeriesList] = useState(initialSeries);
  const [authorsList, setAuthorsList] = useState(initialAuthors);
  const [expandedBookSlug, setExpandedBookSlug] = useState(null);
  const [navigatingBookSlug, setNavigatingBookSlug] = useState(null);
  const [modalBook, setModalBook] = useState(null);
  const [isDark, setIsDark] = useState(false);
  // Reading progress map: bookSlug -> progress object
  const [lastReadMap, setLastReadMap] = useState({});

  // useLayoutEffect runs synchronously before the browser paints —
  // React hydrates with false (matches server), then this flips it
  // before the first visible frame, so there is no blink.
  useLayoutEffect(() => {
    const theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'dark') setIsDark(true);
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ebook_theme', next ? 'dark' : 'light');
        const d = document.documentElement;
        d.setAttribute('data-theme', next ? 'dark' : 'light');
        d.style.setProperty('--bg', next ? '#0c0e14' : '#faf9f5');
        d.style.setProperty('--text', next ? '#f3f4f6' : '#1c1917');
        d.style.background = next ? '#0c0e14' : '#faf9f5';
        d.style.colorScheme = next ? 'dark' : 'light';
      } catch (e) { }
      return next;
    });
  };

  const T = isDark ? CLIENT_THEMES.dark : CLIENT_THEMES.light;

  // Sync props to state if props update
  useEffect(() => {
    if (diskBooks && diskBooks.length > 0) setBooksList(diskBooks);
    if (initialSeries && initialSeries.length > 0) setSeriesList(initialSeries);
    if (initialAuthors && initialAuthors.length > 0) setAuthorsList(initialAuthors);
  }, [diskBooks, initialSeries, initialAuthors]);

  // Load reading progress from localStorage on mount (client only)
  useEffect(() => {
    try {
      const all = loadAllReadingProgress();
      const map = {};
      for (const p of all) { if (p.bookSlug) map[p.bookSlug] = p; }
      setLastReadMap(map);
    } catch (e) { }
  }, []);

  // Restore view, series, and filters from URL or sessionStorage on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlView = params.get('view');
      const urlSeries = params.get('series');
      const urlAuthor = params.get('author');
      const urlSFilter = params.get('sfilter');
      const urlQ = params.get('q');

      const saved = sessionStorage.getItem('library_state');
      const savedState = saved ? JSON.parse(saved) : {};

      const finalView = urlView || savedState.currentView || 'home';
      const finalSeries = urlSeries !== null ? urlSeries : (savedState.selectedSeriesName || null);
      const finalAuthor = urlAuthor || savedState.selectedAuthor || 'all';
      const finalSFilter = urlSFilter || savedState.selectedSeriesFilter || 'all';
      const finalQ = urlQ !== null ? urlQ : (savedState.searchQuery || '');

      if (finalView) setCurrentView(finalView);
      if (finalSeries !== undefined) setSelectedSeriesName(finalSeries);
      if (finalAuthor) setSelectedAuthor(finalAuthor);
      if (finalSFilter) setSelectedSeriesFilter(finalSFilter);
      if (finalQ) setSearchQuery(finalQ);
    } catch (e) { }
  }, []);

  // Sync state to URL query and sessionStorage
  useEffect(() => {
    try {
      const stateToSave = {
        currentView,
        selectedSeriesName,
        selectedAuthor,
        selectedSeriesFilter,
        searchQuery,
      };
      sessionStorage.setItem('library_state', JSON.stringify(stateToSave));
      sessionStorage.setItem('library_view', currentView);

      const params = new URLSearchParams();
      if (currentView !== 'home') params.set('view', currentView);
      if (selectedSeriesName) params.set('series', selectedSeriesName);
      if (selectedAuthor !== 'all') params.set('author', selectedAuthor);
      if (selectedSeriesFilter !== 'all') params.set('sfilter', selectedSeriesFilter);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());

      const qs = params.toString();
      const newUrl = qs ? `/?${qs}` : '/';
      window.history.replaceState(null, '', newUrl);
    } catch (e) { }
  }, [currentView, selectedSeriesName, selectedAuthor, selectedSeriesFilter, searchQuery]);

  // Listen to browser forward/back buttons
  useEffect(() => {
    const handlePopState = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        setCurrentView(params.get('view') || 'home');
        setSelectedSeriesName(params.get('series') || null);
        setSelectedAuthor(params.get('author') || 'all');
        setSelectedSeriesFilter(params.get('sfilter') || 'all');
        setSearchQuery(params.get('q') || '');
      } catch (e) { }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Client-side fetch to ensure books, series, and authors are always synced from DB
  useEffect(() => {
    fetch('/api/books')
      .then((res) => res.json())
      .then((json) => {
        if (json && json.success) {
          if (Array.isArray(json.data) && json.data.length > 0) setBooksList(json.data);
          if (Array.isArray(json.series) && json.series.length > 0) setSeriesList(json.series);
          if (Array.isArray(json.authors) && json.authors.length > 0) setAuthorsList(json.authors);
        }
      })
      .catch((err) => console.warn('Could not fetch /api/books:', err));
  }, []);

  const toggleExpandChapters = useCallback((slug) => {
    setExpandedBookSlug((prev) => (prev === slug ? null : slug));
  }, []);

  // Compute total stats
  const totalChapters = useMemo(() => {
    return booksList.reduce(
      (sum, b) => sum + (b.chaptersCount || (b.chapters ? b.chapters.length : 0)),
      0
    );
  }, [booksList]);

  // Build series with books grouped under each series
  const enrichedSeries = useMemo(() => {
    const seriesMap = new Map();

    // From seriesList
    for (const s of seriesList) {
      seriesMap.set(s.name, {
        name: s.name,
        author: s.author || '',
        description: s.description || '',
        image: s.image || '',
        books: [],
      });
    }

    const unassignedBooks = [];

    // Assign all books
    for (const b of booksList) {
      const sName = b.series;
      if (sName && sName !== 'সাধারণ সংকলন') {
        if (!seriesMap.has(sName)) {
          seriesMap.set(sName, {
            name: sName,
            author: b.author && b.author !== 'অজানা' ? b.author : '',
            description: '',
            image: '',
            books: [],
          });
        }
        seriesMap.get(sName).books.push(b);
        if (!seriesMap.get(sName).author && b.author && b.author !== 'অজানা') {
          seriesMap.get(sName).author = b.author;
        }
      } else {
        unassignedBooks.push(b);
      }
    }

    return {
      series: Array.from(seriesMap.values()),
      unassigned: unassignedBooks,
    };
  }, [seriesList, booksList]);

  // Unique list of authors for the filter
  const allAuthors = useMemo(() => {
    const set = new Set(authorsList);
    booksList.forEach((b) => {
      if (b.author && b.author !== 'অজানা') set.add(b.author);
    });
    seriesList.forEach((s) => {
      if (s.author && s.author !== 'অজানা') set.add(s.author);
    });
    return Array.from(set).filter(Boolean);
  }, [authorsList, booksList, seriesList]);

  // Filter books for "All Books" view based on Search + Writer Filter + Series Filter
  const filteredAllBooks = useMemo(() => {
    return booksList.filter((b) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (b.title || '').toLowerCase().includes(q);
        const authorMatch = (b.author || '').toLowerCase().includes(q);
        const seriesMatch = (b.series || '').toLowerCase().includes(q);
        if (!titleMatch && !authorMatch && !seriesMatch) return false;
      }

      // 2. Author / Writer Filter
      if (selectedAuthor !== 'all') {
        if (b.author !== selectedAuthor) return false;
      }

      // 3. Series Filter
      if (selectedSeriesFilter !== 'all') {
        if (b.series !== selectedSeriesFilter) return false;
      }

      return true;
    });
  }, [booksList, searchQuery, selectedAuthor, selectedSeriesFilter]);

  // Active series detail if selected
  const activeSeries = useMemo(() => {
    if (!selectedSeriesName) return null;
    return enrichedSeries.series.find((s) => s.name === selectedSeriesName) || null;
  }, [selectedSeriesName, enrichedSeries]);

  // Shared card props
  const sharedCardProps = {
    navigatingBookSlug,
    setNavigatingBookSlug,
    expandedBookSlug,
    toggleExpandChapters,
    onOpenChapters: (book) => setModalBook(book),
    theme: T,
  };

  // Helper to look up reading progress for a book by its possible slugs
  const getProgress = useCallback((book) => {
    if (!book) return null;
    const slug = book.slug;
    if (slug && lastReadMap[slug]) return lastReadMap[slug];
    if (slug) {
      const decoded = decodeURIComponent(slug);
      if (lastReadMap[decoded]) return lastReadMap[decoded];
    }
    return null;
  }, [lastReadMap]);

  // Recently read books (sorted most recent first, max 3 shown in banner)
  const recentlyRead = useMemo(() => {
    const progressList = Object.values(lastReadMap).sort(
      (a, b) => new Date(b.savedAt) - new Date(a.savedAt)
    );
    return progressList.slice(0, 6).map((p) => {
      const book = booksList.find(
        (b) => b.slug === p.bookSlug || b.slug === encodeURIComponent(p.bookSlug) ||
          decodeURIComponent(b.slug) === p.bookSlug
      );
      return { progress: p, book };
    }).filter((item) => item.progress);
  }, [lastReadMap, booksList]);

  // Nav tab styles
  const tabBase = {
    padding: '7px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
  };
  const tabActive = { ...tabBase, background: T.navTabActiveBg, color: T.navTabActiveText, boxShadow: T.navTabActiveShadow };
  const tabInactive = { ...tabBase, background: 'transparent', color: T.navTabInactiveText };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.bg,
        color: T.text,
        fontFamily: "'Anek Bangla', 'Noto Serif Bengali', system-ui, sans-serif",
        transition: 'background-color 0.25s ease, color 0.25s ease',
      }}
    >
      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: T.headerBg,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${T.border}`,
          transition: 'background-color 0.25s, border-color 0.25s',
        }}
      >
        <div
          className="app-header-container"
          style={{
            maxWidth: '1060px',
            margin: '0 auto',
            width: '100%',
          }}
        >
          {/* Brand Wrap */}
          <div className="app-header-brand-wrap">
            <HoverButton
              onClick={() => {
                setCurrentView('home');
                setSelectedSeriesName(null);
              }}
              baseStyle={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 0',
                transition: 'transform 0.2s',
                textAlign: 'left',
              }}
              hoverStyle={{ transform: 'scale(1.02)' }}
            >
              <Image
                src="/logo.png"
                alt="অক্ষরমালা"
                width={42}
                height={42}
                className="rounded-xl"
              />
              <div>
                <span className="app-header-brand-title" style={{ fontSize: '22px', fontWeight: 800, color: T.text, display: 'block', lineHeight: 1.1 }}>
                  অক্ষরমালা
                </span>
                <span className="app-header-brand-subtitle" style={{ fontSize: '13px', color: T.textMuted, lineHeight: 1 }}>বাংলা ডিজিটাল পাঠাগার</span>
              </div>
            </HoverButton>
          </div>

          {/* Navigation Views */}
          <nav
            className="app-header-nav"
            style={{
              background: T.navContainerBg,
              borderRadius: '14px',
              padding: '4px',
              gap: '2px',
            }}
          >
            <button
              onClick={() => {
                setCurrentView('home');
                setSelectedSeriesName(null);
              }}
              style={currentView === 'home' && !selectedSeriesName ? tabActive : tabInactive}
            >
              📖 সিরিজ ও সংকলন
            </button>
            <button
              onClick={() => {
                setCurrentView('all-books');
                setSelectedSeriesName(null);
              }}
              style={currentView === 'all-books' ? tabActive : tabInactive}
            >
              📚 সকল বই ({toBengaliNumber(booksList.length)})
            </button>
          </nav>

          {/* Status, Night Mode & Admin Link */}
          <div className="app-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Night Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'লাইট মোডে পরিবর্তন করুন' : 'নাইট মোডে পরিবর্তন করুন'}
              className="header-action-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 700,
                color: T.text,
                background: T.surface,
                padding: '6px 12px',
                borderRadius: '999px',
                border: `1px solid ${T.border}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = T.accent;
                e.currentTarget.style.color = T.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.color = T.text;
              }}
            >
              <span style={{ fontSize: '15px', lineHeight: 1 }}>{isDark ? '☀️' : '🌙'}</span>
              <span className="theme-btn-text-full">{isDark ? 'লাইট মোড' : 'নাইট মোড'}</span>
              <span className="theme-btn-text-short">{isDark ? 'লাইট' : 'নাইট'}</span>
            </button>

            <Link
              href="/admin"
              className="header-action-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '13px',
                fontWeight: 700,
                color: T.textMuted,
                background: T.surface,
                padding: '6px 12px',
                borderRadius: '999px',
                border: `1px solid ${T.border}`,
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = T.buttonPrimaryBg;
                e.currentTarget.style.color = T.buttonPrimaryText;
                e.currentTarget.style.borderColor = T.buttonPrimaryBg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = T.surface;
                e.currentTarget.style.color = T.textMuted;
                e.currentTarget.style.borderColor = T.border;
              }}
            >
              ⚙ Admin
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ─────────────────────────────────────────────── */}
      <main className="main-content-container" style={{ maxWidth: '1060px', margin: '0 auto' }}>
        {/* ═════════════════════════════════════════════════════════════════════
            VIEW: HOME — SERIES WITH BOOKS UNDER EACH SERIES
           ═════════════════════════════════════════════════════════════════════ */}
        {currentView === 'home' && !selectedSeriesName && (
          <div>
            {/* Library Hero Banner */}
            <div
              style={{
                marginBottom: '32px',
                background: T.heroBg,
                border: `1px solid ${T.heroBorder}`,
                borderRadius: '24px',
                padding: '28px 24px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '20px',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    color: T.accentText,
                    background: T.accentBg,
                    padding: '4px 12px',
                    borderRadius: '999px',
                    border: `1px solid ${T.accentBorder}`,
                    marginBottom: '10px',
                  }}
                >
                  ✨ ডিজিটাল বাংলা ই-বুক সংকলন
                </div>
                <h1 style={{ fontSize: 'clamp(24px, 4vw, 34px)', fontWeight: 800, color: T.text, lineHeight: 1.2, margin: '0 0 8px' }}>
                  বই সিরিজ এবং সাহিত্য সমগ্র
                </h1>
                <p style={{ color: T.textMuted, fontSize: '16px', maxWidth: '540px', margin: 0, lineHeight: 1.6 }}>
                  এখানে প্রতিটি সিরিজের অধীনে ক্রমানুসারে বইগুলো সাজানো রয়েছে। পছন্দের সিরিজে ক্লিক করে এর সকল বই উপভোগ করুন।
                </p>
              </div>

              {/* Stats badges */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '12px 18px', textAlign: 'center', minWidth: '90px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: T.accent, display: 'block' }}>
                    {toBengaliNumber(enrichedSeries.series.length)}
                  </span>
                  <span style={{ fontSize: '13px', color: T.textMuted, fontWeight: 600 }}>মোট সিরিজ</span>
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '12px 18px', textAlign: 'center', minWidth: '90px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: T.text, display: 'block' }}>
                    {toBengaliNumber(booksList.length)}
                  </span>
                  <span style={{ fontSize: '13px', color: T.textMuted, fontWeight: 600 }}>মোট বই</span>
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '12px 18px', textAlign: 'center', minWidth: '90px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#22c55e', display: 'block' }}>
                    {toBengaliNumber(totalChapters)}
                  </span>
                  <span style={{ fontSize: '13px', color: T.textMuted, fontWeight: 600 }}>মোট অধ্যায়</span>
                </div>
              </div>
            </div>

            {/* ── Last Read / Continue Reading Section ───────────────────── */}
            {recentlyRead.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '18px' }}>📚</span>
                  <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: T.text }}>পড়া জারি রাখুন</h2>
                  <span style={{
                    fontSize: '12px', fontWeight: 700, color: T.accentText,
                    background: T.accentBg, border: `1px solid ${T.accentBorder}`,
                    padding: '2px 10px', borderRadius: '999px',
                  }}>
                    {toBengaliNumber(recentlyRead.length)} টি বই
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '6px' }}>
                  {recentlyRead.map(({ progress: p, book }) => {
                    const rSlug = p.bookSlug;
                    const rTitle = p.bookTitle || book?.title || rSlug;
                    const pct = Math.round(p.overallPct || 0);
                    const timeAgo = formatRelativeTime(p.savedAt);
                    const isNav = navigatingBookSlug === rSlug;
                    return (
                      <Link
                        key={rSlug}
                        href={`/read/${rSlug}?chapter=${p.chapterNumber || 1}`}
                        onClick={() => setNavigatingBookSlug(rSlug)}
                        style={{
                          flexShrink: 0,
                          width: '220px',
                          background: T.surface,
                          border: `1px solid ${T.border}`,
                          borderRadius: '16px',
                          padding: '14px 16px',
                          textDecoration: 'none',
                          color: T.text,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          boxShadow: T.cardShadow,
                          transition: 'all 0.2s',
                          cursor: isNav ? 'wait' : 'pointer',
                          boxSizing: 'border-box',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = T.accent;
                          e.currentTarget.style.boxShadow = T.cardHoverShadow;
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = T.border;
                          e.currentTarget.style.boxShadow = T.cardShadow;
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {/* Accent strip */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: T.accent, borderRadius: '16px 16px 0 0' }} />
                        <div style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1.3, color: T.text, marginTop: '4px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {rTitle}
                        </div>
                        <div style={{ fontSize: '12px', color: T.textMuted }}>
                          {p.chapterTitle
                            ? <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.chapterTitle}</span>
                            : <span>অধ্যায় {toBengaliNumber(p.chapterIdx + 1)} / {toBengaliNumber(p.totalChapters)}</span>
                          }
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: T.textMuted, marginBottom: '4px', fontWeight: 600 }}>
                            <span>{pct}% সম্পন্ন</span>
                            <span>{timeAgo}</span>
                          </div>
                          <div style={{ height: '5px', background: T.borderSubtle, borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: T.accent, borderRadius: '999px' }} />
                          </div>
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: T.accent, marginTop: '2px' }}>
                          {isNav ? 'খোলা হচ্ছে...' : 'পড়া জারি রাখুন →'}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Series Pills navigation */}
            {enrichedSeries.series.length > 1 && (
              <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: T.textMuted, flexShrink: 0, marginRight: '4px' }}>
                  সিরিজ তালিকা:
                </span>
                {enrichedSeries.series.map((s) => (
                  <HoverButton
                    key={s.name}
                    onClick={() => setSelectedSeriesName(s.name)}
                    baseStyle={{
                      padding: '6px 14px',
                      borderRadius: '999px',
                      fontSize: '14px',
                      fontWeight: 700,
                      background: T.pillBg,
                      border: `1px solid ${T.pillBorder}`,
                      color: T.pillText,
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                    hoverStyle={{ background: T.accentBg, borderColor: T.accentBorder, color: T.accentText }}
                  >
                    <span>📚 {s.name}</span>
                    <span style={{ fontSize: '12px', background: T.pillCountBg, padding: '1px 6px', borderRadius: '999px', color: T.pillCountText }}>
                      {toBengaliNumber(s.books.length)}
                    </span>
                  </HoverButton>
                ))}
              </div>
            )}

            {/* ─── SERIES SECTIONS (Showing series, and all books under each series) ─── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '38px' }}>
              {enrichedSeries.series.map((series) => {
                const sChapCount = series.books.reduce(
                  (sum, b) => sum + (b.chaptersCount || (b.chapters ? b.chapters.length : 0)),
                  0
                );
                const hasImg = !!series.image;
                const hasExpandedBook = series.books.some((b) => b.slug === expandedBookSlug);

                return (
                  <div
                    key={series.name}
                    className="series-card-container"
                    style={{
                      position: 'relative',
                      zIndex: hasExpandedBook ? 10 : 1,
                      background: hasImg ? '#1a1816' : T.surface,
                      borderRadius: '24px',
                      border: `1px solid ${hasImg ? '#282d42' : T.border}`,
                      boxShadow: T.cardShadow,
                    }}
                  >
                    {/* Background image wrapper */}
                    {hasImg && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '23px',
                          overflow: 'hidden',
                          pointerEvents: 'none',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: `url("${series.image}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center top',
                            backgroundRepeat: 'no-repeat',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background:
                              'linear-gradient(180deg, rgba(15,18,28,0.45) 0%, rgba(15,18,28,0.85) 100%)',
                          }}
                        />
                      </div>
                    )}

                    {/* Content on top */}
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      {/* Header */}
                      <div
                        className="series-header"
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '12px',
                          marginBottom: '16px',
                          paddingBottom: hasImg ? 0 : '14px',
                          borderBottom: hasImg ? 'none' : `1px solid ${T.borderSubtle}`,
                        }}
                      >
                        <div style={{ flex: '1 1 200px', minWidth: 0, width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: 800,
                                color: hasImg ? '#fbbf24' : T.accentText,
                                background: hasImg ? 'rgba(251,191,36,0.22)' : T.accentBg,
                                border: hasImg ? '1px solid rgba(251,191,36,0.45)' : `1px solid ${T.accentBorder}`,
                                padding: '3px 9px',
                                borderRadius: '999px',
                              }}
                            >
                              বই সিরিজ
                            </span>
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                color: hasImg ? '#ffffff' : T.textMuted,
                                background: hasImg ? 'rgba(255,255,255,0.2)' : T.surfaceSubtle,
                                border: hasImg ? '1px solid rgba(255,255,255,0.3)' : `1px solid ${T.borderSubtle}`,
                                padding: '3px 9px',
                                borderRadius: '999px',
                              }}
                            >
                              {toBengaliNumber(series.books.length)} টি বই
                            </span>
                          </div>

                          <h2
                            style={{
                              fontSize: 'clamp(18px, 3.5vw, 26px)',
                              fontWeight: 800,
                              color: hasImg ? '#ffffff' : T.text,
                              margin: '0 0 6px',
                              lineHeight: 1.3,
                              wordBreak: 'break-word',
                              overflowWrap: 'anywhere',
                              textShadow: hasImg ? '0 2px 8px rgba(0,0,0,0.7)' : 'none',
                            }}
                          >
                            {series.name}
                          </h2>

                          {series.author && (
                            <p style={{ fontSize: '15px', color: hasImg ? '#fde68a' : T.accent, fontWeight: 700, margin: '0 0 6px' }}>
                              ✍️ লেখক: {series.author}
                            </p>
                          )}

                          {series.description && (
                            <p
                              style={{
                                fontSize: '14px',
                                color: hasImg ? '#e5e7eb' : T.textMuted,
                                margin: 0,
                                maxWidth: '680px',
                                lineHeight: 1.5,
                              }}
                            >
                              {series.description}
                            </p>
                          )}
                        </div>

                        <div
                          className="series-header-actions"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '13px',
                              color: hasImg ? '#f3f4f6' : T.textMuted,
                              background: hasImg ? 'rgba(0,0,0,0.6)' : T.surfaceSubtle,
                              padding: '6px 12px',
                              borderRadius: '10px',
                              border: hasImg ? '1px solid rgba(255,255,255,0.25)' : `1px solid ${T.borderSubtle}`,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            মোট {toBengaliNumber(sChapCount)} টি অধ্যায়
                          </span>
                          <HoverButton
                            onClick={() => setSelectedSeriesName(series.name)}
                            baseStyle={{
                              fontSize: '13px',
                              fontWeight: 800,
                              color: '#78350f',
                              background: '#fde68a',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '7px 14px',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              whiteSpace: 'nowrap',
                            }}
                            hoverStyle={{ background: '#f59e0b', color: '#ffffff', transform: 'scale(1.02)' }}
                          >
                            একক দৃশ্য →
                          </HoverButton>
                        </div>
                      </div>

                      {/* Books */}
                      {series.books.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px 16px', background: T.surfaceSubtle, borderRadius: '16px', border: `1px dashed ${T.border}` }}>
                          <p style={{ fontSize: '13px', color: T.textMuted, margin: 0 }}>
                            এই সিরিজে এখনো কোনো বই যুক্ত করা হয়নি। Admin থেকে এই সিরিজে নতুন বই যুক্ত করতে পারেন।
                          </p>
                        </div>
                      ) : (
                        <SeriesBookRow
                          books={series.books}
                          seriesName={series.name}
                          sharedCardProps={sharedCardProps}
                          getProgress={getProgress}
                          onOpenChapters={(b) => setModalBook(b)}
                          theme={T}
                        />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Unassigned / Standalone Books */}
              {enrichedSeries.unassigned.length > 0 && (
                <div
                  style={{
                    background: T.surface,
                    borderRadius: '24px',
                    border: `1px solid ${T.border}`,
                    padding: '24px',
                    boxShadow: T.cardShadow,
                  }}
                >
                  <div
                    style={{
                      borderBottom: `1px solid ${T.borderSubtle}`,
                      paddingBottom: '14px',
                      marginBottom: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <h2 style={{ fontSize: '22px', fontWeight: 800, color: T.text, margin: 0 }}>
                        📖 একক ও অন্যান্য বইসমূহ
                      </h2>
                      <p style={{ fontSize: '14px', color: T.textMuted, margin: '3px 0 0' }}>
                        কোনো নির্দিষ্ট সিরিজের বাইরে রক্ষিত একক বইসমূহ
                      </p>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: T.textMuted, background: T.surfaceSubtle, padding: '3px 10px', borderRadius: '999px', border: `1px solid ${T.borderSubtle}` }}>
                      {toBengaliNumber(enrichedSeries.unassigned.length)} টি বই
                    </span>
                  </div>

                  <div className="books-grid">
                    {enrichedSeries.unassigned.map((book) => (
                      <BookCard
                        key={book.slug || book.title}
                        book={book}
                        tag="একক বই"
                        bengaliTitle={book.title}
                        englishTitle={null}
                        readingProgress={getProgress(book)}
                        {...sharedCardProps}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            VIEW: SINGLE SERIES FOCUS
           ═════════════════════════════════════════════════════════════════════ */}
        {currentView === 'home' && selectedSeriesName && activeSeries && (
          <div>
            <HoverButton
              onClick={() => setSelectedSeriesName(null)}
              baseStyle={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '15px',
                fontWeight: 700,
                color: T.textMuted,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0 0 20px',
                transition: 'all 0.15s',
              }}
              hoverStyle={{ color: T.accent, transform: 'translateX(-3px)' }}
            >
              ← সকল সিরিজে ফিরে যান
            </HoverButton>

            <div
              style={{
                position: 'relative',
                backgroundImage: activeSeries.image
                  ? `linear-gradient(90deg, rgba(28,25,23,0.95) 0%, rgba(28,25,23,0.8) 45%, rgba(28,25,23,0.55) 100%), url("${activeSeries.image}")`
                  : 'linear-gradient(135deg, #1c1917, #292524)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                borderRadius: '24px',
                padding: '28px 24px',
                color: '#ffffff',
                marginBottom: '28px',
                boxShadow: '0 8px 15px rgba(0,0,0,0.15)',
                display: 'flex',
                gap: '24px',
                alignItems: 'center',
                flexWrap: 'wrap',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#fbbf24',
                    background: 'rgba(251,191,36,0.15)',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    border: '1px solid rgba(251,191,36,0.3)',
                  }}
                >
                  বই সিরিজ
                </span>

                <h1
                  style={{
                    fontSize: 'clamp(22px, 4vw, 32px)',
                    fontWeight: 800,
                    margin: '8px 0 6px',
                    color: '#fff',
                  }}
                >
                  {activeSeries.name}
                </h1>

                {activeSeries.author && (
                  <p
                    style={{
                      fontSize: '16px',
                      color: '#fbbf24',
                      fontWeight: 700,
                      margin: '0 0 8px',
                    }}
                  >
                    ✍️ লেখক: {activeSeries.author}
                  </p>
                )}

                {activeSeries.description && (
                  <p
                    style={{
                      fontSize: '15px',
                      color: '#d6d3d1',
                      margin: '0 0 16px',
                      maxWidth: '600px',
                      lineHeight: 1.6,
                    }}
                  >
                    {activeSeries.description}
                  </p>
                )}

                <div
                  style={{
                    display: 'flex',
                    gap: '16px',
                    fontSize: '14px',
                    color: '#a8a29e',
                  }}
                >
                  <span>
                    📚 {toBengaliNumber(activeSeries.books.length)} টি বই
                  </span>

                  <span>
                    📑{' '}
                    {toBengaliNumber(
                      activeSeries.books.reduce(
                        (s, b) => s + (b.chaptersCount || 0),
                        0
                      )
                    )}{' '}
                    টি অধ্যায়
                  </span>
                </div>
              </div>
            </div>

            <div className="books-grid">
              {activeSeries.books.map((book) => (
                <BookCard
                  key={book.slug || book.title}
                  book={book}
                  tag={activeSeries.name}
                  bengaliTitle={book.title}
                  englishTitle={null}
                  readingProgress={getProgress(book)}
                  {...sharedCardProps}
                />
              ))}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            VIEW: ALL BOOKS WITH WRITER / AUTHOR & SERIES FILTER
           ═════════════════════════════════════════════════════════════════════ */}
        {currentView === 'all-books' && (
          <div>
            {/* Header */}
            <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <h1 style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 800, color: T.text, margin: 0 }}>
                    সকল বই (All Books)
                  </h1>
                  <p style={{ fontSize: '15px', color: T.textMuted, margin: '4px 0 0' }}>
                    পাঠাগারের সমস্ত বই, লেখক ও সিরিজভিত্তিক ফিল্টার সুবিধা সহ
                  </p>
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative', width: '280px', flexShrink: 0 }}>
                  <svg
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: T.textSubtle, pointerEvents: 'none' }}
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="বইয়ের নাম বা লেখক খুঁজুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      paddingLeft: '36px',
                      paddingRight: '12px',
                      paddingTop: '9px',
                      paddingBottom: '9px',
                      fontSize: '15px',
                      background: T.inputBg,
                      border: `1px solid ${T.inputBorder}`,
                      borderRadius: '12px',
                      color: T.text,
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = T.accent;
                      e.target.style.boxShadow = `0 0 0 3px ${T.accent}33`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = T.inputBorder;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* ── Filter Controls: Writer & Series ── */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '14px',
                  alignItems: 'center',
                  background: T.surface,
                  padding: '12px 16px',
                  borderRadius: '14px',
                  border: `1px solid ${T.border}`,
                }}
              >
                {/* Writer / Author Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: T.text, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>✍️</span> লেখক:
                  </span>
                  <select
                    value={selectedAuthor}
                    onChange={(e) => setSelectedAuthor(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${T.selectBorder}`,
                      background: T.selectBg,
                      fontSize: '14px',
                      fontWeight: 600,
                      color: T.text,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="all">সকল লেখক (All)</option>
                    {allAuthors.map((auth) => (
                      <option key={auth} value={auth}>
                        {auth}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Series Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: T.text, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>📚</span> সিরিজ:
                  </span>
                  <select
                    value={selectedSeriesFilter}
                    onChange={(e) => setSelectedSeriesFilter(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: `1px solid ${T.selectBorder}`,
                      background: T.selectBg,
                      fontSize: '14px',
                      fontWeight: 600,
                      color: T.text,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="all">সকল সিরিজ (All)</option>
                    {enrichedSeries.series.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reset Filters */}
                {(selectedAuthor !== 'all' || selectedSeriesFilter !== 'all' || searchQuery.trim()) && (
                  <button
                    onClick={() => {
                      setSelectedAuthor('all');
                      setSelectedSeriesFilter('all');
                      setSearchQuery('');
                    }}
                    style={{
                      marginLeft: 'auto',
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: '1px solid #fca5a5',
                      background: '#fef2f2',
                      color: '#b91c1c',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ✕ ফিল্টার রিসেট
                  </button>
                )}
              </div>
            </div>

            {/* Filtered Books Grid or Empty State */}
            {filteredAllBooks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: T.surface, borderRadius: '20px', border: `2px dashed ${T.border}` }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <h3 style={{ fontSize: '21px', fontWeight: 700, color: T.text, marginBottom: '8px' }}>
                  কোনো বই পাওয়া যায়নি
                </h3>
                <p style={{ fontSize: '15px', color: T.textMuted, maxWidth: '340px', margin: '0 auto', lineHeight: 1.7 }}>
                  আপনার নির্বাচিত ফিল্টার বা খোঁজের সাথে কোনো বই মিলছে না। ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।
                </p>
                <HoverButton
                  onClick={() => {
                    setSelectedAuthor('all');
                    setSelectedSeriesFilter('all');
                    setSearchQuery('');
                  }}
                  baseStyle={{
                    marginTop: '16px',
                    padding: '8px 20px',
                    background: T.buttonPrimaryBg,
                    color: T.buttonPrimaryText,
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  hoverStyle={{ background: T.buttonPrimaryHover }}
                >
                  সব বই প্রদর্শন করুন
                </HoverButton>
              </div>
            ) : (
              <div className="books-grid">
                {filteredAllBooks.map((book) => (
                  <BookCard
                    key={book.slug || book.title}
                    book={book}
                    tag={book.series && book.series !== 'সাধারণ সংকলন' ? book.series : null}
                    bengaliTitle={book.title}
                    englishTitle={null}
                    readingProgress={getProgress(book)}
                    {...sharedCardProps}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Chapter Selection Modal */}
      {modalBook && (
        <ChapterModal
          book={modalBook}
          onClose={() => setModalBook(null)}
          theme={T}
          readingProgress={getProgress(modalBook)}
          navigatingBookSlug={navigatingBookSlug}
          setNavigatingBookSlug={setNavigatingBookSlug}
        />
      )}
    </div>
  );
}
