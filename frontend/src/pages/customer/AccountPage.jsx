
// AccountPage.jsx
export const AccountPage = ({ onNavigate }) => {
  const { user, mpesaBalance } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [language, setLanguage] = useState(user?.language || 'english');
  const [loading, setLoading] = useState(false);
  const [miniStatement, setMiniStatement] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { accountAPI, transactionAPI, formatDate } = require('../../services/api');

  useEffect(() => {
    if (activeTab === 'statement') loadStatement();
  }, [activeTab]);

  const loadStatement = async () => {
    try {
      const data = await transactionAPI.getMiniStatement('mpesa');
      setMiniStatement(data.transactions || []);
    } catch (e) {}
  };

  const handleChangePIN = async () => {
    setError(''); setSuccess('');
    if (oldPin.length < 4 || newPin.length < 4) { setError('PINs must be 4 digits'); return; }
    if (newPin !== confirmPin) { setError('New PINs do not match'); return; }
    setLoading(true);
    try {
      await accountAPI.changePIN(oldPin, newPin);
      setSuccess('PIN changed successfully');
      setOldPin(''); setNewPin(''); setConfirmPin('');
    } catch (err) {
      setError(err.error || 'Failed to change PIN');
    } finally { setLoading(false); }
  };

  const handleChangeLanguage = async (lang) => {
    try {
      await accountAPI.changeLanguage(lang);
      setLanguage(lang);
      toast.success('Language Changed', lang === 'swahili' ? 'Umebadilisha lugha' : 'Language updated to English');
    } catch (e) {}
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'bi-person-circle' },
    { id: 'statement', label: 'Mini Statement', icon: 'bi-card-list' },
    { id: 'pin', label: 'Change PIN', icon: 'bi-key-fill' },
    { id: 'language', label: 'Language', icon: 'bi-translate' },
  ];

  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      {/* Profile header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--mpesa-green-dark) 0%, var(--mpesa-green) 100%)',
        borderRadius: 20, padding: 28, color: 'white', marginBottom: 24, textAlign: 'center'
      }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 30, fontWeight: 900 }}>
          {user?.first_name?.[0] || '?'}
        </div>
        <div style={{ fontSize: 20, fontWeight: 900 }}>{user?.first_name} {user?.last_name}</div>
        <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>{user?.phone_number}</div>
        <div style={{ fontSize: 20, fontWeight: 900, marginTop: 12 }}>{formatKES(mpesaBalance || 0)}</div>
        <div style={{ fontSize: 11, opacity: 0.7 }}>M-PESA Balance</div>
      </div>

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button key={tab.id}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}>
            <i className={`bi ${tab.icon}`}></i> {tab.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-body">
          {/* Overview */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ background: 'var(--mpesa-gray-50)', borderRadius: 12, padding: '4px 16px', marginBottom: 16 }}>
                {[
                  { label: 'Full Name', value: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Not set' },
                  { label: 'Phone Number', value: user?.phone_number },
                  { label: 'Account Status', value: user?.is_verified ? 'Verified ✅' : 'Pending Verification' },
                  { label: 'Language', value: user?.language === 'swahili' ? 'Kiswahili' : 'English' },
                  { label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long' }) : 'N/A' },
                ].map(row => (
                  <div key={row.label} className="confirm-row">
                    <span className="label">{row.label}</span>
                    <span className="value">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mini Statement */}
          {activeTab === 'statement' && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Last 5 Transactions</div>
              {miniStatement.length === 0 ? (
                <div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-text">No transactions yet</div></div>
              ) : miniStatement.map(txn => (
                <div key={txn.id} className="transaction-item">
                  <div className="txn-icon send"><i className="bi bi-arrow-left-right"></i></div>
                  <div className="txn-info">
                    <div className="txn-name">{txn.description || txn.transaction_type.replace(/_/g, ' ')}</div>
                    <div className="txn-date">{formatDate(txn.created_at)}</div>
                  </div>
                  <div className="txn-amount debit">{formatKES(txn.amount)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Change PIN */}
          {activeTab === 'pin' && (
            <div>
              {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
              {success && <div className="alert alert-success" style={{ marginBottom: 16 }}><i className="bi bi-check-circle-fill"></i> {success}</div>}
              <div style={{ marginBottom: 24 }}>
                <PinInput value={oldPin} onChange={setOldPin} label="Current PIN" />
              </div>
              <div style={{ marginBottom: 24 }}>
                <PinInput value={newPin} onChange={setNewPin} label="New PIN" />
              </div>
              <div style={{ marginBottom: 24 }}>
                <PinInput value={confirmPin} onChange={setConfirmPin} label="Confirm New PIN" />
              </div>
              <button className={`btn btn-primary btn-full ${loading ? 'btn-loading' : ''}`}
                onClick={handleChangePIN} disabled={loading}>
                {!loading && <><i className="bi bi-key-fill"></i> Change PIN</>}
              </button>
            </div>
          )}

          {/* Language */}
          {activeTab === 'language' && (
            <div>
              <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--mpesa-gray-500)' }}>
                Select your preferred language for M-PESA messages and notifications.
              </div>
              {[
                { id: 'english', label: 'English', flag: '🇬🇧', sub: 'All messages in English' },
                { id: 'swahili', label: 'Kiswahili', flag: '🇰🇪', sub: 'Ujumbe wote kwa Kiswahili' },
              ].map(lang => (
                <div key={lang.id}
                  onClick={() => handleChangeLanguage(lang.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: 16, borderRadius: 12, marginBottom: 10, cursor: 'pointer',
                    border: `2px solid ${language === lang.id ? 'var(--mpesa-green)' : 'var(--mpesa-gray-200)'}`,
                    background: language === lang.id ? 'var(--mpesa-green-pale)' : 'transparent',
                    transition: 'var(--transition)'
                  }}>
                  <div style={{ fontSize: 28 }}>{lang.flag}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{lang.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--mpesa-gray-500)' }}>{lang.sub}</div>
                  </div>
                  {language === lang.id && <i className="bi bi-check-circle-fill" style={{ color: 'var(--mpesa-green)', fontSize: 20 }}></i>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};