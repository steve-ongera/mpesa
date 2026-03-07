import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/common/Toast';

function Section({ icon, title, color = 'var(--mpesa-green)', children }) {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="card-header">
        <div className="card-title">
          <i className={`bi ${icon}`} style={{ color, marginRight: 8, fontSize: 16 }} />
          {title}
        </div>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

function ToggleSetting({ label, description, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--mpesa-gray-100)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--mpesa-gray-800)' }}>{label}</div>
        {description && <div style={{ fontSize: 11, color: 'var(--mpesa-gray-400)', marginTop: 2 }}>{description}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative',
          background: value ? 'var(--mpesa-green)' : 'var(--mpesa-gray-200)', transition: 'background .25s', flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: value ? 23 : 3, width: 18, height: 18,
          borderRadius: '50%', background: 'white', transition: 'left .25s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  );
}

function RangeSetting({ label, description, value, min, max, unit, onChange }) {
  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid var(--mpesa-gray-100)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
          {description && <div style={{ fontSize: 11, color: 'var(--mpesa-gray-400)' }}>{description}</div>}
        </div>
        <span style={{ fontWeight: 800, color: 'var(--mpesa-green)', fontSize: 14 }}>{value.toLocaleString()} {unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--mpesa-green)' }} />
    </div>
  );
}

