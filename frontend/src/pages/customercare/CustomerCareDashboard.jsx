import React, { useState, useEffect } from 'react';
import { adminAPI, formatKES, formatDate } from '../../services/api';
import { toast } from '../../components/common/Toast';

const CustomerCareDashboard = ({ onNavigate }) => {
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ first_name: '', last_name: '', phone_number: '', role: 'customer', password: '', email: '' });
  const [creating, setCreating] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, t] = await Promise.all([adminAPI.getUsers(), adminAPI.getTransactions()]);
      setUsers(u); setTransactions(t);
    } catch (e) {} finally { setLoading(false); }
  };

  const handleCreateUser = async () => {
    if (!newUser.first_name || !newUser.phone_number || !newUser.password) {
      toast.error('Error', 'Fill in required fields'); return;
    }
    setCreating(true);
    try {
      await adminAPI.createUser(newUser);
      toast.success('Account Created', `M-PESA account created for ${newUser.first_name} ${newUser.last_name}`);
      setShowCreateUser(false);
      setNewUser({ first_name: '', last_name: '', phone_number: '', role: 'customer', password: '', email: '' });
      loadData();
    } catch (err) {
      toast.error('Error', err.phone_number?.[0] || err.error || 'Failed');
    } finally { setCreating(false); }
  };

  const filteredUsers = users.filter(u =>
    !searchQuery ||
    u.phone_number?.includes(searchQuery) ||
    u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalCustomers: users.filter(u => u.role === 'customer').length,
    totalToday: transactions.filter(t => new Date(t.created_at).toDateString() === new Date().toDateString()).length,
    pendingVerification: users.filter(u => !u.is_verified).length,
    totalAgents: users.filter(u => u.role === 'agent').length,
  };

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0C1A2E 0%, #1E3A5F 60%, #0C1A2E 100%)',
        borderRadius: 20, padding: '24px 28px', color: 'white', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Customer Care Portal</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Welcome, Support Team 🎧</div>
          <div style={{ fontSize: 13, opacity: 0.6, marginTop: 4 }}>Help customers manage their M-PESA accounts</div>
        </div>
        <button className="btn" style={{ background: 'var(--mpesa-green)', color: 'white' }} onClick={() => setShowCreateUser(true)}>
          <i className="bi bi-person-plus-fill"></i> Register Customer
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { icon: '👥', label: 'Customers', value: stats.totalCustomers, color: '#00A651', bg: '#E8F8EF' },
          { icon: '🏪', label: 'Agents', value: stats.totalAgents, color: '#0369A1', bg: '#E0F2FE' },
          { icon: '📋', label: "Today's Txns", value: stats.totalToday, color: '#7C3AED', bg: '#EDE9FE' },
          { icon: '⏳', label: 'Pending Verify', value: stats.pendingVerification, color: '#D97706', bg: '#FEF9C3' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'customers', label: '👥 Customers' },
          { id: 'transactions', label: '💸 Transactions' },
        ].map(tab => (
          <button key={tab.id} className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div className="card-header"><div className="card-title">Recent Registrations</div></div>
            <div style={{ padding: '0 16px 8px' }}>
              {users.slice(0, 6).map(u => (
                <div key={u.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0', borderBottom: '1px solid var(--mpesa-gray-100)'
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', background: 'var(--mpesa-green)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                    fontWeight: 700, fontSize: 13, flexShrink: 0
                  }}>{u.first_name?.[0] || '?'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{u.full_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--mpesa-gray-400)' }}>{u.phone_number}</div>
                  </div>
                  <span className={`badge ${u.is_verified ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: 10 }}>
                    {u.is_verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Recent Transactions</div></div>
            <div style={{ padding: '0 16px 8px' }}>
              {transactions.slice(0, 6).map(txn => (
                <div key={txn.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0', borderBottom: '1px solid var(--mpesa-gray-100)'
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, background: 'var(--mpesa-green-pale)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
                  }}>💸</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{txn.transaction_type.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: 11, color: 'var(--mpesa-gray-400)' }}>{txn.sender_phone}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 800 }}>{formatKES(txn.amount)}</div>
                    <span className={`txn-status ${txn.status}`} style={{ fontSize: 10 }}>{txn.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Customers tab */}
      {activeTab === 'customers' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Customer Search</div>
            <div style={{ position: 'relative' }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--mpesa-gray-400)', fontSize: 14 }}></i>
              <input className="form-control" placeholder="Search phone, name..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 36, width: 260, height: 38, fontSize: 13 }} />
            </div>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Customer</th><th>Phone</th><th>Role</th><th>Verified</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--mpesa-green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                          {u.first_name?.[0] || '?'}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{u.full_name}</div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{u.phone_number}</td>
                    <td>
                      <span className="badge badge-gray" style={{ textTransform: 'capitalize', fontSize: 11 }}>{u.role}</span>
                    </td>
                    <td>
                      <span className={`badge ${u.is_verified ? 'badge-green' : 'badge-yellow'}`}>
                        {u.is_verified ? '✓ Verified' : '⏳ Pending'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--mpesa-gray-500)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelectedUser(u)}
                        style={{ fontSize: 12 }}>
                        <i className="bi bi-eye"></i> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transactions tab */}
      {activeTab === 'transactions' && (
        <div className="card">
          <div className="card-header"><div className="card-title">All Transactions</div></div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Type</th><th>From</th><th>Amount</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {transactions.map(txn => (
                  <tr key={txn.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{txn.transaction_id}</td>
                    <td style={{ fontSize: 12, fontWeight: 600 }}>{txn.transaction_type.replace(/_/g, ' ')}</td>
                    <td style={{ fontSize: 12 }}>{txn.sender_phone || '-'}</td>
                    <td style={{ fontWeight: 700 }}>{formatKES(txn.amount)}</td>
                    <td><span className={`txn-status ${txn.status}`}>{txn.status}</span></td>
                    <td style={{ fontSize: 11, color: 'var(--mpesa-gray-500)' }}>{formatDate(txn.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="modal-overlay" onClick={() => setShowCreateUser(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle"></div>
            <div className="modal-header">
              <div className="modal-title">📱 Register New Customer</div>
              <button className="modal-close" onClick={() => setShowCreateUser(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input className="form-control" placeholder="First name"
                  value={newUser.first_name} onChange={e => setNewUser({ ...newUser, first_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input className="form-control" placeholder="Last name"
                  value={newUser.last_name} onChange={e => setNewUser({ ...newUser, last_name: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input className="form-control" placeholder="0712345678" type="tel"
                value={newUser.phone_number} onChange={e => setNewUser({ ...newUser, phone_number: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" placeholder="email@example.com" type="email"
                value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Account Type</label>
              <select className="form-control" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                <option value="customer">Customer</option>
                <option value="agent">Agent</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Initial Password *</label>
              <input className="form-control" placeholder="Set a password" type="password"
                value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
            </div>
            <button className={`btn btn-primary btn-full ${creating ? 'btn-loading' : ''}`}
              disabled={creating} onClick={handleCreateUser}>
              {!creating && <><i className="bi bi-person-plus-fill"></i> Create M-PESA Account</>}
            </button>
          </div>
        </div>
      )}

      {/* User detail modal */}
      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle"></div>
            <div className="modal-header">
              <div className="modal-title">Customer Details</div>
              <button className="modal-close" onClick={() => setSelectedUser(null)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: 'var(--mpesa-green)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 26, fontWeight: 900, margin: '0 auto 12px'
              }}>{selectedUser.first_name?.[0] || '?'}</div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{selectedUser.full_name}</div>
              <div style={{ color: 'var(--mpesa-gray-500)', fontSize: 13 }}>{selectedUser.phone_number}</div>
            </div>
            <div style={{ background: 'var(--mpesa-gray-50)', borderRadius: 12, padding: '4px 16px' }}>
              {[
                { label: 'Role', value: selectedUser.role },
                { label: 'Status', value: selectedUser.is_verified ? 'Verified' : 'Not Verified' },
                { label: 'Language', value: selectedUser.language },
                { label: 'Joined', value: new Date(selectedUser.created_at).toLocaleDateString() },
              ].map(row => (
                <div key={row.label} className="confirm-row">
                  <span className="label">{row.label}</span>
                  <span className="value" style={{ textTransform: 'capitalize' }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => toast.info('Reset PIN', 'PIN reset requires customer verification via ID')}>
                <i className="bi bi-key"></i> Reset PIN
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setSelectedUser(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerCareDashboard;