import React, { useState, useEffect } from 'react';
import { mshwariAPI, dashboardAPI, formatKES } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PinInput from '../../components/common/PinInput';
import { toast } from '../../components/common/Toast';

const MshwariPage = ({ onNavigate }) => {
  const { mshwariBalance, setMshwariBalance, setMpesaBalance, mpesaBalance } = useAuth();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [modal, setModal] = useState(null); // { type, step }
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [lockDate, setLockDate] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [miniStatement, setMiniStatement] = useState([]);

  useEffect(() => {
    loadAccount();
  }, []);

  const loadAccount = async () => {
    try {
      const data = await dashboardAPI.getDashboard();
      setAccount(data.mshwari_account);
      if (data.mshwari_account) setMshwariBalance(data.mshwari_account.balance);
    } catch (e) {} finally { setLoading(false); }
  };

  const loadStatement = async () => {
    const data = await dashboardAPI.getMiniStatement?.('mshwari') || 
      await fetch('/api/mini-statement/?account=mshwari').then(r => r.json());
    setMiniStatement(data?.transactions || []);
  };

  useEffect(() => {
    if (activeTab === 'statement') loadStatement();
  }, [activeTab]);

  const openModal = (type) => {
    setModal(type);
    setAmount('');
    setPin('');
    setError('');
    setLockDate('');
  };

  const closeModal = () => { setModal(null); setError(''); };

  const handleDeposit = async () => {
    setError('');
    if (pin.length < 4) { setError('Enter your PIN'); return; }
    setProcessing(true);
    try {
      const data = await mshwariAPI.deposit({ amount: parseFloat(amount), pin });
      toast.success('M-Shwari', `KES ${parseFloat(amount).toLocaleString()} deposited`);
      setMshwariBalance(data.transaction ? String(parseFloat(mshwariBalance || 0) + parseFloat(amount)) : mshwariBalance);
      setMpesaBalance(data.transaction ? String(parseFloat(mpesaBalance || 0) - parseFloat(amount)) : mpesaBalance);
      loadAccount();
      closeModal();
    } catch (err) {
      setError(err.error || 'Failed');
    } finally { setProcessing(false); }
  };

  const handleWithdraw = async () => {
    setError('');
    if (pin.length < 4) { setError('Enter your PIN'); return; }
    setProcessing(true);
    try {
      await mshwariAPI.withdraw({ amount: parseFloat(amount), pin });
      toast.success('M-Shwari', `KES ${parseFloat(amount).toLocaleString()} withdrawn to M-PESA`);
      loadAccount();
      closeModal();
    } catch (err) {
      setError(err.error || 'Failed');
    } finally { setProcessing(false); }
  };

  const handleLoan = async () => {
    setError('');
    if (pin.length < 4) { setError('Enter your PIN'); return; }
    setProcessing(true);
    try {
      const data = await mshwariAPI.applyLoan({ amount: parseFloat(amount), pin });
      toast.success('Loan Approved!', data.message?.substring(0, 60));
      loadAccount();
      closeModal();
    } catch (err) {
      setError(err.error || 'Loan not approved');
    } finally { setProcessing(false); }
  };

  const handleLock = async () => {
    if (!lockDate) { setError('Select lock date'); return; }
    setProcessing(true);
    try {
      await mshwariAPI.lockSavings({ amount: parseFloat(amount), lock_until: lockDate });
      toast.success('Savings Locked', `KES ${parseFloat(amount).toLocaleString()} locked until ${lockDate}`);
      loadAccount();
      closeModal();
    } catch (err) {
      setError(err.error || 'Failed');
    } finally { setProcessing(false); }
  };

  if (loading) return <div className="loading-spinner"></div>;

  const tabs = ['overview', 'deposit', 'withdraw', 'loan', 'statement'];

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Mshwari header card */}
      <div className="mshwari-card" style={{ marginBottom: 24 }}>
        <div className="account-card-overlay"></div>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 44, height: 44, background: 'rgba(255,255,255,0.15)',
              borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
            }}>🏦</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>M-Shwari</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Save & Borrow with M-PESA</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Balance</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{formatKES(account?.balance || 0)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Locked</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{formatKES(account?.locked_savings || 0)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Active Loan</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{formatKES(account?.active_loan || 0)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { icon: 'bi-arrow-down-circle-fill', label: 'Deposit from M-PESA', color: '#1E40AF', type: 'deposit' },
          { icon: 'bi-arrow-up-circle-fill', label: 'Withdraw to M-PESA', color: '#059669', type: 'withdraw' },
          { icon: 'bi-lock-fill', label: 'Lock Savings', color: '#7C3AED', type: 'lock' },
          { icon: 'bi-credit-card-2-front-fill', label: 'Apply Loan', color: '#D97706', type: 'loan' },
        ].map(action => (
          <div
            key={action.type}
            className="card"
            style={{ cursor: 'pointer', transition: 'var(--transition)' }}
            onClick={() => openModal(action.type)}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}
          >
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, background: action.color + '15',
                borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, color: action.color
              }}>
                <i className={`bi ${action.icon}`}></i>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{action.label}</div>
                <div style={{ fontSize: 12, color: 'var(--mpesa-gray-400)' }}>
                  {action.type === 'deposit' ? `From M-PESA • ${formatKES(mpesaBalance || 0)}` :
                   action.type === 'withdraw' ? `Available: ${formatKES((parseFloat(account?.balance || 0) - parseFloat(account?.locked_savings || 0)))}` :
                   action.type === 'lock' ? 'Earn higher interest' :
                   `Limit: ${formatKES(account?.loan_limit || 0)}`}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Balance & Check */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">
            <i className="bi bi-card-list" style={{ marginRight: 8, color: 'var(--mpesa-green)' }}></i>
            M-Shwari Mini Statement
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab(activeTab === 'statement' ? 'overview' : 'statement')}>
            {activeTab === 'statement' ? 'Hide' : 'View'}
          </button>
        </div>
        {activeTab === 'statement' && (
          <div className="card-body">
            {miniStatement.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <div className="empty-state-text">No M-Shwari transactions yet</div>
              </div>
            ) : miniStatement.map(txn => (
              <div key={txn.id} className="transaction-item">
                <div className={`txn-icon ${txn.transaction_type.includes('deposit') ? 'receive' : 'send'}`}>
                  <i className="bi bi-piggy-bank"></i>
                </div>
                <div className="txn-info">
                  <div className="txn-name">{txn.description || txn.transaction_type.replace(/_/g, ' ')}</div>
                  <div className="txn-date">{new Date(txn.created_at).toLocaleDateString()}</div>
                </div>
                <div className={`txn-amount ${txn.transaction_type.includes('deposit') ? 'credit' : 'debit'}`}>
                  {txn.transaction_type.includes('deposit') ? '+' : '-'}{formatKES(txn.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle"></div>
            <div className="modal-header">
              <div className="modal-title">
                {modal === 'deposit' && '📥 Deposit to M-Shwari'}
                {modal === 'withdraw' && '📤 Withdraw from M-Shwari'}
                {modal === 'loan' && '💰 M-Shwari Loan'}
                {modal === 'lock' && '🔒 Lock Savings'}
              </div>
              <button className="modal-close" onClick={closeModal}><i className="bi bi-x-lg"></i></button>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

            {(modal === 'deposit' || modal === 'withdraw' || modal === 'loan') && (
              <>
                <div className="form-group">
                  <label className="form-label">Amount (KES)</label>
                  <input type="number" className="form-control" placeholder="Enter amount"
                    value={amount} onChange={e => setAmount(e.target.value)} />
                  {modal === 'deposit' && (
                    <div className="form-hint">M-PESA Balance: {formatKES(mpesaBalance || 0)}</div>
                  )}
                  {modal === 'loan' && (
                    <div className="form-hint">Loan Limit: {formatKES(account?.loan_limit || 0)}</div>
                  )}
                </div>
                <div style={{ marginBottom: 24 }}>
                  <PinInput value={pin} onChange={setPin} label="Enter M-PESA PIN" />
                </div>
                <button
                  className={`btn btn-primary btn-full ${processing ? 'btn-loading' : ''}`}
                  disabled={processing || !amount || pin.length < 4}
                  onClick={modal === 'deposit' ? handleDeposit : modal === 'withdraw' ? handleWithdraw : handleLoan}
                >
                  {!processing && (
                    modal === 'deposit' ? `Deposit ${amount ? formatKES(amount) : ''}` :
                    modal === 'withdraw' ? `Withdraw ${amount ? formatKES(amount) : ''}` :
                    `Apply for ${amount ? formatKES(amount) : ''} Loan`
                  )}
                </button>
              </>
            )}

            {modal === 'lock' && (
              <>
                <div className="form-group">
                  <label className="form-label">Amount to Lock (KES)</label>
                  <input type="number" className="form-control" placeholder="Enter amount"
                    value={amount} onChange={e => setAmount(e.target.value)} />
                  <div className="form-hint">Available: {formatKES(account?.balance || 0)}</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Lock Until</label>
                  <input type="date" className="form-control" value={lockDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setLockDate(e.target.value)} />
                </div>
                <button
                  className={`btn btn-primary btn-full ${processing ? 'btn-loading' : ''}`}
                  disabled={processing || !amount || !lockDate}
                  onClick={handleLock}
                >
                  {!processing && `Lock ${amount ? formatKES(amount) : ''}`}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MshwariPage;