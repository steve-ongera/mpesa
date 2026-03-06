import React from 'react';
import { useAuth } from '../../context/AuthContext';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/send-money': 'Send Money',
  '/withdraw': 'Withdraw Cash',
  '/airtime': 'Buy Airtime',
  '/lipa': 'Lipa na M-PESA',
  '/mshwari': 'M-Shwari',
  '/kcb': 'KCB M-PESA',
  '/account': 'My Account',
  '/agent': 'Agent Dashboard',
  '/agent/float': 'Float Management',
  '/agent/transactions': 'Transactions',
  '/admin': 'Admin Overview',
  '/admin/users': 'User Management',
  '/admin/transactions': 'All Transactions',
  '/admin/agents': 'Agent Management',
  '/care': 'Customer Care',
  '/care/register': 'Register Customer',
  '/care/search': 'Find Customer',
  '/care/transactions': 'Transactions',
};

const Topbar = ({ currentPath, onMenuToggle, sidebarCollapsed, onNotificationToggle, notificationOpen }) => {
  const { user, unreadCount, logout, mpesaBalance } = useAuth();
  const title = pageTitles[currentPath] || 'M-PESA';

  return (
    <header className={`topbar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="topbar-left">
        {/* Hamburger for mobile / collapse desktop */}
        <button className="topbar-btn" onClick={onMenuToggle} title="Toggle Menu">
          <i className="bi bi-list" style={{ fontSize: 22 }}></i>
        </button>
        <h1 className="topbar-title">{title}</h1>
      </div>

      <div className="topbar-right">
        {/* Balance quick view */}
        {mpesaBalance !== null && (
          <div style={{
            background: 'var(--mpesa-green-pale)',
            color: 'var(--mpesa-green)',
            fontWeight: 800,
            fontSize: 14,
            padding: '6px 14px',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <i className="bi bi-wallet2"></i>
            KES {parseFloat(mpesaBalance).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
          </div>
        )}

        {/* Notifications */}
        <button
          className="topbar-btn"
          onClick={onNotificationToggle}
          title="Notifications"
          style={notificationOpen ? { background: 'var(--mpesa-green-pale)', color: 'var(--mpesa-green)' } : {}}
        >
          <i className="bi bi-bell-fill"></i>
          {unreadCount > 0 && (
            <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>

        {/* Profile / Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--mpesa-green)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 14
          }}>
            {user?.first_name?.[0]?.toUpperCase() || user?.phone_number?.slice(-1) || '?'}
          </div>
          <button className="topbar-btn" onClick={logout} title="Sign Out">
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;