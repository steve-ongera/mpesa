import React, { useState } from 'react';
import { transactionAPI, formatKES } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PinInput from '../../components/common/PinInput';
import { toast } from '../../components/common/Toast';

const CHARGES = [
  { min: 1, max: 100, charge: 0 },
  { min: 101, max: 500, charge: 7 },
  { min: 501, max: 1000, charge: 13 },
  { min: 1001, max: 1500, charge: 23 },
  { min: 1501, max: 2500, charge: 33 },
  { min: 2501, max: 3500, charge: 53 },
  { min: 3501, max: 5000, charge: 57 },
  { min: 5001, max: 7500, charge: 78 },
  { min: 7501, max: 10000, charge: 90 },
  { min: 10001, max: 15000, charge: 100 },
  { min: 15001, max: 20000, charge: 105 },
  { min: 20001, max: 70000, charge: 108 },
];

function getCharge(amount) {
  const row = CHARGES.find(r => amount >= r.min && amount <= r.max);
  return row ? row.charge : 108;
}

const STEPS = { ENTER: 1, CONFIRM: 2, PIN: 3, SUCCESS: 4 };

const SendMoneyPage = ({ onNavigate }) => {
  const { mpesaBalance, setMpesaBalance } = useAuth();
  const [step, setStep] = useState(STEPS.ENTER);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const charge = amount ? getCharge(parseFloat(amount)) : 0;
  const total = amount ? parseFloat(amount) + charge : 0;

  const handleConfirm = () => {
    setError('');
    if (!phone || phone.length < 10) { setError('Enter a valid phone number'); return; }
    if (!amount || parseFloat(amount) < 1) { setError('Minimum amount is KES 1'); return; }
    setStep(STEPS.CONFIRM);
  };

  const handlePinSubmit = async () => {
    if (pin.length < 4) { setError('Enter 4-digit PIN'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await transactionAPI.sendMoney({
        receiver_phone: phone,
        amount: parseFloat(amount),
        pin,
      });
      setResult(data);
      setMpesaBalance(data.new_balance);
      setStep(STEPS.SUCCESS);
      toast.success('Money Sent!', `KES ${parseFloat(amount).toLocaleString()} sent to ${phone}`);
    } catch (err) {
      setError(err.error || 'Transaction failed');
      setStep(STEPS.CONFIRM);
    } finally {
      setLoading(false);
      setPin('');
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="bi bi-arrow-up-right-circle-fill" style={{ color: 'var(--mpesa-green)', marginRight: 8 }}></i>
            Send Money
          </div>
          {step > 1 && step < 4 && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setStep(step - 1); setError(''); }}>
              <i className="bi bi-arrow-left"></i> Back
            </button>
          )}
        </div>

        <div className="card-body">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <i className="bi bi-exclamation-circle-fill"></i> {error}
            </div>
          )}

          {/* Step 1: Enter details */}
          {step === STEPS.ENTER && (
            <>
              <div className="form-group">
                <label className="form-label">Recipient Phone Number</label>
                <div className="input-group">
                  <i className="bi bi-phone input-prefix"></i>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="e.g. 0712345678"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Amount (KES)</label>
                <div className="input-group">
                  <span className="input-prefix" style={{ fontWeight: 700, color: 'var(--mpesa-gray-700)' }}>KES</span>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    min={1}
                    max={70000}
                  />
                </div>
              </div>

              {/* Quick amounts */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {[100, 200, 500, 1000, 2000, 5000].map(a => (
                  <button
                    key={a}
                    className="btn btn-ghost btn-sm"
                    style={{ border: '1px solid var(--mpesa-gray-200)', fontWeight: 700 }}
                    onClick={() => setAmount(String(a))}
                  >
                    {a.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Charge preview */}
              {amount > 0 && (
                <div style={{
                  background: 'var(--mpesa-gray-50)', borderRadius: 10,
                  padding: '14px 16px', marginBottom: 20
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: 'var(--mpesa-gray-500)' }}>Amount</span>
                    <span style={{ fontWeight: 700 }}>{formatKES(amount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: 'var(--mpesa-gray-500)' }}>Transaction Cost</span>
                    <span style={{ fontWeight: 700 }}>{formatKES(charge)}</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--mpesa-gray-200)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800 }}>Total Deducted</span>
                    <span style={{ fontWeight: 900, color: 'var(--mpesa-green)', fontSize: 16 }}>{formatKES(total)}</span>
                  </div>
                </div>
              )}

              <div style={{ fontSize: 12, color: 'var(--mpesa-gray-400)', marginBottom: 20 }}>
                Available Balance: <strong style={{ color: 'var(--mpesa-green)' }}>{formatKES(mpesaBalance || 0)}</strong>
              </div>

              <button className="btn btn-primary btn-full btn-lg" onClick={handleConfirm}>
                Continue <i className="bi bi-arrow-right"></i>
              </button>
            </>
          )}

          {/* Step 2: Confirm */}
          {step === STEPS.CONFIRM && (
            <>
              <div style={{
                background: 'var(--mpesa-gray-50)', borderRadius: 12,
                padding: '20px 16px', marginBottom: 24
              }}>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: 'var(--mpesa-gray-500)', fontWeight: 600 }}>You're sending</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--mpesa-gray-900)' }}>{formatKES(amount)}</div>
                </div>
                <div className="confirm-row">
                  <span className="label">To</span>
                  <span className="value">{phone}</span>
                </div>
                <div className="confirm-row">
                  <span className="label">Transaction Cost</span>
                  <span className="value">{formatKES(charge)}</span>
                </div>
                <div className="confirm-row">
                  <span className="label" style={{ fontWeight: 800 }}>Total</span>
                  <span className="value total">{formatKES(total)}</span>
                </div>
              </div>
              <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep(STEPS.PIN)}>
                <i className="bi bi-shield-lock"></i> Enter PIN to Confirm
              </button>
            </>
          )}

          {/* Step 3: PIN */}
          {step === STEPS.PIN && (
            <div style={{ padding: '16px 0' }}>
              <PinInput value={pin} onChange={setPin} label="Enter M-PESA PIN" />
              <button
                className={`btn btn-primary btn-full btn-lg ${loading ? 'btn-loading' : ''}`}
                onClick={handlePinSubmit}
                disabled={loading || pin.length < 4}
                style={{ marginTop: 32 }}
              >
                {!loading && <><i className="bi bi-send-fill"></i> Send {formatKES(amount)}</>}
              </button>
            </div>
          )}

          {/* Step 4: Success */}
          {step === STEPS.SUCCESS && result && (
            <div className="success-screen">
              <div className="success-icon">✅</div>
              <div className="success-title">Money Sent!</div>
              <div className="success-amount">{formatKES(amount)}</div>
              <div className="success-detail">Sent to <strong>{phone}</strong></div>
              <div style={{ fontSize: 12, color: 'var(--mpesa-gray-400)', marginTop: 8 }}>
                Ref: {result.transaction?.transaction_id}
              </div>
              <div style={{ background: 'var(--mpesa-green-pale)', borderRadius: 10, padding: '10px 16px', marginTop: 16, fontSize: 13, color: 'var(--mpesa-green-dark)' }}>
                New Balance: <strong>{formatKES(result.new_balance)}</strong>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setStep(STEPS.ENTER); setPhone(''); setAmount(''); setResult(null); }}>
                  Send Again
                </button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onNavigate('/dashboard')}>
                  Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendMoneyPage;