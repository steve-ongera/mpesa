import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { toast } from '../../components/common/Toast';

const CATEGORIES = ['Utilities','Internet','Entertainment','Government','Health','Pension','Telecom','Transport','Education','Finance','Insurance','Retail'];

const CATEGORY_ICONS = {
  Utilities:     { i:'bi-lightning-charge-fill', c:'#D97706', bg:'#FEF9C3' },
  Internet:      { i:'bi-wifi',                  c:'#0369A1', bg:'#E0F2FE' },
  Entertainment: { i:'bi-play-circle-fill',       c:'#7C3AED', bg:'#EDE9FE' },
  Government:    { i:'bi-bank2',                  c:'#334155', bg:'#F1F5F9' },
  Health:        { i:'bi-heart-pulse-fill',        c:'#E31E24', bg:'#FFF0F0' },
  Pension:       { i:'bi-piggy-bank-fill',         c:'#059669', bg:'#ECFDF5' },
  Telecom:       { i:'bi-phone-fill',              c:'#00A651', bg:'#E8F8EF' },
  Transport:     { i:'bi-truck',                   c:'#D97706', bg:'#FEF9C3' },
  Education:     { i:'bi-mortarboard-fill',        c:'#0891B2', bg:'#E0F7FA' },
  Finance:       { i:'bi-currency-exchange',       c:'#059669', bg:'#ECFDF5' },
  Insurance:     { i:'bi-shield-fill-check',       c:'#0369A1', bg:'#E0F2FE' },
  Retail:        { i:'bi-bag-fill',                c:'#DB2777', bg:'#FCE7F3' },
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

const BLANK_BILLER = { name:'', paybill_number:'', category:'Utilities', is_active:true };
const BLANK_TILL   = { business_name:'', till_number:'', location:'', is_active:true };

// Demo billers for UI (replace with API data)
const DEMO_BILLERS = [
  { id:1, name:'Kenya Power',          paybill_number:'888880', category:'Utilities',   is_active:true  },
  { id:2, name:'Safaricom Home Fibre', paybill_number:'400200', category:'Internet',    is_active:true  },
  { id:3, name:'DSTV',                 paybill_number:'444700', category:'Entertainment',is_active:true },
  { id:4, name:'KRA',                  paybill_number:'572572', category:'Government',  is_active:true  },
  { id:5, name:'NHIF',                 paybill_number:'200999', category:'Health',      is_active:true  },
  { id:6, name:'NSSF',                 paybill_number:'333300', category:'Pension',     is_active:false },
  { id:7, name:'Airtel Kenya',         paybill_number:'220220', category:'Telecom',     is_active:true  },
  { id:8, name:'Uber Kenya',           paybill_number:'444500', category:'Transport',   is_active:true  },
];

const DEMO_TILLS = [
  { id:1, business_name:'Naivas Supermarket', till_number:'516600', location:'Westlands, Nairobi', is_active:true  },
  { id:2, business_name:'Java House',         till_number:'571566', location:'CBD, Nairobi',       is_active:true  },
  { id:3, business_name:'KFC Kenya',          till_number:'801000', location:'Multiple',           is_active:true  },
  { id:4, business_name:'Carrefour Kenya',    till_number:'542542', location:'Two Rivers',         is_active:false },
];

const AdminBillers = () => {
  const [tab,     setTab]     = useState('billers');
  const [billers, setBillers] = useState(DEMO_BILLERS);
  const [tills,   setTills]   = useState(DEMO_TILLS);
  const [search,  setSearch]  = useState('');
  const [catF,    setCatF]    = useState('all');
  const [statusF, setStatusF] = useState('all');

  const [billerModal, setBillerModal] = useState(null);
  const [tillModal,   setTillModal]   = useState(null);
  const [billerForm,  setBillerForm]  = useState(BLANK_BILLER);
  const [tillForm,    setTillForm]    = useState(BLANK_TILL);
  const [saving,      setSaving]      = useState(false);
  const [confirm,     setConfirm]     = useState(null);

  const filteredBillers = billers.filter(b => {
    if (catF    !== 'all' && b.category !== catF)         return false;
    if (statusF === 'active'   && !b.is_active)           return false;
    if (statusF === 'inactive' && b.is_active)            return false;
    if (!search) return true;
    return b.name?.toLowerCase().includes(search.toLowerCase()) || b.paybill_number?.includes(search);
  });

  const filteredTills = tills.filter(t => {
    if (statusF === 'active'   && !t.is_active) return false;
    if (statusF === 'inactive' && t.is_active)  return false;
    if (!search) return true;
    return t.business_name?.toLowerCase().includes(search.toLowerCase()) || t.till_number?.includes(search);
  });

  // Biller CRUD
  const openCreateBiller = () => { setBillerForm(BLANK_BILLER); setBillerModal('create'); };
  const openEditBiller   = b  => { setBillerForm(b); setBillerModal(b); };

  const saveBiller = async () => {
    if (!billerForm.name || !billerForm.paybill_number) { toast.error('Validation','Name and paybill number required'); return; }
    setSaving(true);
    try {
      if (billerModal === 'create') {
        const newB = { ...billerForm, id: Date.now() };
        setBillers(prev => [...prev, newB]);
        toast.success('Added', billerForm.name);
      } else {
        setBillers(prev => prev.map(b => b.id===billerModal.id ? {...b,...billerForm} : b));
        toast.success('Updated', billerForm.name);
      }
      setBillerModal(null);
    } catch { toast.error('Error','Failed'); }
    finally { setSaving(false); }
  };

  const deleteBiller = b => setConfirm({ msg:`Remove biller "${b.name}" (${b.paybill_number})?`, danger:true, onOk:()=>{
    setBillers(prev=>prev.filter(x=>x.id!==b.id)); toast.success('Removed',b.name); setConfirm(null);
  }});

  const toggleBiller = b => setBillers(prev=>prev.map(x=>x.id===b.id?{...x,is_active:!x.is_active}:x));

  // Till CRUD
  const openCreateTill = () => { setTillForm(BLANK_TILL); setTillModal('create'); };
  const openEditTill   = t  => { setTillForm(t); setTillModal(t); };

  const saveTill = async () => {
    if (!tillForm.business_name || !tillForm.till_number) { toast.error('Validation','Business name and till number required'); return; }
    setSaving(true);
    if (tillModal === 'create') {
      setTills(prev=>[...prev,{...tillForm,id:Date.now()}]); toast.success('Added',tillForm.business_name);
    } else {
      setTills(prev=>prev.map(t=>t.id===tillModal.id?{...t,...tillForm}:t)); toast.success('Updated',tillForm.business_name);
    }
    setTillModal(null); setSaving(false);
  };

  const deleteTill = t => setConfirm({ msg:`Remove "${t.business_name}" till (${t.till_number})?`, danger:true, onOk:()=>{
    setTills(prev=>prev.filter(x=>x.id!==t.id)); toast.success('Removed',t.business_name); setConfirm(null);
  }});

  const toggleTill = t => setTills(prev=>prev.map(x=>x.id===t.id?{...x,is_active:!x.is_active}:x));

  const cm = cat => CATEGORY_ICONS[cat] || { i:'bi-grid', c:'#6B7280', bg:'#F3F4F6' };

  return (
    <div>
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total Billers', value:billers.length,              icon:'bi-receipt-cutoff',  c:'#0369A1', bg:'#E0F2FE' },
          { label:'Active Billers',value:billers.filter(b=>b.is_active).length, icon:'bi-check-circle-fill', c:'#00A651', bg:'#E8F8EF' },
          { label:'Total Tills',   value:tills.length,                icon:'bi-bag-fill',         c:'#7C3AED', bg:'#EDE9FE' },
          { label:'Active Tills',  value:tills.filter(t=>t.is_active).length,   icon:'bi-shop-window',       c:'#059669', bg:'#ECFDF5' },
        ].map(s=>(
          <div key={s.label} className="card" style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:s.bg, color:s.c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
              <i className={`bi ${s.icon}`} />
            </div>
            <div>
              <div style={{ fontSize:20, fontWeight:900, color:s.c }}>{s.value}</div>
              <div style={{ fontSize:11, color:'var(--mpesa-gray-400)', fontWeight:600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab + toolbar */}
      <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
        <button className={`btn btn-sm ${tab==='billers'?'btn-primary':'btn-outline'}`} onClick={()=>setTab('billers')}>
          <i className="bi bi-receipt-cutoff" style={{ marginRight:6 }} />Paybill Billers ({billers.length})
        </button>
        <button className={`btn btn-sm ${tab==='tills'?'btn-primary':'btn-outline'}`} onClick={()=>setTab('tills')}>
          <i className="bi bi-shop-window" style={{ marginRight:6 }} />Buy Goods Tills ({tills.length})
        </button>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          {/* shared filters */}
          <div style={{ position:'relative' }}>
            <i className="bi bi-search" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--mpesa-gray-400)', fontSize:12 }} />
            <input className="form-control" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:30, height:34, fontSize:12, width:180 }} />
          </div>
          {tab==='billers' && (
            <select className="form-control" value={catF} onChange={e=>setCatF(e.target.value)} style={{ height:34, fontSize:12, width:140 }}>
              <option value="all">All Categories</option>
              {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <select className="form-control" value={statusF} onChange={e=>setStatusF(e.target.value)} style={{ height:34, fontSize:12, width:120 }}>
            <option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
          {tab==='billers'
            ? <button className="btn btn-primary btn-sm" onClick={openCreateBiller}><i className="bi bi-plus-lg" style={{ marginRight:4 }} />Add Biller</button>
            : <button className="btn btn-primary btn-sm" onClick={openCreateTill  }><i className="bi bi-plus-lg" style={{ marginRight:4 }} />Add Till</button>
          }
        </div>
      </div>

      {/* ── BILLERS TABLE ── */}
      {tab === 'billers' && (
        <div className="card">
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Biller</th><th>Paybill No.</th><th>Category</th><th>Status</th><th style={{ textAlign:'right' }}>Actions</th></tr></thead>
              <tbody>
                {filteredBillers.map(b => {
                  const c = cm(b.category);
                  return (
                    <tr key={b.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:36, height:36, borderRadius:10, background:c.bg, color:c.c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                            <i className={`bi ${c.i}`} />
                          </div>
                          <div style={{ fontWeight:700, fontSize:13 }}>{b.name}</div>
                        </div>
                      </td>
                      <td style={{ fontFamily:'monospace', fontSize:13, fontWeight:700, color:'var(--mpesa-gray-700)' }}>{b.paybill_number}</td>
                      <td>
                        <span style={{ background:c.bg, color:c.c, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>
                          <i className={`bi ${c.i}`} style={{ marginRight:4 }} />{b.category}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={()=>toggleBiller(b)}
                          style={{ background:b.is_active?'#E8F8EF':'#F3F4F6', color:b.is_active?'#00A651':'#6B7280', border:'none', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700, cursor:'pointer' }}
                        >
                          <i className={`bi ${b.is_active?'bi-check-circle-fill':'bi-dash-circle-fill'}`} style={{ marginRight:4 }} />
                          {b.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
                          <button className="btn btn-ghost btn-sm" onClick={()=>openEditBiller(b)}><i className="bi bi-pencil-fill" style={{ color:'#0369A1' }} /></button>
                          <button className="btn btn-ghost btn-sm" onClick={()=>deleteBiller(b)}><i className="bi bi-trash-fill" style={{ color:'#E31E24' }} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredBillers.length===0 && (
                  <tr><td colSpan={5} style={{ textAlign:'center', padding:'40px 0', color:'var(--mpesa-gray-400)' }}>
                    <i className="bi bi-receipt-cutoff" style={{ fontSize:24, display:'block', marginBottom:8 }} />No billers found
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TILLS TABLE ── */}
      {tab === 'tills' && (
        <div className="card">
          <div className="table-wrapper">
            <table className="data-table">
              <thead><tr><th>Business</th><th>Till No.</th><th>Location</th><th>Status</th><th style={{ textAlign:'right' }}>Actions</th></tr></thead>
              <tbody>
                {filteredTills.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:34, height:34, borderRadius:10, background:'var(--mpesa-green-pale)', color:'var(--mpesa-green)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <i className="bi bi-shop" />
                        </div>
                        <div style={{ fontWeight:700, fontSize:13 }}>{t.business_name}</div>
                      </div>
                    </td>
                    <td style={{ fontFamily:'monospace', fontSize:13, fontWeight:700 }}>{t.till_number}</td>
                    <td style={{ fontSize:12, color:'var(--mpesa-gray-500)' }}>
                      <i className="bi bi-geo-alt-fill" style={{ marginRight:4, color:'var(--mpesa-green)' }} />{t.location||'—'}
                    </td>
                    <td>
                      <button
                        onClick={()=>toggleTill(t)}
                        style={{ background:t.is_active?'#E8F8EF':'#F3F4F6', color:t.is_active?'#00A651':'#6B7280', border:'none', borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:700, cursor:'pointer' }}
                      >
                        <i className={`bi ${t.is_active?'bi-check-circle-fill':'bi-dash-circle-fill'}`} style={{ marginRight:4 }} />
                        {t.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:4, justifyContent:'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={()=>openEditTill(t)}><i className="bi bi-pencil-fill" style={{ color:'#0369A1' }} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={()=>deleteTill(t)}><i className="bi bi-trash-fill" style={{ color:'#E31E24' }} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTills.length===0 && (
                  <tr><td colSpan={5} style={{ textAlign:'center', padding:'40px 0', color:'var(--mpesa-gray-400)' }}>
                    <i className="bi bi-shop" style={{ fontSize:24, display:'block', marginBottom:8 }} />No tills found
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Biller Modal ── */}
      {billerModal && (
        <Modal title={billerModal==='create'?<><i className="bi bi-plus-circle-fill" style={{ marginRight:8, color:'var(--mpesa-green)' }} />Add Biller</>:<><i className="bi bi-pencil-fill" style={{ marginRight:8 }} />Edit Biller</>} onClose={()=>setBillerModal(null)}>
          <div className="form-group"><label className="form-label">Business Name *</label><input className="form-control" placeholder="e.g. Kenya Power" value={billerForm.name} onChange={e=>setBillerForm({...billerForm,name:e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Paybill Number *</label><input className="form-control" placeholder="e.g. 888880" value={billerForm.paybill_number} onChange={e=>setBillerForm({...billerForm,paybill_number:e.target.value})} /></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control" value={billerForm.category} onChange={e=>setBillerForm({...billerForm,category:e.target.value})}>
                {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={billerForm.is_active?'true':'false'} onChange={e=>setBillerForm({...billerForm,is_active:e.target.value==='true'})}>
                <option value="true">Active</option><option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <button className="btn btn-outline" style={{ flex:1 }} onClick={()=>setBillerModal(null)}>Cancel</button>
            <button className={`btn btn-primary ${saving?'btn-loading':''}`} style={{ flex:2 }} onClick={saveBiller} disabled={saving}>
              {!saving && <><i className="bi bi-check-lg" style={{ marginRight:6 }} />{billerModal==='create'?'Add Biller':'Save Changes'}</>}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Till Modal ── */}
      {tillModal && (
        <Modal title={tillModal==='create'?<><i className="bi bi-plus-circle-fill" style={{ marginRight:8, color:'var(--mpesa-green)' }} />Add Till</>:<><i className="bi bi-pencil-fill" style={{ marginRight:8 }} />Edit Till</>} onClose={()=>setTillModal(null)}>
          <div className="form-group"><label className="form-label">Business Name *</label><input className="form-control" placeholder="e.g. Naivas Supermarket" value={tillForm.business_name} onChange={e=>setTillForm({...tillForm,business_name:e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Till Number *</label><input className="form-control" placeholder="e.g. 516600" value={tillForm.till_number} onChange={e=>setTillForm({...tillForm,till_number:e.target.value})} /></div>
          <div className="form-group"><label className="form-label">Location</label><input className="form-control" placeholder="e.g. Westlands, Nairobi" value={tillForm.location} onChange={e=>setTillForm({...tillForm,location:e.target.value})} /></div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" value={tillForm.is_active?'true':'false'} onChange={e=>setTillForm({...tillForm,is_active:e.target.value==='true'})}>
              <option value="true">Active</option><option value="false">Inactive</option>
            </select>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <button className="btn btn-outline" style={{ flex:1 }} onClick={()=>setTillModal(null)}>Cancel</button>
            <button className={`btn btn-primary ${saving?'btn-loading':''}`} style={{ flex:2 }} onClick={saveTill} disabled={saving}>
              {!saving && <><i className="bi bi-check-lg" style={{ marginRight:6 }} />{tillModal==='create'?'Add Till':'Save Changes'}</>}
            </button>
          </div>
        </Modal>
      )}

      {/* Confirm */}
      {confirm && (
        <div className="modal-overlay" onClick={()=>setConfirm(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{ maxWidth:400, width:'95%' }}>
            <div className="modal-handle" /><div className="modal-header"><div className="modal-title">Confirm Delete</div><button className="modal-close" onClick={()=>setConfirm(null)}><i className="bi bi-x-lg" /></button></div>
            <p style={{ fontSize:14, color:'var(--mpesa-gray-600)', margin:'8px 0 24px', lineHeight:1.6 }}>{confirm.msg}</p>
            <div style={{ display:'flex', gap:10 }}><button className="btn btn-outline" style={{ flex:1 }} onClick={()=>setConfirm(null)}>Cancel</button><button className="btn btn-danger" style={{ flex:1 }} onClick={confirm.onOk}>Delete</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBillers;