import React, { useState, useEffect } from 'react';
import { adminAPI, formatKES, formatDate } from '../../services/api';
import { toast } from '../../components/common/Toast';

function Modal({ title, onClose, children, width=520 }) {
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

const BLANK = { first_name:'', last_name:'', phone_number:'', email:'', password:'', is_verified:false, id_number:'' };

const AdminAgents = () => {
  const [agents,  setAgents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [statusF, setStatusF] = useState('all');
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState(BLANK);
  const [saving,  setSaving]  = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [detail,  setDetail]  = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const users = (await adminAPI.getUsers()) || [];
      setAgents(users.filter(u => u.role === 'agent'));
    } catch { toast.error('Error','Failed to load agents'); }
    finally { setLoading(false); }
  };

  const filtered = agents.filter(a => {
    if (statusF === 'active'   && !a.is_verified) return false;
    if (statusF === 'inactive' && a.is_verified)  return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return a.phone_number?.includes(q) || a.first_name?.toLowerCase().includes(q) ||
           a.last_name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q);
  });

  const openCreate = () => { setForm(BLANK); setModal('create'); };
  const openEdit   = u  => { setForm({...u, password:''}); setModal(u); setDetail(null); };

  const save = async () => {
    if (!form.phone_number || !form.first_name) { toast.error('Validation','Name and phone required'); return; }
    setSaving(true);
    try {
      if (modal === 'create') {
        if (!form.password) { toast.error('Validation','Password required'); setSaving(false); return; }
        await adminAPI.createUser({...form, role:'agent'});
        toast.success('Agent Created', form.phone_number);
      } else {
        const patch = {...form, role:'agent'}; if (!patch.password) delete patch.password;
        await adminAPI.updateUser(modal.id, patch);
        toast.success('Agent Updated', `${form.first_name} ${form.last_name}`);
      }
      setModal(null); load();
    } catch(e) { toast.error('Error', e.phone_number?.[0]||e.error||'Failed'); }
    finally { setSaving(false); }
  };

  const del = u => setConfirm({ msg:`Remove agent ${u.first_name} ${u.last_name} (${u.phone_number})?`, danger:true, onOk: async () => {
    try { await adminAPI.deleteUser(u.id); toast.success('Removed','Agent deleted'); setConfirm(null); setDetail(null); load(); }
    catch { toast.error('Error','Failed'); setConfirm(null); }
  }});

  const toggleActive = async u => {
    try { await adminAPI.updateUser(u.id,{is_verified:!u.is_verified}); toast.success('Updated',`Agent ${u.is_verified?'deactivated':'activated'}`); load(); }
    catch { toast.error('Error','Update failed'); }
  };

  // Stats
  const active   = agents.filter(a=>a.is_verified).length;
  const inactive = agents.length - active;

  if (loading) return <div className="loading-spinner" />;

  return (
    <div>
      {/* ── Stats ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total Agents',   value:agents.length, icon:'bi-shop-window',     c:'#0369A1', bg:'#E0F2FE' },
          { label:'Active',         value:active,         icon:'bi-check-circle-fill',c:'#00A651', bg:'#E8F8EF' },
          { label:'Inactive',       value:inactive,       icon:'bi-pause-circle-fill',c:'#D97706', bg:'#FEF9C3' },
          { label:'Coverage',       value:`${agents.length ? Math.round(active/agents.length*100) : 0}%`, icon:'bi-graph-up', c:'#7C3AED', bg:'#EDE9FE' },
        ].map(s=>(
          <div key={s.label} className="card" style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:s.bg, color:s.c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
              <i className={`bi ${s.icon}`} />
            </div>
            <div>
              <div style={{ fontSize:20, fontWeight:900, color:s.c }}>{s.value}</div>
              <div style={{ fontSize:11, color:'var(--mpesa-gray-400)', fontWeight:600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:'1 1 180px', maxWidth:280 }}>
          <i className="bi bi-search" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--mpesa-gray-400)', fontSize:13 }} />
          <input className="form-control" placeholder="Search agents…" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:36, height:36, fontSize:13 }} />
        </div>
        <select className="form-control" value={statusF} onChange={e=>setStatusF(e.target.value)} style={{ width:140, height:36, fontSize:13 }}>
          <option value="all">All Agents</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <span style={{ fontSize:13, color:'var(--mpesa-gray-400)', marginLeft:'auto' }}>{filtered.length} agents</span>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          <i className="bi bi-shop-window" style={{ marginRight:6 }} />Add Agent
        </button>
      </div>

      {/* ── Cards grid ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
        {filtered.map(a => (
          <div key={a.id} className="card" style={{ padding:0, overflow:'hidden', cursor:'pointer' }} onClick={()=>setDetail(a)}>
            {/* Card header */}
            <div style={{ background: a.is_verified ? 'var(--mpesa-green)' : 'var(--mpesa-gray-400)', padding:'18px 20px 14px', color:'white' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:'50%', background:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:900 }}>
                    {a.first_name?.[0]||'A'}
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:800 }}>{a.full_name||a.phone_number}</div>
                    <div style={{ fontSize:11, opacity:0.8 }}>{a.phone_number}</div>
                  </div>
                </div>
                <span style={{ background:'rgba(255,255,255,0.2)', borderRadius:20, padding:'3px 10px', fontSize:10, fontWeight:700 }}>
                  <i className={`bi ${a.is_verified?'bi-check-circle-fill':'bi-clock-fill'}`} style={{ marginRight:4 }} />
                  {a.is_verified ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Card body */}
            <div style={{ padding:'16px 20px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                {[
                  { label:'Agent No.',    value:'—',              icon:'bi-hash'         },
                  { label:'Business',     value:'—',              icon:'bi-building'     },
                  { label:'Location',     value:'—',              icon:'bi-geo-alt-fill' },
                  { label:'Float',        value:'—',              icon:'bi-cash-stack'   },
                ].map(f=>(
                  <div key={f.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <i className={`bi ${f.icon}`} style={{ color:'var(--mpesa-green)', fontSize:13 }} />
                    <div>
                      <div style={{ fontSize:10, color:'var(--mpesa-gray-400)' }}>{f.label}</div>
                      <div style={{ fontSize:12, fontWeight:700 }}>{f.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', gap:8 }} onClick={e=>e.stopPropagation()}>
                <button className="btn btn-outline btn-sm" style={{ flex:1 }} onClick={()=>openEdit(a)}>
                  <i className="bi bi-pencil-fill" style={{ marginRight:4 }} />Edit
                </button>
                <button
                  className="btn btn-sm"
                  style={{ flex:1, background: a.is_verified?'#FFF0F0':'#E8F8EF', color: a.is_verified?'#E31E24':'#00A651', border:'none' }}
                  onClick={()=>toggleActive(a)}
                >
                  <i className={`bi ${a.is_verified?'bi-pause-circle-fill':'bi-play-circle-fill'}`} style={{ marginRight:4 }} />
                  {a.is_verified ? 'Deactivate' : 'Activate'}
                </button>
                <button className="btn btn-ghost btn-sm" title="Delete" onClick={()=>del(a)}>
                  <i className="bi bi-trash-fill" style={{ color:'#E31E24' }} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length===0 && (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'60px 0', color:'var(--mpesa-gray-400)' }}>
            <i className="bi bi-shop" style={{ fontSize:36, display:'block', marginBottom:12 }} />
            <div style={{ fontWeight:700, marginBottom:6 }}>No agents found</div>
            <button className="btn btn-primary btn-sm" onClick={openCreate}><i className="bi bi-plus-lg" style={{ marginRight:6 }} />Add First Agent</button>
          </div>
        )}
      </div>

      {/* ── Detail Drawer ── */}
      {detail && (
        <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', justifyContent:'flex-end' }}>
          <div style={{ flex:1, background:'rgba(0,0,0,0.3)' }} onClick={()=>setDetail(null)} />
          <div style={{ width:340, background:'white', overflowY:'auto', boxShadow:'var(--shadow-lg)' }}>
            <div style={{ background:'var(--mpesa-green)', padding:'24px', color:'white' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
                <button onClick={()=>setDetail(null)} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:8, color:'white', padding:'6px 10px', cursor:'pointer' }}><i className="bi bi-x-lg" /></button>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>openEdit(detail)} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:8, color:'white', padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:700 }}><i className="bi bi-pencil-fill" style={{ marginRight:4 }} />Edit</button>
                  <button onClick={()=>del(detail)} style={{ background:'rgba(227,30,36,0.6)', border:'none', borderRadius:8, color:'white', padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:700 }}><i className="bi bi-trash-fill" style={{ marginRight:4 }} />Delete</button>
                </div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ width:60, height:60, borderRadius:'50%', background:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:900, margin:'0 auto 12px' }}>{detail.first_name?.[0]||'A'}</div>
                <div style={{ fontSize:18, fontWeight:900 }}>{detail.full_name||detail.phone_number}</div>
                <div style={{ fontSize:12, opacity:0.8 }}>{detail.phone_number}</div>
              </div>
            </div>
            <div style={{ padding:24 }}>
              {[
                { label:'Email',    value:detail.email||'—',      icon:'bi-envelope-fill' },
                { label:'National ID',value:detail.id_number||'—',icon:'bi-card-text'     },
                { label:'Status',   value:detail.is_verified?'Active':'Inactive', icon:'bi-activity' },
                { label:'Joined',   value:formatDate(detail.created_at), icon:'bi-clock-fill' },
              ].map(r=>(
                <div key={r.label} style={{ display:'flex', gap:12, marginBottom:14 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:'var(--mpesa-gray-100)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--mpesa-green)', flexShrink:0 }}><i className={`bi ${r.icon}`} /></div>
                  <div><div style={{ fontSize:11, color:'var(--mpesa-gray-400)', fontWeight:600 }}>{r.label}</div><div style={{ fontSize:13, fontWeight:700 }}>{r.value}</div></div>
                </div>
              ))}
              <div style={{ marginTop:20, padding:16, background:'var(--mpesa-gray-50)', borderRadius:12 }}>
                <div style={{ fontSize:11, color:'var(--mpesa-gray-400)', fontWeight:700, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.05em' }}>Agent Profile</div>
                <div style={{ fontSize:13, color:'var(--mpesa-gray-500)', textAlign:'center', padding:'16px 0' }}>
                  <i className="bi bi-info-circle" style={{ display:'block', fontSize:20, marginBottom:8 }} />
                  Agent profile data (agent number, business name, float) is available via the Agent model. Connect <code>agent_profile</code> to serializer to display here.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {modal && (
        <Modal title={modal==='create'?<><i className="bi bi-shop-window" style={{ marginRight:8, color:'var(--mpesa-green)' }} />Add Agent</>:<><i className="bi bi-pencil-fill" style={{ marginRight:8, color:'#0369A1' }} />Edit Agent</>} onClose={()=>setModal(null)}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="form-group"><label className="form-label">First Name *</label><input className="form-control" placeholder="First name" value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Last Name</label><input className="form-control" placeholder="Last name" value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})} /></div>
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <div className="input-group"><i className="bi bi-phone input-prefix" /><input className="form-control" type="tel" placeholder="0712345678" value={form.phone_number} onChange={e=>setForm({...form,phone_number:e.target.value})} /></div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-group"><i className="bi bi-envelope input-prefix" /><input className="form-control" type="email" placeholder="email@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div>
          </div>
          <div className="form-group">
            <label className="form-label">National ID</label>
            <input className="form-control" placeholder="ID number" value={form.id_number||''} onChange={e=>setForm({...form,id_number:e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" value={form.is_verified?'true':'false'} onChange={e=>setForm({...form,is_verified:e.target.value==='true'})}>
              <option value="true">Active</option><option value="false">Inactive</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{modal==='create'?'Password *':'New Password (blank = keep)'}</label>
            <div className="input-group"><i className="bi bi-lock input-prefix" /><input className="form-control" type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} /></div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <button className="btn btn-outline" style={{ flex:1 }} onClick={()=>setModal(null)}>Cancel</button>
            <button className={`btn btn-primary ${saving?'btn-loading':''}`} style={{ flex:2 }} onClick={save} disabled={saving}>
              {!saving && <><i className={`bi ${modal==='create'?'bi-shop-window':'bi-check-lg'}`} style={{ marginRight:6 }} />{modal==='create'?'Add Agent':'Save Changes'}</>}
            </button>
          </div>
        </Modal>
      )}

      {/* Confirm */}
      {confirm && (
        <div className="modal-overlay" onClick={()=>setConfirm(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{ maxWidth:400, width:'95%' }}>
            <div className="modal-handle" /><div className="modal-header"><div className="modal-title">Confirm</div><button className="modal-close" onClick={()=>setConfirm(null)}><i className="bi bi-x-lg" /></button></div>
            <p style={{ fontSize:14, color:'var(--mpesa-gray-600)', margin:'8px 0 24px', lineHeight:1.6 }}>{confirm.msg}</p>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-outline" style={{ flex:1 }} onClick={()=>setConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" style={{ flex:1 }} onClick={confirm.onOk}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAgents;