/**
 * DailySummary.jsx — Phase 3
 * Courier Financial Wallet — agency mode shows office COD settlement,
 * freelance mode shows 100% personal profit.
 */

import { useState } from 'react';
import {
  PackageCheck, Package, Route, Clock, Banknote,
  RotateCcw, TrendingUp, Fuel, Wallet, AlertCircle,
  Copy, MessageSquare, ChevronDown, ChevronUp, Building2,
} from 'lucide-react';
import { getShift, resetDay, getExpenses, saveExpenses } from '../services/storageService';

function formatMs(ms) {
  if (!ms || ms < 0) return '—';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}س ${m}د` : `${m} دقيقة`;
}

export default function DailySummary({ orders, user, onReset }) {
  const shift    = getShift();
  const isAgency = user?.workMode !== 'freelance';

  const [expenses,    setExpensesState] = useState(getExpenses);
  const [expInput,    setExpInput]      = useState(String(getExpenses() || ''));
  const [confirming,  setConfirming]    = useState(false);
  const [reportOpen,  setReportOpen]    = useState(false);
  const [copied,      setCopied]        = useState(false);

  /* Filter orders for this courier (agency = assigned, freelance = isFreelance or unassigned) */
  const myOrders = isAgency
    ? orders.filter(o => !o.isFreelance && (o.assignedTo === user?.courierId || !o.assignedTo))
    : orders.filter(o => o.isFreelance || !o.assignedTo);

  const pending   = myOrders.filter(o => o.status === 'pending');
  const delivered = myOrders.filter(o => o.status === 'delivered');
  const postponed = myOrders.filter(o => o.status === 'postponed');

  const totalCOD     = myOrders.reduce((s, o) => s + (o.cash || 0), 0);
  const collectedCOD = delivered.reduce((s, o) => s + (o.cash || 0), 0);
  const totalFees    = delivered.reduce((s, o) => s + (o.deliveryFee || 0), 0);
  const netProfit    = totalFees - expenses;

  /* Agency: what courier owes the office */
  const officeOwed = collectedCOD - totalFees;

  const shiftElapsed = shift.startedAt
    ? (shift.active ? Date.now() : (shift.endedAt || Date.now())) - shift.startedAt
    : null;

  function handleExpenseChange(val) {
    setExpInput(val);
    const n = parseFloat(val) || 0;
    setExpensesState(n); saveExpenses(n);
  }

  function buildReport() {
    const date = new Date().toLocaleDateString('ar-EG', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    const modeLabel = isAgency ? `وضع المكتب — ${user?.officeName ?? ''}` : 'مندوب حر مستقل';
    return [
      `📋 تقفيل يوم ${date}`,
      `🛵 ${user?.name ?? ''} | ${modeLabel}`,
      `━━━━━━━━━━━━━━━━━`,
      `📦 إجمالي: ${myOrders.length} | مكتمل: ${delivered.length} | مؤجل: ${postponed.length}`,
      `━━━━━━━━━━━━━━━━━`,
      `💰 COD محصّل: ${collectedCOD.toLocaleString('ar-EG')} جنيه`,
      isAgency
        ? `🏢 المطلوب توريده للمكتب: ${officeOwed.toLocaleString('ar-EG')} جنيه`
        : `💵 إجمالي العمولات: ${totalFees.toLocaleString('ar-EG')} جنيه`,
      `⛽ مصروفات الطريق: ${expenses.toLocaleString('ar-EG')} جنيه`,
      `🤑 صافي ربحك: ${netProfit.toLocaleString('ar-EG')} جنيه`,
      `━━━━━━━━━━━━━━━━━`,
      `📍 ${shift.totalKm || 0} كم | ⏱ ${shiftElapsed ? formatMs(shiftElapsed) : '—'}`,
      `🔖 أوردرات ⚡ رفيق المندوب`,
    ].join('\n');
  }

  async function handleCopy() {
    try { await navigator.clipboard.writeText(buildReport()); setCopied(true); setTimeout(() => setCopied(false), 2500); }
    catch { alert(buildReport()); }
  }

  function handleWhatsApp() { window.open(`https://wa.me/?text=${encodeURIComponent(buildReport())}`, '_blank'); }

  function handleReset() {
    if (!confirming) { setConfirming(true); return; }
    resetDay(); setConfirming(false); setExpensesState(0); setExpInput(''); onReset?.();
  }

  return (
    <div style={{ margin:'0 16px 16px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        <TrendingUp size={18} color="var(--color-accent)" />
        <span style={{ fontWeight:700, fontSize:15 }}>
          {isAgency ? 'محفظة المندوب (وضع المكتب)' : 'محفظة المندوب الحر'}
        </span>
      </div>

      {/* Stats Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
        <MiniStat icon={<PackageCheck size={17} color="var(--color-success)"/>} label="مكتمل" value={delivered.length} color="var(--color-success)"/>
        <MiniStat icon={<AlertCircle  size={17} color="var(--color-urgent)" />} label="مؤجل"  value={postponed.length} color="var(--color-urgent)"/>
        <MiniStat icon={<Package      size={17} color="var(--color-muted)"  />} label="باقي"  value={pending.length}   color="var(--color-muted)"/>
      </div>

      {/* KM + Shift Time */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
        <div className="card" style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
          <Route size={17} color="var(--color-info)"/>
          <div>
            <div style={{ fontWeight:800, fontSize:16, color:'var(--color-info)' }}>{shift.totalKm || 0}<span style={{ fontSize:10, fontWeight:400, color:'var(--color-muted)', marginRight:3 }}>كم</span></div>
            <div style={{ fontSize:10, color:'var(--color-muted)' }}>المسافة</div>
          </div>
        </div>
        <div className="card" style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
          <Clock size={17} color="var(--color-muted)"/>
          <div>
            <div style={{ fontWeight:800, fontSize:14 }}>{shiftElapsed ? formatMs(shiftElapsed) : '—'}</div>
            <div style={{ fontSize:10, color:'var(--color-muted)' }}>وقت الشيفت</div>
          </div>
        </div>
      </div>

      {/* COD Card */}
      <div className="card" style={{ marginBottom:12, background:'linear-gradient(135deg,#1c1a05,#18181B)', border:'1px solid rgba(250,204,21,0.25)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <Banknote size={17} color="var(--color-accent)"/>
            <span style={{ fontSize:13, fontWeight:600 }}>التحصيل النقدي (COD)</span>
          </div>
          <span style={{ fontWeight:800, fontSize:17, color:'var(--color-accent)' }}>
            {collectedCOD.toLocaleString('ar-EG')}
            <span style={{ fontSize:10, fontWeight:400, color:'var(--color-muted)', marginRight:4 }}>/ {totalCOD.toLocaleString('ar-EG')} ج</span>
          </span>
        </div>
        {totalCOD > 0 && (
          <div style={{ height:5, background:'var(--color-surface-2)', borderRadius:3, overflow:'hidden', marginBottom:8 }}>
            <div style={{ height:'100%', width:`${Math.min((collectedCOD/totalCOD)*100,100)}%`, background:'var(--color-accent)', borderRadius:3, transition:'width 0.4s' }}/>
          </div>
        )}
        {/* Agency: office owed */}
        {isAgency && (
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 10px', background:'rgba(0,0,0,0.2)', borderRadius:'var(--radius-sm)' }}>
            <Building2 size={13} color="var(--color-muted)"/>
            <span style={{ fontSize:12, color:'var(--color-muted)' }}>
              المطلوب توريده للمكتب:{' '}
              <strong style={{ color:'var(--color-accent)', fontSize:14 }}>{officeOwed.toLocaleString('ar-EG')} جنيه</strong>
            </span>
          </div>
        )}
      </div>

      {/* Courier Earnings */}
      <div className="card" style={{ marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
          <Wallet size={16} color="var(--color-success)"/>
          <span style={{ fontWeight:700, fontSize:14 }}>محفظة عمولاتك</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
          <div style={{ textAlign:'center', padding:'10px 6px', background:'var(--color-surface-2)', borderRadius:'var(--radius-sm)', border:'1px solid var(--color-border)' }}>
            <div style={{ fontSize:18, fontWeight:800, color:'var(--color-success)' }}>{totalFees.toLocaleString('ar-EG')}</div>
            <div style={{ fontSize:10, color:'var(--color-muted)', marginTop:3 }}>إجمالي العمولات</div>
          </div>
          <div style={{ textAlign:'center', padding:'10px 6px', background:'var(--color-surface-2)', borderRadius:'var(--radius-sm)', border:'1px solid var(--color-border)' }}>
            <div style={{ fontSize:18, fontWeight:800, color: netProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{netProfit.toLocaleString('ar-EG')}</div>
            <div style={{ fontSize:10, color:'var(--color-muted)', marginTop:3 }}>صافي في جيبك</div>
          </div>
        </div>
        <label className="section-label" style={{ marginBottom:5 }}><Fuel size={11}/> مصروفات بنزين / طريق (ج)</label>
        <input className="input input-sm" type="number" inputMode="numeric" placeholder="0" value={expInput} onChange={e => handleExpenseChange(e.target.value)}/>
      </div>

      {/* Export */}
      <div className="card" style={{ marginBottom:14 }}>
        <button style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-main)', color:'var(--color-text)', padding:0 }} onClick={() => setReportOpen(v => !v)}>
          <span style={{ fontWeight:700, fontSize:14, display:'flex', alignItems:'center', gap:7 }}>📋 تقفيل اليوم / مشاركة التقرير</span>
          {reportOpen ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
        </button>
        {reportOpen && (
          <div className="slide-up" style={{ marginTop:12 }}>
            <pre style={{ background:'var(--color-surface-2)', border:'1px solid var(--color-border)', borderRadius:'var(--radius-sm)', padding:10, fontSize:11, color:'var(--color-text)', whiteSpace:'pre-wrap', fontFamily:'var(--font-main)', lineHeight:1.7, marginBottom:10, direction:'rtl' }}>
              {buildReport()}
            </pre>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-ghost btn-sm" style={{ flex:1 }} onClick={handleCopy}><Copy size={13}/> {copied ? '✓ تم' : 'نسخ'}</button>
              <button className="btn btn-whatsapp btn-sm" style={{ flex:1 }} onClick={handleWhatsApp}><MessageSquare size={13}/> واتساب</button>
            </div>
          </div>
        )}
      </div>

      {/* Progress */}
      {myOrders.length > 0 && (
        <div className="card" style={{ marginBottom:14, padding:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
            <span style={{ fontSize:12, color:'var(--color-muted)' }}>نسبة الإنجاز</span>
            <span style={{ fontSize:12, fontWeight:700, color:'var(--color-accent)' }}>{Math.round((delivered.length/myOrders.length)*100)}%</span>
          </div>
          <div style={{ height:7, background:'var(--color-surface-2)', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${(delivered.length/myOrders.length)*100}%`, background:'linear-gradient(90deg,var(--color-accent),var(--color-success))', borderRadius:4, transition:'width 0.4s' }}/>
          </div>
        </div>
      )}

      {/* Reset */}
      <button className={`btn btn-full ${confirming ? 'btn-danger' : 'btn-ghost'}`} onClick={handleReset} style={{ fontSize:13 }}>
        <RotateCcw size={14}/> {confirming ? 'تأكيد تصفير اليوم؟ اضغط مجدداً' : 'تصفير اليوم'}
      </button>
      {confirming && <button className="btn btn-ghost btn-full" onClick={() => setConfirming(false)} style={{ marginTop:8, fontSize:12 }}>إلغاء</button>}
    </div>
  );
}

function MiniStat({ icon, label, value, color }) {
  return (
    <div className="card" style={{ padding:'10px 6px', textAlign:'center' }}>
      <div style={{ marginBottom:4 }}>{icon}</div>
      <div style={{ fontSize:20, fontWeight:800, color }}>{value}</div>
      <div style={{ fontSize:10, color:'var(--color-muted)', marginTop:2 }}>{label}</div>
    </div>
  );
}
