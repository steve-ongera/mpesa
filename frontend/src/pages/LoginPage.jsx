import React, { useState } from 'react';
import { authAPI, authHelpers } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../common/Toast';

const LoginPage = ({ onNavigate }) => {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!phone || !password) { setError('Enter phone number and password'); return; }
    setLoading(true);
    try {
      const data = await authAPI.login(phone, password);
      login(data);
      toast.success('Welcome back!', `Logged in as ${data.user.first_name || data.user.phone_number}`);

      const roleRoutes = {
        customer: '/dashboard',
        agent: '/agent',
        admin: '/admin',
        customer_care: '/care',
      };
      onNavigate(roleRoutes[data.role] || '/dashboard');
    } catch (err) {
      setError(err.error || err.detail || 'Invalid phone number or password');
    } finally {
      setLoading(false);
    }
  };

  // Demo credentials helper
  const fillDemo = (role) => {
    const demos = {
      customer: { phone: '0712345678', password: 'demo1234' },
      agent: { phone: '0722345678', password: 'demo1234' },
      admin: { phone: '0732345678', password: 'demo1234' },
      care: { phone: '0742345678', password: 'demo1234' },
    };
    const d = demos[role];
    setPhone(d.phone);
    setPassword(d.password);
  };

  return (
    <div className="login-wrapper">
      {/* Left hero panel */}
      <div className="login-left">
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: 'white' }}>
          <div style={{
            width: 80, height: 80, background: 'var(--mpesa-green)',
            borderRadius: 20, display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 32px',
            fontSize: 36, fontWeight: 900, boxShadow: '0 12px 32px rgba(0,166,81,0.4)'
          }}>M</div>

          <h1 style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.1, marginBottom: 16 }}>
            The Future of <br />
            <span style={{ color: 'var(--mpesa-green)' }}>Mobile Money</span>
          </h1>
          <p style={{ fontSize: 16, opacity: 0.7, lineHeight: 1.7, maxWidth: 400 }}>
            Send money, pay bills, save, and access loans — all from your phone. Fast, secure, and always available.
          </p>

          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 48 }}>
            {[
              { icon: 'bi-shield-check', label: 'Secure' },
              { icon: 'bi-lightning-charge', label: 'Instant' },
              { icon: 'bi-globe', label: 'Always On' },
            ].map(f => (
              <div key={f.label} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 52, height: 52, background: 'rgba(0,166,81,0.15)',
                  borderRadius: 14, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 8px', fontSize: 22
                }}>
                  <i className={`bi ${f.icon}`} style={{ color: 'var(--mpesa-green)' }}></i>
                </div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="login-right">
        <div className="login-form-wrapper">
          <div className="login-logo">
            <div className="login-logo-mark">M</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 20 }}>M-PESA</div>
              <div style={{ fontSize: 11, color: 'var(--mpesa-green)', fontWeight: 700, letterSpacing: 1 }}>BANKING PORTAL</div>
            </div>
          </div>

          <h2 className="login-title">Sign in</h2>
          <p className="login-subtitle">Enter your M-PESA registered phone number</p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <i className="bi bi-exclamation-circle-fill"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="input-group">
                <i className="bi bi-phone input-prefix"></i>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="e.g. 0712345678"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-group">
                <i className="bi bi-lock input-prefix"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <i
                  className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} input-icon`}
                  onClick={() => setShowPassword(!showPassword)}
                ></i>
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-primary btn-full btn-lg ${loading ? 'btn-loading' : ''}`}
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {!loading && <><i className="bi bi-box-arrow-in-right"></i> Sign In</>}
            </button>
          </form>

          {/* Demo quick access */}
          <div style={{ marginTop: 32 }}>
            <div style={{
              fontSize: 11, color: 'var(--mpesa-gray-400)', textAlign: 'center',
              textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, fontWeight: 700
            }}>
              Quick Demo Login
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {[
                { role: 'customer', label: '👤 Customer', color: 'var(--mpesa-green)' },
                { role: 'agent', label: '🏪 Agent', color: '#0369A1' },
                { role: 'admin', label: '⚙️ Admin', color: '#7C3AED' },
                { role: 'care', label: '🎧 Care', color: '#D97706' },
              ].map(d => (
                <button
                  key={d.role}
                  className="btn btn-ghost btn-sm"
                  onClick={() => fillDemo(d.role)}
                  style={{
                    border: `1px solid ${d.color}22`,
                    background: `${d.color}0A`,
                    color: d.color,
                    fontSize: 12,
                    fontWeight: 700
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;