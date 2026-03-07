import React, { useState, useEffect } from 'react';
import { adminAPI, formatDate } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/common/Toast';

const TYPE_META = {
  info:    { i:'bi-info-circle-fill',    c:'#0369A1', bg:'#E0F2FE', label:'Info'    },
  success: { i:'bi-check-circle-fill',   c:'#00A651', bg:'#E8F8EF', label:'Success' },
  warning: { i:'bi-exclamation-triangle-fill', c:'#D97706', bg:'#FEF9C3', label:'Warning' },
  alert:   { i:'bi-bell-fill',           c:'#E31E24', bg:'#FFF0F0', label:'Alert'   },
  system:  { i:'bi-cpu-fill',            c:'#7C3AED', bg:'#EDE9FE', label:'System'  },
};

function Modal({ title, onClose, children, width=480 }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()} style={{ maxWidth:width, width:'95%' }}>
        <div className="modal-handle" />
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}><i className="bi bi-x-lg" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Demo notification log for admin view
const DEMO_RECENT = [
  { id:1, user_phone:'0712345678', message:'Your M-PESA account has been credited with KES 5,000.',      type:'success', is_read:true,  created_at: new Date(Date.now()-3600000*2).toISOString()  },
  { id:2, user_phone:'0722345678', message:'Float balance low: KES 1,200 remaining.',                   type:'warning', is_read:false, created_at: new Date(Date.now()-3600000*5).toISOString()  },
  { id:3, user_phone:'0732345678', message:'System maintenance scheduled for Sunday 2 AM - 4 AM.',       type:'system',  is_read:false, created_at: new Date(Date.now()-3600000*8).toISOString()  },
  { id:4, user_phone:'0742345678', message:'Your KYC verification has been approved.',                   type:'success', is_read:true,  created_at: new Date(Date.now()-86400000).toISOString()   },
  { id:5, user_phone:'0712345678', message:'Suspicious login detected on your account.',                 type:'alert',   is_read:false, created_at: new Date(Date.now()-86400000*2).toISOString() },
  { id:6, user_phone:'0799123456', message:'Your M-Shwari loan of KES 10,000 has been approved.',       type:'info',    is_read:true,  created_at: new Date(Date.now()-86400000*3).toISOString() },
];

