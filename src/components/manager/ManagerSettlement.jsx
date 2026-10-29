/**
 * ManagerSettlement.jsx — Phase 3
 * Office Manager Tab 3: End-of-day KPIs, per-courier settlement, export report.
 */

import { useState } from 'react';
import {
  TrendingUp, Banknote, CheckCircle2, Wallet, Copy,
  MessageSquare, ChevronDown, ChevronUp, RotateCcw, Receipt,
} from 'lucide-react';
import { getCouriers } from '../../services/authService';
import { settleCourrierAccount, isCourierSettled, resetDay } from '../../services/storageService';

export default function ManagerSettlement({ orders, onReset }) {
  const couriers    = getCouriers();
  const [reportOpen, setReportOpen] = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [, forceRender]             = useState(0);

  /* ── Global KPIs ── */
  const allDelivered  = orders.filter(o => o.status === 'delivered');
  const allPostponed  = orders.filter(o => o.status === 'postponed');
  const allPending    = orders.filter(o => o.status === 'pending');
  const totalCOD      = allDelivered.reduce((s, o) => s + (o.cash || 0), 0);
  const totalShipping = orders.reduce((s, o)       => s + (o.shippingFee || 0), 0);
  const totalPayout   = allDelivered.reduce((s, o) => s + (o.deliveryFee || 0), 0);
  const officeProfit  = totalShipping - totalPayout;
  const completionPct = orders.length > 0 ? Math.round((allDelivered.length / orders.length) * 100) : 0;

  /* ── Per-courier data ── */
  function courierStats(courier) {
    const mine      = orders.filter(o => o.assignedTo === courier.courierId);
    const delivered = mine.filter(o => o.status === 'delivered');
    const cod       = delivered.reduce((s, o) => s + (o.cash || 0), 0);
    const payout    = delivered.reduce((s, o) => s + (o.deliveryFee || 0), 0);
    const netOwed   = cod - payout; // what courier hands over to office
    const settled   = isCourierSettled(courier.courierId);
    return { mine, delivered, cod, payout, netOwed, settled };
  }

  function handleSettle(courierId) {
    settleCourrierAccount(courierId);
    forceRender(n => n + 1);
  }

  /* ── Report text ── */
  function buildReport() {
    const date = new Date().toLocaleDateString('ar-EG', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    const lines = [
      `📋 تقرير مكتب أوردرات إكسبريس`,
      `📅 ${date}`,
      `━━━━━━━━━━━━━━━━━`,
      `📦 إجمالي الأوردرات: ${orders.length} | مكتمل: ${allDelivered.length} (${completionPct}%)`,
      `⏳ مؤجل: ${allPostponed.length} | قيد الانتظار: ${allPending.length}`,
      `━━━━━━━━━━━━━━━━━`,
      `💰 إجمالي COD المحصّل: ${totalCOD.toLocaleString('ar-EG')} جنيه`,
      `🚚 إجمالي رسوم الشحن: ${totalShipping.toLocaleString('ar-EG')} جنيه`,
      `💵 إجمالي عمولات المناديب: ${totalPayout.toLocaleString('ar-EG')} جنيه`,
      `🏢 صافي ربح المكتب: ${officeProfit.toLocaleString('ar-EG')} جنيه`,
      `━━━━━━━━━━━━━━━━━`,
      `📊 تفاصيل المناديب:`,
      ...couriers.map(c => {
        const s = courierStats(c);
        return `  🛵 ${c.name}: تسليم ${s.delivered.length}/${s.mine.length} | COD: ${s.cod.toLocaleString('ar-EG')}ج | عمولة: ${s.payout.toLocaleString('ar-EG')}ج | المستحق للمكتب: ${s.netOwed.toLocaleString('ar-EG')}ج`;
      }),
      `━━━━━━━━━━━━━━━━━`,
      `🔖 أوردرات ⚡ رفيق المندوب`,
    ];
    return lines.join('\n');
  }

  async function handleCopy() {
    try { await navigator.clipboard.writeText(buildReport()); setCopied(true); setTimeout(() => setCopied(false), 2500); }
    catch { alert(buildReport()); }
  }

  function handleWhatsApp() { window.open(`https://wa.me/?text=${encodeURIComponent(buildReport())}`, '_blank'); }

  function handleReset() {
    if (!confirming) { setConfirming(true); return; }
    resetDay(); setConfirming(false); onReset?.();
  }

  return (
    <div style={{ margin:'0 16px 16px' }}>
      {/* ── Office KPI Header ── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        <TrendingUp size={18} color="var(--color-accent)" />
        <span style={{ fontWeight:700, fontSize:15 }}>تقفيل عهدة اليوم وأرباح المكتب</span>
      </div>

      {/* ── KPI Grid ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
        <KpiCard label="مكتمل" value={`${allDelivered.length}/${orders.length}`} sub={`${completionPct}% إنجاز`} color="var(--color-success)" />
        <KpiCard label="مؤجل" value={allPostponed.length} sub="أوردر" color="var(--color-urgent)" />
        <KpiCard label="COD محصّل" value={`${totalCOD.toLocaleString('ar-EG')} ج`} sub="" color="var(--color-accent)" />
        <KpiCard label="ربح المكتب" value={`${officeProfit.toLocaleString('ar-EG')} ج`} sub="شحن − عمولات" color="var(--color-info)" />
      </div>

      {/* Office Revenue Summary */}
      <div className="card" style={{ marginBottom:14, background:'linear-gradient(135deg,#0d1a05,#18181B)', border:'1px solid rgba(34,197,94,0.25)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:13, color:'var(--color-muted)' }}>إجمالي رسوم الشحن</span>
          <span style={{ fontWeight:700, color:'var(--color-text)' }}>{totalShipping.toLocaleString('ar-EG')} ج</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:13, color:'var(--color-muted)' }}>عمولات المناديب</span>
          <span style={{ fontWeight:700, color:'var(--color-danger)' }}>- {totalPayout.toLocaleString('ar-EG')} ج</span>
        </div>
        <div className="divider" style={{ margin:'8px 0' }} />
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontSize:14, fontWeight:700 }}>🏢 صافي ربح المكتب</span>
          <span style={{ fontWeight:800, fontSize:18, color:'var(--color-success)' }}>{officeProfit.toLocaleString('ar-EG')} ج</span>
        </div>
      </div>

      {/* ── Per-courier settlement ── */}
      <p className="section-label" style={{ marginBottom:10 }}>💼 استلام العهدة من المناديب</p>

      {couriers.map(courier => {
        const s = courierStats(courier);
        return (
          <div key={courier.courierId} className="card slide-up" style={{ marginBottom:12, borderRight: s.settled ? '4px solid var(--color-success)' : '4px solid var(--color-accent)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>🛵 {courier.name}</div>
                <div style={{ fontSize:11, color:'var(--color-muted)', marginTop:2 }}>
                  أوردرات: {s.delivered.length}/{s.mine.length} مكتملة
                </div>
              </div>
              {s.settled && <span className="badge badge-green" style={{ fontSize:11 }}>✅ تم الاستلام</span>}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12, textAlign:'center' }}>
              <div style={{ padding:'8px 4px', background:'var(--color-surface-2)', borderRadius:'var(--radius-sm)' }}>
                <div style={{ fontSize:15, fontWeight:800, color:'var(--color-accent)' }}>{s.cod.toLocaleString('ar-EG')}</div>
                <div style={{ fontSize:10, color:'var(--color-muted)', marginTop:2 }}>COD محصّل</div>
              </div>
              <div style={{ padding:'8px 4px', background:'var(--color-surface-2)', borderRadius:'var(--radius-sm)' }}>
                <div style={{ fontSize:15, fontWeight:800, color:'var(--color-success)' }}>{s.payout.toLocaleString('ar-EG')}</div>
                <div style={{ fontSize:10, color:'var(--color-muted)', marginTop:2 }}>عمولة المندوب</div>
              </div>
              <div style={{ padding:'8px 4px', background:'rgba(250,204,21,0.1)', borderRadius:'var(--radius-sm)', border:'1px solid rgba(250,204,21,0.25)' }}>
                <div style={{ fontSize:15, fontWeight:800, color:'var(--color-accent)' }}>{s.netOwed.toLocaleString('ar-EG')}</div>
                <div style={{ fontSize:10, color:'var(--color-muted)', marginTop:2 }}>المطلوب للمكتب</div>
              </div>
            </div>

            {!s.settled ? (
              <button className="btn btn-primary btn-full btn-sm" onClick={() => handleSettle(courier.courierId)}>
                <CheckCircle2 size={14} /> تأكيد استلام العهدة وتقفيل حساب {courier.name}
              </button>
            ) : (
              <p style={{ textAlign:'center', fontSize:12, color:'var(--color-success)' }}>
                ✅ تم تقفيل الحساب وإستلام {s.netOwed.toLocaleString('ar-EG')} جنيه
              </p>
            )}
          </div>
        );
      })}

      {/* ── Export Report ── */}
      <div className="card" style={{ marginBottom:14 }}>
        <button
          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-main)', color:'var(--color-text)', padding:0 }}
          onClick={() => setReportOpen(v => !v)}
        >
          <span style={{ fontWeight:700, fontSize:14, display:'flex', alignItems:'center', gap:7 }}>
            <Receipt size={16} color="var(--color-accent)" /> تقرير المكتب اليومي
          </span>
          {reportOpen ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
        </button>

        {reportOpen && (
          <div className="slide-up" style={{ marginTop:12 }}>
            <pre style={{ background:'var(--color-surface-2)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-sm)', padding:12, fontSize:11, color:'var(--color-text)', whiteSpace:'pre-wrap', fontFamily:'var(--font-main)', lineHeight:1.7, marginBottom:10, direction:'rtl' }}>
              {buildReport()}
            </pre>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-ghost btn-sm" style={{ flex:1 }} onClick={handleCopy}>
                <Copy size={13}/> {copied ? '✓ تم' : 'نسخ'}
              </button>
              <button className="btn btn-whatsapp btn-sm" style={{ flex:1 }} onClick={handleWhatsApp}>
                <MessageSquare size={13}/> واتساب
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Reset Day ── */}
      <button className={`btn btn-full ${confirming ? 'btn-danger' : 'btn-ghost'}`} onClick={handleReset} style={{ fontSize:13 }}>
        <RotateCcw size={14}/> {confirming ? 'تأكيد تصفير المكتب كاملاً؟ اضغط مجدداً' : 'تصفير يوم المكتب'}
      </button>
      {confirming && (
        <button className="btn btn-ghost btn-full" onClick={() => setConfirming(false)} style={{ marginTop:8, fontSize:12 }}>إلغاء</button>
      )}
    </div>
  );
}

/* ── Mini KPI Card ── */
function KpiCard({ label, value, sub, color }) {
  return (
    <div className="card" style={{ padding:'12px 10px', textAlign:'center' }}>
      <div style={{ fontSize:18, fontWeight:800, color }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:'var(--color-muted)', marginTop:2 }}>{sub}</div>}
      <div style={{ fontSize:11, color:'var(--color-muted)', marginTop:4 }}>{label}</div>
    </div>
  );
}
