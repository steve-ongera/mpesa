import React, { useState } from 'react';
import { transactionAPI, formatKES } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PinInput from '../../components/common/PinInput';
import { toast } from '../../components/common/Toast';

const POPULAR_BILLERS = [
  { name: 'Kenya Power', number: '888880', category: 'Utilities', icon: '⚡' },
  { name: 'Nairobi Water', number: '888890', category: 'Utilities', icon: '💧' },
  { name: 'DSTV', number: '222222', category: 'Entertainment', icon: '📺' },
  { name: 'Zuku', number: '200200', category: 'Internet', icon: '🌐' },
  { name: 'KRA iTax', number: '572572', category: 'Government', icon: '🏛️' },
  { name: 'NHIF', number: '200300', category: 'Health', icon: '🏥' },
  { name: 'NSSF', number: '333200', category: 'Pension', icon: '👴' },
  { name: 'Safaricom', number: '400200', category: 'Telecom', icon: '📡' },
];

const STEPS = { ENTER: 1, CONFIRM: 2, PIN: 3, SUCCESS: 4 };

const LipaNaMpesaPage = ({ onNavigate }) => {
  const { mpesaBalance, setMpesaBalance } = useAuth();
  const [activeTab, setActiveTab] = useState('paybill');
  const [step, setStep] = useState(STEPS.ENTER);
  const [paybillNo, setPaybillNo] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [tillNo, setTillNo] = useState('');
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const reset = () => {
    setStep(STEPS.ENTER);
    setAmount('');
    setPin('');
    setError('');
    setResult(null);
    setPaybillNo('');
    setAccountNo('');
    setTillNo('');
  };

  const handleConfirm = () => {
    setError('');
    if (activeTab === 'paybill' && (!paybillNo || !accountNo)) {
      setError('Enter paybill number and account number');
      return;
    }
    if (activeTab === 'goods' && !tillNo) {
      setError('Enter till number');
      return;
    }
    if (!amount || parseFloat(amount) < 1) {
      setError('Enter a valid amount');
      return;
    }
    setStep(STEPS.CONFIRM);
  };

  const handlePay = async () => {
    if (pin.length < 4) { setError('Enter 4-digit PIN'); return; }
    setError('');
    setLoading(true);
    try {
      let data;
      if (activeTab === 'paybill') {
        data = await transactionAPI.paybill({
          paybill_number: paybillNo,
          account_number: accountNo,
          amount: parseFloat(amount),
          pin,
        });
      } else {
        data = await transactionAPI.buyGoods({
          till_number: tillNo,
          amount: parseFloat(amount),
          pin,
        });
      }
      setResult(data);
      setStep(STEPS.SUCCESS);
      toast.success('Payment Successful!', `KES ${parseFloat(amount).toLocaleString()} paid`);
    } catch (err) {
      setError(err.error || 'Payment failed');
      setStep(STEPS.CONFIRM);
    } finally {
      setLoading(false);
      setPin('');
    }
  };

  const selectBiller = (biller) => {
    setPaybillNo(biller.number);
  };

  const tabs = [
    { id: 'paybill', label: 'Paybill', icon: 'bi-receipt-cutoff' },
    { id: 'goods', label: 'Buy Goods', icon: 'bi-bag-fill' },
    { id: 'pochi', label: 'Pochi la Biashara', icon: 'bi-shop' },
  ];

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="card">
        {/* Tab navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--mpesa-gray-200)',
          padding: '0 20px',
          gap: 4,
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); reset(); }}
              style={{
                padding: '16px 14px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-primary)',
                fontSize: 13,
                fontWeight: 700,
                color: activeTab === tab.id ? 'var(--mpesa-green)' : 'var(--mpesa-gray-500)',
                borderBottom: activeTab === tab.id ? '2px solid var(--mpesa-green)' : '2px solid transparent',
                marginBottom: -1,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'var(--transition)',
                whiteSpace: 'nowrap',
              }}
            >
              <i className={`bi ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="card-body">
          {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

          {/* POCHI LA BIASHARA */}
          {activeTab === 'pochi' && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
              <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Pochi la Biashara</h3>
              <p style={{ color: 'var(--mpesa-gray-500)', fontSize: 14, marginBottom: 24, lineHeight: 1.7 }}>
                Receive M-PESA payments directly into your business till without sharing your personal number.
              </p>
              <div style={{
                background: 'var(--mpesa-green-pale)',
                borderRadius: 12, padding: 16,
                marginBottom: 16, textAlign: 'left'
              }}>
                <div style={{ fontWeight: 800, marginBottom: 8, color: 'var(--mpesa-green-dark)' }}>
                  <i className="bi bi-info-circle" style={{ marginRight: 8 }}></i>
                  How it works
                </div>
                <ul style={{ fontSize: 13, color: 'var(--mpesa-gray-700)', lineHeight: 2, paddingLeft: 16 }}>
                  <li>Customers send money to your Pochi number</li>
                  <li>Funds go directly to your M-PESA wallet</li>
                  <li>Zero charges for receiving payments</li>
                  <li>Separate business from personal finances</li>
                </ul>
              </div>
              <button className="btn btn-primary" onClick={() => toast.info('Pochi la Biashara', 'Visit any Safaricom shop or dial *234# to register your Pochi till')}>
                <i className="bi bi-shop"></i> Register Pochi Account
              </button>
            </div>
          )}

          {/* PAYBILL */}
          {activeTab === 'paybill' && step === STEPS.ENTER && (
            <>
              {/* Popular billers */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--mpesa-gray-500)', marginBottom: 10 }}>
                  Popular Billers
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {POPULAR_BILLERS.map(biller => (
                    <div
                      key={biller.number}
                      onClick={() => selectBiller(biller)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 10,
                        border: `1px solid ${paybillNo === biller.number ? 'var(--mpesa-green)' : 'var(--mpesa-gray-200)'}`,
                        background: paybillNo === biller.number ? 'var(--mpesa-green-pale)' : 'var(--mpesa-gray-50)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'var(--transition)',
                        fontSize: 12,
                      }}
                    >
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{biller.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--mpesa-gray-700)' }}>{biller.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="divider"></div>

              <div className="form-group">
                <label className="form-label">Business/Paybill Number</label>
                <input type="tel" className="form-control" placeholder="e.g. 888880"
                  value={paybillNo} onChange={e => setPaybillNo(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Account Number</label>
                <input type="text" className="form-control" placeholder="Account/Reference number"
                  value={accountNo} onChange={e => setAccountNo(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Amount (KES)</label>
                <input type="number" className="form-control" placeholder="0.00"
                  value={amount} onChange={e => setAmount(e.target.value)} />
                <div className="form-hint">Balance: {formatKES(mpesaBalance || 0)}</div>
              </div>
              <button className="btn btn-primary btn-full" onClick={handleConfirm}>
                Continue <i className="bi bi-arrow-right"></i>
              </button>
            </>
          )}

          {/* BUY GOODS */}
          {activeTab === 'goods' && step === STEPS.ENTER && (
            <>
              <div className="form-group">
                <label className="form-label">Till Number / Buy Goods Number</label>
                <div className="input-group">
                  <i className="bi bi-bag input-prefix"></i>
                  <input type="tel" className="form-control" placeholder="e.g. 5551234"
                    value={tillNo} onChange={e => setTillNo(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (KES)</label>
                <input type="number" className="form-control" placeholder="0.00"
                  value={amount} onChange={e => setAmount(e.target.value)} />
                <div className="form-hint">Balance: {formatKES(mpesaBalance || 0)}</div>
              </div>
              <button className="btn btn-primary btn-full" onClick={handleConfirm}>
                Continue <i className="bi bi-arrow-right"></i>
              </button>
            </>
          )}

          {/* CONFIRM */}
          {(activeTab === 'paybill' || activeTab === 'goods') && step === STEPS.CONFIRM && (
            <>
              <div style={{ background: 'var(--mpesa-gray-50)', borderRadius: 12, padding: '16px', marginBottom: 20 }}>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: 'var(--mpesa-gray-500)' }}>Payment Amount</div>
                  <div style={{ fontSize: 32, fontWeight: 900 }}>{formatKES(amount)}</div>
                </div>
                {activeTab === 'paybill' ? (
                  <>
                    <div className="confirm-row">
                      <span className="label">Paybill Number</span>
                      <span className="value">{paybillNo}</span>
                    </div>
                    <div className="confirm-row">
                      <span className="label">Account Number</span>
                      <span className="value">{accountNo}</span>
                    </div>
                  </>
                ) : (
                  <div className="confirm-row">
                    <span className="label">Till Number</span>
                    <span className="value">{tillNo}</span>
                  </div>
                )}
                <div className="confirm-row">
                  <span className="label">Transaction Cost</span>
                  <span className="value">Free</span>
                </div>
              </div>
              <button className="btn btn-primary btn-full" onClick={() => setStep(STEPS.PIN)}>
                <i className="bi bi-shield-lock"></i> Enter PIN to Pay
              </button>
              <button className="btn btn-ghost btn-full" style={{ marginTop: 8 }} onClick={() => setStep(STEPS.ENTER)}>
                Edit Details
              </button>
            </>
          )}

          {/* PIN */}
          {(activeTab === 'paybill' || activeTab === 'goods') && step === STEPS.PIN && (
            <div style={{ padding: '16px 0' }}>
              <PinInput value={pin} onChange={setPin} label="Enter M-PESA PIN" />
              <button
                className={`btn btn-primary btn-full btn-lg ${loading ? 'btn-loading' : ''}`}
                onClick={handlePay}
                disabled={loading || pin.length < 4}
                style={{ marginTop: 32 }}
              >
                {!loading && <><i className="bi bi-check-circle"></i> Pay {formatKES(amount)}</>}
              </button>
            </div>
          )}

          {/* SUCCESS */}
          {step === STEPS.SUCCESS && (
            <div className="success-screen">
              <div className="success-icon">✅</div>
              <div className="success-title">Payment Successful!</div>
              <div className="success-amount">{formatKES(amount)}</div>
              <div className="success-detail">
                {activeTab === 'paybill' ? `Paybill: ${paybillNo} | Account: ${accountNo}` : `Till: ${tillNo}`}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={reset}>Pay Again</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onNavigate('/dashboard')}>Done</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LipaNaMpesaPage;