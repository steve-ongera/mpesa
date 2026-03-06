import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/common/Sidebar';
import Topbar from './components/common/Topbar';
import NotificationPanel from './components/common/NotificationPanel';
import ToastContainer from './components/common/Toast';

// Pages
import LoginPage from './pages/LoginPage';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import SendMoneyPage from './pages/customer/SendMoneyPage';
import MshwariPage from './pages/customer/MshwariPage';
import LipaNaMpesaPage from './pages/customer/LipaNaMpesaPage';
import WithdrawPage from './pages/customer/WithdrawPage';
import AirtimePage  from './pages/customer/AirtimePage';
import KCBPage      from './pages/customer/KCBPage';
import AccountPage  from './pages/customer/AccountPage';
import AgentDashboard from './pages/agent/AgentDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import CustomerCareDashboard from './pages/customercare/CustomerCareDashboard';

import './styles/global-style.css';

// ========== ROUTER ==========
const AppRouter = () => {
  const { user } = useAuth();
  const [currentPath, setCurrentPath] = useState('/login');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // On login, redirect to the right dashboard
  useEffect(() => {
    if (user) {
      const defaults = {
        customer: '/dashboard',
        agent: '/agent',
        admin: '/admin',
        customer_care: '/care',
      };
      setCurrentPath(defaults[user.role] || '/dashboard');
    } else {
      setCurrentPath('/login');
    }
  }, [user?.id]);

  const navigate = (path) => {
    setCurrentPath(path.split('?')[0]);
    setMobileOpen(false);
  };

  const handleMenuToggle = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen(!mobileOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  // If not logged in, show login
  if (!user || currentPath === '/login') {
    return (
      <>
        <LoginPage onNavigate={navigate} />
        <ToastContainer />
      </>
    );
  }

  const renderPage = () => {
    switch (currentPath) {
      // Customer routes
      case '/dashboard': return <CustomerDashboard onNavigate={navigate} />;
      case '/send-money': return <SendMoneyPage onNavigate={navigate} />;
      case '/withdraw': return <WithdrawPage onNavigate={navigate} />;
      case '/airtime': return <AirtimePage onNavigate={navigate} />;
      case '/lipa': return <LipaNaMpesaPage onNavigate={navigate} />;
      case '/mshwari': return <MshwariPage onNavigate={navigate} />;
      case '/kcb': return <KCBPage onNavigate={navigate} />;
      case '/account': return <AccountPage onNavigate={navigate} />;

      // Agent routes
      case '/agent':
      case '/agent/float':
      case '/agent/transactions':
      case '/agent/commission':
      case '/agent/customers':
        return <AgentDashboard onNavigate={navigate} />;

      // Admin routes
      case '/admin':
      case '/admin/users':
      case '/admin/transactions':
      case '/admin/agents':
      case '/admin/analytics':
      case '/admin/settings':
        return <AdminDashboard onNavigate={navigate} />;

      // Customer Care routes
      case '/care':
      case '/care/register':
      case '/care/search':
      case '/care/transactions':
      case '/care/tickets':
        return <CustomerCareDashboard onNavigate={navigate} />;

      default:
        return (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Page Not Found</div>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Go Home</button>
          </div>
        );
    }
  };

  return (
    <div className="app-wrapper">
      <Sidebar
        currentPath={currentPath}
        onNavigate={navigate}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Topbar
          currentPath={currentPath}
          onMenuToggle={handleMenuToggle}
          sidebarCollapsed={sidebarCollapsed}
          onNotificationToggle={() => setNotificationOpen(!notificationOpen)}
          notificationOpen={notificationOpen}
        />

        <main className="page-content">
          {renderPage()}
        </main>
      </div>

      <NotificationPanel
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />

      <ToastContainer />
    </div>
  );
};

// ========== MAIN APP ==========
const App = () => {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};

export default App;