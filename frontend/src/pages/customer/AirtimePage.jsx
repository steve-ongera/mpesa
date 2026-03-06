
// AirtimePage.jsx
export const AirtimePage = ({ onNavigate }) => {
  const { user, mpesaBalance, setMpesaBalance } = useAuth();
  const [target, setTarget] = useState('self');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const quickAmounts = [10, 20, 50, 100, 200, 500];

  const handleBuy = async () => {
    if (pin.length < 4) { setError('Enter PIN'); return; }
    setLoading(true); setError('');
    try {
      const targetPhone = target === 'self' ? user?.phone_number : phone;
      const data = await transactionAPI.buyAirtime({ phone_number: targetPhone, amount: parseFloat(amount), pin });
      setMpesaBalance(data.new_balance);
      setStep(3);
      toast.success('Airtime Purchased!', `KES ${amount} airtime for ${targetPhone}`);
    } catch (err) {
      setError(err.error || 'Failed');
      setStep(2);
    } finally { setLoading(false); setPin(''); }
  };

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <div className="card">
        <div className="card-header">
          <div className="card-title"><i className="bi bi-phone-fill" style={{ color: '#7C3AED', marginRight: 8 }}></i>Buy Airtime</div>
          {step === 2 && <button className="btn btn-ghost btn-sm" onClick={() => { setStep(1); setError(''); }}><i className="bi bi-arrow-left"></i> Back</button>}
        </div>
        <div className="card-body">
          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

          {step === 1 && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {[{ id: 'self', label: '📱 My Number' }, { id: 'other', label: '👤 Other Number' }].map(t => (
                  <button key={t.id} className={`btn ${target === t.id ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1 }} onClick={() => setTarget(t.id)}>{t.label}</button>
                ))}
              </div>
              {target === 'other' && (
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div className="input-group">
                    <i className="bi bi-phone input-prefix"></i>
                    <input type="tel" className="form-control" placeholder="0712345678" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </div>
              )}
              {target === 'self' && (
                <div style={{ background: 'var(--mpesa-gray-50)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="bi bi-phone-fill" style={{ color: 'var(--mpesa-green)', fontSize: 18 }}></i>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>My Number</div>
                    <div style={{ fontSize: 12, color: 'var(--mpesa-gray-500)' }}>{user?.phone_number}</div>
                  </div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Amount (KES)</label>
                <input type="number" className="form-control" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} min={5} max={10000} />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {quickAmounts.map(a => (
                  <button key={a} className="btn btn-ghost btn-sm"
                    style={{ border: '1px solid var(--mpesa-gray-200)', fontWeight: 700, background: amount === String(a) ? 'var(--mpesa-green-pale)' : '' }}
                    onClick={() => setAmount(String(a))}>
                    {a}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--mpesa-gray-400)', marginBottom: 16 }}>Balance: <strong style={{ color: 'var(--mpesa-green)' }}>{formatKES(mpesaBalance || 0)}</strong></div>
              <button className="btn btn-primary btn-full btn-lg"
                onClick={() => { if (!amount || parseFloat(amount) < 5) { setError('Minimum is KES 5'); return; } setError(''); setStep(2); }}>
                Continue <i className="bi bi-arrow-right"></i>
              </button>
            </>
          )}

          {step === 2 && (
            <div style={{ padding: '16px 0' }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: 'var(--mpesa-gray-500)' }}>Buying airtime for</div>
                <div style={{ fontSize: 20, fontWeight: 900 }}>{target === 'self' ? user?.phone_number : phone}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--mpesa-gray-900)', marginTop: 8 }}>{formatKES(amount)}</div>
              </div>
              <PinInput value={pin} onChange={setPin} label="Enter M-PESA PIN" />
              <button className={`btn btn-primary btn-full btn-lg ${loading ? 'btn-loading' : ''}`}
                onClick={handleBuy} disabled={loading || pin.length < 4} style={{ marginTop: 32 }}>
                {!loading && <><i className="bi bi-phone"></i> Buy {formatKES(amount)} Airtime</>}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="success-screen">
              <div className="success-icon">✅</div>
              <div className="success-title">Airtime Sent!</div>
              <div className="success-amount">{formatKES(amount)}</div>
              <div className="success-detail">to {target === 'self' ? user?.phone_number : phone}</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setStep(1); setAmount(''); }}>Buy Again</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onNavigate('/dashboard')}>Done</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
