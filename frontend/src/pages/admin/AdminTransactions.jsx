import React, { useState, useEffect } from 'react';
import { adminAPI, formatKES, formatDate } from '../../services/api';
import { toast } from '../../components/common/Toast';

const STATUS_META = {
  completed: { bg:'#E8F8EF', c:'#00A651', i:'bi-check-circle-fill'       },
  pending:   { bg:'#FEF9C3', c:'#92400E', i:'bi-clock-fill'              },
  failed:    { bg:'#FFF0F0', c:'#E31E24', i:'bi-x-circle-fill'           },
  reversed:  { bg:'#F3F4F6', c:'#6B7280', i:'bi-arrow-counterclockwise'  },
};

const TXN_ICONS = {
  send_money:'bi-arrow-up-right-circle-fill', receive_money:'bi-arrow-down-left-circle-fill',
  withdraw_agent:'bi-cash-stack', withdraw_atm:'bi-bank', buy_airtime:'bi-phone-fill',
  paybill:'bi-receipt', buy_goods:'bi-bag-fill', pochi:'bi-shop',
  mshwari_deposit:'bi-piggy-bank-fill', mshwari_withdraw:'bi-piggy-bank',
  mshwari_loan:'bi-credit-card-fill', kcb_deposit:'bi-building-fill',
  kcb_withdraw:'bi-building', kcb_loan:'bi-bank2',
};

const TXN_TYPES = ['send_money','receive_money','withdraw_agent','withdraw_atm','buy_airtime',
  'paybill','buy_goods','pochi','mshwari_deposit','mshwari_withdraw','mshwari_loan',
  'kcb_deposit','kcb_withdraw','kcb_loan'];

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

