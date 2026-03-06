import React, { useState } from 'react';
import { transactionAPI, formatKES } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PinInput from '../../components/common/PinInput';
import { toast } from '../../components/common/Toast';

const STEPS = { ENTER: 1, CONFIRM: 2, PIN: 3, SUCCESS: 4 };

const CHARGES = [
  { max: 100,   fee: 10  },
  { max: 2500,  fee: 29  },
  { max: 3500,  fee: 52  },
  { max: 5000,  fee: 69  },
  { max: 7500,  fee: 87  },
  { max: 10000, fee: 97  },
  { max: 15000, fee: 107 },
  { max: 70000, fee: 147 },
];

function getCharge(amt) {
  const row = CHARGES.find(r => parseFloat(amt) <= r.max);
  return row ? row.fee : 147;
}

const WithdrawPage = ({ onNavigate }) => {
  const { mpesaBalance, setMpesaBalance } = useAuth();

  const [step, setStep]               = useState(STEPS.ENTER);
  const [type, setType]               = useState('agent'); // 'agent' | 'atm'
  const [agentNumber, setAgentNumber] = useState('');
  const [amount, setAmount]           = useState('');
  const [pin, setPin]                 = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const charge = amount ? getCharge(amount) : 0;
  const total  = amount ? parseFloat(amount) + charge : 0;

  const goBack = () => { setStep(s => s - 1); setError(''); };

  const handleContinue = () => {
    setError('');
    if (!amount || parseFloat(amount) < 100) {
      setError('Minimum withdrawal is KES 100');
      return;
    }
    if (type === 'agent' && !agentNumber.trim()) {
      setError('Enter the agent number');
      return;
    }
    setStep(STEPS.CONFIRM);
  };

  const handleSubmit = async () => {
    if (pin.length < 4) { setError('Enter your 4-digit PIN'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await transactionAPI.withdraw({
        type,
        agent_number: agentNumber,
        amount: parseFloat(amount),
        pin,
      });
      setMpesaBalance(data.new_balance);
      setStep(STEPS.SUCCESS);
      toast.success('Withdrawal Successful', `KES ${parseFloat(amount).toLocaleString()} withdrawn`);
    } catch (err) {
      setError(err.error || 'Withdrawal failed. Please try again.');
      setStep(STEPS.CONFIRM);
    } finally {
      setLoading(false);
      setPin('');
    }
  };

  const handleReset = () => {
    setStep(STEPS.ENTER);
    setAmount('');
    setAgentNumber('');
    setError('');
  };

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <div className="card">

        {/* ── Header ── */}
        <div className="card-header">
          <div className="card-title">
            <i className="bi bi-cash-coin" style={{ color: 'var(--mpesa-red)', marginRight: 8 }} />
            Withdraw Cash
          </div>
          {step > STEPS.ENTER && step < STEPS.SUCCESS && (
            <button className="btn btn-ghost btn-sm" onClick={goBack}>
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
              {/* Withdrawal type toggle */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {[
                  { id: 'agent', label: '🏪 Agent' },
                  { id: 'atm',   label: '🏧 ATM'   },
                ].map(t => (
                  <button
                    key={t.id}
                    className={`btn ${type === t.id ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                    onClick={() => { setType(t.id); setAgentNumber(''); setError(''); }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Agent number — only when agent selected */}
              {type === 'agent' && (
                <div className="form-group">
                  <label className="form-label">Agent Number</label>
                  <div className="input-group">
                    <i className="bi bi-shop input-prefix" />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 12345678"
                      value={agentNumber}
                      onChange={e => setAgentNumber(e.target.value)}
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
                    placeholder="0.00"
                    min={100}
                    max={150000}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Quick amounts */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {[500, 1000, 2000, 5000, 10000, 20000].map(a => (
                  <button
                    key={a}
                    className="btn btn-ghost btn-sm"
                    style={{
                      border: '1px solid var(--mpesa-gray-200)',
                      fontWeight: 700,
                      background: amount === String(a) ? 'var(--mpesa-green-pale)' : '',
                    }}
                    onClick={() => setAmount(String(a))}
                  >
                    {a.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Charge breakdown */}
              {amount > 0 && (
                <div style={{
                  background: 'var(--mpesa-gray-50)', borderRadius: 10,
                  padding: '12px 16px', marginBottom: 20,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: 'var(--mpesa-gray-500)' }}>Withdrawal</span>
                    <span style={{ fontWeight: 700 }}>{formatKES(amount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                    <span style={{ color: 'var(--mpesa-gray-500)' }}>Transaction Cost</span>
                    <span style={{ fontWeight: 700 }}>{formatKES(charge)}</span>
                  </div>
                  <div style={{
                    borderTop: '1px solid var(--mpesa-gray-200)', paddingTop: 8,
                    display: 'flex', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontWeight: 800 }}>Total Deducted</span>
                    <span style={{ fontWeight: 900, color: 'var(--mpesa-red)', fontSize: 16 }}>
                      {formatKES(total)}
                    </span>
                  </div>
                </div>
              )}

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

          {/* ── Step 2: Confirm ── */}
          {step === STEPS.CONFIRM && (
            <>
              <div style={{
                background: 'var(--mpesa-gray-50)', borderRadius: 12,
                padding: '20px 16px', marginBottom: 20,
              }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 13, color: 'var(--mpesa-gray-500)' }}>
                    Withdrawing via {type === 'agent' ? 'Agent' : 'ATM'}
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 900, marginTop: 4 }}>
                    {formatKES(amount)}
                  </div>
                </div>

                {agentNumber && (
                  <div className="confirm-row">
                    <span className="label">Agent Number</span>
                    <span className="value">{agentNumber}</span>
                  </div>
                )}
                <div className="confirm-row">
                  <span className="label">Transaction Cost</span>
                  <span className="value">{formatKES(charge)}</span>
                </div>
                <div className="confirm-row">
                  <span className="label" style={{ fontWeight: 800 }}>Total Deducted</span>
                  <span className="value total">{formatKES(total)}</span>
                </div>
              </div>

              <button className="btn btn-primary btn-full btn-lg" onClick={() => setStep(STEPS.PIN)}>
                <i className="bi bi-shield-lock" /> Enter PIN to Confirm
              </button>
            </>
          )}

          {/* ── Step 3: PIN ── */}
          {step === STEPS.PIN && (
            <div style={{ padding: '16px 0' }}>
              <PinInput value={pin} onChange={setPin} label="Enter M-PESA PIN" />
              <button
                className={`btn btn-primary btn-full btn-lg ${loading ? 'btn-loading' : ''}`}
                onClick={handleSubmit}
                disabled={loading || pin.length < 4}
                style={{ marginTop: 32 }}
              >
                {!loading && (
                  <><i className="bi bi-cash-coin" /> Withdraw {formatKES(amount)}</>
                )}
              </button>
            </div>
          )}

          {/* ── Step 4: Success ── */}
          {step === STEPS.SUCCESS && (
            <div className="success-screen">
              <div className="success-icon">✅</div>
              <div className="success-title">Cash Withdrawn!</div>
              <div className="success-amount">{formatKES(amount)}</div>
              <div className="success-detail">
                via {type === 'agent' ? `Agent ${agentNumber}` : 'ATM'}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={handleReset}>
                  Withdraw Again
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

export default WithdrawPage;