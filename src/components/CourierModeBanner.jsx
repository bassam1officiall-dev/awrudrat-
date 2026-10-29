/**
 * CourierModeBanner.jsx — Phase 3
 * Agency/Freelance toggle banner for the courier view.
 */

import { Building2, Bike } from 'lucide-react';
import { setWorkMode } from '../services/authService';

export default function CourierModeBanner({ user, onModeChange }) {
  const isAgency = user?.workMode !== 'freelance';

  function toggle(mode) {
    if (user?.workMode === mode) return;
    setWorkMode(user.id, mode);
    onModeChange(mode);
  }

  return (
    <div
      style={{
        margin:       '0 16px 12px',
        borderRadius: 'var(--radius-md)',
        overflow:     'hidden',
        border:       '1px solid var(--color-border)',
      }}
    >
      {/* Mode Tabs */}
      <div style={{ display:'flex' }}>
        <button
          onClick={() => toggle('agency')}
          style={{
            flex:        1, padding:'10px 8px',
            background:  isAgency ? 'var(--color-accent)' : 'var(--color-surface-2)',
            color:       isAgency ? '#09090B' : 'var(--color-muted)',
            border:      'none', cursor:'pointer',
            fontFamily:  'var(--font-main)', fontWeight:700, fontSize:12,
            display:     'flex', alignItems:'center', justifyContent:'center', gap:5,
            transition:  'all 0.2s',
          }}
        >
          <Building2 size={14}/> وضع مكتب التوصيل
        </button>
        <button
          onClick={() => toggle('freelance')}
          style={{
            flex:        1, padding:'10px 8px',
            background:  !isAgency ? 'var(--color-success)' : 'var(--color-surface-2)',
            color:       !isAgency ? '#fff' : 'var(--color-muted)',
            border:      'none', cursor:'pointer',
            fontFamily:  'var(--font-main)', fontWeight:700, fontSize:12,
            display:     'flex', alignItems:'center', justifyContent:'center', gap:5,
            transition:  'all 0.2s',
          }}
        >
          <Bike size={14}/> مندوب حر مستقل
        </button>
      </div>

      {/* Description */}
      <div style={{ padding:'8px 12px', background:'var(--color-surface)', fontSize:11, color:'var(--color-muted)', lineHeight:1.5 }}>
        {isAgency ? (
          <>
            🏢 <strong style={{ color:'var(--color-accent)' }}>وضع المكتب:</strong>{' '}
            أوردراتك الواردة من <strong>{user?.officeName ?? 'مكتب التوصيل'}</strong> جاهزة في القائمة.
            يُحسب تلقائياً صافي عهدة المكتب المطلوب تسليمها آخر اليوم.
          </>
        ) : (
          <>
            🛵 <strong style={{ color:'var(--color-success)' }}>وضع حر:</strong>{' '}
            أضف أوردراتك الشخصية واحسب مكسبك الصافي بشكل مستقل تماماً.
          </>
        )}
      </div>
    </div>
  );
}