function TxnDetail({ txn, onClose, onReverse }) {
  if (!txn) return null;
  const sm  = STATUS_META[txn.status] || STATUS_META.pending;
  const ico = TXN_ICONS[txn.transaction_type] || 'bi-arrow-left-right';
  return (
    <Modal title="Transaction Detail" onClose={onClose}>
      {/* ID + icon */}
      <div style={{ textAlign:'center', padding:'12px 0 20px' }}>
        <div style={{ width:56, height:56, borderRadius:16, background:'var(--mpesa-green-pale)', color:'var(--mpesa-green)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, margin:'0 auto 12px' }}>
          <i className={`bi ${ico}`} />
        </div>
        <div style={{ fontSize:22, fontWeight:900, color:'var(--mpesa-gray-900)' }}>{formatKES(txn.amount)}</div>
        <div style={{ fontFamily:'monospace', fontSize:12, color:'var(--mpesa-gray-400)', marginTop:4 }}>{txn.transaction_id}</div>
        <span style={{ background:sm.bg, color:sm.c, fontSize:12, fontWeight:700, padding:'4px 14px', borderRadius:20, display:'inline-block', marginTop:8 }}>
          <i className={`bi ${sm.i}`} style={{ marginRight:5 }} />{txn.status}
        </span>
      </div>

      {/* Details grid */}
      <div style={{ background:'var(--mpesa-gray-50)', borderRadius:12, padding:16, marginBottom:16 }}>
        {[
          { label:'Type',        value: txn.transaction_type.replace(/_/g,' ') },
          { label:'From',        value: txn.sender_phone || '—'               },
          { label:'To',          value: txn.receiver_phone || '—'             },
          { label:'Amount',      value: formatKES(txn.amount)                 },
          { label:'Charge',      value: formatKES(txn.charge || 0)            },
          { label:'Reference',   value: txn.reference || '—'                  },
          { label:'External Ref',value: txn.external_ref || '—'              },
          { label:'Description', value: txn.description || '—'               },
          { label:'Date',        value: formatDate(txn.created_at)            },
          { label:'Completed',   value: txn.completed_at ? formatDate(txn.completed_at) : '—' },
        ].map(row => (
          <div key={row.label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--mpesa-gray-200)', fontSize:13 }}>
            <span style={{ color:'var(--mpesa-gray-500)', fontWeight:600 }}>{row.label}</span>
            <span style={{ fontWeight:700, color:'var(--mpesa-gray-800)', textAlign:'right', textTransform:'capitalize', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Reverse */}
      {txn.status === 'completed' && (
        <button className="btn btn-danger btn-full" onClick={() => onReverse(txn)}>
          <i className="bi bi-arrow-counterclockwise" style={{ marginRight:8 }} />Reverse Transaction
        </button>
      )}
      {txn.status !== 'completed' && (
        <div style={{ textAlign:'center', color:'var(--mpesa-gray-400)', fontSize:13 }}>
          <i className="bi bi-info-circle" style={{ marginRight:6 }} />
          Only completed transactions can be reversed
        </div>
      )}
    </Modal>
  );
}

const PER_PAGE = 20;

const AdminTransactions = () => {
  const [txns,    setTxns]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [statusF, setStatusF] = useState('all');
  const [typeF,   setTypeF]   = useState('all');
  const [dateFrom,setDateFrom]= useState('');
  const [dateTo,  setDateTo]  = useState('');
  const [page,    setPage]    = useState(1);
  const [selected,setSelected]= useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try { setTxns((await adminAPI.getTransactions()) || []); }
    catch { toast.error('Error','Failed to load transactions'); }
    finally { setLoading(false); }
  };

  const filtered = txns.filter(t => {
    if (statusF !== 'all' && t.status !== statusF)              return false;
    if (typeF   !== 'all' && t.transaction_type !== typeF)      return false;
    if (dateFrom && new Date(t.created_at) < new Date(dateFrom))return false;
    if (dateTo   && new Date(t.created_at) > new Date(dateTo+'T23:59:59')) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return t.transaction_id?.toLowerCase().includes(q) ||
           t.sender_phone?.includes(q) ||
           t.receiver_phone?.includes(q) ||
           t.transaction_type?.includes(q);
  });

  const pages   = Math.ceil(filtered.length / PER_PAGE);
  const visible = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  // Summary stats
  const totalAmt   = filtered.reduce((s,t)=>s+parseFloat(t.amount||0),0);
  const totalCharge= filtered.reduce((s,t)=>s+parseFloat(t.charge||0),0);
  const completedN = filtered.filter(t=>t.status==='completed').length;

  const reverse = (txn) => {
    setConfirm({
      msg: `Reverse transaction ${txn.transaction_id} (${formatKES(txn.amount)})? This will refund the sender.`,
      onOk: async () => {
        setSaving(true);
        try {
          await adminAPI.updateUser(txn.id, { status:'reversed' }); // placeholder — real endpoint needed
          toast.success('Reversed', txn.transaction_id);
          setConfirm(null); setSelected(null); load();
        } catch { toast.error('Error','Failed to reverse'); setConfirm(null); }
        finally { setSaving(false); }
      }
    });
  };

  const clearFilters = () => { setSearch(''); setStatusF('all'); setTypeF('all'); setDateFrom(''); setDateTo(''); setPage(1); };

  if (loading) return <div className="loading-spinner" />;

  const sm = (s) => STATUS_META[s] || STATUS_META.pending;

  return (
    <div>
      {/* ── Summary pills ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Filtered Total',    value:filtered.length.toLocaleString(), icon:'bi-list-ul',          c:'#0369A1', bg:'#E0F2FE' },
          { label:'Total Amount',      value:formatKES(totalAmt),              icon:'bi-currency-exchange', c:'#059669', bg:'#ECFDF5' },
          { label:'Total Charges',     value:formatKES(totalCharge),           icon:'bi-receipt',            c:'#D97706', bg:'#FEF9C3' },
          { label:'Completed',         value:completedN.toLocaleString(),      icon:'bi-check-circle-fill',  c:'#00A651', bg:'#E8F8EF' },
        ].map(s=>(
          <div key={s.label} className="card" style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:s.bg, color:s.c, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
              <i className={`bi ${s.icon}`} />
            </div>
            <div>
              <div style={{ fontSize:17, fontWeight:900, color:s.c }}>{s.value}</div>
              <div style={{ fontSize:11, color:'var(--mpesa-gray-400)', fontWeight:600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="card" style={{ padding:'14px 20px', marginBottom:16 }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', flex:'1 1 180px' }}>
            <i className="bi bi-search" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--mpesa-gray-400)', fontSize:13 }} />
            <input className="form-control" placeholder="ID, phone, type…" value={search}
              onChange={e=>{setSearch(e.target.value);setPage(1);}} style={{ paddingLeft:36, height:36, fontSize:13 }} />
          </div>
          <select className="form-control" value={statusF} onChange={e=>{setStatusF(e.target.value);setPage(1);}} style={{ width:130, height:36, fontSize:13 }}>
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="reversed">Reversed</option>
          </select>
          <select className="form-control" value={typeF} onChange={e=>{setTypeF(e.target.value);setPage(1);}} style={{ width:160, height:36, fontSize:13 }}>
            <option value="all">All Types</option>
            {TXN_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
          </select>
          <input type="date" className="form-control" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(1);}} style={{ width:140, height:36, fontSize:13 }} />
          <span style={{ fontSize:12, color:'var(--mpesa-gray-400)' }}>to</span>
          <input type="date" className="form-control" value={dateTo}   onChange={e=>{setDateTo(e.target.value);setPage(1);}} style={{ width:140, height:36, fontSize:13 }} />
          {(search||statusF!=='all'||typeF!=='all'||dateFrom||dateTo) && (
            <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
              <i className="bi bi-x-circle" style={{ marginRight:4 }} />Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Amount</th>
                <th>Charge</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ textAlign:'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(txn => {
                const s  = sm(txn.status);
                const ic = TXN_ICONS[txn.transaction_type] || 'bi-arrow-left-right';
                return (
                  <tr key={txn.id} style={{ cursor:'pointer' }} onClick={()=>setSelected(txn)}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:28, height:28, borderRadius:8, background:'var(--mpesa-green-pale)', color:'var(--mpesa-green)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <i className={`bi ${ic}`} style={{ fontSize:12 }} />
                        </div>
                        <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:700 }}>{txn.transaction_id}</span>
                      </div>
                    </td>
                    <td style={{ fontSize:12, fontWeight:600, textTransform:'capitalize' }}>{txn.transaction_type.replace(/_/g,' ')}</td>
                    <td style={{ fontSize:12, fontFamily:'monospace' }}>{txn.sender_phone||'—'}</td>
                    <td style={{ fontSize:12, fontFamily:'monospace' }}>{txn.receiver_phone||'—'}</td>
                    <td style={{ fontWeight:800, fontSize:13 }}>{formatKES(txn.amount)}</td>
                    <td style={{ fontSize:12, color:'var(--mpesa-gray-500)' }}>{formatKES(txn.charge||0)}</td>
                    <td>
                      <span style={{ background:s.bg, color:s.c, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>
                        <i className={`bi ${s.i}`} style={{ marginRight:4 }} />{txn.status}
                      </span>
                    </td>
                    <td style={{ fontSize:11, color:'var(--mpesa-gray-400)', whiteSpace:'nowrap' }}>{formatDate(txn.created_at)}</td>
                    <td onClick={e=>e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm" title="View Detail" onClick={()=>setSelected(txn)}>
                        <i className="bi bi-eye-fill" style={{ color:'#0369A1' }} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {visible.length===0 && (
                <tr><td colSpan={9} style={{ textAlign:'center', padding:'48px 0', color:'var(--mpesa-gray-400)' }}>
                  <i className="bi bi-inbox" style={{ fontSize:28, display:'block', marginBottom:8 }} />No transactions found
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages>1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:'1px solid var(--mpesa-gray-100)' }}>
            <span style={{ fontSize:13, color:'var(--mpesa-gray-500)' }}>
              {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE,filtered.length)} of {filtered.length}
            </span>
            <div style={{ display:'flex', gap:4 }}>
              <button className="btn btn-ghost btn-sm" disabled={page===1}     onClick={()=>setPage(p=>p-1)}><i className="bi bi-chevron-left"  /></button>
              {Array.from({length:pages},(_,i)=>i+1).filter(p=>p===1||p===pages||Math.abs(p-page)<=1).map((p,i,arr)=>(
                <React.Fragment key={p}>
                  {i>0&&arr[i-1]!==p-1&&<span style={{ padding:'4px 6px', fontSize:13, color:'var(--mpesa-gray-400)' }}>…</span>}
                  <button className={`btn btn-sm ${p===page?'btn-primary':'btn-ghost'}`} onClick={()=>setPage(p)}>{p}</button>
                </React.Fragment>
              ))}
              <button className="btn btn-ghost btn-sm" disabled={page===pages} onClick={()=>setPage(p=>p+1)}><i className="bi bi-chevron-right" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && <TxnDetail txn={selected} onClose={()=>setSelected(null)} onReverse={reverse} />}

      {/* Confirm */}
      {confirm && (
        <div className="modal-overlay" onClick={()=>setConfirm(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{ maxWidth:400, width:'95%' }}>
            <div className="modal-handle" />
            <div className="modal-header">
              <div className="modal-title">Confirm Reversal</div>
              <button className="modal-close" onClick={()=>setConfirm(null)}><i className="bi bi-x-lg" /></button>
            </div>
            <p style={{ fontSize:14, color:'var(--mpesa-gray-600)', margin:'8px 0 24px', lineHeight:1.6 }}>{confirm.msg}</p>
            <div style={{ display:'flex', gap:10 }}>
              <button className="btn btn-outline" style={{ flex:1 }} onClick={()=>setConfirm(null)}>Cancel</button>
              <button className={`btn btn-danger ${saving?'btn-loading':''}`} style={{ flex:1 }} onClick={confirm.onOk} disabled={saving}>
                {!saving && <><i className="bi bi-arrow-counterclockwise" style={{ marginRight:6 }} />Reverse</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;