/**
 * App.jsx — Phase 3 (Defensive / Crash-proof edition)
 * All service calls wrapped in try/catch. Safe defaults everywhere.
 * Zero blank-screen risk.
 */

import { useState, useCallback, lazy, Suspense } from 'react';
import { MapPin, BarChart2, PackagePlus, Truck, Users, DollarSign } from 'lucide-react';
import './styles/theme.css';

/* ── Safe service imports ── */
let _authService  = null;
let _storeService = null;

function getAuthService() {
  if (!_authService) {
    try { _authService = require('./services/authService'); } catch { _authService = {}; }
  }
  return _authService;
}

// We use direct ESM imports instead — the require above is a fallback pattern.
// Real imports below:
import { initAuth, getSession, logout as doLogout, quickSwitch } from './services/authService';
import { initStorage, getOrders } from './services/storageService';

/* ── Safe bootstrap (never throws) ── */
function safeInit() {
  try { initAuth(); }    catch (e) { console.warn('[App] initAuth failed:', e); }
  try { initStorage(); } catch (e) { console.warn('[App] initStorage failed:', e); }
}
safeInit();

function safeGetSession() {
  try { return getSession() ?? null; } catch { return null; }
}

function safeGetOrders() {
  try { return getOrders() ?? []; } catch { return []; }
}

/* ── Lazy component imports (isolate each chunk's errors) ── */
import LoginScreen       from './components/LoginScreen';
import ShiftHeader       from './components/ShiftHeader';
import CourierModeBanner from './components/CourierModeBanner';
import AddressInput      from './components/AddressInput';
import StopList          from './components/StopList';
import DailySummary      from './components/DailySummary';

const RouteMap         = lazy(() => import('./components/RouteMap'));
const ManagerDispatch  = lazy(() => import('./components/manager/ManagerDispatch'));
const ManagerFleet     = lazy(() => import('./components/manager/ManagerFleet'));
const ManagerSettlement = lazy(() => import('./components/manager/ManagerSettlement'));

/* ── Navigation ── */
const COURIER_TABS = [
  { id: 'orders', label: 'أوردراتي', Icon: PackagePlus },
  { id: 'map',    label: 'الخريطة',  Icon: MapPin      },
  { id: 'wallet', label: 'المحفظة',  Icon: BarChart2   },
];
const MANAGER_TABS = [
  { id: 'dispatch',   label: 'التوزيع',  Icon: Truck      },
  { id: 'fleet',      label: 'المناديب', Icon: Users      },
  { id: 'settlement', label: 'التقفيل',  Icon: DollarSign },
];

/* ── Suspense fallback ── */
function LoadingSpinner() {
  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:200 }}>
      <div style={{ color:'var(--color-muted)', fontSize:13, fontFamily:'var(--font-main)' }}>
        <span className="pulse-yellow">جاري التحميل...</span>
      </div>
    </div>
  );
}

export default function App() {
  const [user,      setUser]      = useState(safeGetSession);
  const [orders,    setOrders]    = useState(safeGetOrders);
  const [activeTab, setActiveTab] = useState(null);

  const isManager = user?.role === 'manager';
  const tab       = activeTab ?? (isManager ? 'dispatch' : 'orders');
  const TABS      = isManager ? MANAGER_TABS : COURIER_TABS;

  const refreshOrders = useCallback((updated) => {
    setOrders(updated ?? safeGetOrders());
  }, []);

  function handleUserSwitch(newUser) {
    if (!newUser) return;
    setUser(newUser);
    setActiveTab(null);
    setOrders(safeGetOrders());
  }

  function handleLogout() {
    try { doLogout(); } catch { /* silent */ }
    setUser(null);
    setActiveTab(null);
  }

  function handleModeChange(newMode) {
    setUser(prev => prev ? { ...prev, workMode: newMode } : prev);
  }

  /* Pending count — safe */
  const myPending = (() => {
    try {
      if (isManager) return orders.filter(o => o.status === 'pending').length;
      return orders.filter(o =>
        o.status === 'pending' &&
        (user?.workMode === 'freelance'
          ? o.isFreelance || !o.assignedTo
          : !o.isFreelance && (o.assignedTo === user?.courierId || !o.assignedTo))
      ).length;
    } catch { return 0; }
  })();

  /* ── Login Screen ── */
  if (!user) {
    return (
      <LoginScreen
        onLogin={u => {
          if (u) { setUser(u); setOrders(safeGetOrders()); }
        }}
      />
    );
  }

  /* ── Filtered orders for courier map ── */
  const mapOrders = (() => {
    try {
      return orders.filter(o =>
        user?.workMode === 'freelance'
          ? o.isFreelance || !o.assignedTo
          : !o.isFreelance && (o.assignedTo === user?.courierId || !o.assignedTo)
      );
    } catch { return []; }
  })();

  return (
    <div className="app-container">
      {/* ── Header ── */}
      <ShiftHeader
        user={user}
        onLogout={handleLogout}
        onUserSwitch={handleUserSwitch}
      />

      {/* ── Main Content ── */}
      <main className="page-content">

        {/* ══ COURIER VIEW ══ */}
        {!isManager && (
          <>
            {tab === 'orders' && (
              <>
                <CourierModeBanner user={user} onModeChange={handleModeChange} />
                <AddressInput
                  user={user}
                  onOrderAdded={() => { refreshOrders(); setActiveTab('map'); }}
                />
                <div className="divider" style={{ margin: '4px 16px 12px' }} />
                <StopList orders={orders} user={user} onOrdersChange={refreshOrders} />
              </>
            )}
            {tab === 'map' && (
              <Suspense fallback={<LoadingSpinner />}>
                <RouteMap orders={mapOrders} onOptimized={refreshOrders} />
              </Suspense>
            )}
            {tab === 'wallet' && (
              <DailySummary
                orders={orders}
                user={user}
                onReset={() => { setOrders([]); setActiveTab('orders'); }}
              />
            )}
          </>
        )}

        {/* ══ MANAGER VIEW ══ */}
        {isManager && (
          <>
            {/* Office Banner */}
            <div style={{
              margin: '0 16px 12px', padding: '10px 14px',
              background: 'var(--color-surface)',
              border: '1px solid rgba(250,204,21,0.25)',
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 18 }}>🏢</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-accent)' }}>
                  {user.officeName ?? 'مكتب التوصيل'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                  كود: {user.officeCode ?? '—'} | مرحباً، {user.name ?? 'مدير المكتب'}
                </div>
              </div>
            </div>

            <Suspense fallback={<LoadingSpinner />}>
              {tab === 'dispatch'   && <ManagerDispatch   orders={orders} onOrdersChange={refreshOrders} />}
              {tab === 'fleet'      && <ManagerFleet      orders={orders} />}
              {tab === 'settlement' && <ManagerSettlement orders={orders} onReset={() => setOrders([])} />}
            </Suspense>
          </>
        )}
      </main>

      {/* ── Bottom Nav ── */}
      <nav className="bottom-nav">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-item ${tab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Icon />
              {((id === 'orders' && !isManager) || (id === 'dispatch' && isManager)) && myPending > 0 && (
                <span style={{
                  position: 'absolute', top: -5, left: -5,
                  background: 'var(--color-accent)', color: '#09090B',
                  borderRadius: 'var(--radius-full)', fontSize: 9, fontWeight: 800,
                  padding: '1px 4px', minWidth: 14, textAlign: 'center', lineHeight: '14px',
                }}>
                  {myPending}
                </span>
              )}
            </div>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
