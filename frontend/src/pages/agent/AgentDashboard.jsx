import React, { useState, useEffect } from 'react';
import { agentAPI, transactionAPI, formatKES, formatDate } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PinInput from '../../components/common/PinInput';
import { toast } from '../../components/common/Toast';

const AgentDashboard = ({ onNavigate }) => {
  const { user, mpesaBalance } = useAuth();
  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await agentAPI.getDashboard();
      setAgentData(data);
    } catch (e) {} finally { setLoading(false); }
  };

  const openModal = (type) => {
    setModal(type);
    setAmount(''); setPin(''); setPhone(''); setError('');
  };

  const handleWithdraw = async () => {
    setError('');
    if (!phone || !amount || pin.length < 4) { setError('Fill all fields and enter PIN'); return; }
    setProcessing(true);
    try {
      await transactionAPI.withdraw({
        type: 'agent',
        amount: parseFloat(amount),
        agent_number: agentData?.agent?.agent_number || '',
        pin,
      });
      toast.success('Withdrawal Processed', `KES ${parseFloat(amount).toLocaleString()} paid out to ${phone}`);
      setModal(null);
      loadData();
    } catch (err) {
      setError(err.error || 'Withdrawal failed');
    } finally { setProcessing(false); }
  };

  const agent = agentData?.agent;
  const transactions = agentData?.recent_transactions || [];

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div>
      {/* Agent info banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0A1A0A 0%, #1A3020 60%, #0A1A0A 100%)',
        borderRadius: 20, padding: 28, color: 'white', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
      }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.6, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Agent Account</div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>{agent?.business_name || user?.get_full_name || 'Agent'}</div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
            <i className="bi bi-geo-alt" style={{ marginRight: 4 }}></i>{agent?.location || 'Location not set'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>Agent Number</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--mpesa-green)', letterSpacing: 2 }}>
            {agent?.agent_number || 'N/A'}
          </div>
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>{user?.phone_number}</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'M-PESA Float', value: formatKES(agent?.float_balance || 0), icon: '💵', color: '#00A651', bg: '#E8F8EF' },
          { label: 'M-PESA Balance', value: formatKES(mpesaBalance || agentData?.mpesa_balance || 0), icon: '💳', color: '#0369A1', bg: '#E0F2FE' },
          { label: 'Commission Earned', value: formatKES(agent?.commission_earned || 0), icon: '🏆', color: '#D97706', bg: '#FEF9C3' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: 20 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { icon: 'bi-cash-coin', label: 'Process Withdrawal', sub: 'Help customer withdraw', color: '#00A651', type: 'withdraw' },
          { icon: 'bi-arrow-down-circle-fill', label: 'Receive Float', sub: 'Top up float balance', color: '#0369A1', type: 'float' },
          { icon: 'bi-graph-up-arrow', label: 'View Transactions', sub: 'Transaction history', color: '#7C3AED', type: 'transactions' },
          { icon: 'bi-person-circle', label: 'Customer Lookup', sub: 'Find customer account', color: '#D97706', type: 'lookup' },
        ].map(a => (
          <div
            key={a.type}
            className="card"
            style={{ cursor: 'pointer' }}
            onClick={() => a.type === 'transactions' ? setActiveTab('transactions') : openModal(a.type)}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}
          >
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, background: a.color + '15',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, color: a.color, flexShrink: 0
              }}>
                <i className={`bi ${a.icon}`}></i>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{a.label}</div>
                <div style={{ fontSize: 12, color: 'var(--mpesa-gray-400)' }}>{a.sub}</div>
              </div>
              <i className="bi bi-chevron-right" style={{ marginLeft: 'auto', color: 'var(--mpesa-gray-300)', fontSize: 12 }}></i>
            </div>
          </div>
        ))}
      </div>

      {/* Transactions tab */}
      {activeTab === 'transactions' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Agent Transactions</div>
            <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('overview')}>
              <i className="bi bi-x"></i> Close
            </button>
          </div>
          <div className="card-body p-0" style={{ padding: '0 20px' }}>
            {transactions.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-text">No transactions yet</div></div>
            ) : transactions.map(txn => (
              <div key={txn.id} className="transaction-item">
                <div className="txn-icon withdraw"><i className="bi bi-cash"></i></div>
                <div className="txn-info">
                  <div className="txn-name">{txn.description}</div>
                  <div className="txn-date">{formatDate(txn.created_at)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="txn-amount debit">{formatKES(txn.amount)}</div>
                  <span className={`txn-status ${txn.status}`}>{txn.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {modal === 'withdraw' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle"></div>
            <div className="modal-header">
              <div className="modal-title">💵 Process Withdrawal</div>
              <button className="modal-close" onClick={() => setModal(null)}><i className="bi bi-x-lg"></i></button>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            <div className="form-group">
              <label className="form-label">Customer Phone Number</label>
              <div className="input-group">
                <i className="bi bi-phone input-prefix"></i>
                <input type="tel" className="form-control" placeholder="0712345678" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (KES)</label>
              <input type="number" className="form-control" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} />
              <div className="form-hint">Available Float: {formatKES(agent?.float_balance || 0)}</div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <PinInput value={pin} onChange={setPin} label="Your M-PESA Agent PIN" />
            </div>
            <button
              className={`btn btn-primary btn-full ${processing ? 'btn-loading' : ''}`}
              disabled={processing || !phone || !amount || pin.length < 4}
              onClick={handleWithdraw}
            >
              {!processing && <><i className="bi bi-cash-coin"></i> Process Withdrawal</>}
            </button>
          </div>
        </div>
      )}

      {modal === 'float' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle"></div>
            <div className="modal-header">
              <div className="modal-title">📥 Receive Float</div>
              <button className="modal-close" onClick={() => setModal(null)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Float Top-Up</div>
              <p style={{ color: 'var(--mpesa-gray-500)', fontSize: 14, lineHeight: 1.7 }}>
                To receive float, request your Safaricom distributor to send float to your agent number:
              </p>
              <div style={{
                background: 'var(--mpesa-green-pale)', borderRadius: 12,
                padding: '16px 24px', margin: '16px 0',
                fontSize: 28, fontWeight: 900, color: 'var(--mpesa-green-dark)',
                letterSpacing: 3
              }}>
                {agent?.agent_number || 'N/A'}
              </div>
              <p style={{ color: 'var(--mpesa-gray-400)', fontSize: 12 }}>
                Or dial *234# and select Float → Receive Float
              </p>
            </div>
            <button className="btn btn-outline btn-full" onClick={() => setModal(null)}>Close</button>
          </div>
        </div>
      )}

      {modal === 'lookup' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle"></div>
            <div className="modal-header">
              <div className="modal-title">🔍 Customer Lookup</div>
              <button className="modal-close" onClick={() => setModal(null)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="form-group">
              <label className="form-label">Customer Phone Number</label>
              <div className="input-group">
                <i className="bi bi-search input-prefix"></i>
                <input type="tel" className="form-control" placeholder="0712345678"
                  value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </div>
            <button className="btn btn-primary btn-full" onClick={() => toast.info('Lookup', 'Customer verification requires M-PESA backend integration')}>
              <i className="bi bi-search"></i> Search Customer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;