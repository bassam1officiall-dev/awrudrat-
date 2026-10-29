/**
 * ManagerDispatch.jsx — Phase 3
 * Office Manager Tab 1: Add orders, assign to couriers, filter/re-assign.
 */

import { useState } from 'react';
import {
  Plus, Package, RefreshCw, Trash2, Flame,
  Search, User, Phone, Banknote, Store,
} from 'lucide-react';
import { getOrders, addOrder, updateOrder, deleteOrder } from '../../services/storageService';
import { getCouriers } from '../../services/authService';
import { CAIRO_AREAS, geocodeAddress } from '../../services/routingService';

const STATUS_LABELS = {
  pending:   { label: 'قيد الانتظار',      color: 'var(--color-accent)',  bg: 'rgba(250,204,21,0.12)' },
  delivered: { label: 'تم التوصيل ✓',     color: 'var(--color-success)', bg: 'rgba(34,197,94,0.12)'  },
  postponed: { label: 'مؤجل / لم يرد ⏳', color: 'var(--color-urgent)',  bg: 'rgba(249,115,22,0.12)' },
};

export default function ManagerDispatch({ orders, onOrdersChange }) {
  const couriers = getCouriers();

  /* ── Form state ── */
  const [form, setForm] = useState({
    sender: '', name: '', phone: '', address: '', cash: '',
    shippingFee: '60', deliveryFee: '35', assignedTo: couriers[0]?.courierId ?? '',
    priority: 'normal', notes: '',
  });
  const [addressSugs, setAddressSugs] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [formError, setFormError] = useState('');
  const [showForm,  setShowForm]  = useState(false);

  /* ── Filters ── */
  const [filterCourier, setFilterCourier] = useState('all');
  const [filterStatus,  setFilterStatus]  = useState('all');

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function handleAddressChange(val) {
    setField('address', val);
    if (val.length >= 1) setAddressSugs(CAIRO_AREAS.filter(a => a.name.includes(val)).slice(0, 5));
    else setAddressSugs([]);
  }

  async function handleAddOrder() {
    if (!form.name.trim())    { setFormError('اسم العميل مطلوب');    return; }
    if (!form.address.trim()) { setFormError('العنوان مطلوب');        return; }
    setLoading(true); setFormError('');
    try {
      const geo = await geocodeAddress(form.address);
      addOrder({
        sender:      form.sender.trim(),
        name:        form.name.trim(),
        phone:       form.phone.trim(),
        address:     geo.display_name || form.address,
        cash:        parseFloat(form.cash)        || 0,
        shippingFee: parseFloat(form.shippingFee) || 60,
        deliveryFee: parseFloat(form.deliveryFee) || 35,
        assignedTo:  form.assignedTo || null,
        priority:    form.priority,
        notes:       form.notes.trim(),
        isFreelance: false,
        lat:         geo.lat,
        lng:         geo.lng,
      });
      onOrdersChange(getOrders());
      setForm({ sender:'', name:'', phone:'', address:'', cash:'', shippingFee:'60', deliveryFee:'35', assignedTo: couriers[0]?.courierId ?? '', priority:'normal', notes:'' });
      setShowForm(false);
    } catch (err) {
      setFormError('حدث خطأ في إضافة الأوردر');
    } finally { setLoading(false); }
  }

  function handleReassign(orderId, newCourierId) {
    updateOrder(orderId, { assignedTo: newCourierId || null });
    onOrdersChange(getOrders());
  }

  function handleDelete(id) {
    if (!window.confirm('حذف هذا الأوردر؟')) return;
    onOrdersChange(deleteOrder(id));
  }

  /* ── Filtered orders ── */
  const filtered = orders.filter(o => {
    const okCourier = filterCourier === 'all' || o.assignedTo === filterCourier;
    const okStatus  = filterStatus  === 'all' || o.status === filterStatus;
    return okCourier && okStatus;
  });

  function courierName(cid) {
    if (!cid) return 'غير معين';
    return couriers.find(c => c.courierId === cid)?.name ?? cid;
  }

  return (
    <div style={{ margin: '0 16px 16px' }}>
      {/* ── Add Order Toggle ── */}
      <button
        className={`btn btn-full ${showForm ? 'btn-ghost' : 'btn-primary'}`}
        onClick={() => setShowForm(v => !v)}
        style={{ marginBottom: 12 }}
      >
        <Plus size={17} /> {showForm ? 'إلغاء' : 'إضافة أوردر جديد وتعيينه لمندوب'}
      </button>

      {/* ── Add Order Form ── */}
      {showForm && (
        <div className="card slide-up" style={{ marginBottom: 14, borderColor: 'rgba(250,204,21,0.3)' }}>
          <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--color-accent)' }}>📦 بيانات الأوردر الجديد</p>

          {/* Priority */}
          <div className="priority-toggle" style={{ marginBottom: 10 }}>
            <button className={form.priority === 'normal' ? 'active-normal' : ''} onClick={() => setField('priority', 'normal')}>عادي</button>
            <button className={form.priority === 'urgent' ? 'active-urgent' : ''} onClick={() => setField('priority', 'urgent')}>
              <Flame size={12} style={{ display:'inline', verticalAlign:'middle', marginLeft:3 }} /> مستعجل
            </button>
          </div>

          {/* Sender + Customer row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
            <div>
              <label className="section-label"><Store size={11}/> اسم الراسل / المتجر</label>
              <input className="input input-sm" placeholder="براند ملابس / مطعم..." value={form.sender} onChange={e => setField('sender', e.target.value)} />
            </div>
            <div>
              <label className="section-label"><User size={11}/> اسم العميل</label>
              <input className="input input-sm" placeholder="محمد أحمد..." value={form.name} onChange={e => setField('name', e.target.value)} />
            </div>
          </div>

          {/* Phone + Address */}
          <div style={{ marginBottom: 8 }}>
            <label className="section-label"><Phone size={11}/> هاتف العميل</label>
            <input className="input input-sm" type="tel" placeholder="010xxxxxxxx" value={form.phone} onChange={e => setField('phone', e.target.value)} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label className="section-label"><Search size={11}/> العنوان</label>
            <input className="input input-sm" placeholder="المنطقة والشارع..." value={form.address} onChange={e => handleAddressChange(e.target.value)} />
            {addressSugs.length > 0 && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:5 }}>
                {addressSugs.map(a => (
                  <button key={a.name} className="badge badge-gray" style={{ cursor:'pointer', fontSize:12 }} onClick={() => { setField('address', a.name); setAddressSugs([]); }}>{a.name}</button>
                ))}
              </div>
            )}
          </div>

          {/* Financials */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:8 }}>
            <div>
              <label className="section-label"><Banknote size={11}/> COD (ج)</label>
              <input className="input input-sm" type="number" placeholder="0" value={form.cash} onChange={e => setField('cash', e.target.value)} />
            </div>
            <div>
              <label className="section-label">رسوم الشحن</label>
              <input className="input input-sm" type="number" placeholder="60" value={form.shippingFee} onChange={e => setField('shippingFee', e.target.value)} />
            </div>
            <div>
              <label className="section-label">عمولة المندوب</label>
              <input className="input input-sm" type="number" placeholder="35" value={form.deliveryFee} onChange={e => setField('deliveryFee', e.target.value)} />
            </div>
          </div>

          {/* Assign Courier */}
          <div style={{ marginBottom: 10 }}>
            <label className="section-label">🛵 تعيين المندوب</label>
            <select className="input input-sm" value={form.assignedTo} onChange={e => setField('assignedTo', e.target.value)}>
              <option value="">غير معين</option>
              {couriers.map(c => <option key={c.courierId} value={c.courierId}>{c.name}</option>)}
            </select>
          </div>

          {formError && <p style={{ color:'var(--color-danger)', fontSize:12, marginBottom:8 }}>⚠ {formError}</p>}

          <button className="btn btn-primary btn-full" onClick={handleAddOrder} disabled={loading}>
            {loading ? <span className="pulse-yellow">جاري الإضافة...</span> : <><Plus size={16}/> إضافة الأوردر وإرساله للمندوب</>}
          </button>
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ display:'flex', gap:6, marginBottom:12, flexWrap:'wrap' }}>
        <select className="input input-sm" style={{ flex:1 }} value={filterCourier} onChange={e => setFilterCourier(e.target.value)}>
          <option value="all">كل المناديب</option>
          {couriers.map(c => <option key={c.courierId} value={c.courierId}>{c.name}</option>)}
        </select>
        <select className="input input-sm" style={{ flex:1 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">كل الحالات</option>
          <option value="pending">قيد الانتظار</option>
          <option value="delivered">تم التوصيل</option>
          <option value="postponed">مؤجل</option>
        </select>
      </div>

      {/* ── Orders Table ── */}
      <p className="section-label" style={{ marginBottom:8 }}>📋 أوردرات المكتب ({filtered.length})</p>
      {filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'30px 0', color:'var(--color-muted)' }}>
          <Package size={36} style={{ opacity:.25, marginBottom:10 }} />
          <p>لا توجد أوردرات بهذه الفلاتر</p>
        </div>
      )}
      {filtered.map(o => {
        const sConf = STATUS_LABELS[o.status] ?? STATUS_LABELS.pending;
        return (
          <div key={o.id} className="card slide-up" style={{ marginBottom:10, borderRight:`3px solid ${sConf.color}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:3 }}>
                  {o.sender && <span style={{ fontSize:11, color:'var(--color-muted)' }}>🏪 {o.sender}</span>}
                  {o.priority === 'urgent' && <span className="badge badge-orange" style={{ fontSize:10 }}><Flame size={9}/> مستعجل</span>}
                </div>
                <p style={{ fontWeight:700, fontSize:13 }}>{o.name}</p>
                <p style={{ fontSize:11, color:'var(--color-muted)', marginTop:2 }}>📍 {o.address}</p>
              </div>
              <span className="badge" style={{ background:sConf.bg, color:sConf.color, fontSize:10, flexShrink:0 }}>{sConf.label}</span>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {o.cash > 0 && <span style={{ fontSize:12, color:'var(--color-accent)', fontWeight:700 }}>💰 {o.cash.toLocaleString('ar-EG')} ج</span>}
                <span style={{ fontSize:11, color:'var(--color-muted)' }}>شحن: {o.shippingFee}ج | عمولة: {o.deliveryFee}ج</span>
              </div>
            </div>

            {/* Re-assign */}
            <div style={{ display:'flex', gap:7, alignItems:'center' }}>
              <span style={{ fontSize:11, color:'var(--color-muted)', flexShrink:0 }}>🛵 معين لـ:</span>
              <select
                className="input input-sm"
                style={{ flex:1 }}
                value={o.assignedTo ?? ''}
                onChange={e => handleReassign(o.id, e.target.value)}
              >
                <option value="">غير معين</option>
                {couriers.map(c => <option key={c.courierId} value={c.courierId}>{c.name}</option>)}
              </select>
              <button className="btn btn-ghost btn-xs" onClick={() => handleDelete(o.id)} style={{ padding:'6px 8px' }}>
                <Trash2 size={12} color="var(--color-danger)"/>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
