'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const C = {
  bg: '#0c0e14',
  surface: '#131622',
  surfaceHi: '#1a1e2e',
  border: '#1e2438',
  borderHi: '#2c3350',
  text: '#f0f1f8',
  muted: '#6b7394',
  mutedHi: '#9ba3c8',
  accent: '#7c6bff',
  accentHi: '#a898ff',
  accentGlow: 'rgba(124,107,255,0.35)',
  amber: '#fbbf24',
  red: '#ff5c5c',
  green: '#22d47a',
};

export default function AdminLoginUI() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const from         = searchParams.get('from') || '/admin';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState('');
  const [shake, setShake]      = useState(false);
  const [success, setSuccess]  = useState(false);
  const userRef = useRef(null);

  useEffect(() => {
    userRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('ব্যবহারকারীর নাম ও পাসওয়ার্ড উভয়ই প্রয়োজন।');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        // Hard redirect so the middleware reads the fresh HttpOnly cookie
        setTimeout(() => { window.location.href = from; }, 800);
      } else {
        setError(data.message || 'লগইন ব্যর্থ হয়েছে।');
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    } catch (err) {
      setError('সার্ভারের সাথে সংযোগ করা যাচ্ছে না।');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;600;700;800&family=Noto+Serif+Bengali:wght@400;600;700&family=Inter:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: ${C.bg};
          font-family: 'Anek Bangla', 'Noto Serif Bengali', 'Inter', system-ui, sans-serif;
          min-height: 100vh;
          overflow: hidden;
        }

        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(32px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          35% { transform: translateX(7px); }
          55% { transform: translateX(-5px); }
          75% { transform: translateX(4px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 24px ${C.accentGlow}, 0 0 0 1px ${C.accent}40; }
          50% { box-shadow: 0 0 40px ${C.accentGlow}, 0 0 0 1px ${C.accent}60; }
        }
        @keyframes bgGrid {
          0% { background-position: 0 0; }
          100% { background-position: 60px 60px; }
        }
        @keyframes successPop {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }

        .login-card {
          animation: floatUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .login-card.shake {
          animation: shake 0.55s ease;
        }
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        .input-field {
          width: 100%;
          background: ${C.surfaceHi};
          border: 1.5px solid ${C.border};
          border-radius: 12px;
          color: ${C.text};
          font-size: 15px;
          padding: 13px 16px;
          outline: none;
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-field::placeholder { color: ${C.muted}; }
        .input-field:focus {
          border-color: ${C.accent};
          box-shadow: 0 0 0 3px ${C.accentGlow};
        }
        .login-btn {
          width: 100%;
          background: linear-gradient(135deg, ${C.accent}, #9b8bff);
          color: #fff;
          border: none;
          border-radius: 13px;
          padding: 14px;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          font-family: 'Anek Bangla', 'Noto Serif Bengali', inherit;
          animation: pulse-glow 2.5s ease-in-out infinite;
          letter-spacing: 0.02em;
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
        .login-btn:disabled {
          opacity: 0.75;
          cursor: not-allowed;
          animation: none;
        }
        .toggle-pass {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: ${C.muted};
          font-size: 16px;
          display: flex;
          align-items: center;
          padding: 4px;
          transition: color 0.15s;
          line-height: 1;
        }
        .toggle-pass:hover { color: ${C.mutedHi}; }
        .success-icon {
          animation: successPop 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>

      {/* Animated background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: C.bg,
        backgroundImage: `
          radial-gradient(ellipse 80% 60% at 50% -20%, rgba(124,107,255,0.18) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 80% 100%, rgba(56,189,248,0.08) 0%, transparent 50%)
        `,
        zIndex: 0,
      }} />
      {/* Grid dots */}
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        zIndex: 0,
        animation: 'bgGrid 12s linear infinite',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div
          className={`login-card${shake ? ' shake' : ''}`}
          style={{
            width: '100%',
            maxWidth: '420px',
            background: C.surface,
            border: `1px solid ${C.borderHi}`,
            borderRadius: '28px',
            padding: '44px 40px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          {/* Logo / Brand */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '22px',
              background: `linear-gradient(135deg, ${C.accent}, #9b8bff)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '34px',
              margin: '0 auto 20px',
              boxShadow: `0 12px 36px ${C.accentGlow}`,
            }}>
              {success ? (
                <span className="success-icon">✅</span>
              ) : '⚡'}
            </div>
            <h1 style={{
              fontSize: '26px',
              fontWeight: 800,
              color: C.text,
              fontFamily: "'Anek Bangla', 'Noto Serif Bengali', sans-serif",
              marginBottom: '6px',
            }}>
              অ্যাডমিন প্যানেল
            </h1>
            <p style={{ fontSize: '14px', color: C.muted, fontFamily: "'Anek Bangla', 'Noto Serif Bengali', sans-serif" }}>
              পাঠাগার পরিচালনার জন্য লগইন করুন
            </p>
          </div>

          {success ? (
            <div style={{
              textAlign: 'center',
              padding: '20px 0',
              color: C.green,
              fontSize: '16px',
              fontWeight: 700,
              fontFamily: "'Anek Bangla', 'Noto Serif Bengali', sans-serif",
            }}>
              <div style={{ fontSize: '24px', marginBottom: '10px' }}>✓</div>
              লগইন সফল হয়েছে! পুনর্নির্দেশিত হচ্ছে...
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {/* Username */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: C.mutedHi,
                  marginBottom: '8px',
                  letterSpacing: '0.04em',
                  fontFamily: "'Anek Bangla', 'Noto Serif Bengali', sans-serif",
                }}>
                  👤 ব্যবহারকারীর নাম
                </label>
                <input
                  ref={userRef}
                  className="input-field"
                  type="text"
                  autoComplete="username"
                  placeholder="ব্যবহারকারীর নাম লিখুন"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: '26px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: C.mutedHi,
                  marginBottom: '8px',
                  letterSpacing: '0.04em',
                  fontFamily: "'Anek Bangla', 'Noto Serif Bengali', sans-serif",
                }}>
                  🔐 পাসওয়ার্ড
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input-field"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="পাসওয়ার্ড লিখুন"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    disabled={loading}
                    style={{ paddingRight: '46px' }}
                  />
                  <button
                    type="button"
                    className="toggle-pass"
                    onClick={() => setShowPass((v) => !v)}
                    tabIndex={-1}
                    title={showPass ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  background: 'rgba(255,92,92,0.12)',
                  border: '1px solid rgba(255,92,92,0.35)',
                  borderRadius: '12px',
                  padding: '11px 16px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13px',
                  color: C.red,
                  fontWeight: 600,
                  fontFamily: "'Anek Bangla', 'Noto Serif Bengali', sans-serif",
                }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>✗</span>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner" />
                    লগইন হচ্ছে...
                  </>
                ) : (
                  <>
                    <span>🔑</span>
                    লগইন করুন
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer hint */}
          <p style={{
            textAlign: 'center',
            marginTop: '28px',
            fontSize: '12px',
            color: C.muted,
            fontFamily: "'Anek Bangla', 'Noto Serif Bengali', sans-serif",
          }}>
            এই পানেলটি শুধুমাত্র অ্যাডমিনদের জন্য।
          </p>
        </div>

        {/* Back to library */}
        <a
          href="/"
          style={{
            marginTop: '24px',
            fontSize: '13px',
            color: C.muted,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'color 0.15s',
            fontFamily: "'Anek Bangla', 'Noto Serif Bengali', sans-serif",
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = C.text}
          onMouseLeave={(e) => e.currentTarget.style.color = C.muted}
        >
          ← পাঠাগারে ফিরে যান
        </a>
      </div>
    </>
  );
}
