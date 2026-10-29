/**
 * LoginScreen.jsx — Phase 3
 * RTL Black & Yellow login card with quick demo buttons.
 */

import { useState } from 'react';
import { Eye, EyeOff, Zap, LogIn, User, Lock } from 'lucide-react';
import { login } from '../services/authService';

const DEMO = [
  {
    icon:     '👔',
    label:    'دخول سريع: مدير مكتب التوصيل',
    sub:      'manager@awrudrat.com',
    email:    'manager@awrudrat.com',
    password: 'Manager@123',
    color:    'var(--color-accent)',
    textColor:'#09090B',
  },
  {
    icon:     '🛵',
    label:    'دخول سريع: مندوب توصيل (كريم)',
    sub:      'courier@awrudrat.com',
    email:    'courier@awrudrat.com',
    password: 'Courier@123',
    color:    'var(--color-surface-2)',
    textColor:'var(--color-text)',
    border:   '1px solid var(--color-border)',
  },
];

export default function LoginScreen({ onLogin }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleLogin(e) {
    e?.preventDefault();
    if (!email.trim()) { setError('من فضلك أدخل البريد الإلكتروني'); return; }
    if (!password)     { setError('من فضلك أدخل كلمة المرور'); return; }
    setLoading(true); setError('');
    /* tiny artificial delay for UX feel */
    await new Promise(r => setTimeout(r, 400));
    const result = login(email, password);
    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    onLogin(result.user);
  }

  function handleQuickLogin(demo) {
    setEmail(demo.email);
    setPassword(demo.password);
    setError('');
    /* auto-submit */
    const result = login(demo.email, demo.password);
    if (result.success) onLogin(result.user);
  }

  return (
    <div
      style={{
        minHeight:       '100vh',
        background:      'var(--color-bg)',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        padding:         '24px 16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* ── Logo ── */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 52, height: 52, background: 'var(--color-accent)', borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(250,204,21,0.35)',
            }}>
              <Zap size={28} color="#09090B" fill="#09090B" />
            </div>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-accent)', marginBottom: 4 }}>أوردرات ⚡</h1>
          <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>نظام مكاتب الشحن والمناديب</p>
        </div>

        {/* ── Login Card ── */}
        <div
          className="card"
          style={{
            borderColor: 'rgba(250,204,21,0.2)',
            boxShadow:   '0 8px 40px rgba(0,0,0,0.6)',
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, textAlign: 'center' }}>تسجيل الدخول</h2>
          <form onSubmit={handleLogin} autoComplete="off">
            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label className="section-label"><User size={12} /> البريد الإلكتروني</label>
              <input
                className="input"
                type="email"
                autoComplete="username"
                placeholder="example@awrudrat.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                dir="ltr"
                style={{ textAlign: 'right' }}
              />
            </div>
            {/* Password */}
            <div style={{ marginBottom: 6, position: 'relative' }}>
              <label className="section-label"><Lock size={12} /> كلمة المرور</label>
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                dir="ltr"
                style={{ textAlign: 'right', paddingLeft: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute', bottom: 10, left: 12,
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 0,
                }}
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <p style={{ color: 'var(--color-danger)', fontSize: 13, marginBottom: 10, marginTop: 6 }}>
                ⚠ {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: 14 }}
            >
              {loading ? <span className="pulse-yellow">جاري التحقق...</span> : <><LogIn size={17} /> دخول</>}
            </button>
          </form>
        </div>

        {/* ── Quick Demo Buttons ── */}
        <div className="card" style={{ border: '1px dashed var(--color-border)', background: 'transparent', padding: 14 }}>
          <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 10, textAlign: 'center' }}>
            ⚡ دخول سريع للتجربة بضغطة واحدة
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DEMO.map(d => (
              <button
                key={d.email}
                className="btn"
                onClick={() => handleQuickLogin(d)}
                style={{
                  background: d.color,
                  color:      d.textColor,
                  border:     d.border || 'none',
                  fontSize:   13,
                  padding:    '10px 14px',
                  justifyContent: 'flex-start',
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>{d.icon}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>{d.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 400 }}>{d.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-muted)', marginTop: 16 }}>
          جميع البيانات تُحفظ محلياً في جهازك فقط · بدون إنترنت للتخزين
        </p>
      </div>
    </div>
  );
}
