import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI, transactionAPI, formatKES, formatDate, getTxnIcon } from '../../services/api';
import TransactionModal from '../../components/common/TransactionModal';

const CustomerDashboard = ({ onNavigate }) => {
  const { user, mpesaBalance, mshwariBalance, kcbBalance, setMpesaBalance } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);
  const [selectedTxn, setSelectedTxn] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await dashboardAPI.getDashboard();
      setDashboard(data);
      if (data.mpesa_account?.balance) setMpesaBalance(data.mpesa_account.balance);
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { icon: 'bi-arrow-up-circle-fill', label: 'Send Money', path: '/send-money', bg: '#00A651' },
    { icon: 'bi-cash-coin', label: 'Withdraw', path: '/withdraw', bg: '#E31E24' },
    { icon: 'bi-phone-fill', label: 'Buy Airtime', path: '/airtime', bg: '#7C3AED' },
    { icon: 'bi-receipt-cutoff', label: 'Paybill', path: '/lipa', bg: '#0369A1' },
    { icon: 'bi-bag-fill', label: 'Buy Goods', path: '/lipa?tab=goods', bg: '#D97706' },
    { icon: 'bi-shop', label: 'Pochi', path: '/lipa?tab=pochi', bg: '#059669' },
    { icon: 'bi-piggy-bank-fill', label: 'M-Shwari', path: '/mshwari', bg: '#1E40AF' },
    { icon: 'bi-building-fill', label: 'KCB', path: '/kcb', bg: '#B91C1C' },
  ];

  const getTxnTypeClass = (type) => {
    if (['receive_money', 'mshwari_withdraw', 'kcb_withdraw'].includes(type)) return 'receive';
    if (['mshwari_deposit', 'kcb_deposit', 'buy_airtime', 'paybill', 'buy_goods'].includes(type)) return 'send';
    return 'send';
  };

  const isCredit = (txn) => txn.receiver?.id === user?.id || 
    ['mshwari_withdraw', 'kcb_withdraw'].includes(txn.transaction_type);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const balance = mpesaBalance || dashboard?.mpesa_account?.balance || '0.00';
  const transactions = dashboard?.recent_transactions || [];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Main column */}
        <div>
          {/* M-PESA Balance Card */}
          <div className="balance-card" style={{ marginBottom: 24 }}>
            <button className="balance-toggle" onClick={() => setShowBalance(!showBalance)}>
              <i className={`bi ${showBalance ? 'bi-eye-slash' : 'bi-eye'}`}></i>
            </button>
            <div className="balance-label">M-PESA Balance</div>
            <div className="balance-amount">
              <span className="balance-currency">KES</span>
              {showBalance
                ? parseFloat(balance).toLocaleString('en-KE', { minimumFractionDigits: 2 })
                : '••••••'
              }
            </div>
            <div className="balance-phone">
              <i className="bi bi-phone" style={{ marginRight: 6 }}></i>
              {user?.phone_number}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, position: 'relative', zIndex: 1 }}>
              <button
                className="btn btn-sm"
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', flex: 1 }}
                onClick={() => onNavigate('/send-money')}
              >
                <i className="bi bi-arrow-up-right"></i> Send
              </button>
              <button
                className="btn btn-sm"
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', flex: 1 }}
                onClick={() => onNavigate('/withdraw')}
              >
                <i className="bi bi-cash"></i> Withdraw
              </button>
            </div>
          </div>

          {/* Secondary accounts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div className="mshwari-card" onClick={() => onNavigate('/mshwari')} style={{ cursor: 'pointer' }}>
              <div className="account-card-overlay"></div>
              <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, position: 'relative' }}>M-Shwari</div>
              <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6, marginBottom: 4, position: 'relative' }}>
                {showBalance ? formatKES(mshwariBalance || dashboard?.mshwari_account?.balance || 0) : 'KES ••••'}
              </div>
              <div style={{ fontSize: 11, opacity: 0.7, position: 'relative' }}>
                Loan: {formatKES(dashboard?.mshwari_account?.active_loan || 0)}
              </div>
            </div>
            <div className="kcb-card" onClick={() => onNavigate('/kcb')} style={{ cursor: 'pointer' }}>
              <div className="account-card-overlay"></div>
              <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, position: 'relative' }}>KCB M-PESA</div>
              <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6, marginBottom: 4, position: 'relative' }}>
                {showBalance ? formatKES(kcbBalance || dashboard?.kcb_account?.balance || 0) : 'KES ••••'}
              </div>
              <div style={{ fontSize: 11, opacity: 0.7, position: 'relative' }}>
                Loan Limit: {formatKES(dashboard?.kcb_account?.loan_limit || 50000)}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <div className="card-title">Quick Actions</div>
            </div>
            <div className="card-body">
              <div className="quick-actions">
                {quickActions.map(action => (
                  <div
                    key={action.path}
                    className="quick-action"
                    onClick={() => onNavigate(action.path)}
                  >
                    <div className="quick-action-icon" style={{ background: action.bg }}>
                      <i className={`bi ${action.icon}`}></i>
                    </div>
                    <span className="quick-action-label">{action.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent Transactions</div>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('/account')}>
                View All <i className="bi bi-arrow-right"></i>
              </button>
            </div>
            <div className="card-body p-0">
              {transactions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">💸</div>
                  <div className="empty-state-text">No transactions yet</div>
                </div>
              ) : (
                <div className="transaction-list" style={{ padding: '0 20px' }}>
                  {transactions.map(txn => {
                    const credit = isCredit(txn);
                    return (
                      <div key={txn.id} className="transaction-item" onClick={() => setSelectedTxn(txn)}>
                        <div className={`txn-icon ${getTxnTypeClass(txn.transaction_type)}`}>
                          <i className={`bi ${getTxnIcon(txn.transaction_type)}`}></i>
                        </div>
                        <div className="txn-info">
                          <div className="txn-name">{txn.description || txn.transaction_type.replace(/_/g, ' ')}</div>
                          <div className="txn-date">{formatDate(txn.created_at)}</div>
                        </div>
                        <div>
                          <div className={`txn-amount ${credit ? 'credit' : 'debit'}`}>
                            {credit ? '+' : '-'}{formatKES(txn.amount)}
                          </div>
                          <div style={{ textAlign: 'right', marginTop: 4 }}>
                            <span className={`txn-status ${txn.status}`}>{txn.status}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div>
          {/* Greeting card */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body" style={{ textAlign: 'center', padding: '28px 20px' }}>
              <div style={{
                width: 60, height: 60, background: 'var(--mpesa-green)',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 16px',
                fontSize: 24, fontWeight: 900, color: 'white'
              }}>
                {user?.first_name?.[0] || '?'}
              </div>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
                {user?.first_name ? `Hello, ${user.first_name}!` : 'Welcome!'}
              </div>
              <div style={{ color: 'var(--mpesa-gray-500)', fontSize: 13 }}>
                {user?.phone_number}
              </div>
              <div className="badge badge-green" style={{ marginTop: 12 }}>
                <i className="bi bi-shield-check" style={{ marginRight: 4 }}></i>
                Verified Account
              </div>
            </div>
          </div>

          {/* My Account shortcuts */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">My Account</div>
            </div>
            <div style={{ padding: '8px 12px 12px' }}>
              {[
                { icon: 'bi-card-list', label: 'Mini Statement', onClick: () => onNavigate('/account?tab=statement') },
                { icon: 'bi-key', label: 'Change PIN', onClick: () => onNavigate('/account?tab=pin') },
                { icon: 'bi-translate', label: 'Change Language', onClick: () => onNavigate('/account?tab=language') },
                { icon: 'bi-wallet2', label: 'Check Balance', onClick: loadDashboard },
              ].map(item => (
                <div
                  key={item.label}
                  onClick={item.onClick}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 8px', cursor: 'pointer', borderRadius: 8,
                    transition: 'var(--transition)', fontSize: 14, fontWeight: 600
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--mpesa-gray-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 34, height: 34, background: 'var(--mpesa-green-pale)',
                    borderRadius: 8, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'var(--mpesa-green)', fontSize: 16
                  }}>
                    <i className={`bi ${item.icon}`}></i>
                  </div>
                  {item.label}
                  <i className="bi bi-chevron-right" style={{ marginLeft: 'auto', color: 'var(--mpesa-gray-300)', fontSize: 12 }}></i>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedTxn && <TransactionModal transaction={selectedTxn} onClose={() => setSelectedTxn(null)} />}
    </div>
  );
};

export default CustomerDashboard;