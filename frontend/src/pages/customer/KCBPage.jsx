
// KCBPage.jsx
export const KCBPage = ({ onNavigate }) => {
  const { kcbBalance, mpesaBalance, setKcbBalance, setMpesaBalance } = useAuth();
  const { kcbAPI } = require('../../services/api');
  const [modal, setModal] = useState(null);
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [account, setAccount] = useState({ balance: kcbBalance || 0, loan_limit: 50000, active_loan: 0 });

  const openModal = (type) => { setModal(type); setAmount(''); setPin(''); setError(''); };

  const handleAction = async () => {
    if (pin.length < 4) { setError('Enter PIN'); return; }
    setProcessing(true); setError('');
    try {
      let data;
      if (modal === 'deposit') data = await kcbAPI.deposit({ amount: parseFloat(amount), pin });
      else if (modal === 'withdraw') data = await kcbAPI.withdraw({ amount: parseFloat(amount), pin });
      else data = await kcbAPI.applyLoan({ amount: parseFloat(amount), pin });
      toast.success('KCB M-PESA', data.message?.substring(0, 60) || 'Done');
      setModal(null);
    } catch (err) {
      setError(err.error || 'Failed');
    } finally { setProcessing(false); }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="kcb-card" style={{ marginBottom: 24 }}>
        <div className="account-card-overlay"></div>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏦</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>KCB M-PESA</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>KCB Bank & M-PESA Partnership</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div><div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Balance</div><div style={{ fontSize: 22, fontWeight: 900 }}>{formatKES(kcbBalance || 0)}</div></div>
            <div><div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Loan Limit</div><div style={{ fontSize: 22, fontWeight: 900 }}>{formatKES(50000)}</div></div>
            <div><div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>Active Loan</div><div style={{ fontSize: 22, fontWeight: 900 }}>{formatKES(0)}</div></div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { icon: 'bi-arrow-down-circle-fill', label: 'Deposit', sub: 'From M-PESA', color: '#B91C1C', type: 'deposit' },
          { icon: 'bi-arrow-up-circle-fill', label: 'Withdraw', sub: 'To M-PESA', color: '#059669', type: 'withdraw' },
          { icon: 'bi-credit-card-fill', label: 'Get Loan', sub: 'Up to 50,000', color: '#D97706', type: 'loan' },
        ].map(a => (
          <div key={a.type} className="card" style={{ cursor: 'pointer', textAlign: 'center' }} onClick={() => openModal(a.type)}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}>
            <div className="card-body">
              <div style={{ width: 48, height: 48, borderRadius: 14, background: a.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: a.color, margin: '0 auto 10px' }}>
                <i className={`bi ${a.icon}`}></i>
              </div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{a.label}</div>
              <div style={{ fontSize: 11, color: 'var(--mpesa-gray-400)', marginTop: 2 }}>{a.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle"></div>
            <div className="modal-header">
              <div className="modal-title">
                {modal === 'deposit' && '📥 Deposit to KCB M-PESA'}
                {modal === 'withdraw' && '📤 Withdraw from KCB M-PESA'}
                {modal === 'loan' && '💳 KCB M-PESA Loan'}
              </div>
              <button className="modal-close" onClick={() => setModal(null)}><i className="bi bi-x-lg"></i></button>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
            <div className="form-group">
              <label className="form-label">Amount (KES)</label>
              <input type="number" className="form-control" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} />
              <div className="form-hint">
                {modal === 'deposit' && `M-PESA Balance: ${formatKES(mpesaBalance || 0)}`}
                {modal === 'withdraw' && `KCB Balance: ${formatKES(kcbBalance || 0)}`}
                {modal === 'loan' && 'Loan Limit: KES 50,000'}
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <PinInput value={pin} onChange={setPin} label="Enter M-PESA PIN" />
            </div>
            <button className={`btn btn-primary btn-full ${processing ? 'btn-loading' : ''}`}
              disabled={processing || !amount || pin.length < 4} onClick={handleAction}>
              {!processing && (modal === 'deposit' ? `Deposit ${amount ? formatKES(amount) : ''}` : modal === 'withdraw' ? `Withdraw ${amount ? formatKES(amount) : ''}` : `Apply for Loan`)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
