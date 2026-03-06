import React, { useState, useEffect } from 'react';
import { kcbAPI, dashboardAPI, formatKES } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PinInput from '../../components/common/PinInput';
import { toast } from '../../components/common/Toast';

const KCBPage = ({ onNavigate }) => {
  const { kcbBalance, setKcbBalance, mpesaBalance, setMpesaBalance } = useAuth();

  const [account, setAccount]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null); // 'deposit' | 'withdraw' | 'loan'
  const [amount, setAmount]       = useState('');
  const [pin, setPin]             = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => { loadAccount(); }, []);

  const loadAccount = async () => {
    setLoading(true);
    try {
      const data = await dashboardAPI.getDashboard();
      setAccount(data.kcb_account);
      if (data.kcb_account?.balance !== undefined) {
        setKcbBalance(data.kcb_account.balance);
      }
    } catch (e) {
      console.error('Failed to load KCB account:', e);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type) => {
    setModal(type);
    setAmount('');
    setPin('');
    setError('');
  };

  const closeModal = () => {
    setModal(null);
    setError('');
  };

  const handleAction = async () => {
    setError('');
    if (!amount || parseFloat(amount) < 1) { setError('Enter a valid amount'); return; }
    if (pin.length < 4) { setError('Enter your 4-digit PIN'); return; }

    setProcessing(true);
    try {
      let data;
      if (modal === 'deposit') {
        data = await kcbAPI.deposit({ amount: parseFloat(amount), pin });
        toast.success('KCB M-PESA', `KES ${parseFloat(amount).toLocaleString()} deposited`);
      } else if (modal === 'withdraw') {
        data = await kcbAPI.withdraw({ amount: parseFloat(amount), pin });
        toast.success('KCB M-PESA', `KES ${parseFloat(amount).toLocaleString()} withdrawn to M-PESA`);
      } else {
        data = await kcbAPI.applyLoan({ amount: parseFloat(amount), pin });
        toast.success('Loan Approved!', data.message?.substring(0, 60) || 'Loan disbursed to M-PESA');
      }
      closeModal();
      loadAccount(); // refresh balances
    } catch (err) {
      setError(err.error || 'Transaction failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const loanLimit   = parseFloat(account?.loan_limit  || 50000);
  const activeLoan  = parseFloat(account?.active_loan || 0);
  const kcbBal      = parseFloat(kcbBalance           || account?.balance || 0);
  const mpesaBal    = parseFloat(mpesaBalance         || 0);

  const ACTIONS = [
    {
      type: 'deposit',
      icon: 'bi-arrow-down-circle-fill',
      label: 'Deposit',
      sub: `From M-PESA • ${formatKES(mpesaBal)}`,
      color: '#1E40AF',
    },
    {
      type: 'withdraw',
      icon: 'bi-arrow-up-circle-fill',
      label: 'Withdraw',
      sub: `To M-PESA • ${formatKES(kcbBal)} available`,
      color: '#059669',
    },
    {
      type: 'loan',
      icon: 'bi-credit-card-2-front-fill',
      label: 'Get Loan',
      sub: activeLoan > 0
        ? `Active loan: ${formatKES(activeLoan)}`
        : `Up to ${formatKES(loanLimit)}`,
      color: '#D97706',
    },
  ];

  const modalMeta = {
    deposit:  { title: '📥 Deposit to KCB M-PESA',   hint: `M-PESA Balance: ${formatKES(mpesaBal)}`,  btn: 'Deposit'   },
    withdraw: { title: '📤 Withdraw from KCB M-PESA', hint: `KCB Balance: ${formatKES(kcbBal)}`,       btn: 'Withdraw'  },
    loan:     { title: '💳 Apply for KCB Loan',        hint: `Loan Limit: ${formatKES(loanLimit)}`,    btn: 'Apply'     },
  };

  if (loading) return <div className="loading-spinner" />;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>

      {/* ── KCB balance card ── */}
      <div className="kcb-card" style={{ marginBottom: 24 }}>
        <div className="account-card-overlay" />
        <div style={{ position: 'relative' }}>
          {/* Brand header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{
              width: 48, height: 48,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
            }}>
              🏦
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 20 }}>KCB M-PESA</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>KCB Bank &amp; M-PESA Partnership</div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Balance',     value: formatKES(kcbBal)         },
              { label: 'Loan Limit',  value: formatKES(loanLimit)      },
              { label: 'Active Loan', value: formatKES(activeLoan)     },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 10, opacity: 0.65, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Action cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {ACTIONS.map(a => (
          <div
            key={a.type}
            className="card"
            style={{ cursor: 'pointer', textAlign: 'center', transition: 'var(--transition)' }}
            onClick={() => openModal(a.type)}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
          >
            <div className="card-body">
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: a.color + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, color: a.color,
                margin: '0 auto 12px',
              }}>
                <i className={`bi ${a.icon}`} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{a.label}</div>
              <div style={{ fontSize: 11, color: 'var(--mpesa-gray-400)', lineHeight: 1.4 }}>{a.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Info card ── */}
      <div className="card">
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: '#FEF9C3', color: '#92400E',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
            }}>
              💡
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>About KCB M-PESA</div>
              <div style={{ fontSize: 13, color: 'var(--mpesa-gray-500)', lineHeight: 1.7 }}>
                KCB M-PESA is a mobile banking service offered in partnership with KCB Bank Kenya.
                Save money, earn interest, and access instant loans — all from your M-PESA menu.
                Loans are disbursed instantly to your M-PESA wallet.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Transaction modal ── */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />

            <div className="modal-header">
              <div className="modal-title">{modalMeta[modal].title}</div>
              <button className="modal-close" onClick={closeModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                <i className="bi bi-exclamation-circle-fill" /> {error}
              </div>
            )}

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
                  max={modal === 'loan' ? loanLimit : undefined}
                />
              </div>
              <div className="form-hint">{modalMeta[modal].hint}</div>
            </div>

            {/* Quick amounts for deposit/withdraw */}
            {modal !== 'loan' && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {[500, 1000, 2000, 5000, 10000].map(a => (
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
            )}

            <div style={{ marginBottom: 24 }}>
              <PinInput value={pin} onChange={setPin} label="Enter M-PESA PIN" />
            </div>

            <button
              className={`btn btn-primary btn-full btn-lg ${processing ? 'btn-loading' : ''}`}
              disabled={processing || !amount || pin.length < 4}
              onClick={handleAction}
            >
              {!processing && (
                <>{modalMeta[modal].btn} {amount ? formatKES(amount) : ''}</>
              )}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default KCBPage;