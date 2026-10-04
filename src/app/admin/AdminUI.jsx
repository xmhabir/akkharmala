'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { CldUploadWidget } from 'next-cloudinary';

const C = {
  bg: '#0d0f18', surface: '#161925', surfaceHi: '#1e2235',
  border: '#252a3d', borderHi: '#3a4060',
  text: '#e8eaf6', muted: '#6b7394', mutedHi: '#9ba3c8',
  accent: '#7c6bff', accentHi: '#a898ff', accentBg: 'rgba(124,107,255,0.1)',
  green: '#22d47a', greenBg: 'rgba(34,212,122,0.1)',
  red: '#ff5c5c', redBg: 'rgba(255,92,92,0.1)',
  amber: '#ffb340', amberBg: 'rgba(255,179,64,0.1)',
  blue: '#38bdf8', blueBg: 'rgba(56,189,248,0.1)',
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map((t) => (
        <div key={t.id} style={{ background: C.surface, border: `1px solid ${t.type === 'error' ? C.red : t.type === 'warn' ? C.amber : C.green}`, borderLeft: `4px solid ${t.type === 'error' ? C.red : t.type === 'warn' ? C.amber : C.green}`, color: C.text, borderRadius: 12, padding: '11px 18px', fontSize: 13, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', minWidth: 240, animation: 'toastIn 0.22s ease' }}>
          <span style={{ marginRight: 8 }}>{t.type === 'error' ? '✗' : t.type === 'warn' ? '⚠' : '✓'}</span>{t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Confirm ───────────────────────────────────────────────────────────────────
function Confirm({ message, onConfirm, onCancel, confirmLabel = 'মুছে দিন', danger = true, loading = false }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '28px 32px', width: '100%', maxWidth: 400, boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ fontSize: 24, marginBottom: 10 }}>⚠️</div>
        <p style={{ fontSize: 14, color: C.text, lineHeight: 1.6, marginBottom: 22 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} disabled={loading} style={{ ...ghost, opacity: loading ? 0.6 : 1 }}>বাতিল</button>
          <button onClick={onConfirm} disabled={loading} style={{ ...primary, background: danger ? C.red : C.accent, opacity: loading ? 0.6 : 1 }}>
            {loading ? '⏳ মুছে ফেলা হচ্ছে...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '28px 30px', width: '100%', maxWidth: 480, boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{ background: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, cursor: 'pointer', padding: '4px 8px', fontSize: 14 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const primary = { background: C.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s', whiteSpace: 'nowrap' };
const ghost = { background: 'transparent', color: C.mutedHi, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s', whiteSpace: 'nowrap' };
const input = { background: C.surfaceHi, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, padding: '10px 14px', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s' };
const focus = (e) => { e.target.style.borderColor = C.accent; };
const blur = (e) => { e.target.style.borderColor = C.border; };
const labelStyle = { fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 };

// ── Pill badge ────────────────────────────────────────────────────────────────
function Pill({ children, color = C.muted }) {
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: `${color}18`, border: `1px solid ${color}40`, color }}>{children}</span>;
}

// ── Cloudinary Upload Button ──────────────────────────────────────────────────
function CoverUploadButton({ onUploaded, onError }) {
  return (
    <CldUploadWidget
      signatureEndpoint="/api/sign-cloudinary-params"
      options={{
        folder: 'akkharmala/books',
        resourceType: 'image',
        maxFileSize: 5000000,
        clientAllowedSources: ['local', 'url'],
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
      }}
      onSuccess={(result) => {
        const info = result?.info;
        if (!info || typeof info === 'string') return;
        onUploaded(info.secure_url, info.public_id);
      }}
      onError={() => onError?.()}
    >
      {({ open }) => (
        <button
          type="button"
          onClick={() => open()}
          style={{ ...ghost, background: C.surfaceHi, flexShrink: 0, fontSize: 12 }}
          title="Cloudinary-তে ছবি আপলোড করুন"
        >
          ☁️ আপলোড
        </button>
      )}
    </CldUploadWidget>
  );
}

// ── Image field (URL input + Cloudinary upload + preview) ─────────────────────
function ImageField({ label, value, onChange, toast, successMsg = 'ছবি আপলোড হয়েছে!' }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          placeholder="ছবির লিঙ্ক (URL) দিন... যেমন: https://..."
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          style={input}
          onFocus={focus}
          onBlur={blur}
        />
        <CoverUploadButton
          onUploaded={(url) => { onChange(url); toast(successMsg); }}
          onError={() => toast('আপলোড ব্যর্থ হয়েছে।', 'error')}
        />
      </div>

      {value ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: C.surfaceHi, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <img
            src={value}
            alt="প্রিভিউ"
            style={{ width: 44, height: 60, objectFit: 'cover', borderRadius: 8, border: `1px solid ${C.borderHi}`, flexShrink: 0 }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>✓ কভার ছবি নির্বাচিত</div>
            <div style={{ fontSize: 10, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontSize: 13, padding: '4px 6px' }}
            title="ছবি বাদ দিন"
          >
            ✕
          </button>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>💡 ওয়েব লিঙ্ক (URL) দিন অথবা <strong>আপলোড</strong> বাটনে ক্লিক করে ছবি দিন</span>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminUI() {
  // Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
    } catch { }
    window.location.href = '/admin/login';
  };

  // Data
  const [data, setData] = useState({ series: [], unassigned: [] });
  const [loading, setLoading] = useState(true);

  // Global loading operations tracker for delays
  const [activeOps, setActiveOps] = useState([]); // Array of { id, msg }

  const withLoading = useCallback(async (msg, asyncFn) => {
    const id = Date.now() + Math.random();
    setActiveOps((prev) => [...prev, { id, msg }]);
    try {
      return await asyncFn();
    } finally {
      setActiveOps((prev) => prev.filter((op) => op.id !== id));
    }
  }, []);

  const isBusy = loading || activeOps.length > 0;
  const currentMsg = activeOps.length > 0
    ? activeOps[activeOps.length - 1].msg
    : (loading ? 'ডেটা লোড হচ্ছে...' : '');

  // Selection / navigation
  const [selSeries, setSelSeries] = useState(null);   // series object
  const [selBook, setSelBook] = useState(null);   // book object
  const [panel, setPanel] = useState('series'); // 'series'|'books'|'chapters'|'editor'

  // Editor
  const [editor, setEditor] = useState(null);     // { bookTitle, chapterNumber, chapterTitle, content, fileName, isNew }
  const [saving, setSaving] = useState(false);

  // Modals
  const [modal, setModal] = useState(null);     // 'new-series'|'edit-series'|'new-book'|'edit-book'
  const [confirm, setConfirm] = useState(null);

  // Forms
  const [form, setForm] = useState({});

  // Toast
  const [toasts, setToasts] = useState([]);
  const textRef = useRef(null);

  const toast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3200);
  }, []);

  // ── Load all data ───────────────────────────────────────────────────────────
  const reload = useCallback(async () => {
    setLoading(true);
    await withLoading('লাইব্রেরি ডেটা লোড হচ্ছে...', async () => {
      try {
        const res = await fetch('/api/admin/books');
        const json = await res.json();
        if (json.success) {
          setData({
            series: json.data?.series || [],
            unassigned: json.data?.unassigned || [],
            dbConnected: json.dbConnected,
          });
          // Refresh selected objects
          if (selSeries) {
            const fresh = json.data.series.find((s) => s.name === selSeries.name);
            setSelSeries(fresh || null);
            if (selBook && fresh) {
              const freshBook = fresh.books.find((b) => b.title === selBook.title);
              setSelBook(freshBook || null);
            }
          }
        } else {
          toast(json.message || 'ডেটা লোড করতে সমস্যা হয়েছে।', 'error');
        }
      } catch (err) {
        toast('ডেটা লোড হয়নি: ' + (err.message || 'সার্ভার সমস্যা'), 'error');
      } finally {
        setLoading(false);
      }
    });
  }, [selSeries, selBook, toast, withLoading]);

  useEffect(() => { reload(); }, []);

  // Ctrl+S to save
  useEffect(() => {
    const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 's' && panel === 'editor') { e.preventDefault(); saveChapter(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [panel, editor, saving]);

  // ── Series actions ──────────────────────────────────────────────────────────
  const createSeries = async () => {
    if (!form.seriesName?.trim()) return;
    await withLoading('নতুন সিরিজ তৈরি হচ্ছে...', async () => {
      try {
        const r = await fetch('/api/admin/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create-series',
            name: form.seriesName.trim(),
            author: form.seriesAuthor?.trim() || '',
            description: form.seriesDesc || '',
            image: form.seriesImage?.trim() || '',
          }),
        });
        const j = await r.json();
        if (j.success) {
          toast(j.dbSaved ? 'সিরিজ ডাটাবেজে তৈরি হয়েছে! ✓' : 'সিরিজ তৈরি হয়েছে!');
          setModal(null);
          setForm({});
          await reload();
        } else toast(j.message, 'error');
      } catch {
        toast('সিরিজ তৈরিতে ব্যর্থ হয়েছে।', 'error');
      }
    });
  };

  const updateSeries = async () => {
    if (!form.seriesName?.trim()) return;
    await withLoading('সিরিজ আপডেট হচ্ছে...', async () => {
      try {
        const r = await fetch('/api/admin/books', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update-series',
            name: form.seriesName.trim(),
            author: form.seriesAuthor?.trim() || '',
            description: form.seriesDesc || '',
            image: form.seriesImage?.trim() || '',
          }),
        });
        const j = await r.json();
        if (j.success) {
          toast(j.dbSaved ? 'সিরিজের ছবি ও তথ্য ডাটাবেজে আপডেট হয়েছে! ✓' : 'সিরিজ আপডেট হয়েছে!');
          setModal(null);
          setForm({});
          await reload();
        } else toast(j.message, 'error');
      } catch {
        toast('আপডেট ব্যর্থ হয়েছে।', 'error');
      }
    });
  };

  const openEditSeries = (s) => {
    setForm({
      seriesName: s.name,
      seriesAuthor: s.author || '',
      seriesDesc: s.description || '',
      seriesImage: s.image || '',
    });
    setModal('edit-series');
  };

  const deleteSeries = (s) => setConfirm({
    msg: `"${s.name}" সিরিজ এবং এর সমস্ত বই মুছে দিতে চান? এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।`,
    onConfirm: async () => {
      setConfirm(null);
      await withLoading('সিরিজ মুছে ফেলা হচ্ছে...', async () => {
        try {
          const r = await fetch('/api/admin/books', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete-series', name: s.name, deleteBooks: true }),
          });
          const j = await r.json();
          if (j.success) {
            toast('সিরিজ মুছে দেওয়া হয়েছে।');
            if (selSeries?.name === s.name) {
              setSelSeries(null);
              setSelBook(null);
              setPanel('series');
            }
            await reload();
          } else toast(j.message, 'error');
        } catch {
          toast('মুছতে ব্যর্থ।', 'error');
        }
      });
    },
  });

  // ── Book actions ────────────────────────────────────────────────────────────
  const createBook = async () => {
    if (!form.bookTitle?.trim() || !selSeries) return;
    await withLoading('নতুন বই তৈরি হচ্ছে...', async () => {
      try {
        const r = await fetch('/api/admin/books', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create-book',
            seriesName: selSeries.name,
            bookTitle: form.bookTitle.trim(),
            author: form.bookAuthor?.trim() || selSeries.author || 'অজানা',
            image: form.bookImage?.trim() || '',
          }),
        });
        const j = await r.json();
        if (j.success) {
          toast(j.dbSaved ? 'বই ডাটাবেজে যুক্ত হয়েছে! ✓' : 'বই তৈরি হয়েছে!');
          setModal(null);
          setForm({});
          await reload();
        } else toast(j.message, 'error');
      } catch {
        toast('বই তৈরিতে ব্যর্থ হয়েছে।', 'error');
      }
    });
  };

  const deleteBook = (book) => setConfirm({
    msg: `"${book.title}" বই এবং এর সমস্ত অধ্যায় মুছে দিতে চান?`,
    onConfirm: async () => {
      setConfirm(null);
      await withLoading('বই মুছে ফেলা হচ্ছে...', async () => {
        try {
          const r = await fetch('/api/admin/books', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete-book', seriesName: selSeries.name, bookTitle: book.title, deleteFiles: true }),
          });
          const j = await r.json();
          if (j.success) {
            toast('বই মুছে দেওয়া হয়েছে।');
            if (selBook?.title === book.title) {
              setSelBook(null);
              setPanel('books');
            }
            await reload();
          } else toast(j.message, 'error');
        } catch {
          toast('মুছতে ব্যর্থ।', 'error');
        }
      });
    },
  });

  // ── Update book image / metadata ────────────────────────────────────────
  const updateBook = async () => {
    if (!form.editBookTitle?.trim()) return;
    await withLoading('বই আপডেট হচ্ছে...', async () => {
      try {
        const r = await fetch('/api/admin/books', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update-book',
            bookTitle: form.editBookTitle.trim(),
            image: form.bookImage?.trim() ?? '',
          }),
        });
        const j = await r.json();
        if (j.success) {
          toast(j.dbSaved ? 'বইয়ের ছবি ডাটাবেজে আপডেট হয়েছে! ✓' : 'বই আপডেট হয়েছে!');
          setModal(null);
          setForm({});
          await reload();
        } else toast(j.message, 'error');
      } catch {
        toast('আপডেট ব্যর্থ হয়েছে।', 'error');
      }
    });
  };

  const openEditBook = (book) => {
    setForm({
      editBookTitle: book.title,
      bookImage: book.image || '',
    });
    setModal('edit-book');
  };

  // ── Chapter actions ─────────────────────────────────────────────────────────
  const openNewChapter = (book) => {
    const next = (book.chapters?.length || 0) + 1;
    setEditor({ bookTitle: book.title, chapterNumber: next, chapterTitle: '', content: '', fileName: null, isNew: true });
    setPanel('editor');
  };

  const openEditChapter = async (book, chap) => {
    await withLoading(`"${chap.chapterTitle}" লোড হচ্ছে...`, async () => {
      try {
        const r = await fetch(
          `/api/admin/chapters?book=${encodeURIComponent(book.title)}&chapter=${encodeURIComponent(chap.fileName)}&chapterNumber=${chap.chapterNumber || ''}`
        );
        const j = await r.json();
        setEditor({
          bookTitle: book.title,
          chapterNumber: chap.chapterNumber,
          chapterTitle: chap.chapterTitle,
          content: j.success ? j.content : '',
          fileName: chap.fileName,
          isNew: false,
        });
        setPanel('editor');
      } catch {
        toast('অধ্যায় লোড হয়নি।', 'error');
      }
    });
  };

  const saveChapter = async () => {
    if (!editor?.chapterTitle?.trim()) { toast('অধ্যায়ের নাম দিন।', 'warn'); return; }
    setSaving(true);
    await withLoading('অধ্যায় সংরক্ষণ হচ্ছে...', async () => {
      try {
        const r = await fetch('/api/admin/chapters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookTitle: editor.bookTitle,
            chapterNumber: editor.chapterNumber,
            chapterTitle: editor.chapterTitle,
            content: editor.content,
            oldFileName: editor.fileName,
          }),
        });
        const j = await r.json();
        if (j.success) {
          toast(j.dbSaved ? 'অধ্যায় ডাটাবেজে সংরক্ষিত হয়েছে! ✓' : 'সংরক্ষিত হয়েছে! ✓');
          setEditor((p) => ({ ...p, fileName: j.fileName, isNew: false }));
          await reload();
        } else toast(j.message, 'error');
      } catch {
        toast('সংরক্ষণ ব্যর্থ।', 'error');
      } finally {
        setSaving(false);
      }
    });
  };

  const deleteChapter = (chap) => setConfirm({
    msg: `"${chap.chapterTitle}" অধ্যায়টি মুছে দিতে চান?`,
    onConfirm: async () => {
      setConfirm(null);
      await withLoading('অধ্যায় মুছে ফেলা হচ্ছে...', async () => {
        try {
          const r = await fetch('/api/admin/chapters', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookTitle: selBook.title, fileName: chap.fileName, chapterNumber: chap.chapterNumber }),
          });
          const j = await r.json();
          if (j.success) {
            toast('অধ্যায় মুছে দেওয়া হয়েছে।');
            if (panel === 'editor' && editor?.fileName === chap.fileName) setPanel('chapters');
            await reload();
          } else toast(j.message, 'error');
        } catch {
          toast('মুছতে ব্যর্থ।', 'error');
        }
      });
    },
  });

  // ── Breadcrumb nav ──────────────────────────────────────────────────────────
  const goTo = (p) => { setPanel(p); if (p === 'series') { setSelSeries(null); setSelBook(null); } if (p === 'books') setSelBook(null); };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Inter','Anek Bangla','Noto Serif Bengali',system-ui,sans-serif" }}>

      {/* ── Top Progress Loading Bar (Active on Every Delay) ───────────────── */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 3.5,
          zIndex: 99999,
          pointerEvents: 'none',
          opacity: isBusy ? 1 : 0,
          transition: 'opacity 0.25s ease',
          overflow: 'hidden',
          background: 'rgba(124, 107, 255, 0.12)',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, #7c6bff 0%, #38bdf8 30%, #ec4899 65%, #7c6bff 100%)',
            backgroundSize: '200% 100%',
            animation: isBusy
              ? 'adminBarProgress 1.3s ease-in-out infinite, adminBarGlow 1.3s ease-in-out infinite'
              : 'none',
          }}
        />
      </div>

      <Toast toasts={toasts} />
      {confirm && (
        <Confirm
          message={confirm.msg}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
          loading={isBusy}
        />
      )}

      {/* ── New Series Modal ───────────────────────────────────────────────── */}
      {modal === 'new-series' && (
        <Modal title="নতুন সিরিজ তৈরি করুন" onClose={() => { setModal(null); setForm({}); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={labelStyle}>সিরিজের নাম *</label>
              <input autoFocus type="text" placeholder="যেমন: হ্যারি পটার সিরিজ" value={form.seriesName || ''} onChange={(e) => setForm((p) => ({ ...p, seriesName: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && createSeries()} style={input} onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <label style={labelStyle}>লেখক / রাইটার (ঐচ্ছিক)</label>
              <input type="text" placeholder="যেমন: জে. কে. রাউলিং" value={form.seriesAuthor || ''} onChange={(e) => setForm((p) => ({ ...p, seriesAuthor: e.target.value }))} style={input} onFocus={focus} onBlur={blur} />
            </div>
            <ImageField
              label="সিরিজের ছবি / কভার ইমেজ (ঐচ্ছিক)"
              value={form.seriesImage}
              onChange={(v) => setForm((p) => ({ ...p, seriesImage: v }))}
              toast={toast}
              successMsg="ছবি আপলোড হয়েছে! সংরক্ষণে ক্লিক করুন।"
            />
            <div>
              <label style={labelStyle}>বিবরণ (ঐচ্ছিক)</label>
              <input type="text" placeholder="সিরিজ সম্পর্কে সংক্ষিপ্ত বিবরণ..." value={form.seriesDesc || ''} onChange={(e) => setForm((p) => ({ ...p, seriesDesc: e.target.value }))} style={input} onFocus={focus} onBlur={blur} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => { setModal(null); setForm({}); }} disabled={isBusy} style={{ ...ghost, opacity: isBusy ? 0.6 : 1 }}>বাতিল</button>
              <button onClick={createSeries} disabled={isBusy || !form.seriesName?.trim()} style={{ ...primary, opacity: isBusy || !form.seriesName?.trim() ? 0.5 : 1 }}>
                {isBusy ? '⏳ তৈরি হচ্ছে...' : '✓ সিরিজ তৈরি করুন'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit Series Modal ───────────────────────────────────────────────── */}
      {modal === 'edit-series' && (
        <Modal title={`"${form.seriesName}" সিরিজ ও ছবি সম্পাদনা`} onClose={() => { setModal(null); setForm({}); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={labelStyle}>সিরিজের নাম</label>
              <input type="text" value={form.seriesName || ''} readOnly style={{ ...input, opacity: 0.7, cursor: 'not-allowed' }} />
            </div>
            <div>
              <label style={labelStyle}>লেখক / রাইটার (ঐচ্ছিক)</label>
              <input type="text" placeholder="যেমন: জে. কে. রাউলিং" value={form.seriesAuthor || ''} onChange={(e) => setForm((p) => ({ ...p, seriesAuthor: e.target.value }))} style={input} onFocus={focus} onBlur={blur} />
            </div>
            <ImageField
              label="সিরিজের ছবি / কভার ইমেজ"
              value={form.seriesImage}
              onChange={(v) => setForm((p) => ({ ...p, seriesImage: v }))}
              toast={toast}
              successMsg="ছবি আপলোড হয়েছে! সংরক্ষণে ক্লিক করুন।"
            />
            <div>
              <label style={labelStyle}>বিবরণ (ঐচ্ছিক)</label>
              <input type="text" placeholder="সিরিজ সম্পর্কে সংক্ষিপ্ত বিবরণ..." value={form.seriesDesc || ''} onChange={(e) => setForm((p) => ({ ...p, seriesDesc: e.target.value }))} style={input} onFocus={focus} onBlur={blur} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => { setModal(null); setForm({}); }} disabled={isBusy} style={{ ...ghost, opacity: isBusy ? 0.6 : 1 }}>বাতিল</button>
              <button onClick={updateSeries} disabled={isBusy} style={{ ...primary, opacity: isBusy ? 0.6 : 1 }}>
                {isBusy ? '⏳ সংরক্ষণ হচ্ছে...' : '💾 পরিবর্তন সংরক্ষণ করুন'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── New Book Modal ─────────────────────────────────────────────────── */}
      {modal === 'new-book' && selSeries && (
        <Modal title={`"${selSeries.name}"-এ নতুন বই`} onClose={() => { setModal(null); setForm({}); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>সিরিজ: <strong style={{ color: C.accentHi }}>{selSeries.name}</strong></p>
            <div>
              <label style={labelStyle}>বইয়ের নাম *</label>
              <input autoFocus type="text" placeholder="যেমন: হ্যারি পটার ও পাথরের পাথর" value={form.bookTitle || ''} onChange={(e) => setForm((p) => ({ ...p, bookTitle: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && createBook()} style={input} onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <label style={labelStyle}>লেখক / রাইটার (ঐচ্ছিক)</label>
              <input type="text" placeholder={selSeries.author ? `ডিফল্ট: ${selSeries.author}` : 'যেমন: জে. কে. রাউলিং'} value={form.bookAuthor || ''} onChange={(e) => setForm((p) => ({ ...p, bookAuthor: e.target.value }))} style={input} onFocus={focus} onBlur={blur} />
            </div>
            <ImageField
              label="বইয়ের কভার ছবি (ঐচ্ছিক)"
              value={form.bookImage}
              onChange={(v) => setForm((p) => ({ ...p, bookImage: v }))}
              toast={toast}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => { setModal(null); setForm({}); }} disabled={isBusy} style={{ ...ghost, opacity: isBusy ? 0.6 : 1 }}>বাতিল</button>
              <button onClick={createBook} disabled={isBusy || !form.bookTitle?.trim()} style={{ ...primary, opacity: isBusy || !form.bookTitle?.trim() ? 0.5 : 1 }}>
                {isBusy ? '⏳ তৈরি হচ্ছে...' : '✓ বই তৈরি করুন'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit Book Modal ─────────────────────────────────────────────────── */}
      {modal === 'edit-book' && (
        <Modal title={`"${form.editBookTitle}" — কভার ছবি সম্পাদনা`} onClose={() => { setModal(null); setForm({}); }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={labelStyle}>বইয়ের নাম</label>
              <input type="text" value={form.editBookTitle || ''} readOnly style={{ ...input, opacity: 0.7, cursor: 'not-allowed' }} />
            </div>
            <ImageField
              label="বইয়ের কভার ছবি"
              value={form.bookImage}
              onChange={(v) => setForm((p) => ({ ...p, bookImage: v }))}
              toast={toast}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => { setModal(null); setForm({}); }} disabled={isBusy} style={{ ...ghost, opacity: isBusy ? 0.6 : 1 }}>বাতিল</button>
              <button onClick={updateBook} disabled={isBusy} style={{ ...primary, opacity: isBusy ? 0.6 : 1 }}>
                {isBusy ? '⏳ সংরক্ষণ হচ্ছে...' : '💾 ছবি সংরক্ষণ করুন'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(13,15,24,0.96)', borderBottom: `1px solid ${C.border}`, backdropFilter: 'blur(12px)', padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Brand + breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>⚡</span>
              <span style={{ fontWeight: 800, color: C.text }}>অক্ষরমালা</span>
              <span style={{ fontSize: 11, color: C.accent, background: C.accentBg, padding: '1px 8px', borderRadius: 6, fontWeight: 700, border: `1px solid ${C.accent}40` }}>Admin</span>
            </div>
            {/* Breadcrumb */}
            <span style={{ color: C.border }}>›</span>
            <button onClick={() => goTo('series')} style={{ background: 'none', border: 'none', color: panel === 'series' ? C.text : C.muted, cursor: 'pointer', fontSize: 13, fontWeight: panel === 'series' ? 700 : 400, padding: 0 }}>সিরিজ</button>
            {selSeries && (<>
              <span style={{ color: C.border }}>›</span>
              <button onClick={() => goTo('books')} style={{ background: 'none', border: 'none', color: panel === 'books' ? C.text : C.muted, cursor: 'pointer', fontSize: 13, fontWeight: panel === 'books' ? 700 : 400, padding: 0, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selSeries.name}</button>
            </>)}
            {selBook && (<>
              <span style={{ color: C.border }}>›</span>
              <button onClick={() => goTo('chapters')} style={{ background: 'none', border: 'none', color: panel === 'chapters' || panel === 'editor' ? C.text : C.muted, cursor: 'pointer', fontSize: 13, fontWeight: panel === 'chapters' || panel === 'editor' ? 700 : 400, padding: 0, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selBook.title}</button>
            </>)}
            {panel === 'editor' && (<>
              <span style={{ color: C.border }}>›</span>
              <span style={{ color: C.accentHi, fontSize: 13, fontWeight: 700 }}>{editor?.isNew ? 'নতুন অধ্যায়' : editor?.chapterTitle}</span>
            </>)}
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Live Progress Delay Indicator */}
            {isBusy && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '5px 12px',
                  borderRadius: 999,
                  background: 'rgba(124,107,255,0.14)',
                  border: '1px solid rgba(124,107,255,0.4)',
                  color: '#c7d2fe',
                  animation: 'fadeUp 0.2s ease',
                  boxShadow: '0 0 12px rgba(124,107,255,0.2)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    border: '2px solid rgba(199,210,254,0.3)',
                    borderTopColor: '#c7d2fe',
                    borderRadius: '50%',
                    animation: 'adminPulseSpin 0.7s linear infinite',
                  }}
                />
                <span>{currentMsg || 'অপেক্ষা করুন...'}</span>
              </div>
            )}

            {panel === 'editor' && (
              <button onClick={saveChapter} disabled={saving || isBusy} style={{ ...primary, opacity: saving || isBusy ? 0.6 : 1 }}>
                {saving || isBusy ? '⏳ সংরক্ষণ হচ্ছে...' : '💾 সংরক্ষণ (Ctrl+S)'}
              </button>
            )}
            {panel === 'series' && (
              <button onClick={() => setModal('new-series')} disabled={isBusy} style={{ ...primary, opacity: isBusy ? 0.7 : 1 }}>+ নতুন সিরিজ</button>
            )}
            {panel === 'books' && selSeries && (
              <button onClick={() => setModal('new-book')} disabled={isBusy} style={{ ...primary, opacity: isBusy ? 0.7 : 1 }}>+ নতুন বই</button>
            )}
            {panel === 'chapters' && selBook && (
              <button onClick={() => openNewChapter(selBook)} disabled={isBusy} style={{ ...primary, opacity: isBusy ? 0.7 : 1 }}>+ নতুন অধ্যায়</button>
            )}
            <div
              title={data.dbConnected ? 'MongoDB ডাটাবেজের সাথে সরাসরি যুক্ত' : 'লোকাল ফাইল সিস্টেম মোড'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                fontWeight: 700,
                padding: '5px 10px',
                borderRadius: 999,
                background: data.dbConnected ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                border: `1px solid ${data.dbConnected ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
                color: data.dbConnected ? '#4ade80' : '#f59e0b',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: data.dbConnected ? '#22c55e' : '#f59e0b',
                  display: 'inline-block',
                  boxShadow: data.dbConnected ? '0 0 6px #22c55e' : 'none',
                }}
              />
              <span>{data.dbConnected ? 'MongoDB ক্লাউড DB' : 'ফাইল মোড'}</span>
            </div>
            <Link href="/" style={{ ...ghost, textDecoration: 'none' }}>🏠 পাঠাগার</Link>
            <button
              onClick={handleLogout}
              style={{
                ...ghost,
                color: '#ff7070',
                borderColor: 'rgba(255,92,92,0.4)',
                background: 'rgba(255,92,92,0.08)',
              }}
              title="অ্যাডমিন প্যানেল থেকে লগআউট করুন"
            >
              🚪 লগআউট
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px 80px', animation: 'fadeUp 0.2s ease' }}>

        {/* ═══════════════════════════════════════════════
            PANEL 1: SERIES LIST
           ═══════════════════════════════════════════════ */}
        {panel === 'series' && (
          <div>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
              {[
                { icon: '🗂', label: 'মোট সিরিজ', value: data.series.length, color: C.accent },
                { icon: '📚', label: 'মোট বই', value: data.series.reduce((s, x) => s + x.books.length, 0) + data.unassigned.length, color: C.blue },
                { icon: '📑', label: 'মোট অধ্যায়', value: data.series.reduce((s, x) => s + x.books.reduce((b, bk) => b + bk.chaptersCount, 0), 0) + data.unassigned.reduce((s, b) => s + b.chaptersCount, 0), color: C.green },
              ].map((st) => (
                <div key={st.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 20px' }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{st.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: st.color, lineHeight: 1 }}>{st.value}</div>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, marginTop: 4 }}>{st.label}</div>
                </div>
              ))}
            </div>

            {/* Series grid */}
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    style={{
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 18,
                      height: 160,
                      padding: 20,
                      display: 'flex',
                      gap: 16,
                      alignItems: 'center',
                      opacity: 0.7,
                      animation: 'pulse 1.4s ease-in-out infinite',
                    }}
                  >
                    <div style={{ width: 68, height: 96, borderRadius: 12, background: 'rgba(255,255,255,0.06)' }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ height: 16, width: '70%', borderRadius: 6, background: 'rgba(255,255,255,0.08)' }} />
                      <div style={{ height: 12, width: '45%', borderRadius: 6, background: 'rgba(255,255,255,0.05)' }} />
                      <div style={{ height: 22, width: '35%', borderRadius: 999, background: 'rgba(124,107,255,0.15)', marginTop: 8 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : data.series.length === 0 && data.unassigned.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', background: C.surface, borderRadius: 20, border: `2px dashed ${C.border}` }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>📂</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>কোনো সিরিজ নেই</h3>
                <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>প্রথমে একটি সিরিজ তৈরি করুন, তারপর সেই সিরিজের অধীনে বই যোগ করুন।</p>
                <button onClick={() => setModal('new-series')} style={{ ...primary, margin: '0 auto' }}>+ প্রথম সিরিজ তৈরি করুন</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16, alignItems: 'stretch' }}>
                {data.series.map((s) => (
                  <div
                    key={s.name}
                    style={{
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 18,
                      padding: 0,
                      overflow: 'hidden',
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 32px rgba(124,107,255,0.15)`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    onClick={() => { setSelSeries(s); setPanel('books'); }}
                  >
                    {/* Card top accent */}
                    <div style={{ height: 4, background: `linear-gradient(90deg, ${C.accent}, ${C.blue})` }} />
                    <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontSize: 18 }}>🗂</span>
                            <Pill color={C.accent}>{s.books.length} টি বই</Pill>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); openEditSeries(s); }}
                              title="সিরিজের ছবি ও তথ্য পরিবর্তন করুন"
                              style={{ background: C.surfaceHi, border: `1px solid ${C.border}`, color: C.mutedHi, borderRadius: 8, padding: '4px 9px', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 4 }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accentHi; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.mutedHi; }}
                            >✏ ছবি/তথ্য</button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteSeries(s); }}
                              title="সিরিজ মুছে ফেলুন"
                              style={{ background: C.redBg, border: `1px solid ${C.red}30`, color: C.red, borderRadius: 8, padding: '4px 8px', cursor: 'pointer', fontSize: 12, transition: 'all 0.15s' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = C.red; e.currentTarget.style.color = '#fff'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = C.redBg; e.currentTarget.style.color = C.red; }}
                            >🗑</button>
                          </div>
                        </div>

                        {/* Series Cover + Details */}
                        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 12 }}>
                          {s.image ? (
                            <img
                              src={s.image}
                              alt={s.name}
                              style={{
                                width: 58,
                                height: 82,
                                objectFit: 'cover',
                                borderRadius: 10,
                                border: `1px solid ${C.borderHi}`,
                                flexShrink: 0,
                                boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                              }}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 58,
                                height: 82,
                                borderRadius: 10,
                                background: C.surfaceHi,
                                border: `1px dashed ${C.border}`,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: C.muted,
                                fontSize: 16,
                                flexShrink: 0,
                              }}
                              title="কোনো ছবি যোগ করা হয়নি"
                            >
                              <span>🖼️</span>
                              <span style={{ fontSize: 9, marginTop: 4, color: C.muted }}>ছবি নেই</span>
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: '0 0 4px', lineHeight: 1.3 }}>{s.name}</h3>
                            <div style={{ minHeight: 18, marginBottom: 5 }}>
                              {s.author ? <p style={{ fontSize: 11, color: C.amber, fontWeight: 700, margin: 0 }}>✍️ {s.author}</p> : null}
                            </div>
                            <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.4, minHeight: 34, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {s.description || 'কোনো বিবরণ দেওয়া হয়নি'}
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, minHeight: 24, alignItems: 'center' }}>
                          {s.books.slice(0, 4).map((b) => (
                            <span key={b.title} style={{ fontSize: 10, color: C.mutedHi, background: C.surfaceHi, padding: '2px 8px', borderRadius: 6, border: `1px solid ${C.border}`, whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</span>
                          ))}
                          {s.books.length > 4 && <span style={{ fontSize: 10, color: C.muted }}>+{s.books.length - 4} আরো</span>}
                          {s.books.length === 0 && <span style={{ fontSize: 11, color: C.muted, fontStyle: 'italic' }}>কোনো বই যুক্ত নেই</span>}
                        </div>
                      </div>

                      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: 12, color: C.accentHi, fontWeight: 700 }}>বই দেখুন →</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Unassigned books */}
            {data.unassigned.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.muted, margin: 0 }}>📁 সিরিজ-বিহীন বই ({data.unassigned.length})</h3>
                </div>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
                  {data.unassigned.map((book, i) => (
                    <div key={book.title} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: i < data.unassigned.length - 1 ? `1px solid ${C.border}` : 'none', transition: 'background 0.15s' }} className="admin-card-row">
                      <span style={{ fontSize: 16 }}>📖</span>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text }}>{book.title}</span>
                      <Pill color={C.muted}>{book.chaptersCount} অধ্যায়</Pill>
                      <Link href={`/read/${book.slug}`} target="_blank" style={{ fontSize: 11, color: C.blue, textDecoration: 'none' }}>👁 দেখুন</Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            PANEL 2: BOOKS IN SERIES
           ═══════════════════════════════════════════════ */}
        {panel === 'books' && selSeries && (
          <div>
            {/* Series info banner */}
            <div style={{ background: `linear-gradient(135deg, ${C.accent}18, ${C.blue}10)`, border: `1px solid ${C.accent}30`, borderRadius: 18, padding: '22px 26px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                {selSeries.image ? (
                  <img
                    src={selSeries.image}
                    alt={selSeries.name}
                    style={{ width: 68, height: 96, objectFit: 'cover', borderRadius: 12, border: `1px solid ${C.accent}40`, boxShadow: '0 6px 20px rgba(0,0,0,0.3)', flexShrink: 0 }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div style={{ width: 68, height: 96, borderRadius: 12, background: C.surface, border: `1px dashed ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 20, flexShrink: 0 }}>
                    <span>🖼️</span>
                    <span style={{ fontSize: 9, marginTop: 4 }}>ছবি নেই</span>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>📂 বই সিরিজ</div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: '0 0 4px' }}>{selSeries.name}</h2>
                  {selSeries.author && <p style={{ fontSize: 13, color: C.amber, fontWeight: 700, margin: '0 0 4px' }}>✍️ লেখক: {selSeries.author}</p>}
                  {selSeries.description && <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{selSeries.description}</p>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  onClick={() => openEditSeries(selSeries)}
                  style={{ ...ghost, borderColor: `${C.accent}60`, color: C.accentHi }}
                >
                  ✏ ছবি ও তথ্য সম্পাদনা
                </button>
                <Pill color={C.blue}>{selSeries.books.length} টি বই</Pill>
                <Pill color={C.green}>{selSeries.books.reduce((s, b) => s + b.chaptersCount, 0)} অধ্যায়</Pill>
              </div>
            </div>

            {selSeries.books.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '70px 20px', background: C.surface, borderRadius: 18, border: `2px dashed ${C.border}` }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>এই সিরিজে কোনো বই নেই</h3>
                <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>উপরের "+ নতুন বই" বাটনে ক্লিক করে বই যোগ করুন।</p>
                <button onClick={() => setModal('new-book')} style={{ ...primary, margin: '0 auto' }}>+ প্রথম বই যোগ করুন</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14, alignItems: 'stretch' }}>
                {selSeries.books.map((book, i) => (
                  <div
                    key={book.title}
                    style={{
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 16,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      justifyContent: 'space-between',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.borderHi; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,0,0,0.3)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    onClick={() => { setSelBook(book); setPanel('chapters'); }}
                  >
                    {/* Order badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
                      <span style={{ width: 30, height: 30, borderRadius: 9, background: C.accentBg, border: `1px solid ${C.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: C.accent }}>
                        {i + 1}
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); openNewChapter(book); }}
                          style={{ background: C.accentBg, border: `1px solid ${C.accent}30`, color: C.accent, borderRadius: 7, padding: '4px 9px', cursor: 'pointer', fontSize: 11, fontWeight: 700, transition: 'all 0.15s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = C.accent; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = C.accentBg; e.currentTarget.style.color = C.accent; }}
                        >+ অধ্যায়</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditBook(book); }}
                          style={{ background: C.blueBg, border: `1px solid ${C.blue}30`, color: C.blue, borderRadius: 7, padding: '4px 7px', cursor: 'pointer', fontSize: 11, transition: 'all 0.15s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = C.blue; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = C.blueBg; e.currentTarget.style.color = C.blue; }}
                          title="বইয়ের কভার ছবি সম্পাদনা"
                        >🖼</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteBook(book); }}
                          style={{ background: C.redBg, border: `1px solid ${C.red}30`, color: C.red, borderRadius: 7, padding: '4px 7px', cursor: 'pointer', fontSize: 11, transition: 'all 0.15s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = C.red; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = C.redBg; e.currentTarget.style.color = C.red; }}
                        >🗑</button>
                      </div>
                    </div>
                    <div style={{ padding: '0 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                        {book.image && (
                          <img
                            src={book.image}
                            alt={book.title}
                            style={{
                              width: 38,
                              height: 52,
                              objectFit: 'cover',
                              borderRadius: 6,
                              border: `1px solid ${C.borderHi}`,
                              flexShrink: 0,
                            }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        <h4
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            color: C.text,
                            margin: 0,
                            lineHeight: 1.4,
                            minHeight: 40,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            flex: 1,
                          }}
                          title={book.title}
                        >
                          {book.title}
                        </h4>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                        <Pill color={book.chaptersCount > 0 ? C.green : C.muted}>{book.chaptersCount} টি অধ্যায়</Pill>
                        <span style={{ fontSize: 12, color: C.accentHi, fontWeight: 700 }}>অধ্যায় দেখুন →</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            PANEL 3: CHAPTERS IN BOOK
           ═══════════════════════════════════════════════ */}
        {panel === 'chapters' && selBook && (
          <div style={{ maxWidth: 800 }}>
            {/* Book header */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5 }}>📖 বই</div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0 }}>{selBook.title}</h2>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Link href={`/read/${selBook.slug}`} target="_blank" style={{ ...ghost, textDecoration: 'none' }}>👁 প্রিভিউ</Link>
                <button onClick={() => openNewChapter(selBook)} style={primary}>+ নতুন অধ্যায়</button>
              </div>
            </div>

            {selBook.chapters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: C.surface, borderRadius: 18, border: `2px dashed ${C.border}` }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
                <p style={{ fontSize: 14, color: C.muted, marginBottom: 18 }}>এই বইতে কোনো অধ্যায় নেই।</p>
                <button onClick={() => openNewChapter(selBook)} style={{ ...primary, margin: '0 auto' }}>+ প্রথম অধ্যায় যোগ করুন</button>
              </div>
            ) : (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden' }}>
                {selBook.chapters.map((chap, idx) => (
                  <div
                    key={chap.fileName}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderBottom: idx < selBook.chapters.length - 1 ? `1px solid ${C.border}` : 'none', transition: 'background 0.15s' }}
                    className="admin-card-row"
                  >
                    <span style={{ width: 32, height: 32, borderRadius: 9, background: C.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: C.accent, flexShrink: 0 }}>
                      {chap.chapterNumber}
                    </span>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chap.chapterTitle}</span>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => openEditChapter(selBook, chap)}
                        style={{ background: C.accentBg, border: `1px solid ${C.accent}30`, color: C.accentHi, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = C.accent; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = C.accentBg; e.currentTarget.style.color = C.accentHi; }}
                      >✏ সম্পাদনা</button>
                      <button
                        onClick={() => deleteChapter(chap)}
                        style={{ background: C.redBg, border: `1px solid ${C.red}30`, color: C.red, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12, transition: 'all 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = C.red; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = C.redBg; e.currentTarget.style.color = C.red; }}
                      >🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════
            PANEL 4: CHAPTER EDITOR
           ═══════════════════════════════════════════════ */}
        {panel === 'editor' && editor && (
          <div style={{ maxWidth: 860 }}>
            {/* Meta fields */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 22px', marginBottom: 16, display: 'grid', gridTemplateColumns: '100px 1fr', gap: '12px 16px', alignItems: 'center' }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>অধ্যায় নং</label>
              <input type="number" min="1" value={editor.chapterNumber} onChange={(e) => setEditor((p) => ({ ...p, chapterNumber: parseInt(e.target.value) || 1 }))} style={{ ...input, width: 100 }} onFocus={focus} onBlur={blur} />
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>শিরোনাম</label>
              <input type="text" placeholder="অধ্যায়ের নাম লিখুন..." value={editor.chapterTitle} onChange={(e) => setEditor((p) => ({ ...p, chapterTitle: e.target.value }))} style={input} onFocus={focus} onBlur={blur} />
            </div>

            {/* Text editor */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', borderBottom: `1px solid ${C.border}`, background: C.surfaceHi }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>📝 বিষয়বস্তু</span>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: C.muted }}>
                  <span>{editor.content.length.toLocaleString()} অক্ষর</span>
                  <span>·</span>
                  <span>{editor.content.split(/\n\n+/).filter(Boolean).length} অনুচ্ছেদ</span>
                  <span>·</span>
                  <span>{editor.content.split(/\s+/).filter(Boolean).length} শব্দ</span>
                </div>
              </div>
              <textarea
                ref={textRef}
                value={editor.content}
                onChange={(e) => setEditor((p) => ({ ...p, content: e.target.value }))}
                placeholder={`এখানে অধ্যায়ের লেখা লিখুন বা পেস্ট করুন...\n\nদুটো Enter = নতুন অনুচ্ছেদ`}
                style={{ width: '100%', minHeight: '62vh', padding: '20px 24px', background: 'transparent', border: 'none', outline: 'none', color: C.text, fontSize: 16, lineHeight: 1.9, fontFamily: "'Anek Bangla','Noto Serif Bengali',system-ui,sans-serif", display: 'block', resize: 'vertical' }}
              />
            </div>

            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: C.muted }}>💡 Ctrl+S দিয়ে দ্রুত সংরক্ষণ করুন</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setPanel('chapters')} disabled={saving || isBusy} style={ghost}>← ফিরে যান</button>
                <button onClick={saveChapter} disabled={saving || isBusy} style={{ ...primary, opacity: saving || isBusy ? 0.6 : 1 }}>
                  {saving || isBusy ? '⏳ সংরক্ষণ হচ্ছে...' : '💾 সংরক্ষণ করুন'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
