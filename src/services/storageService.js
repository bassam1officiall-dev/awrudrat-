/**
 * storageService.js — Phase 3 (backward-compatible + demo seed orders)
 */

const KEYS = {
  ORDERS:   'awr_orders',
  SHIFT:    'awr_shift',
  EXPENSES: 'awr_expenses',
  SETTLED:  'awr_settled',   // per-courier settlement flags
};

/* ──────────────────────────────────────────
   DEMO SEED ORDERS (seeded once if empty)
────────────────────────────────────────── */
const DEMO_ORDERS = [
  {
    id: 'demo_1', name: 'مي سامي', sender: 'براند بيتش للملابس', address: 'المهندسين - شارع جامعة الدول العربية',
    phone: '01055512345', cash: 850, deliveryFee: 35, shippingFee: 60,
    notes: 'الدور الثالث، شقة 8', priority: 'normal', status: 'pending',
    lat: 30.0613, lng: 31.2001, assignedTo: 'c_1', isFreelance: false,
    routeIndex: 0, createdAt: Date.now() - 3600000, deliveredAt: null, postponedAt: null,
  },
  {
    id: 'demo_2', name: 'محمد عيد', sender: 'صيدلية النور', address: 'الدقي - شارع التحرير',
    phone: '01066623456', cash: 290, deliveryFee: 35, shippingFee: 60,
    notes: 'أمام البنك الأهلي', priority: 'urgent', status: 'pending',
    lat: 30.0391, lng: 31.2076, assignedTo: 'c_1', isFreelance: false,
    routeIndex: 1, createdAt: Date.now() - 3200000, deliveredAt: null, postponedAt: null,
  },
  {
    id: 'demo_3', name: 'هدى كمال', sender: 'مطعم الشيف', address: 'العجوزة - شارع البحر الأعظم',
    phone: '01077734567', cash: 0, deliveryFee: 35, shippingFee: 60,
    notes: 'عمارة الياسمين - شقة 5', priority: 'normal', status: 'delivered',
    lat: 30.0607, lng: 31.2000, assignedTo: 'c_1', isFreelance: false,
    routeIndex: 2, createdAt: Date.now() - 2800000, deliveredAt: Date.now() - 900000, postponedAt: null,
  },
  {
    id: 'demo_4', name: 'أحمد رياض', sender: 'ستايلو للأزياء', address: 'مدينة نصر - شارع عباس العقاد',
    phone: '01088845678', cash: 1200, deliveryFee: 35, shippingFee: 60,
    notes: 'برج سيتي ستارز، الدور السابع', priority: 'urgent', status: 'pending',
    lat: 30.0626, lng: 31.3336, assignedTo: 'c_2', isFreelance: false,
    routeIndex: 0, createdAt: Date.now() - 2400000, deliveredAt: null, postponedAt: null,
  },
];

function seedDemoOrders() {
  try {
    const raw = localStorage.getItem(KEYS.ORDERS);
    if (!raw || JSON.parse(raw).length === 0) {
      localStorage.setItem(KEYS.ORDERS, JSON.stringify(DEMO_ORDERS));
    }
  } catch { /* silent */ }
}

export function initStorage() {
  seedDemoOrders();
}

/* ──────────────────────────────────────────
   ORDER NORMALIZER (safe defaults for all phases)
────────────────────────────────────────── */
function normalizeOrder(raw) {
  return {
    id:          raw.id          ?? crypto.randomUUID(),
    name:        raw.name        ?? '',
    sender:      raw.sender      ?? '',
    address:     raw.address     ?? '',
    phone:       raw.phone       ?? '',
    cash:        raw.cash        ?? 0,
    deliveryFee: raw.deliveryFee ?? 30,
    shippingFee: raw.shippingFee ?? 60,
    notes:       raw.notes       ?? '',
    priority:    raw.priority    ?? 'normal',
    lat:         raw.lat         ?? 30.0444,
    lng:         raw.lng         ?? 31.2357,
    assignedTo:  raw.assignedTo  ?? null,   // courierId or null
    isFreelance: raw.isFreelance ?? false,
    status:      raw.status      ?? 'pending',
    routeIndex:  raw.routeIndex  ?? 0,
    createdAt:   raw.createdAt   ?? Date.now(),
    deliveredAt: raw.deliveredAt ?? null,
    postponedAt: raw.postponedAt ?? null,
  };
}

