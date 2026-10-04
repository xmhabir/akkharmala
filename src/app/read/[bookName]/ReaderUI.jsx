'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  saveReadingProgress,
  loadReadingProgress,
  formatRelativeTime,
} from '../../../lib/readingProgress';

const toBengaliNumber = (num) => {
  const d = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  return String(num).replace(/\d/g, (n) => d[Number(n)]);
};

const FONT_SIZES = [
  { label: 'ছোট',           size: '16px', line: '2.0' },
  { label: 'স্বাভাবিক',    size: '19px', line: '2.1' },
  { label: 'বড়',            size: '22px', line: '2.2' },
  { label: 'অতিরিক্ত বড়', size: '26px', line: '2.3' },
];

const THEMES = {
  light: {
    id: 'light', label: 'লাইট', icon: '☀️',
    bg: '#faf9f5', text: '#1c1917', muted: '#78716c',
    border: '#e7e5e4', headerBg: 'rgba(250,249,245,0.93)',
    navBg: 'rgba(255,255,255,0.93)', navBorder: '#e7e5e4',
    tocBg: '#faf9f5', tocText: '#1c1917', tocBorder: '#e7e5e4',
    activeBg: '#1c1917', activeText: '#ffffff',
    bar: '#0284c7', btnBg: 'rgba(0,0,0,0.06)',
    toastBg: '#ffffff', toastBorder: '#e7e5e4', toastAccent: '#0284c7',
    continueBg: '#0284c7', continueText: '#ffffff',
  },
  sepia: {
    id: 'sepia', label: 'সেপিয়া', icon: '📖',
    bg: '#f4ecd8', text: '#433422', muted: '#8c7355',
    border: '#dfcca0', headerBg: 'rgba(244,236,216,0.93)',
    navBg: 'rgba(240,228,198,0.95)', navBorder: '#dfcca0',
    tocBg: '#f4ecd8', tocText: '#433422', tocBorder: '#dfcca0',
    activeBg: '#5c4033', activeText: '#f4ecd8',
    bar: '#a05a2c', btnBg: 'rgba(92,64,51,0.08)',
    toastBg: '#f4ecd8', toastBorder: '#dfcca0', toastAccent: '#a05a2c',
    continueBg: '#5c4033', continueText: '#f4ecd8',
  },
  dark: {
    id: 'dark', label: 'ডার্ক', icon: '🌙',
    bg: '#121316', text: '#e4e4e7', muted: '#a1a1aa',
    border: '#27272a', headerBg: 'rgba(18,19,22,0.93)',
    navBg: 'rgba(26,27,32,0.96)', navBorder: '#27272a',
    tocBg: '#121316', tocText: '#e4e4e7', tocBorder: '#27272a',
    activeBg: '#e4e4e7', activeText: '#121316',
    bar: '#38bdf8', btnBg: 'rgba(255,255,255,0.08)',
    toastBg: '#1e2030', toastBorder: '#27272a', toastAccent: '#38bdf8',
    continueBg: '#38bdf8', continueText: '#121316',
  },
};

