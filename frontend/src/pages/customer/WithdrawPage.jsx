// WithdrawPage.jsx
import React, { useState } from 'react';
import { transactionAPI, formatKES } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PinInput from '../../components/common/PinInput';
import { toast } from '../../components/common/Toast';

const STEPS = { ENTER: 1, CONFIRM: 2, PIN: 3, SUCCESS: 4 };

export const WithdrawPage = ({ onNavigate }) => {
  const { mpesaBalance, setMpesaBalance } = useAuth();
  const [step, setStep] = useState(STEPS.ENTER);
  const [type, setType] = useState('agent');
  const [agentNumber, setAgentNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const getCharge = (amt) => {
    const a = parseFloat(amt);
    if (a <= 100) return 10; if (a <= 2500) return 29; if (a <= 3500) return 52;
    if (a <= 5000) return 69; if (a <= 7500) return 87; if (a <= 10000) return 97;
    if (a <= 15000) return 107; return 147;
  };

  const charge = amount ? getCharge(amount) : 0;
  const total = amount ? parseFloat(amount) + charge : 0;

  const handleSubmit = async () => {
    if (pin.length < 4) { setError('Enter PIN'); return; }
    setLoading(true); setError('');
    try {
      const data = await transactionAPI.withdraw({ type, agent_number: agentNumber, amount: parseFloat(amount), pin });
      setResult(data);
      setMpesaBalance(data.new_balance);
      setStep(STEPS.SUCCESS);
      toast.success('Withdrawal Successful', `KES ${parseFloat(amount).toLocaleString()} withdrawn`);
    } catch (err) {
      setError(err.error || 'Withdrawal failed');
      setStep(STEPS.CONFIRM);
    } finally { setLoading(false); setPin(''); }
  };

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <div className="card">
        <div className="card-header">
          <div className="card-title"><i className="bi bi-cash-coin" style={{ color: 'var(--mpesa-red)', marginRight: 8 }}></i>Withdraw Cash</div>
          {step > 1 && step < 4 && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setStep(step - 1); setError(''); }}>
              <i className="bi bi-arrow-left"></i> Back
            </button>
          )}
        </div>
        <div className="card-body">
          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

          {step === STEPS.ENTER && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {[{ id: 'agent', label: '🏪 Agent', icon: 'bi-shop' }, { id: 'atm', label: '🏧 ATM', icon: 'bi-bank' }].map(t => (
                  <button key={t.id}
                    className={`btn ${type === t.id ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                    onClick={() => setType(t.id)}>
                    {t.label}
                  </button>
                ))}
              </div>
              {type === 'agent' && (
                <div className="form-group">
                  <label className="form-label">Agent Number</label>
                  <div className="input-group">
                    <i className="bi bi-shop input-prefix"></i>
                    <input type="text" className="form-control" placeholder="e.g. 12345678" value={agentNumber} onChange={e => setAgentNumber(e.target.value)} />
                  </div>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Amount (KES)</label>
                <input type="number" className="form-control" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              {amount > 0 && (
                <div style={{ background: 'var(--mpesa-gray-50)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: 'var(--mpesa-gray-500)' }}>Withdrawal</span>
                    <span style={{ fontWeight: 700 }}>{formatKES(amount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                    <span style={{ color: 'var(--mpesa-gray-500)' }}>Transaction Cost</span>
                    <span style={{ fontWeight: 700 }}>{formatKES(charge)}</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--mpesa-gray-200)', paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800 }}>Total Deducted</span>
                    <span style={{ fontWeight: 900, color: 'var(--mpesa-red)', fontSize: 16 }}>{formatKES(total)}</span>
                  </div>
                </div>
              )}
              <div style={{ fontSize: 12, color: 'var(--mpesa-gray-400)', marginBottom: 16 }}>Balance: <strong style={{ color: 'var(--mpesa-green)' }}>{formatKES(mpesaBalance || 0)}</strong></div>
              <button className="btn btn-primary btn-full btn-lg" onClick={() => { if (!amount || parseFloat(amount) < 100) { setError('Minimum withdrawal is KES 100'); return; } setError(''); setStep(STEPS.CONFIRM); }}>
                Continue <i className="bi bi-arrow-right"></i>
              </button>
            </>
          )}

          {step === STEPS.CONFIRM && (
            <>
              <div style={{ background: 'var(--mpesa-gray-50)', borderRadius: 12, padding: '20px 16px', marginBottom: 20 }}>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: 'var(--mpesa-gray-500)' }}>Withdrawing via {type === 'agent' ? 'Agent' : 'ATM'}</div>
                  <div style={{ fontSize: 32, fontWeight: 900 }}>{formatKES(amount)}</div>
                </div>
                {agentNumber && <div className="confirm-row"><span className="label">Agent No.</span><span className="value">{agentNumber}</span></div>}
                <div className="confirm-row"><span className="label">Transaction Cost</span><span className="value">{formatKES(charge)}</span></div>
                <div className="confirm-row"><span className="label" style={{ fontWeight: 800 }}>Total Deducted</span><span className="value total">{formatKES(total)}</span></div>
              </div>
              <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep(STEPS.PIN)}>
                <i className="bi bi-shield-lock"></i> Enter PIN
              </button>
            </>
          )}

          {step === STEPS.PIN && (
            <div style={{ padding: '16px 0' }}>
              <PinInput value={pin} onChange={setPin} label="Enter M-PESA PIN" />
              <button className={`btn btn-primary btn-full btn-lg ${loading ? 'btn-loading' : ''}`}
                onClick={handleSubmit} disabled={loading || pin.length < 4} style={{ marginTop: 32 }}>
                {!loading && <><i className="bi bi-cash-coin"></i> Withdraw {formatKES(amount)}</>}
              </button>
            </div>
          )}

          {step === STEPS.SUCCESS && (
            <div className="success-screen">
              <div className="success-icon">✅</div>
              <div className="success-title">Cash Withdrawn!</div>
              <div className="success-amount">{formatKES(amount)}</div>
              <div className="success-detail">via {type === 'agent' ? `Agent ${agentNumber}` : 'ATM'}</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setStep(STEPS.ENTER); setAmount(''); setResult(null); }}>Withdraw Again</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onNavigate('/dashboard')}>Done</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};