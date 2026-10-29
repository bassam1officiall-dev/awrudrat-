/**
 * main.jsx — Phase 3 + Error Boundary
 * Wraps App in ErrorBoundary to prevent blank white screen.
 */

import { StrictMode, Component } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

/* ── Global Error Boundary ── */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] caught:', error, info);
    this.setState({ info });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const msg   = this.state.error?.message ?? String(this.state.error);
    const stack = this.state.error?.stack?.split('\n').slice(0, 6).join('\n') ?? '';

    return (
      <div style={{
        minHeight:      '100vh',
        background:     '#0D0D0D',
        color:          '#FAFAFA',
        fontFamily:     "'Cairo', sans-serif",
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        24,
        direction:      'rtl',
      }}>
        <div style={{
          background:   '#18181B',
          border:       '1px solid #EF4444',
          borderRadius: 12,
          padding:      24,
          maxWidth:     460,
          width:        '100%',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <h2 style={{ color: '#EF4444', fontWeight: 800, marginBottom: 12 }}>
            حدث خطأ في التطبيق
          </h2>
          <p style={{ color: '#A1A1AA', fontSize: 13, marginBottom: 16 }}>
            تفاصيل الخطأ للمطوّر:
          </p>
          <pre style={{
            background:    '#09090B',
            border:        '1px solid #3F3F46',
            borderRadius:  6,
            padding:       12,
            fontSize:      11,
            color:         '#FACC15',
            whiteSpace:    'pre-wrap',
            wordBreak:     'break-word',
            marginBottom:  16,
            direction:     'ltr',
            textAlign:     'left',
          }}>
            {msg}{'\n\n'}{stack}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null, info: null })}
            style={{
              background:   '#FACC15',
              color:        '#09090B',
              border:       'none',
              borderRadius: 8,
              padding:      '10px 20px',
              fontFamily:   "'Cairo', sans-serif",
              fontWeight:   700,
              fontSize:     14,
              cursor:       'pointer',
              width:        '100%',
            }}
          >
            🔄 إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }
}

/* ── Mount ── */
const rootEl = document.getElementById('root');
if (!rootEl) {
  document.body.innerHTML = '<div style="color:red;padding:20px;font-family:monospace">خطأ: لم يُعثر على عنصر #root في index.html</div>';
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}
