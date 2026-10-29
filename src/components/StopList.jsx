/**
 * StopList.jsx — Phase 3
 * Shows agency badge "وارد من المكتب 🏢", handles all 3 statuses,
 * contact (call/WhatsApp), Google Maps, deliver/postpone/restore.
 */

import {
  Trash2, ExternalLink, CheckCircle2, MapPin,
  Banknote, Clock, Phone, MessageSquare,
  AlertCircle, RotateCcw, FileText, Flame, Building2,
} from 'lucide-react';
import { markDelivered, markPostponed, markPending, deleteOrder } from '../services/storageService';
import { googleMapsLink, whatsappLink } from '../services/routingService';

export default function StopList({ orders, user, onOrdersChange }) {
  const isAgency = user?.workMode !== 'freelance';

  /* Filter by mode */
  const myOrders = isAgency
    ? orders.filter(o => !o.isFreelance && (o.assignedTo === user?.courierId || !o.assignedTo))
    : orders.filter(o => o.isFreelance || !o.assignedTo);

  const pending   = myOrders.filter(o => o.status === 'pending');
  const postponed = myOrders.filter(o => o.status === 'postponed');
  const delivered = myOrders.filter(o => o.status === 'delivered');

  function refresh(fn, id) { onOrdersChange?.(fn(id)); }

  if (myOrders.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--color-muted)' }}>
        <MapPin size={40} style={{ marginBottom:12, opacity:.25 }}/>
        <p style={{ fontSize:15 }}>لا توجد أوردرات في هذا الوضع</p>
        <p style={{ fontSize:12, marginTop:6, opacity:.6 }}>
          {isAgency ? 'انتظر توزيع الأوردرات من مشرف المكتب' : 'أضف أوردرك الأول من الأعلى'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ margin:'0 16px' }}>
      {pending.length > 0 && (
        <>
          <p className="section-label" style={{ marginBottom:10 }}>📦 قيد التوصيل ({pending.length})</p>
          {pending.map((o, idx) => (
            <StopCard key={o.id} order={o} stepNumber={idx + 1} isNext={idx === 0}
              onDeliver={id => refresh(markDelivered, id)}
              onPostpone={id => refresh(markPostponed, id)}
              onDelete={id => { if(window.confirm('حذف؟')) onOrdersChange?.(deleteOrder(id)); }}
            />
          ))}
        </>
      )}

      {postponed.length > 0 && (
        <>
          <div className="divider" style={{ margin:'14px 0 10px' }}/>
          <p className="section-label" style={{ marginBottom:10, color:'var(--color-urgent)' }}>⏳ مؤجل / لم يرد ({postponed.length})</p>
          {postponed.map(o => (
            <StopCard key={o.id} order={o} isPostponed
              onDeliver={id => refresh(markDelivered, id)}
              onRestore={id => refresh(markPending, id)}
              onDelete={id => { if(window.confirm('حذف؟')) onOrdersChange?.(deleteOrder(id)); }}
            />
          ))}
        </>
      )}

      {delivered.length > 0 && (
        <>
          <div className="divider" style={{ margin:'14px 0 10px' }}/>
          <p className="section-label" style={{ marginBottom:10, color:'var(--color-success)' }}>✅ تم التوصيل ({delivered.length})</p>
          {delivered.map(o => (
            <StopCard key={o.id} order={o} isDelivered
              onDelete={id => { if(window.confirm('حذف؟')) onOrdersChange?.(deleteOrder(id)); }}
            />
          ))}
        </>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   Individual Stop Card
────────────────────────────────────────── */
function StopCard({ order, stepNumber, isNext=false, isDelivered=false, isPostponed=false, onDeliver, onPostpone, onRestore, onDelete }) {
  const mapsUrl = googleMapsLink(order.lat, order.lng, order.address);
  const waUrl   = order.phone ? whatsappLink(order.phone) : null;
  const telUrl  = order.phone ? `tel:${order.phone}` : null;

  let borderClass = '';
  if (isNext && !isDelivered && !isPostponed)           borderClass = 'card-next';
  if (order.priority === 'urgent' && !isDelivered && !isPostponed) borderClass = 'card-urgent';

  return (
    <div className={`card slide-up ${borderClass}`} style={{ marginBottom:10, opacity: isDelivered ? 0.65 : 1 }}>
      {/* Row 1: step + name + badges */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:9, marginBottom:8 }}>
        <div style={{ flexShrink:0 }}>
          {stepNumber && !isDelivered && !isPostponed ? (
            <span style={{ width:26, height:26, background: isNext ? 'var(--color-accent)' : 'var(--color-surface-2)', color: isNext ? '#09090B' : 'var(--color-text)', border: isNext ? 'none' : '1px solid var(--color-border)', borderRadius:'var(--radius-full)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12 }}>{stepNumber}</span>
          ) : isDelivered ? <CheckCircle2 size={22} color="var(--color-success)"/> : <AlertCircle size={22} color="var(--color-urgent)"/>}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap', marginBottom:3 }}>
            {order.name && <span style={{ fontWeight:700, fontSize:13 }}>{order.name}</span>}
            {order.sender && <span style={{ fontSize:10, color:'var(--color-muted)' }}>| {order.sender}</span>}
            {order.assignedTo && !order.isFreelance && (
              <span className="badge" style={{ background:'rgba(59,130,246,0.15)', color:'var(--color-info)', fontSize:9 }}>
                <Building2 size={8}/> من المكتب
              </span>
            )}
            {order.priority === 'urgent' && !isDelivered && (
              <span className="badge badge-orange" style={{ fontSize:9 }}><Flame size={8}/> مستعجل</span>
            )}
            {isNext && !isDelivered && <span className="badge badge-yellow" style={{ fontSize:9 }}>التالي ▶</span>}
          </div>
          <p style={{ fontSize:11, color:'var(--color-muted)', lineHeight:1.4 }}>
            <MapPin size={10} style={{ display:'inline', marginLeft:3, verticalAlign:'middle' }}/>{order.address}
          </p>
          {order.notes && (
            <p style={{ fontSize:10, color:'var(--color-muted)', marginTop:2, fontStyle:'italic', opacity:.8 }}>
              <FileText size={9} style={{ display:'inline', marginLeft:3, verticalAlign:'middle' }}/>{order.notes}
            </p>
          )}
        </div>

        <button className="btn btn-ghost btn-xs" onClick={() => onDelete?.(order.id)} style={{ padding:'5px 7px', flexShrink:0 }}>
          <Trash2 size={12} color="var(--color-danger)"/>
        </button>
      </div>

      {/* Row 2: financials */}
      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:10 }}>
        {order.cash > 0 && (
          <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:12 }}>
            <Banknote size={12} color="var(--color-accent)"/>
            <strong style={{ color:'var(--color-accent)' }}>{order.cash.toLocaleString('ar-EG')}</strong>
            <span style={{ color:'var(--color-muted)', fontSize:10 }}>ج COD</span>
          </span>
        )}
        {order.deliveryFee > 0 && <span className="badge badge-green" style={{ fontSize:10 }}>+{order.deliveryFee} عمولة</span>}
        {isDelivered && order.deliveredAt && (
          <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, color:'var(--color-muted)' }}>
            <Clock size={10}/>{new Date(order.deliveredAt).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'})}
          </span>
        )}
        {isPostponed && order.postponedAt && (
          <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, color:'var(--color-urgent)' }}>
            <Clock size={10}/>{new Date(order.postponedAt).toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'})}
          </span>
        )}
      </div>

      {/* Actions */}
      {!isDelivered && (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {order.phone && (
            <div style={{ display:'flex', gap:6 }}>
              <a href={telUrl} className="btn btn-ghost btn-xs" style={{ flex:1, textDecoration:'none', justifyContent:'center' }}>
                <Phone size={11}/> اتصال
              </a>
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-xs" style={{ flex:1, textDecoration:'none', justifyContent:'center' }}>
                <MessageSquare size={11}/> واتساب
              </a>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-xs" style={{ flex:1, textDecoration:'none', justifyContent:'center' }}>
                <ExternalLink size={11}/> خرائط
              </a>
            </div>
          )}
          {!order.phone && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-xs btn-full" style={{ textDecoration:'none' }}>
              <ExternalLink size={11}/> فتح في خرائط جوجل
            </a>
          )}
          <div style={{ display:'flex', gap:6 }}>
            {isPostponed ? (
              <button className="btn btn-ghost btn-xs" style={{ flex:1 }} onClick={() => onRestore?.(order.id)}>
                <RotateCcw size={12}/> إعادة للقائمة
              </button>
            ) : (
              <button className="btn btn-orange btn-xs" style={{ flex:1 }} onClick={() => onPostpone?.(order.id)}>
                <AlertCircle size={12}/> مؤجل / لم يرد
              </button>
            )}
            <button className="btn btn-success btn-xs" style={{ flex:1 }} onClick={() => onDeliver?.(order.id)}>
              <CheckCircle2 size={12}/> تم التوصيل ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
