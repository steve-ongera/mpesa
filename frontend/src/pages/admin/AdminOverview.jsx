import React, { useState, useEffect } from 'react';
import { adminAPI, formatKES, formatDate } from '../../services/api';
import { toast } from '../../components/common/Toast';

// ─── Pure SVG chart components ────────────────────────────────────────────────

const PALETTE = ['#00A651','#0369A1','#7C3AED','#D97706','#E31E24','#059669','#DB2777','#0891B2'];

function LineSparkline({ data = [], color = '#00A651', height = 56 }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 200, h = height;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - (v / max) * (h - 8) - 2,
  }));
  const poly    = pts.map(p => `${p.x},${p.y}`).join(' ');
  const areaD   = `M 0,${h} L ${pts.map(p => `${p.x},${p.y}`).join(' L ')} L ${w},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#sg-${color.replace('#','')})`} />
      <polyline points={poly} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DonutChart({ data = [], size = 130 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cum = 0;
  const cx = size / 2, cy = size / 2, r = size * 0.39, ir = size * 0.25;
  const slices = data.map((d, i) => {
    const pct = d.value / total;
    const sa = cum * 2 * Math.PI - Math.PI / 2;
    cum += pct;
    const ea = cum * 2 * Math.PI - Math.PI / 2;
    const [x1,y1,x2,y2]     = [cx+r*Math.cos(sa), cy+r*Math.sin(sa), cx+r*Math.cos(ea), cy+r*Math.sin(ea)];
    const [ix1,iy1,ix2,iy2] = [cx+ir*Math.cos(sa),cy+ir*Math.sin(sa),cx+ir*Math.cos(ea),cy+ir*Math.sin(ea)];
    const lg = pct > 0.5 ? 1 : 0;
    return { path: `M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ir} ${ir} 0 ${lg} 0 ${ix1} ${iy1} Z`, color: PALETTE[i % PALETTE.length], ...d };
  });
  return (
    <svg width={size} height={size}>
      {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize={12} fontWeight={900} fill="#1E293B">{total.toLocaleString()}</text>
      <text x={cx} y={cy + 9} textAnchor="middle" fontSize={8}  fill="#94A3B8">TOTAL</text>
    </svg>
  );
}

function BarChart({ data = [], height = 140 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height, padding:'4px 0 0' }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            <div style={{ fontSize:9, color:'var(--mpesa-gray-500)', fontWeight:700 }}>
              {d.value > 9999 ? `${(d.value/1000).toFixed(1)}k` : d.value}
            </div>
            <div style={{ width:'100%', borderRadius:'4px 4px 0 0', background: PALETTE[i % PALETTE.length], height:`${Math.max(pct,3)}%`, transition:'height .5s ease' }} />
            <div style={{ fontSize:9, color:'var(--mpesa-gray-400)', textAlign:'center', lineHeight:1.2, maxHeight:28, overflow:'hidden' }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function AreaChart({ data = [], height = 120, color = '#00A651' }) {
  if (data.length < 2) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 400, h = height;
  const pts = data.map((d, i) => ({ x: (i / (data.length - 1)) * w, y: h - (d.value / max) * (h - 20) - 4 }));
  const poly  = pts.map(p => `${p.x},${p.y}`).join(' ');
  const areaD = `M 0,${h} L ${pts.map(p => `${p.x},${p.y}`).join(' L ')} L ${w},${h} Z`;
  const uid = color.replace('#','');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width:'100%', height }}>
      <defs>
        <linearGradient id={`ag-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#ag-${uid})`} />
      <polyline points={poly} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} />)}
    </svg>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, bg, trend, sparkData }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '20px 20px 12px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:bg, color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
            <i className={`bi ${icon}`} />
          </div>
          {trend !== undefined && (
            <span style={{ fontSize:11, fontWeight:700, color: trend >= 0 ? '#00A651' : '#E31E24', background: trend >= 0 ? '#E8F8EF' : '#FFF0F0', padding:'3px 8px', borderRadius:20 }}>
              <i className={`bi bi-arrow-${trend >= 0 ? 'up' : 'down'}-short`} />
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div style={{ fontSize:26, fontWeight:900, color:'var(--mpesa-gray-900)', lineHeight:1.1, marginBottom:4 }}>{value}</div>
        <div style={{ fontSize:13, color:'var(--mpesa-gray-500)', fontWeight:600 }}>{label}</div>
        {sub && <div style={{ fontSize:11, color:'var(--mpesa-gray-400)', marginTop:2 }}>{sub}</div>}
      </div>
      {sparkData && (
        <div style={{ padding:'0 0 0', marginTop:4 }}>
          <LineSparkline data={sparkData} color={color} height={44} />
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const AdminOverview = ({ onNavigate }) => {
  const [stats,  setStats]  = useState(null);
  const [users,  setUsers]  = useState([]);
  const [txns,   setTxns]   = useState([]);
  const [loading,setLoading]= useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [s, u, t] = await Promise.all([adminAPI.getStats(), adminAPI.getUsers(), adminAPI.getTransactions()]);
      setStats(s); setUsers(u || []); setTxns(t || []);
    } catch { toast.error('Error', 'Failed to load overview data'); }
    finally  { setLoading(false); }
  };

  // Derived data
  const roleData = [
    { label:'Customers',    value: users.filter(u => u.role==='customer').length      },
    { label:'Agents',       value: users.filter(u => u.role==='agent').length         },
    { label:'Care',         value: users.filter(u => u.role==='customer_care').length },
    { label:'Admin',        value: users.filter(u => u.role==='admin').length         },
  ].filter(d => d.value > 0);

  const statusData = [
    { label:'Completed', value: txns.filter(t => t.status==='completed').length },
    { label:'Pending',   value: txns.filter(t => t.status==='pending').length   },
    { label:'Failed',    value: txns.filter(t => t.status==='failed').length    },
    { label:'Reversed',  value: txns.filter(t => t.status==='reversed').length  },
  ].filter(d => d.value > 0);

  const typeBarData = Object.entries(
    txns.reduce((a,t) => { const k = t.transaction_type.replace(/_/g,' '); a[k]=(a[k]||0)+1; return a; }, {})
  ).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([label,value])=>({ label: label.split(' ').pop(), value }));

  // 7-day trend
  const trendDays = Array.from({length:7},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-(6-i));
    return { label: d.toLocaleDateString('en-KE',{weekday:'short'}), date:d.toDateString(), value:0, vol:0 };
  });
  txns.forEach(t => {
    const slot = trendDays.find(x => x.date===new Date(t.created_at).toDateString());
    if (slot) { slot.value++; slot.vol += parseFloat(t.amount||0); }
  });

  // Joined trend (new users per day)
  const userTrend = Array.from({length:7},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-(6-i));
    return { label:d.toLocaleDateString('en-KE',{weekday:'short'}), date:d.toDateString(), value:0 };
  });
  users.forEach(u => {
    const slot = userTrend.find(x=>x.date===new Date(u.created_at).toDateString());
    if (slot) slot.value++;
  });

  const totalVol  = txns.reduce((s,t) => s + parseFloat(t.amount||0), 0);
  const todayVol  = txns.filter(t => new Date(t.created_at).toDateString()===new Date().toDateString())
                        .reduce((s,t) => s + parseFloat(t.amount||0), 0);
  const verifiedPct = users.length ? Math.round((users.filter(u=>u.is_verified).length/users.length)*100) : 0;

  const STAT_CARDS = stats ? [
    { icon:'bi-people-fill',       label:'Total Users',         value:stats.total_users?.toLocaleString(),        color:'#00A651', bg:'#E8F8EF', sub:`${verifiedPct}% verified`,   trend: 12, sparkData: userTrend.map(d=>d.value)    },
    { icon:'bi-arrow-left-right',  label:'Total Transactions',  value:stats.total_transactions?.toLocaleString(), color:'#0369A1', bg:'#E0F2FE', sub:`${stats.today_transactions||0} today`, trend: 8, sparkData: trendDays.map(d=>d.value) },
    { icon:'bi-currency-exchange', label:'Total Volume',        value:formatKES(totalVol),                        color:'#059669', bg:'#ECFDF5', sub:`${formatKES(todayVol)} today`,trend: 5,  sparkData: trendDays.map(d=>d.vol/1000)  },
    { icon:'bi-shop-window',       label:'Active Agents',       value:stats.total_agents?.toLocaleString(),       color:'#7C3AED', bg:'#EDE9FE', sub:'Registered agent accounts',  trend: 2,  sparkData: null                          },
    { icon:'bi-graph-up-arrow',    label:"Today's Transactions",value:stats.today_transactions?.toLocaleString(), color:'#D97706', bg:'#FEF9C3', sub:'Past 24 hours',               trend: -3, sparkData: null                          },
    { icon:'bi-shield-check',      label:'Verified Users',      value:`${users.filter(u=>u.is_verified).length}`, color:'#0891B2', bg:'#E0F7FA', sub:`${verifiedPct}% of total`,   trend: 1,  sparkData: null                          },
  ] : [];

  const TXN_ICON = { send_money:'bi-arrow-up-right-circle-fill', receive_money:'bi-arrow-down-left-circle-fill', withdraw_agent:'bi-cash-stack', buy_airtime:'bi-phone-fill', paybill:'bi-receipt', buy_goods:'bi-bag-fill', mshwari_deposit:'bi-piggy-bank-fill', kcb_deposit:'bi-building-fill' };
  const S_META  = { completed:{bg:'#E8F8EF',c:'#00A651'}, pending:{bg:'#FEF9C3',c:'#92400E'}, failed:{bg:'#FFF0F0',c:'#E31E24'}, reversed:{bg:'#F3F4F6',c:'#6B7280'} };
  const R_META  = { customer:{c:'#00A651',bg:'#E8F8EF',i:'bi-person-fill'}, agent:{c:'#0369A1',bg:'#E0F2FE',i:'bi-shop'}, admin:{c:'#7C3AED',bg:'#EDE9FE',i:'bi-shield-fill'}, customer_care:{c:'#92400E',bg:'#FEF9C3',i:'bi-headset'} };

  if (loading) return <div className="loading-spinner" />;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

      {/* ── Stat cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {STAT_CARDS.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      {/* ── Area chart full width ── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="bi bi-graph-up-arrow" style={{ color:'var(--mpesa-green)', marginRight:8 }} />
            Transaction Volume — Last 7 Days
          </div>
          <div style={{ fontSize:13, color:'var(--mpesa-gray-400)' }}>
            Total: <strong style={{ color:'var(--mpesa-gray-800)' }}>{formatKES(totalVol)}</strong>
          </div>
        </div>
        <div className="card-body">
          <AreaChart data={trendDays.map(d=>({...d, value:d.vol}))} height={130} color="var(--mpesa-green)" />
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, padding:'0 4px' }}>
            {trendDays.map((d,i) => (
              <div key={i} style={{ textAlign:'center', flex:1 }}>
                <div style={{ fontSize:10, color:'var(--mpesa-gray-400)', fontWeight:600 }}>{d.label}</div>
                <div style={{ fontSize:9, color:'var(--mpesa-gray-300)' }}>{d.value} txn</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1.3fr', gap:20 }}>

        {/* Donut — roles */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="bi bi-pie-chart-fill" style={{ color:'#7C3AED', marginRight:8 }} />
              Users by Role
            </div>
          </div>
          <div className="card-body" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
            <DonutChart data={roleData} size={130} />
            <div style={{ width:'100%' }}>
              {roleData.map((d,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:PALETTE[i], flexShrink:0 }} />
                  <div style={{ fontSize:12, flex:1 }}>{d.label}</div>
                  <div style={{ fontWeight:800, fontSize:12 }}>{d.value}</div>
                  <div style={{ fontSize:11, color:'var(--mpesa-gray-400)', width:36, textAlign:'right' }}>
                    {Math.round(d.value/users.length*100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Donut — status */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="bi bi-check2-circle" style={{ color:'#059669', marginRight:8 }} />
              Txn Status
            </div>
          </div>
          <div className="card-body" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
            <DonutChart data={statusData} size={130} />
            <div style={{ width:'100%' }}>
              {statusData.map((d,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:PALETTE[i], flexShrink:0 }} />
                  <div style={{ fontSize:12, flex:1 }}>{d.label}</div>
                  <div style={{ fontWeight:800, fontSize:12 }}>{d.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar — txn types */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="bi bi-bar-chart-fill" style={{ color:'#0369A1', marginRight:8 }} />
              Transactions by Type
            </div>
          </div>
          <div className="card-body">
            <BarChart data={typeBarData} height={150} />
          </div>
        </div>

      </div>

      {/* ── Bottom row: recent users + recent txns ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="bi bi-person-lines-fill" style={{ color:'var(--mpesa-green)', marginRight:8 }} />
              Recent Users
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('/admin/users')}>
              View all <i className="bi bi-arrow-right" />
            </button>
          </div>
          {users.slice(0,6).map(u => {
            const rm = R_META[u.role] || R_META.customer;
            return (
              <div key={u.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 20px', borderBottom:'1px solid var(--mpesa-gray-100)' }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:rm.c, color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, flexShrink:0 }}>
                  {u.first_name?.[0] || '?'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.full_name || u.phone_number}</div>
                  <div style={{ fontSize:11, color:'var(--mpesa-gray-400)' }}>{u.phone_number}</div>
                </div>
                <span style={{ background:rm.bg, color:rm.c, fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, whiteSpace:'nowrap' }}>
                  <i className={`bi ${rm.i}`} style={{ marginRight:3 }} />{u.role?.replace('_',' ')}
                </span>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="bi bi-clock-history" style={{ color:'#D97706', marginRight:8 }} />
              Recent Transactions
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('/admin/transactions')}>
              View all <i className="bi bi-arrow-right" />
            </button>
          </div>
          {txns.slice(0,6).map(txn => {
            const sm  = S_META[txn.status]  || S_META.pending;
            const ico = TXN_ICON[txn.transaction_type] || 'bi-arrow-left-right';
            return (
              <div key={txn.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 20px', borderBottom:'1px solid var(--mpesa-gray-100)' }}>
                <div style={{ width:34, height:34, borderRadius:10, background:'var(--mpesa-green-pale)', color:'var(--mpesa-green)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <i className={`bi ${ico}`} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:700, textTransform:'capitalize' }}>{txn.transaction_type.replace(/_/g,' ')}</div>
                  <div style={{ fontSize:11, color:'var(--mpesa-gray-400)' }}>{txn.sender_phone || '—'}</div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:13, fontWeight:800 }}>{formatKES(txn.amount)}</div>
                  <span style={{ background:sm.bg, color:sm.c, fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:20 }}>{txn.status}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default AdminOverview;