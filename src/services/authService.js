/**
 * authService.js — Zero-Auth Instant Direct Testing
 * Pre-seeded accounts, auto-default session, role switching.
 */

const KEYS = {
  USERS:   'awr_users',
  SESSION: 'awr_session',
};

/* ──────────────────────────────────────────
   PRE-SEEDED ACCOUNTS
────────────────────────────────────────── */
export const DEFAULT_COURIER = {
  id:         'u_c1',
  email:      'courier@awrudrat.com',
  password:   'Courier@123',
  role:       'courier',
  name:       'مندوب تجريبي (كريم عادل)',
  label:      'مندوب توصيل',
  courierId:  'c_1',
  phone:      '01012345678',
  zone:       'المهندسين / الدقي / الجيزة',
  workMode:   'agency',   // 'agency' | 'freelance'
  officeName: 'مكتب أوردرات إكسبريس (نظام سبيدو)',
  officeCode: 'SPD-10',
};

export const DEFAULT_MANAGER = {
  id:         'u_manager',
  email:      'manager@awrudrat.com',
  password:   'Manager@123',
  role:       'manager',
  name:       'مدير مكتب تجريبي (مكتب الشحن)',
  label:      'مدير مكتب التوصيل',
  officeName: 'مكتب أوردرات إكسبريس (نظام سبيدو)',
  officeCode: 'SPD-10',
  courierId:  null,
  phone:      '01099999999',
  workMode:   null,
};

const SEED_USERS = [
  DEFAULT_MANAGER,
  DEFAULT_COURIER,
  {
    id:         'u_c2',
    email:      'hassan@awrudrat.com',
    password:   'Courier@123',
    role:       'courier',
    name:       'حسن طارق',
    label:      'مندوب توصيل',
    courierId:  'c_2',
    phone:      '01123456789',
    zone:       'مدينة نصر / مصر الجديدة',
    workMode:   'agency',
    officeName: 'مكتب أوردرات إكسبريس',
    officeCode: 'SPD-10',
  },
];

/* ──────────────────────────────────────────
   INITIALIZATION (seed once)
────────────────────────────────────────── */
export function initAuth() {
  try {
    const existing = localStorage.getItem(KEYS.USERS);
    if (!existing) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(SEED_USERS));
    }
    // Ensure default active session is always ready
    if (!localStorage.getItem(KEYS.SESSION)) {
      localStorage.setItem(KEYS.SESSION, JSON.stringify(DEFAULT_COURIER));
    }
  } catch { /* silent */ }
}

/* ──────────────────────────────────────────
   USER CRUD
────────────────────────────────────────── */
export function getAllUsers() {
  try {
    const raw = localStorage.getItem(KEYS.USERS);
    return raw ? JSON.parse(raw) : SEED_USERS;
  } catch { return SEED_USERS; }
}

function saveUsers(users) {
  try { localStorage.setItem(KEYS.USERS, JSON.stringify(users)); } catch { /* silent */ }
}

export function getCouriers() {
  return getAllUsers().filter(u => u.role === 'courier');
}

/** Add a new courier to the office roster */
export function addCourier({ name, phone, zone }) {
  const users = getAllUsers();
  const id    = `u_c${Date.now()}`;
  const cId   = `c_${Date.now()}`;
  const newUser = {
    id,
    email:      `${name.replace(/\s/g, '').toLowerCase()}@awrudrat.com`,
    password:   'Courier@123',
    role:       'courier',
    name,
    label:      'مندوب توصيل',
    courierId:  cId,
    phone:      phone || '',
    zone:       zone  || '',
    workMode:   'agency',
    officeName: 'مكتب أوردرات إكسبريس',
    officeCode: 'SPD-10',
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

/** Update a user's workMode */
export function setWorkMode(userId, mode) {
  const users = getAllUsers().map(u =>
    u.id === userId ? { ...u, workMode: mode } : u
  );
  saveUsers(users);
  const session = getSession();
  if (session?.id === userId) {
    saveSession({ ...session, workMode: mode });
  }
}

/* ──────────────────────────────────────────
   AUTH & ROLE SWITCH
────────────────────────────────────────── */
export function login(email, password) {
  const users = getAllUsers();
  const user  = users.find(
    u => u.email.toLowerCase() === email.trim().toLowerCase()
      && u.password === password
  );
  if (!user) return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
  const session = { ...user, loggedInAt: Date.now() };
  saveSession(session);
  return { success: true, user: session };
}

export function logout() {
  try {
    // In zero-auth mode, resetting session defaults back to courier
    saveSession(DEFAULT_COURIER);
  } catch { /* silent */ }
}

/** Instant role switch between Courier and Manager */
export function switchRole(targetRole) {
  const target = targetRole === 'manager' ? DEFAULT_MANAGER : DEFAULT_COURIER;
  saveSession(target);
  return target;
}

/** Quick-switch to another pre-seeded account */
export function quickSwitch(email) {
  const users = getAllUsers();
  const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;
  const session = { ...user, loggedInAt: Date.now() };
  saveSession(session);
  return session;
}

/* ──────────────────────────────────────────
   SESSION
────────────────────────────────────────── */
export function getSession() {
  try {
    const raw = localStorage.getItem(KEYS.SESSION);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.role) return parsed;
    }
    // Default to courier for instant zero-auth testing
    saveSession(DEFAULT_COURIER);
    return DEFAULT_COURIER;
  } catch {
    return DEFAULT_COURIER;
  }
}

export function saveSession(session) {
  try { localStorage.setItem(KEYS.SESSION, JSON.stringify(session)); } catch { /* silent */ }
}

export function isLoggedIn() {
  return true; // Zero-auth mode: always active
}
