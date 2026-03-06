import React, { useState, useEffect } from 'react';
import { adminAPI, formatKES, formatDate } from '../../services/api';
import { toast } from '../../components/common/Toast';

const AdminDashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ first_name: '', last_name: '', phone_number: '', role: 'customer', password: '', email: '' });
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, txnData] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getTransactions(),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setTransactions(txnData);
    } catch (e) {
      toast.error('Error', 'Failed to load data');
    } finally { setLoading(false); }
  };

  const handleCreateUser = async () => {
    setCreating(true);
    try {
      await adminAPI.createUser(newUser);
      toast.success('User Created', `Account created for ${newUser.phone_number}`);
      setShowCreateUser(false);
      setNewUser({ first_name: '', last_name: '', phone_number: '', role: 'customer', password: '', email: '' });
      loadData();
    } catch (err) {
      toast.error('Error', err.phone_number?.[0] || err.error || 'Failed to create user');
    } finally { setCreating(false); }
  };

  const filteredUsers = users.filter(u =>
    u.phone_number?.includes(searchQuery) ||
    u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const roleColors = {
    customer: { bg: 'var(--mpesa-green-pale)', color: 'var(--mpesa-green-dark)' },
    agent: { bg: '#E0F2FE', color: '#0369A1' },
    admin: { bg: '#EDE9FE', color: '#7C3AED' },
    customer_care: { bg: '#FEF9C3', color: '#92400E' },
  };

  const statCards = stats ? [
    { icon: '👥', label: 'Total Users', value: stats.total_users?.toLocaleString(), color: '#00A651', bg: '#E8F8EF' },
    { icon: '👤', label: 'Customers', value: stats.total_customers?.toLocaleString(), color: '#0369A1', bg: '#E0F2FE' },
    { icon: '🏪', label: 'Agents', value: stats.total_agents?.toLocaleString(), color: '#7C3AED', bg: '#EDE9FE' },
    { icon: '💸', label: 'Total Transactions', value: stats.total_transactions?.toLocaleString(), color: '#D97706', bg: '#FEF9C3' },
    { icon: '💰', label: 'Transaction Volume', value: formatKES(stats.total_volume || 0), color: '#059669', bg: '#ECFDF5' },
    { icon: '📊', label: "Today's Transactions", value: stats.today_transactions?.toLocaleString(), color: '#E31E24', bg: '#FFF0F0' },
  ] : [];

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {statCards.map(card => (
          <div key={card.label} className="stat-card">
            <div className="stat-icon" style={{ background: card.bg, color: card.color }}>{card.icon}</div>
            <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['overview', 'users', 'transactions'].map(tab => (
          <button
            key={tab}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setActiveTab(tab)}
            style={{ textTransform: 'capitalize' }}
          >
            {tab === 'overview' ? '📊 Overview' :
             tab === 'users' ? '👥 Users' : '💸 Transactions'}
          </button>
        ))}
        <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setShowCreateUser(true)}>
          <i className="bi bi-person-plus-fill"></i> Create Account
        </button>
      </div>

      {/* Users tab */}
      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">All Users ({filteredUsers.length})</div>
            <div style={{ position: 'relative' }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--mpesa-gray-400)' }}></i>
              <input
                className="form-control"
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 36, width: 260, height: 38, fontSize: 13 }}
              />
            </div>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const rc = roleColors[u.role] || roleColors.customer;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'var(--mpesa-green)', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700
                          }}>
                            {u.first_name?.[0] || u.phone_number?.[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{u.full_name}</div>
                            <div style={{ fontSize: 11, color: 'var(--mpesa-gray-400)' }}>{u.email || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{u.phone_number}</td>
                      <td>
                        <span className="badge" style={{ background: rc.bg, color: rc.color, textTransform: 'capitalize' }}>
                          {u.role?.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.is_verified ? 'badge-green' : 'badge-yellow'}`}>
                          {u.is_verified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--mpesa-gray-500)' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transactions tab */}
      {activeTab === 'transactions' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">All Transactions</div>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(txn => (
                  <tr key={txn.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{txn.transaction_id}</td>
                    <td style={{ fontSize: 12, fontWeight: 600 }}>{txn.transaction_type.replace(/_/g, ' ')}</td>
                    <td style={{ fontSize: 12 }}>{txn.sender_phone || '-'}</td>
                    <td style={{ fontSize: 12 }}>{txn.receiver_phone || '-'}</td>
                    <td style={{ fontWeight: 700 }}>{formatKES(txn.amount)}</td>
                    <td>
                      <span className={`txn-status ${txn.status}`}>{txn.status}</span>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--mpesa-gray-500)' }}>
                      {formatDate(txn.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div className="card-header"><div className="card-title">Recent Users</div></div>
            <div className="card-body p-0">
              {users.slice(0, 6).map(u => {
                const rc = roleColors[u.role] || roleColors.customer;
                return (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 20px', borderBottom: '1px solid var(--mpesa-gray-100)'
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', background: 'var(--mpesa-green)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: 14
                    }}>
                      {u.first_name?.[0] || '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{u.full_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--mpesa-gray-400)' }}>{u.phone_number}</div>
                    </div>
                    <span className="badge" style={{ background: rc.bg, color: rc.color, fontSize: 10 }}>
                      {u.role?.replace('_', ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Recent Transactions</div></div>
            <div className="card-body p-0">
              {transactions.slice(0, 6).map(txn => (
                <div key={txn.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 20px', borderBottom: '1px solid var(--mpesa-gray-100)'
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'var(--mpesa-green-pale)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16
                  }}>💸</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{txn.transaction_type.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: 11, color: 'var(--mpesa-gray-400)' }}>{txn.sender_phone}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--mpesa-gray-900)' }}>{formatKES(txn.amount)}</div>
                    <span className={`txn-status ${txn.status}`} style={{ fontSize: 10 }}>{txn.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="modal-overlay" onClick={() => setShowCreateUser(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle"></div>
            <div className="modal-header">
              <div className="modal-title">Create Account</div>
              <button className="modal-close" onClick={() => setShowCreateUser(false)}><i className="bi bi-x-lg"></i></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className="form-control" placeholder="First name"
                  value={newUser.first_name} onChange={e => setNewUser({ ...newUser, first_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="form-control" placeholder="Last name"
                  value={newUser.last_name} onChange={e => setNewUser({ ...newUser, last_name: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-control" placeholder="0712345678" type="tel"
                value={newUser.phone_number} onChange={e => setNewUser({ ...newUser, phone_number: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email (optional)</label>
              <input className="form-control" placeholder="email@example.com" type="email"
                value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-control" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                <option value="customer">Customer</option>
                <option value="agent">Agent</option>
                <option value="customer_care">Customer Care</option>
                <option value="admin">Admin / ICT</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" placeholder="Set password" type="password"
                value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
            </div>

            <button
              className={`btn btn-primary btn-full ${creating ? 'btn-loading' : ''}`}
              disabled={creating}
              onClick={handleCreateUser}
            >
              {!creating && <><i className="bi bi-person-plus-fill"></i> Create Account</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;