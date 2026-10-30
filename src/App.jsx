/**
 * App.jsx — Zero-Auth Instant Direct Testing
 * Direct access to Courier & Manager workspaces with sticky role switcher.
 */

import { useState, useCallback, lazy, Suspense } from 'react';
import { MapPin, BarChart2, PackagePlus, Truck, Users, DollarSign } from 'lucide-react';
import './styles/theme.css';

/* ── Services ── */
import {
  initAuth,
  getSession,
  switchRole,
  DEFAULT_COURIER,
  DEFAULT_MANAGER,
} from './services/authService';
import { initStorage, getOrders } from './services/storageService';

/* ── Safe bootstrap ── */
function safeInit() {
  try { initAuth(); }    catch (e) { console.warn('[App] initAuth failed:', e); }
  try { initStorage(); } catch (e) { console.warn('[App] initStorage failed:', e); }
}
safeInit();

function safeGetSession() {
  try { return getSession() || DEFAULT_COURIER; } catch { return DEFAULT_COURIER; }
}

function safeGetOrders() {
  try { return getOrders() ?? []; } catch { return []; }
}

/* ── Components ── */
import ShiftHeader       from './components/ShiftHeader';
import CourierModeBanner from './components/CourierModeBanner';
import AddressInput      from './components/AddressInput';
import StopList          from './components/StopList';
import DailySummary      from './components/DailySummary';

const RouteMap          = lazy(() => import('./components/RouteMap'));
const ManagerDispatch   = lazy(() => import('./components/manager/ManagerDispatch'));
const ManagerFleet      = lazy(() => import('./components/manager/ManagerFleet'));
const ManagerSettlement = lazy(() => import('./components/manager/ManagerSettlement'));

/* ── Navigation Tabs ── */
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

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 220 }}>
      <div style={{ color: 'var(--color-muted)', fontSize: 13, fontFamily: 'var(--font-main)' }}>
        <span className="pulse-yellow">جاري تحميل البيانات والخريطة...</span>
      </div>
    </div>
  );
}

export default function App() {
  const [user,      setUser]      = useState(safeGetSession);
  const [orders,    setOrders]    = useState(safeGetOrders);
  const [activeTab, setActiveTab] = useState(null);

  const currentUser = user || DEFAULT_COURIER;
  const isManager   = currentUser.role === 'manager';
  const tab         = activeTab ?? (isManager ? 'dispatch' : 'orders');
  const TABS        = isManager ? MANAGER_TABS : COURIER_TABS;

  const refreshOrders = useCallback((updated) => {
    setOrders(updated ?? safeGetOrders());
  }, []);

  function handleRoleChange(newUser) {
    if (!newUser) return;
    setUser(newUser);
    setActiveTab(newUser.role === 'manager' ? 'dispatch' : 'orders');
    setOrders(safeGetOrders());
  }

  function handleModeChange(newMode) {
    setUser(prev => prev ? { ...prev, workMode: newMode } : prev);
  }

  /* Pending count badge */
  const myPending = (() => {
    try {
      if (isManager) return orders.filter(o => o.status === 'pending').length;
      return orders.filter(o =>
        o.status === 'pending' &&
        (currentUser.workMode === 'freelance'
          ? o.isFreelance || !o.assignedTo
          : !o.isFreelance && (o.assignedTo === currentUser.courierId || !o.assignedTo))
      ).length;
    } catch { return 0; }
  })();

  /* Filtered orders for courier map */
  const mapOrders = (() => {
    try {
      return orders.filter(o =>
        currentUser.workMode === 'freelance'
          ? o.isFreelance || !o.assignedTo
          : !o.isFreelance && (o.assignedTo === currentUser.courierId || !o.assignedTo)
      );
    } catch { return []; }
  })();

  return (
    <div className="app-container">
      {/* ── Sticky Top Header with Role Switcher ── */}
      <ShiftHeader
        user={currentUser}
        onRoleChange={handleRoleChange}
        onRefreshOrders={() => refreshOrders()}
      />

      {/* ── Main Content ── */}
      <main className="page-content">

        {/* ══════════════════════════════════════
            COURIER EXPERIENCE
        ══════════════════════════════════════ */}
        {!isManager && (
          <>
            {tab === 'orders' && (
              <>
                <CourierModeBanner user={currentUser} onModeChange={handleModeChange} />
                <AddressInput
                  user={currentUser}
                  onOrderAdded={() => { refreshOrders(); setActiveTab('map'); }}
                />
                <div className="divider" style={{ margin: '4px 16px 12px' }} />
                <StopList orders={orders} user={currentUser} onOrdersChange={refreshOrders} />
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
                user={currentUser}
                onReset={() => { setOrders([]); setActiveTab('orders'); }}
              />
            )}
          </>
        )}

        {/* ══════════════════════════════════════
            MANAGER DISPATCH BOARD
        ══════════════════════════════════════ */}
        {isManager && (
          <>
            {/* Office Info Banner */}
            <div
              style={{
                margin:       '0 16px 12px',
                padding:      '10px 14px',
                background:   'var(--color-surface)',
                border:       '1px solid rgba(250,204,21,0.25)',
                borderRadius: 'var(--radius-md)',
                display:      'flex',
                alignItems:   'center',
                gap:          10,
              }}
            >
              <span style={{ fontSize: 22 }}>🏢</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-accent)' }}>
                  {currentUser.officeName ?? 'مكتب أوردرات إكسبريس (نظام سبيدو)'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
                  كود المكتب: <strong>{currentUser.officeCode ?? 'SPD-10'}</strong> · المشرف: {currentUser.name}
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

      {/* ── Fixed Bottom Navigation ── */}
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
                <span
                  style={{
                    position:     'absolute',
                    top:          -5,
                    left:         -5,
                    background:   'var(--color-accent)',
                    color:        '#09090B',
                    borderRadius: 'var(--radius-full)',
                    fontSize:     9,
                    fontWeight:   800,
                    padding:      '1px 4px',
                    minWidth:     14,
                    textAlign:    'center',
                    lineHeight:   '14px',
                  }}
                >
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
