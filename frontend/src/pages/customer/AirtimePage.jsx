import React, { useState } from 'react';
import { transactionAPI, formatKES } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PinInput from '../../components/common/PinInput';
import { toast } from '../../components/common/Toast';

const STEPS = { ENTER: 1, PIN: 2, SUCCESS: 3 };

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500, 1000];

const AirtimePage = ({ onNavigate }) => {
  const { user, mpesaBalance, setMpesaBalance } = useAuth();

  const [step, setStep]       = useState(STEPS.ENTER);
  const [target, setTarget]   = useState('self'); // 'self' | 'other'
  const [phone, setPhone]     = useState('');
  const [amount, setAmount]   = useState('');
  const [pin, setPin]         = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const recipientPhone = target === 'self' ? user?.phone_number : phone;

  const handleContinue = () => {
    setError('');
    if (target === 'other' && (!phone || phone.trim().length < 10)) {
      setError('Enter a valid phone number');
      return;
    }
    if (!amount || parseFloat(amount) < 5) {
      setError('Minimum airtime amount is KES 5');
      return;
    }
    if (parseFloat(amount) > 10000) {
      setError('Maximum airtime amount is KES 10,000');
      return;
    }
    setStep(STEPS.PIN);
  };

  const handleBuy = async () => {
    if (pin.length < 4) { setError('Enter your 4-digit PIN'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await transactionAPI.buyAirtime({
        phone_number: recipientPhone,
        amount: parseFloat(amount),
        pin,
      });
      setMpesaBalance(data.new_balance);
      setStep(STEPS.SUCCESS);
      toast.success('Airtime Purchased!', `KES ${parseFloat(amount).toLocaleString()} sent to ${recipientPhone}`);
    } catch (err) {
      setError(err.error || 'Failed to buy airtime. Please try again.');
      setStep(STEPS.ENTER);
    } finally {
      setLoading(false);
      setPin('');
    }
  };

  const handleReset = () => {
    setStep(STEPS.ENTER);
    setAmount('');
    setPhone('');
    setError('');
  };

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <div className="card">

        {/* ── Header ── */}
        <div className="card-header">
          <div className="card-title">
            <i className="bi bi-phone-fill" style={{ color: '#7C3AED', marginRight: 8 }} />
            Buy Airtime
          </div>
          {step === STEPS.PIN && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setStep(STEPS.ENTER); setError(''); setPin(''); }}>
              <i className="bi bi-arrow-left" /> Back
            </button>
          )}
        </div>

        <div className="card-body">

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              <i className="bi bi-exclamation-circle-fill" /> {error}
            </div>
          )}

          {/* ── Step 1: Enter details ── */}
          {step === STEPS.ENTER && (
            <>
              {/* Target toggle */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {[
                  { id: 'self',  label: '📱 My Number'    },
                  { id: 'other', label: '👤 Other Number' },
                ].map(t => (
                  <button
                    key={t.id}
                    className={`btn ${target === t.id ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                    onClick={() => { setTarget(t.id); setPhone(''); setError(''); }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Self — show current number as read-only */}
              {target === 'self' && (
                <div style={{
                  background: 'var(--mpesa-green-pale)',
                  border: '1px solid rgba(0,166,81,0.2)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: 'var(--mpesa-green)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 18,
                  }}>
                    <i className="bi bi-phone-fill" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--mpesa-green-dark)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      My Number
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--mpesa-gray-900)' }}>
                      {user?.phone_number}
                    </div>
                  </div>
                </div>
              )}

              {/* Other — phone input */}
              {target === 'other' && (
                <div className="form-group">
                  <label className="form-label">Recipient Phone Number</label>
                  <div className="input-group">
                    <i className="bi bi-phone input-prefix" />
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="e.g. 0712345678"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Amount */}
              <div className="form-group">
                <label className="form-label">Amount (KES)</label>
                <div className="input-group">
                  <span className="input-prefix" style={{ fontWeight: 700, color: 'var(--mpesa-gray-700)' }}>KES</span>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0"
                    min={5}
                    max={10000}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Quick amounts */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {QUICK_AMOUNTS.map(a => (
                  <button
                    key={a}
                    className="btn btn-ghost btn-sm"
                    style={{
                      border: '1px solid var(--mpesa-gray-200)',
                      fontWeight: 700,
                      background: amount === String(a) ? 'var(--mpesa-green-pale)' : '',
                      borderColor: amount === String(a) ? 'var(--mpesa-green)' : '',
                    }}
                    onClick={() => setAmount(String(a))}
                  >
                    {a}
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 12, color: 'var(--mpesa-gray-400)', marginBottom: 20 }}>
                Available Balance:{' '}
                <strong style={{ color: 'var(--mpesa-green)' }}>
                  {formatKES(mpesaBalance || 0)}
                </strong>
              </div>

              <button className="btn btn-primary btn-full btn-lg" onClick={handleContinue}>
                Continue <i className="bi bi-arrow-right" />
              </button>
            </>
          )}

          {/* ── Step 2: PIN ── */}
          {step === STEPS.PIN && (
            <div style={{ padding: '16px 0' }}>
              {/* Summary */}
              <div style={{
                background: 'var(--mpesa-gray-50)', borderRadius: 12,
                padding: '20px 16px', marginBottom: 28, textAlign: 'center',
              }}>
                <div style={{ fontSize: 13, color: 'var(--mpesa-gray-500)', marginBottom: 4 }}>
                  Buying airtime for
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
                  {recipientPhone}
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--mpesa-gray-900)' }}>
                  {formatKES(amount)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--mpesa-green)', fontWeight: 700, marginTop: 6 }}>
                  No transaction charge
                </div>
              </div>

              <PinInput value={pin} onChange={setPin} label="Enter M-PESA PIN" />

              <button
                className={`btn btn-primary btn-full btn-lg ${loading ? 'btn-loading' : ''}`}
                onClick={handleBuy}
                disabled={loading || pin.length < 4}
                style={{ marginTop: 32 }}
              >
                {!loading && (
                  <><i className="bi bi-phone" /> Buy {formatKES(amount)} Airtime</>
                )}
              </button>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === STEPS.SUCCESS && (
            <div className="success-screen">
              <div className="success-icon">✅</div>
              <div className="success-title">Airtime Sent!</div>
              <div className="success-amount">{formatKES(amount)}</div>
              <div className="success-detail">
                to <strong>{recipientPhone}</strong>
              </div>
              <div style={{
                background: 'var(--mpesa-green-pale)', borderRadius: 10,
                padding: '10px 16px', marginTop: 16,
                fontSize: 13, color: 'var(--mpesa-green-dark)',
              }}>
                New Balance: <strong>{formatKES(mpesaBalance || 0)}</strong>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={handleReset}>
                  Buy Again
                </button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onNavigate('/dashboard')}>
                  Done
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AirtimePage;