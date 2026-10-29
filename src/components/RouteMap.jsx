/**
 * RouteMap.jsx — Phase 3 (Fixed: no Leaflet calls at module scope)
 * All L.DivIcon / L.Icon.Default calls moved inside component or useEffect.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Navigation, Loader, LocateFixed } from 'lucide-react';
import { optimizeRoute } from '../services/routingService';
import { reorderOrders, updateShiftKm } from '../services/storageService';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CAIRO_CENTER = [30.0444, 31.2357];

/* ── Icon factories (called inside useEffect, never at module scope) ── */
function makeYellowIcon() {
  return new L.DivIcon({
    className: '',
    html: '<div style="width:24px;height:24px;background:#FACC15;border:2.5px solid #09090B;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 10px rgba(250,204,21,0.5)"></div>',
    iconSize: [24, 24], iconAnchor: [12, 24],
  });
}
function makeGreenIcon() {
  return new L.DivIcon({
    className: '',
    html: '<div style="width:18px;height:18px;background:#22C55E;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>',
    iconSize: [18, 18], iconAnchor: [9, 9],
  });
}
function makeOrangeIcon() {
  return new L.DivIcon({
    className: '',
    html: '<div style="width:18px;height:18px;background:#F97316;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>',
    iconSize: [18, 18], iconAnchor: [9, 9],
  });
}
function makeCourierIcon() {
  return new L.DivIcon({
    className: '',
    html: '<div class="courier-dot" style="width:20px;height:20px;background:#FACC15;border:3px solid #09090B;border-radius:50%"></div>',
    iconSize: [20, 20], iconAnchor: [10, 10],
  });
}

