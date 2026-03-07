import React, { useState, useEffect } from 'react';
import { adminAPI, formatKES, formatDate } from '../../services/api';
import { toast } from '../../components/common/Toast';

const ROLE_META = {
  customer:      { c:'#00A651', bg:'#E8F8EF', i:'bi-person-fill'    },
  agent:         { c:'#0369A1', bg:'#E0F2FE', i:'bi-shop'           },
  admin:         { c:'#7C3AED', bg:'#EDE9FE', i:'bi-shield-fill'    },
  customer_care: { c:'#92400E', bg:'#FEF9C3', i:'bi-headset'        },
};

const BLANK_USER = { first_name:'', last_name:'', phone_number:'', role:'customer', password:'', email:'', id_number:'', date_of_birth:'', is_verified:false };

function Modal({ title, onClose, children, width=540 }) {
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

function Confirm({ msg, danger, onOk, onCancel }) {
  return (
    <Modal title="Confirm" onClose={onCancel} width={400}>
      <p style={{ fontSize:14, color:'var(--mpesa-gray-600)', margin:'8px 0 24px', lineHeight:1.6 }}>{msg}</p>
      <div style={{ display:'flex', gap:10 }}>
        <button className="btn btn-outline" style={{ flex:1 }} onClick={onCancel}>Cancel</button>
        <button className={`btn ${danger?'btn-danger':'btn-primary'}`} style={{ flex:1 }} onClick={onOk}>Confirm</button>
      </div>
    </Modal>
  );
}

function UserDetailDrawer({ user, onClose, onEdit, onDelete, onToggleVerify }) {
  if (!user) return null;
  const rm = ROLE_META[user.role] || ROLE_META.customer;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, display:'flex', justifyContent:'flex-end' }}>
      <div style={{ flex:1, background:'rgba(0,0,0,0.3)' }} onClick={onClose} />
      <div style={{ width:360, background:'white', overflowY:'auto', boxShadow:'var(--shadow-lg)', display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ background:'var(--mpesa-green)', padding:'28px 24px 20px', color:'white' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:8, color:'white', padding:'6px 10px', cursor:'pointer' }}>
              <i className="bi bi-x-lg" />
            </button>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => onEdit(user)} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:8, color:'white', padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:700 }}>
                <i className="bi bi-pencil-fill" style={{ marginRight:4 }} />Edit
              </button>
              <button onClick={() => onDelete(user)} style={{ background:'rgba(227,30,36,0.7)', border:'none', borderRadius:8, color:'white', padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:700 }}>
                <i className="bi bi-trash-fill" style={{ marginRight:4 }} />Delete
              </button>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:900 }}>
              {user.first_name?.[0] || '?'}
            </div>
            <div>
              <div style={{ fontSize:18, fontWeight:900 }}>{user.full_name || user.phone_number}</div>
              <div style={{ fontSize:12, opacity:0.8, marginTop:2 }}>{user.phone_number}</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, marginTop:16 }}>
            <span style={{ background:'rgba(255,255,255,0.2)', borderRadius:20, padding:'3px 12px', fontSize:11, fontWeight:700, textTransform:'capitalize' }}>
              <i className={`bi ${rm.i}`} style={{ marginRight:4 }} />{user.role?.replace('_',' ')}
            </span>
            <button
              onClick={() => onToggleVerify(user)}
              style={{ background: user.is_verified ? 'rgba(255,255,255,0.2)' : 'rgba(243,156,18,0.6)', border:'none', borderRadius:20, padding:'3px 12px', fontSize:11, fontWeight:700, color:'white', cursor:'pointer' }}
            >
              <i className={`bi ${user.is_verified ? 'bi-patch-check-fill' : 'bi-patch-exclamation-fill'}`} style={{ marginRight:4 }} />
              {user.is_verified ? 'Verified' : 'Pending Verification'}
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:24, flex:1 }}>
          {[
            { label:'Email',       value: user.email || '—',       icon:'bi-envelope-fill'    },
            { label:'National ID', value: user.id_number || '—',   icon:'bi-card-text'        },
            { label:'Date of Birth',value:user.date_of_birth||'—', icon:'bi-calendar3'        },
            { label:'Language',    value: user.language||'english', icon:'bi-translate'        },
            { label:'Joined',      value: formatDate(user.created_at), icon:'bi-clock-fill'   },
            { label:'Last Updated',value: formatDate(user.updated_at), icon:'bi-arrow-repeat'  },
          ].map(row => (
            <div key={row.label} style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:16 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:'var(--mpesa-gray-100)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--mpesa-green)', flexShrink:0 }}>
                <i className={`bi ${row.icon}`} />
              </div>
              <div>
                <div style={{ fontSize:11, color:'var(--mpesa-gray-400)', fontWeight:600 }}>{row.label}</div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--mpesa-gray-800)' }}>{row.value}</div>
              </div>
            </div>
          ))}

          <div style={{ borderTop:'1px solid var(--mpesa-gray-100)', paddingTop:16, marginTop:4 }}>
            <div style={{ fontSize:12, color:'var(--mpesa-gray-500)', fontWeight:700, marginBottom:12, textTransform:'uppercase', letterSpacing:'0.05em' }}>Accounts</div>
            {[
              { label:'M-PESA Account',   value: user.account_number || '—',   color:'var(--mpesa-green)', icon:'bi-phone-fill'    },
              { label:'M-Shwari Balance', value: user.mshwari_balance != null ? formatKES(user.mshwari_balance) : '—', color:'#0369A1', icon:'bi-piggy-bank-fill' },
              { label:'KCB M-PESA',       value: user.kcb_balance     != null ? formatKES(user.kcb_balance)     : '—', color:'#E31E24', icon:'bi-bank'           },
            ].map(a => (
              <div key={a.label} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <i className={`bi ${a.icon}`} style={{ color:a.color, fontSize:16 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:'var(--mpesa-gray-400)' }}>{a.label}</div>
                  <div style={{ fontSize:13, fontWeight:800, color:a.color }}>{a.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const AdminUsers = () => {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [verFilter,  setVerFilter]  = useState('all');
  const [sortBy,  setSortBy]  = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [page,    setPage]    = useState(1);
  const PER_PAGE = 15;

  const [modal,   setModal]   = useState(null); // null | 'create' | {user}
  const [form,    setForm]    = useState(BLANK_USER);
  const [saving,  setSaving]  = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [drawer,  setDrawer]  = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setUsers((await adminAPI.getUsers()) || []); }
    catch { toast.error('Error', 'Failed to load users'); }
    finally { setLoading(false); }
  };

  // ── filters + sort + pagination ──────────────────────────────────────────
  const filtered = users
    .filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (verFilter  === 'verified'   && !u.is_verified) return false;
      if (verFilter  === 'unverified' && u.is_verified)  return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return u.phone_number?.includes(q) || u.first_name?.toLowerCase().includes(q) ||
             u.last_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) ||
             u.id_number?.includes(q);
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'created_at') return dir * (new Date(a.created_at) - new Date(b.created_at));
      if (sortBy === 'name')       return dir * (a.first_name||'').localeCompare(b.first_name||'');
      if (sortBy === 'role')       return dir * (a.role||'').localeCompare(b.role||'');
      return 0;
    });

  const pages   = Math.ceil(filtered.length / PER_PAGE);
  const visible = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  const sort = (col) => { if (sortBy === col) setSortDir(d => d==='asc'?'desc':'asc'); else { setSortBy(col); setSortDir('asc'); } };
  const SortIcon = ({ col }) => sortBy===col
    ? <i className={`bi bi-arrow-${sortDir==='asc'?'up':'down'}`} style={{ marginLeft:4, fontSize:11 }} />
    : <i className="bi bi-arrow-down-up" style={{ marginLeft:4, fontSize:10, opacity:0.3 }} />;

  // ── CRUD ─────────────────────────────────────────────────────────────────
  const openCreate = () => { setForm(BLANK_USER); setModal('create'); };
  const openEdit   = (u) => { setForm({...u, password:''}); setModal(u); setDrawer(null); };

  const save = async () => {
    if (!form.phone_number || !form.first_name) { toast.error('Validation','Name and phone required'); return; }
    if (modal==='create' && !form.password)      { toast.error('Validation','Password required');      return; }
    setSaving(true);
    try {
      if (modal === 'create') {
        await adminAPI.createUser(form);
        toast.success('Created', `Account for ${form.phone_number}`);
      } else {
        const patch = {...form}; if (!patch.password) delete patch.password;
        await adminAPI.updateUser(modal.id, patch);
        toast.success('Updated', `${form.first_name} ${form.last_name}`);
      }
      setModal(null); load();
    } catch(e) { toast.error('Error', e.phone_number?.[0] || e.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const del = (u) => {
    setConfirm({ msg:`Permanently delete ${u.first_name} ${u.last_name} (${u.phone_number})?`, danger:true,
      onOk: async () => {
        try { await adminAPI.deleteUser(u.id); toast.success('Deleted','User removed'); setConfirm(null); setDrawer(null); load(); }
        catch { toast.error('Error','Failed'); setConfirm(null); }
      }
    });
  };

  const toggleVerify = async (u) => {
    try {
      await adminAPI.updateUser(u.id, { is_verified: !u.is_verified });
      toast.success('Updated', `${u.first_name} ${u.is_verified ? 'un-verified' : 'verified'}`);
      if (drawer?.id === u.id) setDrawer(prev => ({...prev, is_verified:!prev.is_verified}));
      load();
    } catch { toast.error('Error','Failed'); }
  };

  if (loading) return <div className="loading-spinner" />;

  const rm = (role) => ROLE_META[role] || ROLE_META.customer;
  const Field = ({ label, ...props }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-control" {...props} />
    </div>
  );

  return (
    <div>
      {/* ── Toolbar ── */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        {/* Search */}
        <div style={{ position:'relative', flex:'1 1 200px', maxWidth:280 }}>
          <i className="bi bi-search" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--mpesa-gray-400)', fontSize:13 }} />
          <input className="form-control" placeholder="Search name, phone, email, ID…"
            value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
            style={{ paddingLeft:36, height:38, fontSize:13 }} />
        </div>
        {/* Role filter */}
        <select className="form-control" value={roleFilter} onChange={e=>{setRoleFilter(e.target.value);setPage(1);}} style={{ width:140, height:38, fontSize:13 }}>
          <option value="all">All Roles</option>
          <option value="customer">Customers</option>
          <option value="agent">Agents</option>
          <option value="customer_care">Customer Care</option>
          <option value="admin">Admin</option>
        </select>
        {/* Verified filter */}
        <select className="form-control" value={verFilter} onChange={e=>{setVerFilter(e.target.value);setPage(1);}} style={{ width:140, height:38, fontSize:13 }}>
          <option value="all">All Statuses</option>
          <option value="verified">Verified</option>
          <option value="unverified">Pending</option>
        </select>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:13, color:'var(--mpesa-gray-400)' }}>{filtered.length} users</span>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <i className="bi bi-person-plus-fill" style={{ marginRight:6 }} />Add User
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ cursor:'pointer' }} onClick={()=>sort('name')}>
                  User <SortIcon col="name" />
                </th>
                <th>Phone</th>
                <th style={{ cursor:'pointer' }} onClick={()=>sort('role')}>
                  Role <SortIcon col="role" />
                </th>
                <th>M-PESA Acc</th>
                <th>Verified</th>
                <th style={{ cursor:'pointer' }} onClick={()=>sort('created_at')}>
                  Joined <SortIcon col="created_at" />
                </th>
                <th style={{ textAlign:'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(u => {
                const r = rm(u.role);
                return (
                  <tr key={u.id} style={{ cursor:'pointer' }} onClick={()=>setDrawer(u)}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:'50%', background:r.c, color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, flexShrink:0 }}>
                          {u.first_name?.[0]||'?'}
                        </div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13 }}>{u.full_name||u.phone_number}</div>
                          <div style={{ fontSize:11, color:'var(--mpesa-gray-400)' }}>{u.email||'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily:'monospace', fontSize:12 }}>{u.phone_number}</td>
                    <td>
                      <span style={{ background:r.bg, color:r.c, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, textTransform:'capitalize', whiteSpace:'nowrap' }}>
                        <i className={`bi ${r.i}`} style={{ marginRight:4 }} />{u.role?.replace('_',' ')}
                      </span>
                    </td>
                    <td style={{ fontSize:11, fontFamily:'monospace', color:'var(--mpesa-gray-500)' }}>
                      {u.account_number||'—'}
                    </td>
                    <td>
                      <button onClick={e=>{e.stopPropagation();toggleVerify(u);}}
                        style={{ background:u.is_verified?'#E8F8EF':'#FEF9C3', color:u.is_verified?'#00A651':'#92400E', border:'none', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                        <i className={`bi ${u.is_verified?'bi-patch-check-fill':'bi-patch-exclamation-fill'}`} style={{ marginRight:4 }} />
                        {u.is_verified?'Verified':'Pending'}
                      </button>
                    </td>
                    <td style={{ fontSize:12, color:'var(--mpesa-gray-500)' }}>
                      {new Date(u.created_at).toLocaleDateString('en-KE')}
                    </td>
                    <td onClick={e=>e.stopPropagation()}>
                      <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" title="Edit"   onClick={()=>openEdit(u)}><i className="bi bi-pencil-fill"  style={{ color:'#0369A1' }} /></button>
                        <button className="btn btn-ghost btn-sm" title="Delete" onClick={()=>del(u)}><i      className="bi bi-trash-fill"   style={{ color:'#E31E24' }} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visible.length===0 && (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:'48px 0', color:'var(--mpesa-gray-400)' }}>
                  <i className="bi bi-person-x" style={{ fontSize:28, display:'block', marginBottom:8 }} />No users found
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:'1px solid var(--mpesa-gray-100)' }}>
            <span style={{ fontSize:13, color:'var(--mpesa-gray-500)' }}>
              Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display:'flex', gap:4 }}>
              <button className="btn btn-ghost btn-sm" disabled={page===1}     onClick={()=>setPage(p=>p-1)}><i className="bi bi-chevron-left"  /></button>
              {Array.from({length:pages},(_,i)=>i+1).filter(p=>p===1||p===pages||Math.abs(p-page)<=1).map((p,i,arr)=>(
                <React.Fragment key={p}>
                  {i>0 && arr[i-1]!==p-1 && <span style={{ padding:'4px 6px', fontSize:13, color:'var(--mpesa-gray-400)' }}>…</span>}
                  <button className={`btn btn-sm ${p===page?'btn-primary':'btn-ghost'}`} onClick={()=>setPage(p)}>{p}</button>
                </React.Fragment>
              ))}
              <button className="btn btn-ghost btn-sm" disabled={page===pages} onClick={()=>setPage(p=>p+1)}><i className="bi bi-chevron-right" /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      {modal && (
        <Modal
          title={modal==='create'
            ? <><i className="bi bi-person-plus-fill" style={{ marginRight:8, color:'var(--mpesa-green)' }} />Create Account</>
            : <><i className="bi bi-pencil-fill"      style={{ marginRight:8, color:'#0369A1' }} />Edit User</>}
          onClose={()=>setModal(null)}
        >
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="First Name *" placeholder="First name" value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})} />
            <Field label="Last Name"    placeholder="Last name"  value={form.last_name}  onChange={e=>setForm({...form,last_name:e.target.value})}  />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <div className="input-group">
              <i className="bi bi-phone input-prefix" />
              <input className="form-control" type="tel" placeholder="0712345678" value={form.phone_number} onChange={e=>setForm({...form,phone_number:e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-group">
              <i className="bi bi-envelope input-prefix" />
              <input className="form-control" type="email" placeholder="email@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Field label="National ID" placeholder="ID number" value={form.id_number||''} onChange={e=>setForm({...form,id_number:e.target.value})} />
            <Field label="Date of Birth" type="date" value={form.date_of_birth||''} onChange={e=>setForm({...form,date_of_birth:e.target.value})} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-control" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                <option value="customer">Customer</option>
                <option value="agent">Agent</option>
                <option value="customer_care">Customer Care</option>
                <option value="admin">Admin / ICT</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Verification</label>
              <select className="form-control" value={form.is_verified?'true':'false'} onChange={e=>setForm({...form,is_verified:e.target.value==='true'})}>
                <option value="true">Verified</option>
                <option value="false">Pending</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{modal==='create'?'Password *':'New Password (blank = keep current)'}</label>
            <div className="input-group">
              <i className="bi bi-lock input-prefix" />
              <input className="form-control" type="password" placeholder={modal==='create'?'Set password':'Leave blank to keep'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <button className="btn btn-outline" style={{ flex:1 }} onClick={()=>setModal(null)}>Cancel</button>
            <button className={`btn btn-primary ${saving?'btn-loading':''}`} style={{ flex:2 }} onClick={save} disabled={saving}>
              {!saving && <><i className={`bi ${modal==='create'?'bi-person-plus-fill':'bi-check-lg'}`} style={{ marginRight:6 }} />{modal==='create'?'Create Account':'Save Changes'}</>}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Confirm ── */}
      {confirm && <Confirm {...confirm} onCancel={()=>setConfirm(null)} />}

      {/* ── Detail Drawer ── */}
      {drawer && (
        <UserDetailDrawer
          user={drawer}
          onClose={()=>setDrawer(null)}
          onEdit={openEdit}
          onDelete={del}
          onToggleVerify={toggleVerify}
        />
      )}
    </div>
  );
};

export default AdminUsers;