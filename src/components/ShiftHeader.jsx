/**
 * ShiftHeader.jsx — Phase 3
 * Shows user name, role badge, quick account switch, logout.
 */

import { useState, useEffect, useRef } from 'react';
import { Zap, Play, Square, Clock, LogOut, RefreshCw, ChevronDown } from 'lucide-react';
import { getShift, startShift, endShift } from '../services/storageService';
import { quickSwitch, getCouriers } from '../services/authService';

function formatDuration(ms) {
  if (!ms || ms < 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

const ROLE_CONFIG = {
  manager: { badge: '👔 مدير مكتب',    badgeBg: 'var(--color-accent)',   badgeColor: '#09090B' },
  courier: { badge: '🛵 مندوب توصيل',  badgeBg: 'var(--color-surface-2)', badgeColor: 'var(--color-text)' },
};

export default function ShiftHeader({ user, onLogout, onUserSwitch }) {
  const [shift,     setShift]     = useState(getShift);
  const [elapsed,   setElapsed]   = useState(0);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const timerRef  = useRef(null);
  const menuRef   = useRef(null);

  const roleConf = ROLE_CONFIG[user?.role] ?? ROLE_CONFIG.courier;

  /* Live timer */
  useEffect(() => {
    if (shift.active && shift.startedAt) {
      setElapsed(Date.now() - shift.startedAt);
      timerRef.current = setInterval(() => setElapsed(Date.now() - shift.startedAt), 1000);
    } else {
      clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => clearInterval(timerRef.current);
  }, [shift.active, shift.startedAt]);

  /* Close dropdown on outside click */
  useEffect(() => {
    function handler(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleShiftToggle() {
    if (shift.active) {
      if (!window.confirm('إنهاء الشيفت الحالي؟')) return;
      setShift(endShift());
    } else {
      setShift(startShift());
    }
  }

  function handleSwitch(email) {
    setMenuOpen(false);
    const newUser = quickSwitch(email);
    if (newUser) onUserSwitch(newUser);
  }

  /* Quick-switch targets (all pre-seeded accounts except current) */
  const switchTargets = [
    { email: 'manager@awrudrat.com', label: '👔 مدير المكتب — أحمد محمود' },
    { email: 'courier@awrudrat.com', label: '🛵 كريم عادل (مندوب 1)' },
    { email: 'hassan@awrudrat.com',  label: '🛵 حسن طارق (مندوب 2)' },
  ].filter(t => t.email !== user?.email);

  return (
    <header style={{
      position: 'fixed', top: 0, width: '100%', maxWidth: '480px',
      height: 'var(--header-height)', background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 12px', zIndex: 200, gap: 8,
      boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <Zap size={19} color="var(--color-accent)" fill="var(--color-accent)" />
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--color-accent)' }}>أوردرات ⚡</div>
          <span className="badge" style={{ background: roleConf.badgeBg, color: roleConf.badgeColor, fontSize: 9, padding: '1px 7px', marginTop: 1 }}>
            {roleConf.badge}
          </span>
        </div>
      </div>

      {/* Live Timer (courier only, during active shift) */}
      {user?.role === 'courier' && shift.active && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '3px 9px', flexShrink: 0 }}>
          <Clock size={12} color="var(--color-accent)" className="pulse-yellow" />
          <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--color-accent)', letterSpacing: 1 }}>
            {formatDuration(elapsed)}
          </span>
        </div>
      )}

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }} ref={menuRef}>
        {/* Shift toggle (courier only) */}
        {user?.role === 'courier' && (
          <button
            className={`btn btn-xs ${shift.active ? 'btn-danger' : 'btn-primary'}`}
            onClick={handleShiftToggle}
            style={{ minWidth: 80 }}
          >
            {shift.active
              ? <><Square size={11} fill="currentColor" /> إنهاء</>
              : <><Play  size={11} fill="currentColor" /> شيفت</>}
          </button>
        )}

        {/* Account Switcher Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => setMenuOpen(v => !v)}
            style={{ gap: 4, padding: '6px 9px' }}
            title="تبديل الحساب"
          >
            <RefreshCw size={13} />
            <ChevronDown size={11} />
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', top: '110%', left: 0,
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)', minWidth: 220, zIndex: 500,
              boxShadow: '0 8px 30px rgba(0,0,0,0.6)', overflow: 'hidden',
            }}>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)' }}>
                <p style={{ fontSize: 11, color: 'var(--color-muted)' }}>تبديل سريع للحساب</p>
              </div>
              {switchTargets.map(t => (
                <button
                  key={t.email}
                  onClick={() => handleSwitch(t.email)}
                  style={{
                    display: 'block', width: '100%', padding: '10px 12px',
                    background: 'none', border: 'none', color: 'var(--color-text)',
                    fontFamily: 'var(--font-main)', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', textAlign: 'right',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          className="btn btn-ghost btn-xs"
          onClick={onLogout}
          style={{ padding: '6px 9px' }}
          title="تسجيل خروج"
        >
          <LogOut size={13} color="var(--color-danger)" />
        </button>
      </div>
    </header>
  );
}