const AdminSettings = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('general');

  // Settings state
  const [general, setGeneral] = useState({
    app_name: 'M-PESA',
    support_phone: '+254 722 000 000',
    support_email: 'mpesa@safaricom.co.ke',
    maintenance_mode: false,
    registration_open: true,
    require_id_verification: true,
  });

  const [limits, setLimits] = useState({
    send_min: 10,
    send_max: 150000,
    withdraw_min: 50,
    withdraw_max: 150000,
    daily_limit: 300000,
    mshwari_loan_min: 100,
    mshwari_loan_max: 50000,
    kcb_loan_min: 1000,
    kcb_loan_max: 500000,
    airtime_min: 5,
    airtime_max: 10000,
  });

  const [fees, setFees] = useState({
    send_money_enabled: true,
    send_money_rate: 1.0,
    withdraw_agent_enabled: true,
    withdraw_agent_rate: 1.5,
    mshwari_loan_rate: 7.5,
    kcb_loan_rate: 8.64,
    paybill_enabled: false,
  });

  const [security, setSecurity] = useState({
    pin_attempts_max: 3,
    session_timeout: 30,
    require_pin_send: true,
    require_pin_withdraw: true,
    require_pin_loans: true,
    otp_expiry: 5,
    rate_limit_enabled: true,
  });

  const [notifications, setNotifications] = useState({
    sms_enabled: true,
    push_enabled: true,
    email_enabled: false,
    transaction_alerts: true,
    login_alerts: true,
    balance_threshold_alerts: true,
    balance_threshold: 500,
  });

  const save = async (section) => {
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      toast.success('Saved', `${section} settings updated`);
    } catch { toast.error('Error', 'Failed to save'); }
    finally { setSaving(false); }
  };

  const SECTIONS = [
    { id: 'general',       label: 'General',       icon: 'bi-gear-fill'         },
    { id: 'limits',        label: 'Limits',         icon: 'bi-sliders'           },
    { id: 'fees',          label: 'Fees & Rates',   icon: 'bi-percent'           },
    { id: 'security',      label: 'Security',       icon: 'bi-shield-lock-fill'  },
    { id: 'notifications', label: 'Notifications',  icon: 'bi-bell-fill'         },
  ];

  const inp = (val, key, setter) => (
    <input className="form-control" value={val} onChange={e=>setter(p=>({...p,[key]:e.target.value}))} style={{ height:36, fontSize:13 }} />
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20, alignItems: 'flex-start' }}>

      {/* Sidebar nav */}
      <div className="card" style={{ padding: '8px 0' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
              background: activeSection===s.id ? 'var(--mpesa-green-pale)' : 'transparent',
              color: activeSection===s.id ? 'var(--mpesa-green)' : 'var(--mpesa-gray-600)',
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: activeSection===s.id ? 700 : 500,
              borderLeft: `3px solid ${activeSection===s.id ? 'var(--mpesa-green)' : 'transparent'}`,
              transition: 'all .2s', textAlign: 'left',
            }}
          >
            <i className={`bi ${s.icon}`} style={{ fontSize: 14 }} />{s.label}
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── GENERAL ── */}
        {activeSection === 'general' && (
          <Section icon="bi-gear-fill" title="General Settings">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Application Name</label>
                {inp(general.app_name, 'app_name', setGeneral)}
              </div>
              <div className="form-group">
                <label className="form-label">Support Phone</label>
                {inp(general.support_phone, 'support_phone', setGeneral)}
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Support Email</label>
                {inp(general.support_email, 'support_email', setGeneral)}
              </div>
            </div>
            <ToggleSetting label="Maintenance Mode" description="Disable all transactions while maintenance is in progress" value={general.maintenance_mode} onChange={v=>setGeneral(p=>({...p,maintenance_mode:v}))} />
            <ToggleSetting label="Open Registration" description="Allow new users to self-register on the platform" value={general.registration_open} onChange={v=>setGeneral(p=>({...p,registration_open:v}))} />
            <ToggleSetting label="Require ID Verification" description="Mandate National ID for full account access" value={general.require_id_verification} onChange={v=>setGeneral(p=>({...p,require_id_verification:v}))} />
            <div style={{ marginTop: 20 }}>
              <button className={`btn btn-primary ${saving?'btn-loading':''}`} onClick={()=>save('General')} disabled={saving}>
                {!saving && <><i className="bi bi-check-lg" style={{ marginRight:6 }} />Save General Settings</>}
              </button>
            </div>
          </Section>
        )}

        {/* ── LIMITS ── */}
        {activeSection === 'limits' && (
          <Section icon="bi-sliders" title="Transaction Limits" color="#0369A1">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {[
                { key:'send_min',        label:'Min Send Amount',      unit:'KES', min:1,    max:500    },
                { key:'send_max',        label:'Max Send Amount',      unit:'KES', min:1000, max:500000 },
                { key:'withdraw_min',    label:'Min Withdrawal',       unit:'KES', min:50,   max:500    },
                { key:'withdraw_max',    label:'Max Withdrawal',       unit:'KES', min:1000, max:500000 },
                { key:'daily_limit',     label:'Daily Transaction Limit',unit:'KES',min:10000,max:1000000},
                { key:'airtime_min',     label:'Min Airtime',          unit:'KES', min:5,    max:50     },
                { key:'airtime_max',     label:'Max Airtime',          unit:'KES', min:100,  max:50000  },
                { key:'mshwari_loan_max',label:'Max M-Shwari Loan',    unit:'KES', min:1000, max:100000 },
                { key:'kcb_loan_max',    label:'Max KCB Loan',         unit:'KES', min:5000, max:1000000},
              ].map(f => (
                <div key={f.key} className="form-group">
                  <label className="form-label">{f.label}</label>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <input type="number" className="form-control" value={limits[f.key]} min={f.min} max={f.max}
                      onChange={e=>setLimits(p=>({...p,[f.key]:Number(e.target.value)}))}
                      style={{ height:36, fontSize:13 }} />
                    <span style={{ fontSize:12, color:'var(--mpesa-gray-400)', whiteSpace:'nowrap' }}>{f.unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20 }}>
              <button className={`btn btn-primary ${saving?'btn-loading':''}`} onClick={()=>save('Limits')} disabled={saving}>
                {!saving && <><i className="bi bi-check-lg" style={{ marginRight:6 }} />Save Limits</>}
              </button>
            </div>
          </Section>
        )}

        {/* ── FEES ── */}
        {activeSection === 'fees' && (
          <Section icon="bi-percent" title="Fees & Interest Rates" color="#D97706">
            <div style={{ background:'#FEF9C3', borderRadius:10, padding:'12px 16px', marginBottom:20, fontSize:13, color:'#92400E' }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ marginRight:8 }} />
              Changes to fees affect all future transactions. Existing transactions are not affected.
            </div>
            {[
              { enableKey:'send_money_enabled', rateKey:'send_money_rate', label:'Send Money Fee', desc:'% of transaction amount' },
              { enableKey:'withdraw_agent_enabled', rateKey:'withdraw_agent_rate', label:'Agent Withdrawal Fee', desc:'% of withdrawal amount' },
              { enableKey:'paybill_enabled', rateKey:null, label:'Paybill Fee', desc:'No fee — toggle to enable' },
            ].map(f => (
              <div key={f.label} style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 0', borderBottom:'1px solid var(--mpesa-gray-100)' }}>
                <button
                  onClick={() => setFees(p=>({...p,[f.enableKey]:!p[f.enableKey]}))}
                  style={{ width:44, height:24, borderRadius:12, border:'none', cursor:'pointer', position:'relative', background:fees[f.enableKey]?'var(--mpesa-green)':'var(--mpesa-gray-200)', transition:'background .25s', flexShrink:0 }}
                >
                  <span style={{ position:'absolute', top:3, left:fees[f.enableKey]?23:3, width:18, height:18, borderRadius:'50%', background:'white', transition:'left .25s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                </button>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{f.label}</div>
                  <div style={{ fontSize:11, color:'var(--mpesa-gray-400)' }}>{f.desc}</div>
                </div>
                {f.rateKey && (
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <input type="number" step="0.1" min={0} max={20} className="form-control" value={fees[f.rateKey]}
                      onChange={e=>setFees(p=>({...p,[f.rateKey]:Number(e.target.value)}))}
                      style={{ width:80, height:34, fontSize:13, textAlign:'center' }} />
                    <span style={{ fontSize:13, fontWeight:700, color:'var(--mpesa-gray-600)' }}>%</span>
                  </div>
                )}
              </div>
            ))}
            <div style={{ padding:'14px 0', borderBottom:'1px solid var(--mpesa-gray-100)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <div><div style={{ fontSize:13, fontWeight:700 }}>M-Shwari Loan Rate</div><div style={{ fontSize:11, color:'var(--mpesa-gray-400)' }}>Monthly interest rate</div></div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <input type="number" step="0.1" min={0} max={30} className="form-control" value={fees.mshwari_loan_rate} onChange={e=>setFees(p=>({...p,mshwari_loan_rate:Number(e.target.value)}))} style={{ width:80, height:34, fontSize:13, textAlign:'center' }} />
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--mpesa-gray-600)' }}>%</span>
                </div>
              </div>
            </div>
            <div style={{ padding:'14px 0' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <div><div style={{ fontSize:13, fontWeight:700 }}>KCB M-PESA Loan Rate</div><div style={{ fontSize:11, color:'var(--mpesa-gray-400)' }}>Annual interest rate</div></div>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <input type="number" step="0.01" min={0} max={50} className="form-control" value={fees.kcb_loan_rate} onChange={e=>setFees(p=>({...p,kcb_loan_rate:Number(e.target.value)}))} style={{ width:80, height:34, fontSize:13, textAlign:'center' }} />
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--mpesa-gray-600)' }}>%</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <button className={`btn btn-primary ${saving?'btn-loading':''}`} onClick={()=>save('Fees')} disabled={saving}>
                {!saving && <><i className="bi bi-check-lg" style={{ marginRight:6 }} />Save Fee Settings</>}
              </button>
            </div>
          </Section>
        )}

        {/* ── SECURITY ── */}
        {activeSection === 'security' && (
          <Section icon="bi-shield-lock-fill" title="Security Settings" color="#E31E24">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <div className="form-group">
                <label className="form-label">Max PIN Attempts</label>
                <select className="form-control" value={security.pin_attempts_max} onChange={e=>setSecurity(p=>({...p,pin_attempts_max:Number(e.target.value)}))}>
                  {[2,3,4,5].map(n=><option key={n} value={n}>{n} attempts</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Session Timeout</label>
                <select className="form-control" value={security.session_timeout} onChange={e=>setSecurity(p=>({...p,session_timeout:Number(e.target.value)}))}>
                  {[15,30,60,120,480].map(n=><option key={n} value={n}>{n} minutes</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">OTP Expiry</label>
                <select className="form-control" value={security.otp_expiry} onChange={e=>setSecurity(p=>({...p,otp_expiry:Number(e.target.value)}))}>
                  {[2,5,10,15].map(n=><option key={n} value={n}>{n} minutes</option>)}
                </select>
              </div>
            </div>
            <ToggleSetting label="Require PIN for Send Money"   value={security.require_pin_send}     onChange={v=>setSecurity(p=>({...p,require_pin_send:v}))}     />
            <ToggleSetting label="Require PIN for Withdrawals"  value={security.require_pin_withdraw} onChange={v=>setSecurity(p=>({...p,require_pin_withdraw:v}))} />
            <ToggleSetting label="Require PIN for Loans"        value={security.require_pin_loans}    onChange={v=>setSecurity(p=>({...p,require_pin_loans:v}))}    />
            <ToggleSetting label="Enable Rate Limiting" description="Block excessive API requests per user" value={security.rate_limit_enabled} onChange={v=>setSecurity(p=>({...p,rate_limit_enabled:v}))} />
            <div style={{ marginTop: 20 }}>
              <button className={`btn btn-primary ${saving?'btn-loading':''}`} onClick={()=>save('Security')} disabled={saving}>
                {!saving && <><i className="bi bi-check-lg" style={{ marginRight:6 }} />Save Security Settings</>}
              </button>
            </div>
          </Section>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeSection === 'notifications' && (
          <Section icon="bi-bell-fill" title="Notification Settings" color="#7C3AED">
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize:12, color:'var(--mpesa-gray-500)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Channels</div>
              <ToggleSetting label="SMS Notifications"   description="Send transaction alerts via SMS"           value={notifications.sms_enabled}   onChange={v=>setNotifications(p=>({...p,sms_enabled:v}))}   />
              <ToggleSetting label="Push Notifications"  description="In-app real-time notifications via WebSocket" value={notifications.push_enabled}  onChange={v=>setNotifications(p=>({...p,push_enabled:v}))}  />
              <ToggleSetting label="Email Notifications" description="Send summary emails to users"              value={notifications.email_enabled} onChange={v=>setNotifications(p=>({...p,email_enabled:v}))} />
            </div>
            <div>
              <div style={{ fontSize:12, color:'var(--mpesa-gray-500)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Triggers</div>
              <ToggleSetting label="Transaction Alerts"       value={notifications.transaction_alerts}         onChange={v=>setNotifications(p=>({...p,transaction_alerts:v}))}         />
              <ToggleSetting label="Login Alerts"             value={notifications.login_alerts}               onChange={v=>setNotifications(p=>({...p,login_alerts:v}))}               />
              <ToggleSetting label="Low Balance Alerts"       value={notifications.balance_threshold_alerts}   onChange={v=>setNotifications(p=>({...p,balance_threshold_alerts:v}))}   />
            </div>
            {notifications.balance_threshold_alerts && (
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Low Balance Threshold (KES)</label>
                <input type="number" className="form-control" value={notifications.balance_threshold} min={0} max={10000}
                  onChange={e=>setNotifications(p=>({...p,balance_threshold:Number(e.target.value)}))} style={{ height:36, fontSize:13 }} />
              </div>
            )}
            <div style={{ marginTop: 20 }}>
              <button className={`btn btn-primary ${saving?'btn-loading':''}`} onClick={()=>save('Notifications')} disabled={saving}>
                {!saving && <><i className="bi bi-check-lg" style={{ marginRight:6 }} />Save Notification Settings</>}
              </button>
            </div>
          </Section>
        )}

      </div>
    </div>
  );
};

export default AdminSettings;