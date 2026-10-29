/**
 * AddressInput.jsx — Phase 3
 * Courier adds a stop; marks it as freelance or not based on workMode.
 */

import { useState } from 'react';
import { MapPin, User, DollarSign, Plus, Search, Phone, FileText, Banknote, Flame } from 'lucide-react';
import { CAIRO_AREAS, geocodeAddress } from '../services/routingService';
import { addOrder } from '../services/storageService';

const DEFAULT_FEE = 30;

export default function AddressInput({ user, onOrderAdded }) {
  const isFreelanceMode = user?.workMode === 'freelance';

  const [name,        setName]        = useState('');
  const [query,       setQuery]       = useState('');
  const [phone,       setPhone]       = useState('');
  const [cash,        setCash]        = useState('');
  const [deliveryFee, setDeliveryFee] = useState(String(DEFAULT_FEE));
  const [notes,       setNotes]       = useState('');
  const [priority,    setPriority]    = useState('normal');
  const [suggestions, setSuggestions] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [expanded,    setExpanded]    = useState(false);

  function handleQueryChange(val) {
    setQuery(val); setError('');
    setSuggestions(val.length >= 1 ? CAIRO_AREAS.filter(a => a.name.includes(val)).slice(0, 7) : []);
  }

  async function handleAdd() {
    if (!query.trim()) { setError('من فضلك أدخل العنوان'); return; }
    setLoading(true); setError('');
    try {
      const geo = await geocodeAddress(query);
      addOrder({
        name:        name.trim(),
        address:     geo.display_name || query,
        phone:       phone.trim(),
        cash:        parseFloat(cash)        || 0,
        deliveryFee: parseFloat(deliveryFee) || DEFAULT_FEE,
        shippingFee: parseFloat(deliveryFee) || DEFAULT_FEE,
        notes:       notes.trim(),
        priority,
        lat:         geo.lat,
        lng:         geo.lng,
        assignedTo:  isFreelanceMode ? null : (user?.courierId ?? null),
        isFreelance: isFreelanceMode,
      });
      onOrderAdded?.();
      setName(''); setQuery(''); setPhone(''); setCash('');
      setDeliveryFee(String(DEFAULT_FEE)); setNotes(''); setPriority('normal'); setSuggestions([]);
    } catch (err) {
      setError('حدث خطأ، حاول مرة أخرى');
    } finally { setLoading(false); }
  }

  const cairoAreas = CAIRO_AREAS.filter(a => a.zone === 'القاهرة').slice(0, 7);
  const gizaAreas  = CAIRO_AREAS.filter(a => a.zone === 'الجيزة').slice(0, 7);

  return (
    <div className="card slide-up" style={{ margin:'12px 16px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <MapPin size={16} color="var(--color-accent)"/>
          <span style={{ fontWeight:700, fontSize:14 }}>
            {isFreelanceMode ? '📦 إضافة أوردر شخصي (حر)' : '📦 إضافة محطة توصيل'}
          </span>
        </div>
        <div className="priority-toggle" style={{ width:130 }}>
          <button className={priority === 'normal' ? 'active-normal' : ''} onClick={() => setPriority('normal')}>عادي</button>
          <button className={priority === 'urgent' ? 'active-urgent' : ''} onClick={() => setPriority('urgent')}>
            <Flame size={11} style={{ display:'inline', verticalAlign:'middle', marginLeft:2 }}/> مستعجل
          </button>
        </div>
      </div>

      <div style={{ marginBottom:10 }}>
        <label className="section-label"><User size={11}/> اسم العميل / رقم الأوردر</label>
        <input className="input" placeholder="#1042 — أحمد محمد" value={name} onChange={e => setName(e.target.value)}/>
      </div>

      <div style={{ marginBottom:10 }}>
        <label className="section-label"><Search size={11}/> العنوان</label>
        <input className="input" placeholder="المهندسين، شارع النيل..." value={query} onChange={e => handleQueryChange(e.target.value)} onKeyDown={e => e.key==='Enter' && handleAdd()}/>
        {suggestions.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:7 }}>
            {suggestions.map(a => <button key={a.name} className="badge badge-gray" onClick={() => { setQuery(a.name); setSuggestions([]); }} style={{ cursor:'pointer', fontSize:12 }}>{a.name}</button>)}
          </div>
        )}
        {!query && (
          <div style={{ marginTop:9 }}>
            <p style={{ fontSize:10, color:'var(--color-muted)', marginBottom:4 }}>📍 القاهرة</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:7 }}>
              {cairoAreas.map(a => <button key={a.name} className="badge badge-gray" onClick={() => setQuery(a.name)} style={{ cursor:'pointer', fontSize:11 }}>{a.name}</button>)}
            </div>
            <p style={{ fontSize:10, color:'var(--color-muted)', marginBottom:4 }}>📍 الجيزة</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {gizaAreas.map(a => <button key={a.name} className="badge badge-gray" onClick={() => setQuery(a.name)} style={{ cursor:'pointer', fontSize:11 }}>{a.name}</button>)}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom:10 }}>
        <label className="section-label"><Phone size={11}/> هاتف العميل</label>
        <input className="input" type="tel" inputMode="tel" placeholder="010xxxxxxxx" value={phone} onChange={e => setPhone(e.target.value)}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
        <div>
          <label className="section-label"><DollarSign size={11}/> تحصيل COD (ج)</label>
          <input className="input" type="number" inputMode="numeric" placeholder="0" value={cash} onChange={e => setCash(e.target.value)}/>
        </div>
        <div>
          <label className="section-label"><Banknote size={11}/> عمولتك (ج)</label>
          <input className="input" type="number" inputMode="numeric" placeholder="30" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)}/>
        </div>
      </div>

      <div style={{ marginBottom:12 }}>
        <button onClick={() => setExpanded(v => !v)} style={{ cursor:'pointer', background:'none', border:'none', color:'var(--color-muted)', fontFamily:'var(--font-main)', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
          <FileText size={11}/> ملاحظات العنوان {expanded ? '▲' : '▼'}
        </button>
        {expanded && (
          <textarea className="input" rows={2} placeholder="الدور الرابع، شقة 12، بجوار صيدلية..." value={notes} onChange={e => setNotes(e.target.value)} style={{ resize:'none', marginTop:5 }}/>
        )}
      </div>

      {error && <p style={{ color:'var(--color-danger)', fontSize:12, marginBottom:8 }}>⚠ {error}</p>}

      <button className="btn btn-primary btn-full" onClick={handleAdd} disabled={loading}>
        {loading ? <span className="pulse-yellow">جاري البحث...</span> : <><Plus size={16}/> إضافة المحطة</>}
      </button>
    </div>
  );
}