/* ──────────────────────────────────────────
   ORDER CRUD
────────────────────────────────────────── */
export function getOrders() {
  try {
    const raw = localStorage.getItem(KEYS.ORDERS);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.map(normalizeOrder) : [];
  } catch { return []; }
}

export function saveOrders(orders) {
  try { localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders)); }
  catch (err) { console.error('[storage] saveOrders:', err); }
}

export function addOrder(stop) {
  const orders   = getOrders();
  const newOrder = normalizeOrder({ ...stop, id: crypto.randomUUID(), status: 'pending', routeIndex: orders.length, createdAt: Date.now() });
  orders.push(newOrder);
  saveOrders(orders);
  return newOrder;
}

export function updateOrder(id, changes) {
  const orders = getOrders().map(o => o.id === id ? { ...o, ...changes } : o);
  saveOrders(orders);
  return orders;
}

export function markDelivered(id) {
  return updateOrder(id, { status: 'delivered', deliveredAt: Date.now() });
}

export function markPostponed(id) {
  return updateOrder(id, { status: 'postponed', postponedAt: Date.now() });
}

export function markPending(id) {
  return updateOrder(id, { status: 'pending', deliveredAt: null, postponedAt: null });
}

export function deleteOrder(id) {
  const orders = getOrders().filter(o => o.id !== id);
  saveOrders(orders);
  return orders;
}

export function reorderOrders(orderedOrders) {
  const updated = orderedOrders.map((o, idx) => ({ ...o, routeIndex: idx }));
  saveOrders(updated);
  return updated;
}

/* ──────────────────────────────────────────
   SHIFT
────────────────────────────────────────── */
const DEFAULT_SHIFT = { active: false, startedAt: null, endedAt: null, totalKm: 0 };

export function getShift() {
  try { const r = localStorage.getItem(KEYS.SHIFT); return r ? { ...DEFAULT_SHIFT, ...JSON.parse(r) } : { ...DEFAULT_SHIFT }; }
  catch { return { ...DEFAULT_SHIFT }; }
}
export function startShift() {
  const s = { active: true, startedAt: Date.now(), endedAt: null, totalKm: 0 };
  localStorage.setItem(KEYS.SHIFT, JSON.stringify(s)); return s;
}
export function endShift() {
  const s = { ...getShift(), active: false, endedAt: Date.now() };
  localStorage.setItem(KEYS.SHIFT, JSON.stringify(s)); return s;
}
export function updateShiftKm(km) {
  const s = { ...getShift(), totalKm: km };
  localStorage.setItem(KEYS.SHIFT, JSON.stringify(s));
}

/* ──────────────────────────────────────────
   EXPENSES
────────────────────────────────────────── */
export function getExpenses() {
  try { return parseFloat(localStorage.getItem(KEYS.EXPENSES) || '0') || 0; }
  catch { return 0; }
}
export function saveExpenses(v) {
  try { localStorage.setItem(KEYS.EXPENSES, String(parseFloat(v) || 0)); } catch { /* silent */ }
}

/* ──────────────────────────────────────────
   SETTLEMENT FLAGS (per courier)
────────────────────────────────────────── */
export function getSettlements() {
  try { const r = localStorage.getItem(KEYS.SETTLED); return r ? JSON.parse(r) : {}; }
  catch { return {}; }
}
export function settleCourrierAccount(courierId) {
  const s = { ...getSettlements(), [courierId]: { settledAt: Date.now() } };
  localStorage.setItem(KEYS.SETTLED, JSON.stringify(s));
}
export function isCourierSettled(courierId) {
  return !!getSettlements()[courierId];
}

/* ──────────────────────────────────────────
   RESET
────────────────────────────────────────── */
export function resetDay() {
  [KEYS.ORDERS, KEYS.SHIFT, KEYS.EXPENSES, KEYS.SETTLED].forEach(k => {
    try { localStorage.removeItem(k); } catch { /* silent */ }
  });
}