export default function RouteMap({ orders, onOptimized }) {
  const mapRef        = useRef(null);
  const mapInstance   = useRef(null);
  const markersRef    = useRef([]);
  const polyRef       = useRef(null);
  const courierRef    = useRef(null);
  const courierLatLng = useRef(null);

  const [optimizing, setOptimizing] = useState(false);
  const [locating,   setLocating]   = useState(false);
  const [routeInfo,  setRouteInfo]  = useState(null);
  const [gpsError,   setGpsError]   = useState('');

  /* ── Init map once (Leaflet calls safely inside useEffect) ── */
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    /* Fix broken default icon paths — safe here because L is loaded */
    try {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    } catch { /* not critical */ }

    mapInstance.current = L.map(mapRef.current, { center: CAIRO_CENTER, zoom: 11 });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© CARTO © OSM', subdomains: 'abcd', maxZoom: 19,
    }).addTo(mapInstance.current);

    return () => {
      try { mapInstance.current?.remove(); } catch { /* silent */ }
      mapInstance.current = null;
    };
  }, []);

  /* ── Sync markers when orders change ── */
  useEffect(() => {
    if (!mapInstance.current) return;
    try {
      markersRef.current.forEach(m => { try { m.remove(); } catch { /* silent */ } });
      markersRef.current = [];

      const addM = (o, iconFn, prefix) => {
        if (!o.lat || !o.lng) return;
        const m = L.marker([o.lat, o.lng], { icon: iconFn() })
          .addTo(mapInstance.current)
          .bindPopup(`<div dir="rtl" style="font-family:Cairo,sans-serif;min-width:130px;font-size:12px">
            <strong>${prefix}${o.name || 'محطة'}</strong><br/>
            <span style="color:#a1a1aa">${o.address}</span>
            ${o.phone ? `<br/>📞 ${o.phone}` : ''}
            ${o.cash  ? `<br/><span style="color:#FACC15">💰 ${o.cash} ج</span>` : ''}
          </div>`);
        markersRef.current.push(m);
      };

      (orders ?? []).filter(o => o.status === 'pending').forEach((o, i) => addM(o, makeYellowIcon, `#${i+1} `));
      (orders ?? []).filter(o => o.status === 'delivered').forEach(o => addM(o, makeGreenIcon,  '✅ '));
      (orders ?? []).filter(o => o.status === 'postponed').forEach(o => addM(o, makeOrangeIcon, '⏳ '));

      if (markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current);
        if (group.getBounds().isValid()) {
          mapInstance.current.fitBounds(group.getBounds().pad(0.2));
        }
      }
    } catch (err) {
      console.warn('[RouteMap] marker sync error:', err);
    }
  }, [orders]);

  /* ── GPS locate ── */
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) { setGpsError('المتصفح لا يدعم GPS'); return; }
    setLocating(true); setGpsError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        courierLatLng.current = { lat, lng };
        try { courierRef.current?.remove(); } catch { /* silent */ }
        courierRef.current = L.marker([lat, lng], { icon: makeCourierIcon(), zIndexOffset: 1000 })
          .addTo(mapInstance.current)
          .bindPopup('<div dir="rtl" style="font-size:12px;font-family:Cairo,sans-serif">📍 موقعك الحالي</div>')
          .openPopup();
        mapInstance.current.setView([lat, lng], 14);
        setLocating(false);
      },
      err => {
        setGpsError('تعذّر تحديد موقعك — تحقق من إذن الموقع');
        console.warn('[RouteMap] GPS:', err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  /* ── Optimize route ── */
  async function handleOptimize() {
    const pending = (orders ?? []).filter(o => o.status === 'pending');
    if (pending.length < 2) { alert('تحتاج محطتين على الأقل'); return; }
    setOptimizing(true); setRouteInfo(null);
    try {
      const start     = courierLatLng.current ?? { lat: CAIRO_CENTER[0], lng: CAIRO_CENTER[1] };
      const waypoints = [start, ...pending.map(o => ({ lat: o.lat, lng: o.lng }))];
      const result    = await optimizeRoute(waypoints);

      const reordered = result.orderedIndices.filter(i => i > 0).map(i => pending[i - 1]).filter(Boolean);
      const others    = (orders ?? []).filter(o => o.status !== 'pending');
      const finalList = [...reordered, ...others];
      reorderOrders(finalList);
      updateShiftKm(result.totalKm);

      try {
        if (polyRef.current) polyRef.current.remove();
        if (result.geometry.length > 1) {
          polyRef.current = L.polyline(result.geometry, { color: '#FACC15', weight: 5, opacity: 0.9 })
            .addTo(mapInstance.current);
          if (polyRef.current.getBounds().isValid()) {
            mapInstance.current.fitBounds(polyRef.current.getBounds().pad(0.12));
          }
        }
      } catch { /* silent polyline error */ }

      setRouteInfo({ km: result.totalKm, minutes: result.totalMinutes });
      onOptimized?.(finalList);
    } catch (err) {
      console.error('[RouteMap] optimize:', err);
      alert('تعذّر الاتصال بخدمة التوجيه');
    } finally { setOptimizing(false); }
  }

  return (
    <div style={{ margin: '0 16px 16px' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button
          className="btn btn-ghost"
          onClick={handleLocate}
          disabled={locating}
          style={{ flex: '0 0 auto', padding: '12px 14px' }}
          title="موقعي الحالي"
        >
          {locating ? <Loader size={17} className="pulse-yellow" /> : <LocateFixed size={17} color="var(--color-accent)" />}
        </button>
        <button className="btn btn-primary" onClick={handleOptimize} disabled={optimizing} style={{ flex: 1 }}>
          {optimizing
            ? <><Loader size={16} className="pulse-yellow" /> جاري الحساب...</>
            : <><Navigation size={16} /> رتب خط السير</>
          }
        </button>
      </div>

      {gpsError && <p style={{ color: 'var(--color-danger)', fontSize: 12, marginBottom: 8 }}>{gpsError}</p>}

      {routeInfo && (
        <div className="card slide-up" style={{ display: 'flex', justifyContent: 'space-around', padding: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            📍 <strong style={{ color: 'var(--color-accent)' }}>{routeInfo.km} كم</strong>
          </span>
          <span style={{ color: 'var(--color-border)' }}>|</span>
          <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            ⏱ <strong style={{ color: 'var(--color-accent)' }}>{routeInfo.minutes} دقيقة</strong>
          </span>
        </div>
      )}

      <p style={{ fontSize: 10, color: 'var(--color-muted)', marginBottom: 8, textAlign: 'center' }}>
        اضغط 📍 لتحديد موقعك قبل ترتيب المسار
      </p>

      <div
        ref={mapRef}
        style={{ height: '310px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflow: 'hidden' }}
      />
    </div>
  );
}
