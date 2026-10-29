/**
 * ManagerFleet.jsx — Phase 3
 * Office Manager Tab 2: Courier cards + Leaflet map of all orders.
 */

import { useEffect, useRef, useState } from 'react';
import { Phone, MessageSquare, UserPlus, CheckCircle2 } from 'lucide-react';
import { getCouriers, addCourier } from '../../services/authService';
import { whatsappLink } from '../../services/routingService';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const COURIER_COLORS = { c_1: '#FACC15', c_2: '#3B82F6', default: '#A1A1AA' };

/* ── Icons created lazily inside functions (never at module scope) ── */
function makeCourierIcon(color) {
  return new L.DivIcon({
    className: '',
    html: `<div style="width:22px;height:22px;background:${color};border:2.5px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>`,
    iconSize: [22, 22], iconAnchor: [11, 11],
  });
}

export default function ManagerFleet({ orders }) {
  const mapRef      = useRef(null);
  const mapInstance = useRef(null);
  const markersRef  = useRef([]);
  const couriers    = getCouriers();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName,     setNewName]     = useState('');
  const [newPhone,    setNewPhone]    = useState('');
  const [newZone,     setNewZone]     = useState('');
  const [, forceRender] = useState(0);

  /* ── Leaflet map ── */
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    try {
      mapInstance.current = L.map(mapRef.current, { center: [30.05, 31.24], zoom: 11 });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© CARTO © OSM', subdomains: 'abcd', maxZoom: 19,
      }).addTo(mapInstance.current);
    } catch (e) { console.warn('[ManagerFleet] map init:', e); }
    return () => { try { mapInstance.current?.remove(); } catch { /* silent */ } mapInstance.current = null; };
  }, []);

  /* ── Sync markers ── */
  useEffect(() => {
    if (!mapInstance.current) return;
    try {
      markersRef.current.forEach(m => { try { m.remove(); } catch { /* silent */ } });
      markersRef.current = [];

      (orders ?? []).forEach(o => {
        if (!o.lat || !o.lng) return;
        const color  = COURIER_COLORS[o.assignedTo] ?? COURIER_COLORS.default;
        const cName  = couriers.find(c => c.courierId === o.assignedTo)?.name ?? 'غير معين';
        const marker = L.marker([o.lat, o.lng], { icon: makeCourierIcon(color) })
          .addTo(mapInstance.current)
          .bindPopup(`<div dir="rtl" style="font-family:Cairo,sans-serif;font-size:12px;min-width:140px">
            <strong>${o.name}</strong><br/>
            <span style="color:#a1a1aa">${o.address}</span><br/>
            🛵 <span style="color:${color};font-weight:700">${cName}</span><br/>
            ${o.cash ? `💰 ${o.cash} ج` : ''}
          </div>`);
        markersRef.current.push(marker);
      });

      if (markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current);
        if (group.getBounds().isValid()) {
          mapInstance.current.fitBounds(group.getBounds().pad(0.2));
        }
      }
    } catch (e) { console.warn('[ManagerFleet] markers:', e); }
  }, [orders]);

  function handleAddCourier() {
    if (!newName.trim()) return;
    addCourier({ name: newName, phone: newPhone, zone: newZone });
    setNewName(''); setNewPhone(''); setNewZone('');
    setShowAddForm(false);
    forceRender(n => n + 1);
  }

  return (
    <div style={{ margin: '0 16px 16px' }}>
      {/* ── Courier Cards ── */}
      <p className="section-label" style={{ marginBottom: 10 }}>🛵 فريق المناديب</p>

      {couriers.map(c => {
        const myOrders    = orders.filter(o => o.assignedTo === c.courierId);
        const delivered   = myOrders.filter(o => o.status === 'delivered');
        const collectedCOD = delivered.reduce((s, o) => s + (o.cash || 0), 0);
        const progress    = myOrders.length > 0 ? (delivered.length / myOrders.length) * 100 : 0;
        const color       = COURIER_COLORS[c.courierId] ?? COURIER_COLORS.default;
        const waUrl       = c.phone ? whatsappLink(c.phone) : null;
        const telUrl      = c.phone ? `tel:${c.phone}` : null;

        return (
          <div key={c.courierId} className="card slide-up" style={{ marginBottom: 12, borderRight: `4px solid ${color}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
              <div>
                <div style={{ fontWeight:800, fontSize:14 }}>{c.name}</div>
                <div style={{ fontSize:11, color:'var(--color-muted)', marginTop:2 }}>📍 {c.zone || 'لم يحدد المنطقة'}</div>
              </div>
              <span className="badge" style={{ background: 'rgba(34,197,94,0.15)', color:'var(--color-success)', fontSize:10 }}>
                🟢 نشط
              </span>
            </div>

            {/* Progress */}
            <div style={{ marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:12, color:'var(--color-muted)' }}>
                  <CheckCircle2 size={12} style={{ display:'inline', verticalAlign:'middle', marginLeft:3 }} />
                  {delivered.length} / {myOrders.length} أوردر
                </span>
                <span style={{ fontSize:12, color:'var(--color-accent)', fontWeight:700 }}>
                  💵 {collectedCOD.toLocaleString('ar-EG')} ج محصّل
                </span>
              </div>
              <div style={{ height:6, background:'var(--color-surface-2)', borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${progress}%`, background: color, borderRadius:3, transition:'width 0.4s' }} />
              </div>
            </div>

            {/* Contact */}
            {c.phone && (
              <div style={{ display:'flex', gap:7 }}>
                <a href={telUrl} className="btn btn-ghost btn-xs" style={{ flex:1, textDecoration:'none', justifyContent:'center' }}>
                  <Phone size={12} /> {c.phone}
                </a>
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-xs" style={{ flex:'0 0 auto', textDecoration:'none', justifyContent:'center', padding:'5px 12px' }}>
                  <MessageSquare size={12} /> واتساب
                </a>
              </div>
            )}
          </div>
        );
      })}

      {/* Add Courier */}
      <button
        className={`btn btn-full ${showAddForm ? 'btn-ghost' : 'btn-ghost'}`}
        onClick={() => setShowAddForm(v => !v)}
        style={{ marginBottom: 12, borderStyle:'dashed' }}
      >
        <UserPlus size={15} /> {showAddForm ? 'إلغاء' : '+ إضافة مندوب جديد للمكتب'}
      </button>

      {showAddForm && (
        <div className="card slide-up" style={{ marginBottom: 14 }}>
          <p style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>بيانات المندوب الجديد</p>
          <div style={{ marginBottom:8 }}>
            <label className="section-label">الاسم الكامل *</label>
            <input className="input input-sm" placeholder="علي محمد" value={newName} onChange={e => setNewName(e.target.value)} />
          </div>
          <div style={{ marginBottom:8 }}>
            <label className="section-label">رقم الهاتف</label>
            <input className="input input-sm" type="tel" placeholder="010xxxxxxxx" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
          </div>
          <div style={{ marginBottom:12 }}>
            <label className="section-label">المنطقة / خط السير</label>
            <input className="input input-sm" placeholder="مثال: الهرم / فيصل" value={newZone} onChange={e => setNewZone(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-full btn-sm" onClick={handleAddCourier} disabled={!newName.trim()}>
            <UserPlus size={14} /> إضافة المندوب
          </button>
        </div>
      )}

      {/* Fleet Map */}
      <p className="section-label" style={{ marginBottom:8 }}>🗺 خريطة أوردرات المكتب</p>
      <div
        ref={mapRef}
        style={{ height:'280px', borderRadius:'var(--radius-md)', border:'1px solid var(--color-border)', overflow:'hidden' }}
      />
      {/* Legend */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:8 }}>
        {couriers.map(c => (
          <span key={c.courierId} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--color-muted)' }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background: COURIER_COLORS[c.courierId] ?? COURIER_COLORS.default, display:'inline-block' }} />
            {c.name}
          </span>
        ))}
      </div>
    </div>
  );
}
