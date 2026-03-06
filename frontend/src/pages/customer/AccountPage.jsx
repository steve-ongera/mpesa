import React, { useState, useEffect } from 'react';
import { accountAPI, transactionAPI, formatKES, formatDate } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PinInput from '../../components/common/PinInput';
import { toast } from '../../components/common/Toast';

const TABS = [
  { id: 'overview',   label: 'Overview',       icon: 'bi-person-circle'  },
  { id: 'statement',  label: 'Mini Statement',  icon: 'bi-card-list'      },
  { id: 'pin',        label: 'Change PIN',      icon: 'bi-key-fill'       },
  { id: 'language',   label: 'Language',        icon: 'bi-translate'      },
];

const AccountPage = ({ onNavigate }) => {
  const { user, mpesaBalance } = useAuth();

  const [activeTab,     setActiveTab]     = useState('overview');
  const [miniStatement, setMiniStatement] = useState([]);
  const [stmtLoading,   setStmtLoading]   = useState(false);

  // PIN change
  const [oldPin,     setOldPin]     = useState('');
  const [newPin,     setNewPin]     = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError,   setPinError]   = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  // Language
  const [language, setLanguage] = useState(user?.language || 'english');

  // Load mini-statement when tab is opened
  useEffect(() => {
    if (activeTab === 'statement') loadStatement();
  }, [activeTab]);

  const loadStatement = async () => {
    setStmtLoading(true);
    try {
      const data = await transactionAPI.getMiniStatement('mpesa');
      setMiniStatement(data?.transactions || []);
    } catch (e) {
      console.error('Mini statement error:', e);
    } finally {
      setStmtLoading(false);
    }
  };

  const handleTabChange = (id) => {
    setActiveTab(id);
    setPinError('');
    setPinSuccess('');
  };

  /* ── Change PIN ── */
  const handleChangePIN = async () => {
    setPinError('');
    setPinSuccess('');
    if (oldPin.length < 4)          { setPinError('Enter your current PIN'); return; }
    if (newPin.length < 4)          { setPinError('New PIN must be 4 digits'); return; }
    if (newPin !== confirmPin)       { setPinError('New PINs do not match'); return; }
    if (newPin === oldPin)           { setPinError('New PIN cannot be the same as current PIN'); return; }

    setPinLoading(true);
    try {
      await accountAPI.changePIN(oldPin, newPin);
      setPinSuccess('PIN changed successfully');
      setOldPin(''); setNewPin(''); setConfirmPin('');
      toast.success('PIN Changed', 'Your M-PESA PIN has been updated');
    } catch (err) {
      setPinError(err.error || 'Failed to change PIN. Check your current PIN.');
    } finally {
      setPinLoading(false);
    }
  };

  /* ── Change Language ── */
  const handleChangeLanguage = async (lang) => {
    try {
      await accountAPI.changeLanguage(lang);
      setLanguage(lang);
      toast.success(
        'Language Changed',
        lang === 'swahili' ? 'Umebadilisha lugha hadi Kiswahili' : 'Language updated to English'
      );
    } catch (e) {
      toast.error('Error', 'Failed to update language');
    }
  };

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || '?'
    : '?';

  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>

      {/* ── Profile header ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--mpesa-green-dark) 0%, var(--mpesa-green) 100%)',
        borderRadius: 20, padding: 28, color: 'white',
        marginBottom: 24, textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -50, left: 20, width: 120, height: 120, background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />

        {/* Avatar */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          border: '3px solid rgba(255,255,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: 28, fontWeight: 900,
          position: 'relative',
        }}>
          {initials}
        </div>

        <div style={{ fontSize: 22, fontWeight: 900, position: 'relative' }}>
          {user?.first_name} {user?.last_name}
        </div>
        <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4, position: 'relative' }}>
          {user?.phone_number}
        </div>

        {/* Balance */}
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 12, padding: '12px 20px',
          display: 'inline-block', marginTop: 16,
          position: 'relative',
        }}>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>M-PESA Balance</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>{formatKES(mpesaBalance || 0)}</div>
        </div>
      </div>

      {/* ── Tab buttons ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => handleTabChange(tab.id)}
          >
            <i className={`bi ${tab.icon}`} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="card">
        <div className="card-body">

          {/* Overview */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ background: 'var(--mpesa-gray-50)', borderRadius: 12, padding: '4px 16px' }}>
                {[
                  { label: 'Full Name',      value: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Not set' },
                  { label: 'Phone Number',   value: user?.phone_number },
                  { label: 'Email',          value: user?.email || 'Not set' },
                  { label: 'Account Status', value: user?.is_verified ? 'Verified ✅' : 'Pending Verification ⏳' },
                  { label: 'Language',       value: language === 'swahili' ? 'Kiswahili 🇰🇪' : 'English 🇬🇧' },
                  { label: 'Member Since',   value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A' },
                ].map(row => (
                  <div key={row.label} className="confirm-row">
                    <span className="label">{row.label}</span>
                    <span className="value">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Quick links */}
              <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => handleTabChange('pin')}>
                  <i className="bi bi-key" /> Change PIN
                </button>
                <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => handleTabChange('statement')}>
                  <i className="bi bi-card-list" /> Statement
                </button>
              </div>
            </div>
          )}

          {/* Mini Statement */}
          {activeTab === 'statement' && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>
                Last 5 M-PESA Transactions
              </div>

              {stmtLoading ? (
                <div className="loading-spinner" style={{ margin: '24px auto' }} />
              ) : miniStatement.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-text">No transactions yet</div>
                </div>
              ) : (
                <div className="transaction-list">
                  {miniStatement.map(txn => {
                    const isCredit = txn.transaction_type === 'receive_money';
                    return (
                      <div key={txn.id} className="transaction-item">
                        <div className={`txn-icon ${isCredit ? 'receive' : 'send'}`}>
                          <i className={`bi ${isCredit ? 'bi-arrow-down-left' : 'bi-arrow-up-right'}`} />
                        </div>
                        <div className="txn-info">
                          <div className="txn-name">
                            {txn.description || txn.transaction_type.replace(/_/g, ' ')}
                          </div>
                          <div className="txn-date">{formatDate(txn.created_at)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className={`txn-amount ${isCredit ? 'credit' : 'debit'}`}>
                            {isCredit ? '+' : '-'}{formatKES(txn.amount)}
                          </div>
                          <span className={`txn-status ${txn.status}`}>{txn.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button className="btn btn-ghost btn-sm btn-full" style={{ marginTop: 16 }} onClick={loadStatement}>
                <i className="bi bi-arrow-clockwise" /> Refresh
              </button>
            </div>
          )}

          {/* Change PIN */}
          {activeTab === 'pin' && (
            <div>
              <div style={{ color: 'var(--mpesa-gray-500)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                Your PIN must be exactly <strong>4 digits</strong>. Keep it confidential and never share it.
              </div>

              {pinError && (
                <div className="alert alert-error" style={{ marginBottom: 20 }}>
                  <i className="bi bi-exclamation-circle-fill" /> {pinError}
                </div>
              )}
              {pinSuccess && (
                <div className="alert alert-success" style={{ marginBottom: 20 }}>
                  <i className="bi bi-check-circle-fill" /> {pinSuccess}
                </div>
              )}

              <div style={{ marginBottom: 28 }}>
                <PinInput value={oldPin} onChange={setOldPin} label="Current PIN" />
              </div>
              <div style={{ marginBottom: 28 }}>
                <PinInput value={newPin} onChange={setNewPin} label="New PIN" />
              </div>
              <div style={{ marginBottom: 28 }}>
                <PinInput value={confirmPin} onChange={setConfirmPin} label="Confirm New PIN" />
              </div>

              <button
                className={`btn btn-primary btn-full btn-lg ${pinLoading ? 'btn-loading' : ''}`}
                onClick={handleChangePIN}
                disabled={pinLoading || oldPin.length < 4 || newPin.length < 4 || confirmPin.length < 4}
              >
                {!pinLoading && <><i className="bi bi-key-fill" /> Change PIN</>}
              </button>
            </div>
          )}

          {/* Language */}
          {activeTab === 'language' && (
            <div>
              <div style={{ color: 'var(--mpesa-gray-500)', fontSize: 14, marginBottom: 20 }}>
                Select your preferred language for M-PESA messages and notifications.
              </div>

              {[
                { id: 'english', label: 'English',    flag: '🇬🇧', sub: 'All messages in English' },
                { id: 'swahili', label: 'Kiswahili',  flag: '🇰🇪', sub: 'Ujumbe wote kwa Kiswahili' },
              ].map(lang => (
                <div
                  key={lang.id}
                  onClick={() => handleChangeLanguage(lang.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: 18, borderRadius: 12, marginBottom: 12,
                    cursor: 'pointer', transition: 'var(--transition)',
                    border: `2px solid ${language === lang.id ? 'var(--mpesa-green)' : 'var(--mpesa-gray-200)'}`,
                    background: language === lang.id ? 'var(--mpesa-green-pale)' : 'var(--mpesa-white)',
                  }}
                >
                  <div style={{ fontSize: 32 }}>{lang.flag}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{lang.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--mpesa-gray-500)', marginTop: 2 }}>{lang.sub}</div>
                  </div>
                  {language === lang.id && (
                    <i className="bi bi-check-circle-fill" style={{ color: 'var(--mpesa-green)', fontSize: 22 }} />
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AccountPage;