// ─── Restore Toast ────────────────────────────────────────────────────────────
function RestoreToast({ progress, onRestore, onDismiss, T }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); }, []);
  const pct    = Math.round(progress.overallPct || 0);
  const timeAgo = formatRelativeTime(progress.savedAt);
  return (
    <div
      role="dialog"
      aria-live="polite"
      style={{
        position: 'fixed', bottom: '90px', left: '50%',
        transform: `translateX(-50%) translateY(${visible ? '0' : '16px'})`,
        opacity: visible ? 1 : 0, transition: 'opacity 0.3s, transform 0.3s',
        zIndex: 55, background: T.toastBg, border: `1px solid ${T.toastBorder}`,
        borderRadius: '16px', padding: '14px 18px', maxWidth: 'min(92vw, 400px)',
        width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 800, color: T.toastAccent, display: 'flex', alignItems: 'center', gap: '5px' }}>
          📚 আগের অবস্থান পাওয়া গেছে
        </span>
        <button onClick={onDismiss} aria-label="বন্ধ করুন" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.muted, fontSize: '16px', lineHeight: 1, padding: '0 2px' }}>✕</button>
      </div>
      <div style={{ fontSize: '14px', color: T.text, marginBottom: '3px', fontWeight: 600 }}>
        {progress.chapterTitle || `অধ্যায় ${toBengaliNumber(progress.chapterNumber || (progress.chapterIdx + 1))}`}
      </div>
      <div style={{ fontSize: '13px', color: T.muted, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span>অধ্যায় {toBengaliNumber(progress.chapterIdx + 1)} / {toBengaliNumber(progress.totalChapters)}</span>
        <span>·</span><span>{pct}% সম্পন্ন</span>
        {timeAgo && <><span>·</span><span>{timeAgo}</span></>}
      </div>
      <div style={{ height: '4px', background: T.border, borderRadius: '999px', marginBottom: '12px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: T.toastAccent, borderRadius: '999px', transition: 'width 0.4s' }} />
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onRestore}
          style={{ flex: 1, padding: '9px 12px', borderRadius: '10px', fontSize: '14px', fontWeight: 800, border: 'none', cursor: 'pointer', background: T.continueBg, color: T.continueText, transition: 'opacity 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          সেখান থেকে পড়ুন →
        </button>
        <button
          onClick={onDismiss}
          style={{ padding: '9px 14px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', background: 'transparent', border: `1px solid ${T.border}`, color: T.muted, transition: 'all 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.toastAccent; e.currentTarget.style.color = T.toastAccent; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
        >
          শুরু থেকে
        </button>
      </div>
    </div>
  );
}

export default function ReaderUI({ bookTitle, chapters = [], initialChapterNumber = 1, bookSlug = '' }) {
  const router = useRouter();
  const initialIndex = useMemo(() => {
    if (!initialChapterNumber || !chapters.length) return 0;
    const idx = chapters.findIndex((c) => c.chapterNumber === initialChapterNumber);
    return idx !== -1 ? idx : 0;
  }, [chapters, initialChapterNumber]);

  const [chapterIdx, setChapterIdx]         = useState(initialIndex);
  const [fontIdx, setFontIdx]               = useState(1);
  const [theme, setThemeState]              = useState('light');

  // ── Reading-progress state ────────────────────────────────────────────────
  // progressPhase: 'idle' | 'toast' | 'restoring' | 'restored'
  const [progressPhase, setProgressPhase] = useState('idle');
  const [savedProgress, setSavedProgress] = useState(null);
  // Guard: don't auto-save until restoration is complete
  const isRestoringRef = useRef(true);
  const saveTimerRef   = useRef(null);
  // Ref mirrors for reliable access inside cleanup / async callbacks
  const chapterIdxRef  = useRef(chapterIdx);  // always current chapter index
  const chaptersRef    = useRef(chapters);     // always current chapters array
  // Snapshot of scroll position updated live during reading.
  // Used in cleanup saves so we never read stale DOM after Next.js has navigated away.
  const scrollStateRef = useRef({ scrollY: 0, scrollPct: 0 });
  // Pending scroll: set when user arrives at correct chapter via URL, restored silently
  // Stores { scrollY, scrollPct } — scrollPct is used for restoration (immune to layout shifts)
  const pendingScrollRef = useRef(null);
  useEffect(() => { chapterIdxRef.current = chapterIdx; }, [chapterIdx]);
  useEffect(() => { chaptersRef.current = chapters; }, [chapters]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ebook_theme');
      if (saved && THEMES[saved]) {
        setThemeState(saved);
      }
    } catch (e) {}
  }, []);

  // ── On mount: check for saved progress ───────────────────────────────────
  useEffect(() => {
    const slug = bookSlug || (typeof window !== 'undefined' ? decodeURIComponent(window.location.pathname.split('/').pop()) : '');
    if (!slug) { isRestoringRef.current = false; setProgressPhase('restored'); return; }
    const saved = loadReadingProgress(slug);
    // Only show restore toast if saved progress differs meaningfully from current position
    // (skip if user already arrived at the correct chapter via ?chapter= URL param)
    const alreadyAtSavedChapter = saved && saved.chapterIdx === initialIndex;
    if (alreadyAtSavedChapter) {
      // Already on the right chapter — restore scroll silently without toast
      if (saved.scrollY > 10 || saved.scrollPct > 1) {
        pendingScrollRef.current = { scrollY: saved.scrollY, scrollPct: saved.scrollPct || 0 };
      }
      isRestoringRef.current = false;
      setProgressPhase('restored');
    } else if (
      saved &&
      typeof saved.chapterIdx === 'number' &&
      saved.chapterIdx < chapters.length &&
      (saved.chapterIdx > 0 || saved.scrollPct > 5)
    ) {
      setSavedProgress(saved);
      setProgressPhase('toast');
    } else {
      isRestoringRef.current = false;
      setProgressPhase('restored');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Restore: user clicked "Continue reading" ──────────────────────────────
  const handleRestoreProgress = useCallback(() => {
    if (!savedProgress) return;
    setProgressPhase('restoring');
    setChanging(true);
    setTimeout(() => {
      setChapterIdx(savedProgress.chapterIdx);
      setChanging(false);
      setTimeout(() => {
        isRestoringRef.current = false;
        setProgressPhase('restored');
        // Restore scroll using percentage for precision (immune to layout shifts)
        const doScroll = () => {
          const totalScrollable = document.documentElement.scrollHeight - window.innerHeight;
          if (totalScrollable < 10) { requestAnimationFrame(doScroll); return; }
          const targetY = savedProgress.scrollPct > 0
            ? Math.round((savedProgress.scrollPct / 100) * totalScrollable)
            : savedProgress.scrollY;
          window.scrollTo({ top: targetY, behavior: 'instant' });
          setTimeout(() => {
            const total = document.documentElement.scrollHeight - window.innerHeight;
            const retryY = savedProgress.scrollPct > 0
              ? Math.round((savedProgress.scrollPct / 100) * total)
              : savedProgress.scrollY;
            if (Math.abs(window.scrollY - retryY) > 30) {
              window.scrollTo({ top: retryY, behavior: 'instant' });
            }
          }, 200);
        };
        requestAnimationFrame(doScroll);
      }, 350);
    }, 200);
  }, [savedProgress]);

  // ── Dismiss toast: start from beginning ──────────────────────────────────
  const handleDismissToast = useCallback(() => {
    isRestoringRef.current = false;
    setProgressPhase('restored');
    setSavedProgress(null);
  }, []);

  // ── Auto-save (debounced 800ms) ───────────────────────────────────────────
  const scheduleSave = useCallback((overrideChapterIdx) => {
    if (isRestoringRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const slug = bookSlug || (typeof window !== 'undefined' ? decodeURIComponent(window.location.pathname.split('/').pop()) : '');
      if (!slug) return;
      const cidx = overrideChapterIdx !== undefined ? overrideChapterIdx : chapterIdx;
      const ch   = chapters[cidx] || {};
      const scrollY   = window.scrollY;
      const total     = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPct = total > 0 ? Math.min(100, (scrollY / total) * 100) : 0;
      saveReadingProgress({ bookSlug: slug, bookTitle, chapterIdx: cidx,
        chapterNumber: ch.chapterNumber || (cidx + 1), chapterTitle: ch.chapterTitle || '',
        totalChapters: chapters.length, scrollY, scrollPct });
    }, 800);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookSlug, bookTitle, chapters]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('ebook_theme', newTheme);
    } catch (e) {}
  };

  const [tocOpen, setTocOpen]               = useState(false);
  const [progress, setProgress]             = useState(0);
  const [headerVisible, setHeaderVisible]   = useState(true);
  const [changing, setChanging]             = useState(false);

  const lastScrollY = useRef(0);
  const T = THEMES[theme];
  const F = FONT_SIZES[fontIdx];
  const chapter = chapters[chapterIdx] || { chapterNumber: 1, chapterTitle: 'অধ্যায়', content: '' };

  const paragraphs = useMemo(() => {
    if (!chapter.content) return [];
    return chapter.content.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);
  }, [chapter.content]);

  useEffect(() => {
    const pending = pendingScrollRef.current;
    if (pending) {
      pendingScrollRef.current = null;
      // Use requestAnimationFrame to ensure DOM has painted, then scroll.
      // We use scrollPct (percentage) to restore position, which is immune to
      // minor layout shifts from font loading or different viewport heights.
      // 'instant' avoids a smooth animation that could be visually imprecise.
      const restoreScroll = () => {
        const totalScrollable = document.documentElement.scrollHeight - window.innerHeight;
        if (totalScrollable < 10) {
          // Content not yet tall enough — retry after a frame
          requestAnimationFrame(restoreScroll);
          return;
        }
        const targetY = pending.scrollPct > 0
          ? Math.round((pending.scrollPct / 100) * totalScrollable)
          : pending.scrollY;
        window.scrollTo({ top: targetY, behavior: 'instant' });
        // One final retry after 200ms to correct any late layout shifts
        setTimeout(() => {
          const total = document.documentElement.scrollHeight - window.innerHeight;
          const retryY = pending.scrollPct > 0
            ? Math.round((pending.scrollPct / 100) * total)
            : pending.scrollY;
          if (Math.abs(window.scrollY - retryY) > 30) {
            window.scrollTo({ top: retryY, behavior: 'instant' });
          }
        }, 200);
      };
      requestAnimationFrame(restoreScroll);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setProgress(0);
  }, [chapterIdx]);

  // Save when chapter changes (after guard is lifted)
  useEffect(() => {
    if (progressPhase === 'restored') scheduleSave(chapterIdx);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterIdx, progressPhase]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) setProgress(Math.min(100, (y / total) * 100));
      if (y > 120) {
        if (y > lastScrollY.current + 10) setHeaderVisible(false);
        else if (y < lastScrollY.current - 10) setHeaderVisible(true);
      } else setHeaderVisible(true);
      lastScrollY.current = y;
      // Keep scrollStateRef in sync — this is the authoritative snapshot used by
      // save-on-unmount, avoiding the race where Next.js replaces the DOM before cleanup.
      const pct = total > 0 ? Math.min(100, (y / total) * 100) : 0;
      scrollStateRef.current = { scrollY: y, scrollPct: pct };
      scheduleSave(); // debounced auto-save on scroll
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [scheduleSave]);

  // ── Save before HARD page unload (refresh / close tab) ───────────────────
  useEffect(() => {
    const onUnload = () => {
      if (isRestoringRef.current) return;
      const slug = bookSlug || decodeURIComponent(window.location.pathname.split('/').pop());
      if (!slug) return;
      const cidx = chapterIdxRef.current;
      const ch = chaptersRef.current[cidx] || {};
      // Use live DOM values here — beforeunload fires before any navigation
      const scrollY   = window.scrollY;
      const total     = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPct = total > 0 ? Math.min(100, (scrollY / total) * 100) : 0;
      scrollStateRef.current = { scrollY, scrollPct }; // keep ref in sync too
      saveReadingProgress({ bookSlug: slug, bookTitle, chapterIdx: cidx,
        chapterNumber: ch.chapterNumber || (cidx + 1), chapterTitle: ch.chapterTitle || '',
        totalChapters: chaptersRef.current.length, scrollY, scrollPct });
    };
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookSlug, bookTitle]);

  // ── Save on component UNMOUNT (Next.js client-side navigation) ───────────
  // router.back() / Link clicks do NOT fire beforeunload — this catches those.
  // IMPORTANT: We read from scrollStateRef, NOT live DOM (window.scrollY /
  // scrollHeight). By the time cleanup fires, Next.js may have already swapped
  // in the home page, making those values meaningless or 100%.
  useEffect(() => {
    return () => {
      if (isRestoringRef.current) return;
      try {
        const slug = bookSlug || decodeURIComponent(window.location.pathname.split('/').pop());
        if (!slug) return;
        const cidx = chapterIdxRef.current;
        const ch = chaptersRef.current[cidx] || {};
        const { scrollY, scrollPct } = scrollStateRef.current; // ← snapshot from last scroll event
        saveReadingProgress({ bookSlug: slug, bookTitle, chapterIdx: cidx,
          chapterNumber: ch.chapterNumber || (cidx + 1), chapterTitle: ch.chapterTitle || '',
          totalChapters: chaptersRef.current.length, scrollY, scrollPct });
      } catch (e) {}
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookSlug, bookTitle]);  // stable deps — refs handle latest values

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { if (chapterIdx < chapters.length - 1) switchChapter(chapterIdx + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { if (chapterIdx > 0) switchChapter(chapterIdx - 1); }
      else if (e.key === 'Escape') setTocOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [chapterIdx, chapters.length]);

  // ── Sync URL with current chapter (no history stack entry) ───────────────
  useEffect(() => {
    if (progressPhase !== 'restored') return; // don't change URL during restore animation
    const ch = chapters[chapterIdx];
    if (!ch) return;
    const chapterNum = ch.chapterNumber || (chapterIdx + 1);
    const url = new URL(window.location.href);
    const current = url.searchParams.get('chapter');
    if (String(current) !== String(chapterNum)) {
      url.searchParams.set('chapter', chapterNum);
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [chapterIdx, progressPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchChapter = useCallback((idx) => {
    if (idx === chapterIdx) return;
    setChanging(true);
    setTocOpen(false);
    setTimeout(() => { setChapterIdx(idx); setChanging(false); }, 200);
  }, [chapterIdx]);

  const btn = (extra = {}) => ({
    background: 'transparent',
    border: `1px solid ${T.border}`,
    borderRadius: '8px',
    color: T.text,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5px 7px',
    transition: 'all 0.15s',
    flexShrink: 0,
    lineHeight: 1,
    ...extra,
  });

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: "'Anek Bangla','Noto Serif Bengali',system-ui,sans-serif", transition: 'background 0.3s,color 0.3s' }}>

      {/* Progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '3px', zIndex: 60, background: 'rgba(128,128,128,0.12)' }}>
        <div style={{ height: '100%', background: T.bar, width: `${progress}%`, transition: 'width 0.12s' }} />
      </div>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40, width: '100%',
        background: T.headerBg, borderBottom: `1px solid ${T.border}`,
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        transform: headerVisible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 18px', height: '68px', display: 'flex', alignItems: 'center', gap: '10px' }}>

          {/* Back */}
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                const savedView = typeof window !== 'undefined' ? sessionStorage.getItem('library_view') : null;
                router.push(savedView && savedView !== 'home' ? `/?view=${savedView}` : '/');
              }
            }}
            style={{ ...btn(), textDecoration: 'none' }}
            title="পাঠাগারে ফিরে যান"
            aria-label="ফিরে যান"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          {/* TOC trigger — three horizontal lines */}
          <button
            onClick={() => setTocOpen(true)}
            style={btn()}
            title="সূচিপত্র (সব অধ্যায়)"
            aria-label="সূচিপত্র"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>

          {/* Book title + chapter info */}
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: '17px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>{bookTitle}</div>
            <div style={{ fontSize: '13px', color: T.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>অধ্যায় {toBengaliNumber(chapterIdx + 1)} / {toBengaliNumber(chapters.length)}</span>
              <span style={{ color: T.bar, fontWeight: 700 }}>· {Math.round(chapters.length > 0 ? ((chapterIdx / chapters.length) * 100) + ((progress / 100) * (100 / chapters.length)) : 0)}%</span>
            </div>
          </div>

          {/* Font controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1px', border: `1px solid ${T.border}`, borderRadius: '8px', padding: '2px', flexShrink: 0 }}>
            <button
              onClick={() => setFontIdx((p) => Math.max(0, p - 1))}
              disabled={fontIdx === 0}
              style={{ background: 'transparent', border: 'none', color: T.text, cursor: fontIdx === 0 ? 'not-allowed' : 'pointer', opacity: fontIdx === 0 ? 0.3 : 1, fontWeight: 800, fontSize: '13px', padding: '3px 8px', borderRadius: '6px', transition: 'background 0.15s', lineHeight: 1 }}
              title="ফন্ট ছোট"
              onMouseEnter={(e) => { if (fontIdx !== 0) e.currentTarget.style.background = T.btnBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >A-</button>
            <span style={{ fontSize: '10px', color: T.muted, padding: '0 4px', fontWeight: 600, userSelect: 'none', minWidth: '52px', textAlign: 'center' }}>{F.label}</span>
            <button
              onClick={() => setFontIdx((p) => Math.min(FONT_SIZES.length - 1, p + 1))}
              disabled={fontIdx === FONT_SIZES.length - 1}
              style={{ background: 'transparent', border: 'none', color: T.text, cursor: fontIdx === FONT_SIZES.length - 1 ? 'not-allowed' : 'pointer', opacity: fontIdx === FONT_SIZES.length - 1 ? 0.3 : 1, fontWeight: 800, fontSize: '13px', padding: '3px 8px', borderRadius: '6px', transition: 'background 0.15s', lineHeight: 1 }}
              title="ফন্ট বড়"
              onMouseEnter={(e) => { if (fontIdx !== FONT_SIZES.length - 1) e.currentTarget.style.background = T.btnBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >A+</button>
          </div>

          {/* Theme buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', border: `1px solid ${T.border}`, borderRadius: '10px', padding: '3px', flexShrink: 0 }}>
            {Object.values(THEMES).map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                title={t.label}
                style={{
                  width: '36px', height: '34px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                  fontSize: '18px', lineHeight: 1,
                  background: theme === t.id ? T.btnBg : 'transparent',
                  outline: theme === t.id ? `2px solid ${T.bar}` : 'none',
                  outlineOffset: '-1px',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={(e) => { if (theme !== t.id) e.currentTarget.style.background = T.btnBg; }}
                onMouseLeave={(e) => { if (theme !== t.id) e.currentTarget.style.background = 'transparent'; }}
              >
                {t.icon}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────── */}
      <main style={{ maxWidth: '720px', margin: '0 auto', padding: '36px 20px 150px' }}>
        {/* Chapter header */}
        <header style={{ marginBottom: '44px', textAlign: 'center', borderBottom: `1px solid ${T.border}`, paddingBottom: '28px' }}>
          <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 14px', borderRadius: '999px', marginBottom: '12px', border: `1px solid ${T.border}`, color: T.muted }}>
            অধ্যায় {toBengaliNumber(chapter.chapterNumber || chapterIdx + 1)}
          </span>
          <h2 style={{ fontSize: 'clamp(20px, 4vw, 30px)', fontWeight: 800, lineHeight: 1.3, margin: 0 }}>
            {chapter.chapterTitle}
          </h2>
        </header>

        {/* Body */}
        {changing ? (
          <div style={{ padding: '80px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <LoadingSpinner variant="magical" size="lg" label="অধ্যায় খোলা হচ্ছে..." />
          </div>
        ) : (
          <article className="chapter-animate" style={{ fontSize: F.size, lineHeight: F.line, color: T.text, fontFamily: "'Noto Serif Bengali', 'Anek Bangla', Georgia, serif" }}>
            {paragraphs.length > 0 ? paragraphs.map((p, i) => (
              <p key={i} style={{ textAlign: 'justify', hyphens: 'auto', wordBreak: 'break-word', marginBottom: '1.5em' }}>{p}</p>
            )) : (
              <div style={{ padding: '80px 0', textAlign: 'center', opacity: 0.6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <LoadingSpinner variant="book" size="md" label="এই অধ্যায়ে কোনো লেখা পাওয়া যায়নি।" />
              </div>
            )}
          </article>
        )}

        <div style={{ marginTop: '64px', paddingTop: '28px', textAlign: 'center', borderTop: `1px solid ${T.border}`, opacity: 0.45 }}>
          <span style={{ fontSize: '14px', letterSpacing: '0.15em' }}>❦ অধ্যায় সমাপ্ত ❦</span>
        </div>
      </main>

      {/* ── Floating Nav ────────────────────────────────────────── */}
      <nav style={{ position: 'fixed', bottom: '20px', left: 0, right: 0, zIndex: 40, padding: '0 16px', pointerEvents: 'none' }}>
        <div style={{
          maxWidth: '420px', margin: '0 auto',
          background: T.navBg, border: `1px solid ${T.navBorder}`,
          borderRadius: '999px', padding: '8px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          pointerEvents: 'auto',
        }}>
          <button
            onClick={() => { if (chapterIdx > 0) switchChapter(chapterIdx - 1); }}
            disabled={chapterIdx === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, border: 'none', background: 'transparent', color: T.text, cursor: chapterIdx === 0 ? 'not-allowed' : 'pointer', opacity: chapterIdx === 0 ? 0.3 : 1, transition: 'all 0.15s' }}
            onMouseEnter={(e) => { if (chapterIdx > 0) e.currentTarget.style.background = T.btnBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
            পূর্ববর্তী
          </button>

          <button
            onClick={() => setTocOpen(true)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5px 10px', borderRadius: '10px', border: 'none', background: 'transparent', color: T.text, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = T.btnBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ fontSize: '13px', fontWeight: 700 }}>অধ্যায় {toBengaliNumber(chapterIdx + 1)}</span>
            <span style={{ fontSize: '10px', color: T.muted }}>মোট {toBengaliNumber(chapters.length)} টি</span>
          </button>

          <button
            onClick={() => { if (chapterIdx < chapters.length - 1) switchChapter(chapterIdx + 1); }}
            disabled={chapterIdx === chapters.length - 1}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, border: 'none', background: 'transparent', color: T.text, cursor: chapterIdx === chapters.length - 1 ? 'not-allowed' : 'pointer', opacity: chapterIdx === chapters.length - 1 ? 0.3 : 1, transition: 'all 0.15s' }}
            onMouseEnter={(e) => { if (chapterIdx < chapters.length - 1) e.currentTarget.style.background = T.btnBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            পরবর্তী
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </nav>

      {/* ── TOC Drawer ──────────────────────────────────────────── */}
      {tocOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)' }}
            onClick={() => setTocOpen(false)}
          />
          <aside style={{
            position: 'relative', zIndex: 10,
            width: '100%', maxWidth: '310px', height: '100%',
            background: T.tocBg, color: T.tocText,
            borderRight: `1px solid ${T.tocBorder}`,
            display: 'flex', flexDirection: 'column',
            boxShadow: '4px 0 32px rgba(0,0,0,0.22)',
          }}>
            {/* Drawer header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: `1px solid ${T.tocBorder}` }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '17px' }}>সূচিপত্র</h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: T.muted }}>মোট {toBengaliNumber(chapters.length)} টি অধ্যায়</p>
              </div>
              <button
                onClick={() => setTocOpen(false)}
                style={{ background: T.btnBg, border: `1px solid ${T.border}`, borderRadius: '8px', color: T.text, cursor: 'pointer', padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="বন্ধ করুন"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Chapter list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {chapters.map((ch, idx) => {
                const active = idx === chapterIdx;
                return (
                  <button
                    key={idx}
                    onClick={() => switchChapter(idx)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '9px 12px',
                      borderRadius: '10px', border: 'none', cursor: 'pointer',
                      fontSize: '13px', display: 'flex', alignItems: 'flex-start', gap: '8px',
                      background: active ? T.activeBg : 'transparent',
                      color: active ? T.activeText : T.tocText,
                      fontWeight: active ? 700 : 400,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = T.btnBg; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontFamily: 'monospace', fontSize: '10px', opacity: 0.55, flexShrink: 0, paddingTop: '2px' }}>{toBengaliNumber(idx + 1)}.</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{ch.chapterTitle}</span>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 18px', borderTop: `1px solid ${T.tocBorder}`, textAlign: 'center' }}>
              <span style={{ fontSize: '11px', color: T.muted }}>কীবোর্ড: ← পূর্ববর্তী | পরবর্তী →</span>
            </div>
          </aside>
        </div>
      )}

      {/* ── Restore Toast ─────────────────────────────────────── */}
      {progressPhase === 'toast' && savedProgress && (
        <RestoreToast
          progress={savedProgress}
          onRestore={handleRestoreProgress}
          onDismiss={handleDismissToast}
          T={T}
        />
      )}
    </div>
  );
}
