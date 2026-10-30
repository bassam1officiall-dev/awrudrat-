/**
 * ShiftHeader.jsx — Zero-Auth Instant Direct Testing
 * Sticky top bar with intuitive Black & Yellow role switcher pill:
 * [ 🛵 وضع المندوب ] | [ 👔 لوحة مدير المكتب ]
 */

import { useState, useEffect, useRef } from 'react';
import { Zap, Play, Square, Clock, RotateCcw } from 'lucide-react';
import { getShift, startShift, endShift, resetDay } from '../services/storageService';
import { switchRole, DEFAULT_COURIER, DEFAULT_MANAGER } from '../services/authService';

function formatDuration(ms) {
  if (!ms || ms < 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
}

export default function ShiftHeader({ user, onRoleChange, onRefreshOrders }) {
  const [shift,   setShift]   = useState(getShift);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  const isCourier = user?.role !== 'manager';

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

  function handleShiftToggle() {
    if (shift.active) {
      if (!window.confirm('إنهاء الشيفت الحالي؟')) return;
      setShift(endShift());
    } else {
      setShift(startShift());
    }
  }

  function handleRoleSelect(targetRole) {
    if (user?.role === targetRole) return;
    const newUser = switchRole(targetRole);
    onRoleChange?.(newUser);
  }

  function handleQuickReset() {
    if (!window.confirm('إعادة تهيئة البيانات التجريبية لليوم؟')) return;
    resetDay();
    onRefreshOrders?.();
  }

  return (
    <header
      style={{
        position:       'fixed',
        top:            0,
        width:          '100%',
        maxWidth:       '480px',
        background:     'var(--color-surface)',
        borderBottom:   '1px solid var(--color-border)',
        zIndex:         200,
        boxShadow:      '0 4px 24px rgba(0,0,0,0.5)',
        padding:        '8px 14px 10px',
        display:        'flex',
        flexDirection:  'column',
        gap:            8,
      }}
    >
      {/* ── Row 1: Brand + Shift Controls / Quick Reset ── */}
      <div
        style={{
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'space-between',
          width:           '100%',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(250,204,21,0.35)',
            }}
          >
            <Zap size={18} color="#09090B" fill="#09090B" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-accent)', letterSpacing: 0.2 }}>
                أوردرات ⚡
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(250,204,21,0.15)',
                  color: 'var(--color-accent)',
                  border: '1px solid rgba(250,204,21,0.3)',
                }}
              >
                تجربة فورية
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Timer & Shift Toggle for Courier, or Office Badge for Manager */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isCourier ? (
            <>
              {shift.active && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '3px 8px',
                  }}
                >
                  <Clock size={12} color="var(--color-accent)" className="pulse-yellow" />
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--color-accent)',
                      letterSpacing: 0.8,
                    }}
                  >
                    {formatDuration(elapsed)}
                  </span>
                </div>
              )}
              <button
                className={`btn btn-xs ${shift.active ? 'btn-danger' : 'btn-primary'}`}
                onClick={handleShiftToggle}
                style={{ minWidth: 76, padding: '5px 9px', fontSize: 11 }}
              >
                {shift.active ? (
                  <><Square size={11} fill="currentColor" /> إنهاء</>
                ) : (
                  <><Play size={11} fill="currentColor" /> شيفت</>
                )}
              </button>
            </>
          ) : (
            <button
              className="btn btn-ghost btn-xs"
              onClick={handleQuickReset}
              title="إعادة ضبط البيانات التجريبية"
              style={{ fontSize: 11, padding: '4px 8px', gap: 4 }}
            >
              <RotateCcw size={12} color="var(--color-muted)" />
              <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>إعادة تعيين</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Row 2: Sticky High-Contrast Role Switcher Pill ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'var(--color-surface-2)',
          padding: 3,
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--color-border)',
          gap: 4,
        }}
      >
        <button
          type="button"
          onClick={() => handleRoleSelect('courier')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            fontFamily: 'var(--font-main)',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            background: isCourier ? 'var(--color-accent)' : 'transparent',
            color: isCourier ? '#09090B' : 'var(--color-muted)',
            boxShadow: isCourier ? '0 2px 8px rgba(250,204,21,0.35)' : 'none',
          }}
        >
          <span>🛵</span>
          <span>وضع المندوب</span>
        </button>

        <button
          type="button"
          onClick={() => handleRoleSelect('manager')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '7px 12px',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            fontFamily: 'var(--font-main)',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            background: !isCourier ? 'var(--color-accent)' : 'transparent',
            color: !isCourier ? '#09090B' : 'var(--color-muted)',
            boxShadow: !isCourier ? '0 2px 8px rgba(250,204,21,0.35)' : 'none',
          }}
        >
          <span>👔</span>
          <span>لوحة مدير المكتب</span>
        </button>
      </div>
    </header>
  );
}
