import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authHelpers, WebSocketService, dashboardAPI, accountAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authHelpers.getUser());
  const [mpesaBalance, setMpesaBalance] = useState(null);
  const [mshwariBalance, setMshwariBalance] = useState(null);
  const [kcbBalance, setKcbBalance] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [wsService, setWsService] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize WebSocket when user logs in
  useEffect(() => {
    if (user?.id) {
      const ws = new WebSocketService(user.id, {
        onNotification: (data) => {
          setNotifications(prev => [data, ...prev]);
          setUnreadCount(prev => prev + 1);
          // Show toast
          window.dispatchEvent(new CustomEvent('mpesa-notification', { detail: data }));
        },
        onBalanceUpdate: (data) => {
          if (data.mpesa_balance !== undefined) setMpesaBalance(data.mpesa_balance);
          if (data.mshwari_balance !== undefined) setMshwariBalance(data.mshwari_balance);
          if (data.kcb_balance !== undefined) setKcbBalance(data.kcb_balance);
        },
        onTransaction: (data) => {
          window.dispatchEvent(new CustomEvent('mpesa-transaction', { detail: data }));
        },
        onConnect: () => console.log('Real-time connected'),
        onDisconnect: () => console.log('Real-time disconnected'),
      });
      ws.connect();
      setWsService(ws);

      // Load initial balance
      loadBalance();
      loadNotifications();

      return () => ws.disconnect();
    }
  }, [user?.id]);

  const loadBalance = async () => {
    try {
      const data = await dashboardAPI.getBalance();
      if (data) {
        setMpesaBalance(data.mpesa_balance);
        if (data.mshwari_balance) setMshwariBalance(data.mshwari_balance);
        if (data.kcb_balance) setKcbBalance(data.kcb_balance);
      }
    } catch (e) {}
  };

  const loadNotifications = async () => {
    try {
      const data = await accountAPI.getNotifications();
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (e) {}
  };

  const login = useCallback((authData) => {
    authHelpers.saveAuth(authData);
    setUser(authData.user);
    if (authData.mpesa_account) {
      setMpesaBalance(authData.mpesa_account.balance);
    }
  }, []);

  const logout = useCallback(() => {
    wsService?.disconnect();
    authHelpers.logout();
    setUser(null);
    setMpesaBalance(null);
    setNotifications([]);
    setUnreadCount(0);
  }, [wsService]);

  const markNotificationsRead = useCallback(async () => {
    await accountAPI.markNotificationsRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }, []);

  const refreshBalance = loadBalance;

  return (
    <AuthContext.Provider value={{
      user, login, logout, isLoading, setIsLoading,
      mpesaBalance, mshwariBalance, kcbBalance,
      setMpesaBalance, setMshwariBalance, setKcbBalance,
      notifications, unreadCount,
      markNotificationsRead, loadNotifications,
      refreshBalance,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;