const AdminNotifications = () => {
  const { notifications: myNotifs = [], markNotificationsRead } = useAuth();
  const [tab,        setTab]        = useState('broadcast');
  const [log,        setLog]        = useState(DEMO_RECENT);
  const [typeF,      setTypeF]      = useState('all');
  const [readF,      setReadF]      = useState('all');
  const [search,     setSearch]     = useState('');
  const [modal,      setModal]      = useState(false);
  const [sending,    setSending]    = useState(false);
  const [preview,    setPreview]    = useState(null);

  const [form, setForm] = useState({
    target: 'all',        // all | customers | agents | specific
    phone:  '',
    type:   'info',
    title:  '',
    message:'',
  });

  const filteredLog = log.filter(n => {
    if (typeF !== 'all' && n.type !== typeF)              return false;
    if (readF === 'read'   && !n.is_read)                 return false;
    if (readF === 'unread' && n.is_read)                  return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return n.message?.toLowerCase().includes(q) || n.user_phone?.includes(q);
  });

  const unreadCount = log.filter(n=>!n.is_read).length;

  const sendBroadcast = async () => {
    if (!form.title || !form.message) { toast.error('Validation','Title and message are required'); return; }
    if (form.target==='specific' && !form.phone) { toast.error('Validation','Phone number required for specific user'); return; }
    setSending(true);
    try {
      // Simulate API call
      await new Promise(r=>setTimeout(r,1200));
      const newEntry = {
        id: Date.now(), user_phone: form.target==='specific'?form.phone:`[${form.target}]`,
        message: form.message, type: form.type, is_read: false, created_at: new Date().toISOString(),
      };
      setLog(prev=>[newEntry,...prev]);
      toast.success('Sent!', `Notification broadcast to ${form.target==='all'?'all users':form.target}`);
      setModal(false);
      setForm({ target:'all', phone:'', type:'info', title:'', message:'' });
    } catch { toast.error('Error','Failed to send notification'); }
    finally { setSending(false); }
  };

  const markRead = id => setLog(prev=>prev.map(n=>n.id===id?{...n,is_read:true}:n));
  const markAllRead = () => setLog(prev=>prev.map(n=>({...n,is_read:true})));
  const deleteNotif = id => setLog(prev=>prev.filter(n=>n.id!==id));

  const tm = t => TYPE_META[t] || TYPE_META.info;

  return (
    <div>
      {/* ── Stats ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total Notifications', value:log.length,         icon:'bi-bell-fill',       c:'#0369A1', bg:'#E0F2FE' },
          { label:'Unread',              value:unreadCount,         icon:'bi-bell-slash-fill', c:'#E31E24', bg:'#FFF0F0' },
          { label:'Read',                value:log.length-unreadCount, icon:'bi-check-all',   c:'#00A651', bg:'#E8F8EF' },
          { label:'My Notifications',    value:myNotifs.length,    icon:'bi-person-fill',      c:'#7C3AED', bg:'#EDE9FE' },
        ].map(s=>(
          <div key={s.label} className="card" style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:s.bg, color:s.c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
              <i className={`bi ${s.icon}`} />
            </div>
            <div>
              <div style={{ fontSize:22, fontWeight:900, color:s.c }}>{s.value}</div>
              <div style={{ fontSize:11, color:'var(--mpesa-gray-400)', fontWeight:600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs + toolbar ── */}
      <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
        <button className={`btn btn-sm ${tab==='broadcast'?'btn-primary':'btn-outline'}`} onClick={()=>setTab('broadcast')}>
          <i className="bi bi-megaphone-fill" style={{ marginRight:6 }} />Broadcast
        </button>
        <button className={`btn btn-sm ${tab==='log'?'btn-primary':'btn-outline'}`} onClick={()=>setTab('log')}>
          <i className="bi bi-clock-history" style={{ marginRight:6 }} />Notification Log
          {unreadCount>0 && <span style={{ marginLeft:6, background:'#E31E24', color:'white', borderRadius:20, padding:'1px 7px', fontSize:10, fontWeight:700 }}>{unreadCount}</span>}
        </button>
        <button className={`btn btn-sm ${tab==='my'?'btn-primary':'btn-outline'}`} onClick={()=>setTab('my')}>
          <i className="bi bi-person-fill" style={{ marginRight:6 }} />My Notifications
        </button>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button className="btn btn-primary btn-sm" onClick={()=>setModal(true)}>
            <i className="bi bi-send-fill" style={{ marginRight:6 }} />New Broadcast
          </button>
        </div>
      </div>

      {/* ── BROADCAST tab ── */}
      {tab === 'broadcast' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          {/* Quick broadcast form */}
          <div className="card">
            <div className="card-header"><div className="card-title"><i className="bi bi-megaphone-fill" style={{ color:'var(--mpesa-green)', marginRight:8 }} />Quick Broadcast</div></div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Target Audience</label>
                <select className="form-control" value={form.target} onChange={e=>setForm({...form,target:e.target.value})}>
                  <option value="all">All Users</option>
                  <option value="customers">Customers Only</option>
                  <option value="agents">Agents Only</option>
                  <option value="specific">Specific User</option>
                </select>
              </div>
              {form.target==='specific' && (
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div className="input-group"><i className="bi bi-phone input-prefix" /><input className="form-control" type="tel" placeholder="0712345678" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Notification Type</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {Object.entries(TYPE_META).map(([key,v])=>(
                    <button key={key} onClick={()=>setForm({...form,type:key})}
                      style={{ padding:'6px 12px', borderRadius:20, border:'2px solid', borderColor:form.type===key?v.c:'var(--mpesa-gray-200)', background:form.type===key?v.bg:'transparent', color:form.type===key?v.c:'var(--mpesa-gray-500)', fontSize:11, fontWeight:700, cursor:'pointer', transition:'all .2s' }}>
                      <i className={`bi ${v.i}`} style={{ marginRight:4 }} />{v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-control" placeholder="Notification title…" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-control" rows={4} placeholder="Write your notification message…" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} style={{ resize:'vertical' }} />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button className="btn btn-outline" style={{ flex:1 }} onClick={()=>setForm({target:'all',phone:'',type:'info',title:'',message:''})}>
                  <i className="bi bi-x-circle" style={{ marginRight:6 }} />Clear
                </button>
                <button className={`btn btn-primary ${sending?'btn-loading':''}`} style={{ flex:2 }} onClick={sendBroadcast} disabled={sending}>
                  {!sending && <><i className="bi bi-send-fill" style={{ marginRight:6 }} />Send Notification</>}
                </button>
              </div>
            </div>
          </div>

          {/* Preview + templates */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Live preview */}
            <div className="card">
              <div className="card-header"><div className="card-title"><i className="bi bi-eye-fill" style={{ color:'#0369A1', marginRight:8 }} />Preview</div></div>
              <div className="card-body">
                {form.message ? (
                  <div style={{ background:tm(form.type).bg, border:`1px solid ${tm(form.type).c}30`, borderRadius:12, padding:16 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                      <i className={`bi ${tm(form.type).i}`} style={{ color:tm(form.type).c, fontSize:18 }} />
                      <div style={{ fontWeight:800, fontSize:14, color:tm(form.type).c }}>{form.title || 'Notification Title'}</div>
                    </div>
                    <div style={{ fontSize:13, color:'var(--mpesa-gray-700)', lineHeight:1.6 }}>{form.message}</div>
                    <div style={{ fontSize:11, color:'var(--mpesa-gray-400)', marginTop:8 }}>Just now · {form.target==='all'?'All Users':form.target==='specific'?form.phone||'Specific User':form.target}</div>
                  </div>
                ) : (
                  <div style={{ textAlign:'center', padding:'24px 0', color:'var(--mpesa-gray-300)' }}>
                    <i className="bi bi-eye" style={{ fontSize:28, display:'block', marginBottom:8 }} />Write a message to see preview
                  </div>
                )}
              </div>
            </div>

            {/* Quick templates */}
            <div className="card">
              <div className="card-header"><div className="card-title"><i className="bi bi-files" style={{ color:'#7C3AED', marginRight:8 }} />Quick Templates</div></div>
              <div style={{ padding:'8px 0' }}>
                {[
                  { title:'Maintenance Notice', message:'Scheduled system maintenance on Sunday 2 AM – 4 AM EAT. Services may be unavailable during this time.', type:'system' },
                  { title:'New Feature',         message:'Exciting news! We have launched a new feature on M-PESA. Update your app to enjoy the latest experience.', type:'info'   },
                  { title:'Security Alert',      message:'For your security, never share your M-PESA PIN with anyone, including M-PESA agents.', type:'alert'  },
                  { title:'Promotion',           message:'Send money to any network for FREE this weekend! Offer valid Saturday and Sunday only.', type:'success' },
                ].map((t,i)=>(
                  <div key={i} onClick={()=>setForm(f=>({...f,title:t.title,message:t.message,type:t.type}))}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 20px', borderBottom:'1px solid var(--mpesa-gray-100)', cursor:'pointer', transition:'background .15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--mpesa-gray-50)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                  >
                    <div style={{ width:32, height:32, borderRadius:8, background:tm(t.type).bg, color:tm(t.type).c, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <i className={`bi ${tm(t.type).i}`} style={{ fontSize:14 }} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700 }}>{t.title}</div>
                      <div style={{ fontSize:11, color:'var(--mpesa-gray-400)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.message}</div>
                    </div>
                    <i className="bi bi-chevron-right" style={{ color:'var(--mpesa-gray-300)', fontSize:12 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LOG tab ── */}
      {tab === 'log' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title"><i className="bi bi-clock-history" style={{ color:'#D97706', marginRight:8 }} />Notification Log ({filteredLog.length})</div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div style={{ position:'relative' }}>
                <i className="bi bi-search" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--mpesa-gray-400)', fontSize:12 }} />
                <input className="form-control" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:30, height:34, fontSize:12, width:180 }} />
              </div>
              <select className="form-control" value={typeF} onChange={e=>setTypeF(e.target.value)} style={{ height:34, fontSize:12, width:120 }}>
                <option value="all">All Types</option>
                {Object.entries(TYPE_META).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
              <select className="form-control" value={readF} onChange={e=>setReadF(e.target.value)} style={{ height:34, fontSize:12, width:110 }}>
                <option value="all">All</option><option value="unread">Unread</option><option value="read">Read</option>
              </select>
              {unreadCount>0 && <button className="btn btn-ghost btn-sm" onClick={markAllRead}><i className="bi bi-check-all" style={{ marginRight:4 }} />Mark all read</button>}
            </div>
          </div>
          <div>
            {filteredLog.map(n => {
              const t = tm(n.type);
              return (
                <div key={n.id} style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'14px 20px', borderBottom:'1px solid var(--mpesa-gray-100)', background:n.is_read?'transparent':'#FAFFFE', transition:'background .2s' }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:t.bg, color:t.c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0, marginTop:2 }}>
                    <i className={`bi ${t.i}`} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                      <span style={{ fontSize:12, fontFamily:'monospace', color:'var(--mpesa-gray-600)', fontWeight:700 }}>{n.user_phone}</span>
                      <span style={{ background:t.bg, color:t.c, fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:20 }}>{t.label}</span>
                      {!n.is_read && <span style={{ background:'#E31E24', color:'white', fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:20 }}>NEW</span>}
                    </div>
                    <div style={{ fontSize:13, color:'var(--mpesa-gray-700)', lineHeight:1.5 }}>{n.message}</div>
                    <div style={{ fontSize:11, color:'var(--mpesa-gray-400)', marginTop:4 }}>{formatDate(n.created_at)}</div>
                  </div>
                  <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                    {!n.is_read && (
                      <button className="btn btn-ghost btn-sm" title="Mark read" onClick={()=>markRead(n.id)}>
                        <i className="bi bi-check2" style={{ color:'#00A651' }} />
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm" title="Delete" onClick={()=>deleteNotif(n.id)}>
                      <i className="bi bi-trash-fill" style={{ color:'#E31E24' }} />
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredLog.length===0 && (
              <div style={{ textAlign:'center', padding:'48px 0', color:'var(--mpesa-gray-400)' }}>
                <i className="bi bi-bell-slash" style={{ fontSize:32, display:'block', marginBottom:12 }} />No notifications found
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MY NOTIFICATIONS tab ── */}
      {tab === 'my' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title"><i className="bi bi-person-fill" style={{ color:'#7C3AED', marginRight:8 }} />My Notifications ({myNotifs.length})</div>
            {myNotifs.some(n=>!n.is_read) && (
              <button className="btn btn-ghost btn-sm" onClick={markNotificationsRead}>
                <i className="bi bi-check-all" style={{ marginRight:4 }} />Mark all read
              </button>
            )}
          </div>
          {myNotifs.length > 0 ? myNotifs.map(n=>(
            <div key={n.id} style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'14px 20px', borderBottom:'1px solid var(--mpesa-gray-100)', background:n.is_read?'transparent':'#FAFFFE' }}>
              <div style={{ width:38, height:38, borderRadius:10, background:'var(--mpesa-green-pale)', color:'var(--mpesa-green)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0, marginTop:2 }}>
                <i className="bi bi-bell-fill" />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:'var(--mpesa-gray-700)', lineHeight:1.5 }}>{n.message}</div>
                <div style={{ fontSize:11, color:'var(--mpesa-gray-400)', marginTop:4 }}>{formatDate(n.created_at)}</div>
              </div>
              {!n.is_read && <span style={{ width:8, height:8, borderRadius:'50%', background:'#00A651', flexShrink:0, marginTop:8 }} />}
            </div>
          )) : (
            <div style={{ textAlign:'center', padding:'48px 0', color:'var(--mpesa-gray-400)' }}>
              <i className="bi bi-bell-slash" style={{ fontSize:32, display:'block', marginBottom:12 }} />No notifications yet
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;