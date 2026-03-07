import React from 'react';
import { useAuth } from '../../context/AuthContext';

const customerNav = [
  { icon: 'bi-grid-fill', label: 'Dashboard', path: '/dashboard' },
  { icon: 'bi-arrow-up-right-circle', label: 'Send Money', path: '/send-money' },
  { icon: 'bi-cash-coin', label: 'Withdraw', path: '/withdraw' },
  { icon: 'bi-phone', label: 'Buy Airtime', path: '/airtime' },
  { icon: 'bi-receipt-cutoff', label: 'Lipa na M-PESA', path: '/lipa', section: 'lipa' },
  { icon: 'bi-piggy-bank', label: 'M-Shwari', path: '/mshwari' },
  { icon: 'bi-building-fill', label: 'KCB M-PESA', path: '/kcb' },
  { icon: 'bi-person-circle', label: 'My Account', path: '/account' },
];

const agentNav = [
  { icon: 'bi-grid-fill', label: 'Dashboard', path: '/agent' },
  { icon: 'bi-cash-coin', label: 'Float Management', path: '/agent/float' },
  { icon: 'bi-people', label: 'Customer Service', path: '/agent/customers' },
  { icon: 'bi-graph-up', label: 'Transactions', path: '/agent/transactions' },
  { icon: 'bi-bar-chart', label: 'Commission', path: '/agent/commission' },
];

const adminNav = [
  { icon: 'bi-grid-1x2-fill',      label: 'Overview',       path: '/admin'                  },
  { icon: 'bi-people-fill',        label: 'Users',          path: '/admin/users'            },
  { icon: 'bi-arrow-left-right',   label: 'Transactions',   path: '/admin/transactions'     },
  { icon: 'bi-shop-window',        label: 'Agents',         path: '/admin/agents'           },
  { icon: 'bi-receipt-cutoff',     label: 'Billers & Tills',path: '/admin/billers'          },
  { icon: 'bi-bell-fill',          label: 'Notifications',  path: '/admin/notifications'    },
  { icon: 'bi-gear-fill',          label: 'Settings',       path: '/admin/settings'         },
];

const customerCareNav = [
  { icon: 'bi-headset', label: 'Dashboard', path: '/care' },
  { icon: 'bi-person-plus-fill', label: 'Register Customer', path: '/care/register' },
  { icon: 'bi-search', label: 'Find Customer', path: '/care/search' },
  { icon: 'bi-arrow-left-right', label: 'Transactions', path: '/care/transactions' },
  { icon: 'bi-chat-dots', label: 'Support Tickets', path: '/care/tickets' },
];

const navByRole = {
  customer: customerNav,
  agent: agentNav,
  admin: adminNav,
  customer_care: customerCareNav,
};

const roleLabels = {
  customer: 'Customer',
  agent: 'Agent',
  admin: 'ICT Admin',
  customer_care: 'Customer Care',
};

const Sidebar = ({ currentPath, onNavigate, collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const { user, unreadCount } = useAuth();
  const navItems = navByRole[user?.role] || customerNav;
  const initials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.phone_number?.slice(-2) : '?';

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={onMobileClose}
      />

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-img">M</div>
          {!collapsed && (
            <div className="sidebar-logo-text">
              <span className="brand">M-PESA</span>
              <span className="sub">Banking App</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {!collapsed && (
            <div className="nav-section-label">Main Menu</div>
          )}

          {navItems.map((item) => (
            <div
              key={item.path}
              className={`nav-item ${currentPath === item.path ? 'active' : ''}`}
              onClick={() => { onNavigate(item.path); onMobileClose?.(); }}
              title={collapsed ? item.label : ''}
            >
              <i className={`bi ${item.icon} nav-icon`}></i>
              {!collapsed && <span className="nav-label">{item.label}</span>}
              {!collapsed && item.label === 'Dashboard' && unreadCount > 0 && (
                <span className="nav-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </div>
          ))}
        </nav>

        {/* User profile */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">
                {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.phone_number}
              </div>
              <div className="sidebar-user-role">{roleLabels[user?.role] || user?.role}</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;