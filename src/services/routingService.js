/**
 * routingService.js — Phase 2
 * Expanded Cairo & Giza hotspots, same Nominatim + OSRM logic.
 */

export const CAIRO_CENTER = { lat: 30.0444, lng: 31.2357 };

/* ── Expanded Cairo + Giza hotspots ── */
export const CAIRO_AREAS = [
  /* ─── القاهرة ─── */
  { name: 'وسط البلد',       lat: 30.0561, lng: 31.2394, zone: 'القاهرة' },
  { name: 'مدينة نصر',       lat: 30.0626, lng: 31.3336, zone: 'القاهرة' },
  { name: 'مصر الجديدة',     lat: 30.0872, lng: 31.3290, zone: 'القاهرة' },
  { name: 'التجمع الخامس',   lat: 30.0087, lng: 31.4713, zone: 'القاهرة' },
  { name: 'المعادي',         lat: 29.9602, lng: 31.2569, zone: 'القاهرة' },
  { name: 'حلوان',           lat: 29.8495, lng: 31.3341, zone: 'القاهرة' },
  { name: 'العباسية',        lat: 30.0697, lng: 31.2842, zone: 'القاهرة' },
  { name: 'شبرا',            lat: 30.1000, lng: 31.2432, zone: 'القاهرة' },
  { name: 'المقطم',          lat: 30.0181, lng: 31.3018, zone: 'القاهرة' },
  { name: 'عين شمس',         lat: 30.1091, lng: 31.3197, zone: 'القاهرة' },
  { name: 'السلام',          lat: 30.1294, lng: 31.3612, zone: 'القاهرة' },
  { name: 'الشروق',          lat: 30.1756, lng: 31.6077, zone: 'القاهرة' },
  { name: 'بدر',             lat: 30.1213, lng: 31.7271, zone: 'القاهرة' },
  { name: 'المرج',           lat: 30.1391, lng: 31.3619, zone: 'القاهرة' },
  { name: 'النزهة',          lat: 30.0998, lng: 31.3358, zone: 'القاهرة' },
  { name: 'مصر القديمة',     lat: 30.0063, lng: 31.2313, zone: 'القاهرة' },
  /* ─── الجيزة ─── */
  { name: 'المهندسين',       lat: 30.0613, lng: 31.2001, zone: 'الجيزة'  },
  { name: 'الدقي',           lat: 30.0391, lng: 31.2076, zone: 'الجيزة'  },
  { name: 'الزمالك',         lat: 30.0659, lng: 31.2196, zone: 'الجيزة'  },
  { name: 'إمبابة',          lat: 30.0764, lng: 31.2076, zone: 'الجيزة'  },
  { name: 'فيصل',            lat: 29.9978, lng: 31.1836, zone: 'الجيزة'  },
  { name: 'الهرم',           lat: 29.9889, lng: 31.1395, zone: 'الجيزة'  },
  { name: '6 أكتوبر',        lat: 29.9341, lng: 30.9202, zone: 'الجيزة'  },
  { name: 'الشيخ زايد',      lat: 30.0021, lng: 30.9749, zone: 'الجيزة'  },
  { name: 'بولاق الدكرور',   lat: 30.0271, lng: 31.1872, zone: 'الجيزة'  },
  { name: 'الوراق',          lat: 30.0871, lng: 31.1716, zone: 'الجيزة'  },
  { name: 'أبو النمرس',      lat: 29.9564, lng: 31.0832, zone: 'الجيزة'  },
  { name: 'الحوامدية',       lat: 29.8993, lng: 31.2358, zone: 'الجيزة'  },
];

/* ──────────────────────────────────────────
   GEOCODING via Nominatim
────────────────────────────────────────── */

export async function geocodeAddress(query) {
  if (!query?.trim()) return { ...CAIRO_CENTER, display_name: 'القاهرة' };

  const preset = CAIRO_AREAS.find(a => query.includes(a.name));
  if (preset) return { lat: preset.lat, lng: preset.lng, display_name: preset.name };

  const url =
    `https://nominatim.openstreetmap.org/search?format=json&limit=1` +
    `&accept-language=ar&countrycodes=eg&q=${encodeURIComponent(query)}`;

  try {
    const res  = await fetch(url, {
      headers: { 'Accept-Language': 'ar', 'User-Agent': 'awrudrat/2.0' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.length) throw new Error('No results');
    return {
      lat:          parseFloat(data[0].lat),
      lng:          parseFloat(data[0].lon),
      display_name: data[0].display_name,
    };
  } catch (err) {
    console.warn('[routingService] geocode fallback:', err.message);
    return { ...CAIRO_CENTER, display_name: query };
  }
}

/* ──────────────────────────────────────────
   ROUTE OPTIMIZATION via OSRM
────────────────────────────────────────── */

export async function optimizeRoute(waypoints) {
  if (!waypoints || waypoints.length < 2) {
    return { orderedIndices: waypoints.map((_, i) => i), totalKm: 0, totalMinutes: 0, geometry: [] };
  }

  const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(';');
  const url =
    `https://router.project-osrm.org/trip/v1/driving/${coords}` +
    `?source=first&destination=last&roundtrip=false&steps=false&geometries=geojson&overview=full`;

  try {
    const res  = await fetch(url);
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
    const data = await res.json();
    if (data.code !== 'Ok') throw new Error(`OSRM code: ${data.code}`);

    const trip = data.trips[0];
    const orderedIndices = data.waypoints
      .sort((a, b) => a.waypoint_index - b.waypoint_index)
      .map(w => w.trips_index ?? w.waypoint_index);

    const geometry     = trip.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    const totalKm      = Math.round((trip.distance / 1000) * 10) / 10;
    const totalMinutes = Math.round(trip.duration / 60);

    return { orderedIndices, totalKm, totalMinutes, geometry };
  } catch (err) {
    console.warn('[routingService] OSRM fallback:', err.message);
    return {
      orderedIndices: waypoints.map((_, i) => i),
      totalKm:        estimateStraightLineKm(waypoints),
      totalMinutes:   Math.round(estimateStraightLineKm(waypoints) * 3),
      geometry:       waypoints.map(w => [w.lat, w.lng]),
    };
  }
}

function estimateStraightLineKm(pts) {
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) total += haversine(pts[i], pts[i + 1]);
  return Math.round(total * 10) / 10;
}

function haversine(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/* ──────────────────────────────────────────
   EXTERNAL LINKS
────────────────────────────────────────── */

export function googleMapsLink(lat, lng, label = '') {
  const dest = `${lat},${lng}`;
  const q    = label ? encodeURIComponent(label) : dest;
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving&query=${q}`;
}

/**
 * WhatsApp pre-filled message link.
 * @param {string} rawPhone  — e.g. "01012345678" or "1012345678"
 * @param {string} [msg]
 */
export function whatsappLink(rawPhone, msg = '') {
  // Normalize to Egyptian international: +20xxxxxxxxx
  const digits = rawPhone.replace(/\D/g, '');
  const intl   = digits.startsWith('20') ? digits : `20${digits.replace(/^0/, '')}`;
  const text   = encodeURIComponent(
    msg ||
    'مرحباً، أنا مندوب التوصيل في طريقي إليك لتسليم الأوردر. برجاء تأكيد التواجد أو إرسال اللوكيشن. شكراً 🚚'
  );
  return `https://wa.me/${intl}?text=${text}`;
}
