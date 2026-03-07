import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authHelpers, WebSocketService, dashboardAPI, accountAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Safely read stored user — never crash if localStorage has bad JSON
  const [user, setUser] = useState(() => {
    try { return authHelpers.getUser(); }
    catch { return null; }
  });

  const [mpesaBalance,   setMpesaBalance]   = useState(null);
  const [mshwariBalance, setMshwariBalance] = useState(null);
  const [kcbBalance,     setKcbBalance]     = useState(null);
  const [notifications,  setNotifications]  = useState([]);
  const [unreadCount,    setUnreadCount]    = useState(0);
  const [isLoading,      setIsLoading]      = useState(false);

  // Use a ref so the latest ws instance is always accessible in logout
  const wsRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;

    // If there's no token, clear the stale user rather than firing 401s
    const token = localStorage.getItem('access_token');
    if (!token) { setUser(null); return; }

    const ws = new WebSocketService(user.id, {
      onNotification: (data) => {
        setNotifications(prev => [data, ...prev]);
        setUnreadCount(prev => prev + 1);
        window.dispatchEvent(new CustomEvent('mpesa-notification', { detail: data }));
      },
      onBalanceUpdate: (data) => {
        if (data.mpesa_balance   !== undefined) setMpesaBalance(data.mpesa_balance);
        if (data.mshwari_balance !== undefined) setMshwariBalance(data.mshwari_balance);
        if (data.kcb_balance     !== undefined) setKcbBalance(data.kcb_balance);
      },
      onTransaction: (data) => {
        window.dispatchEvent(new CustomEvent('mpesa-transaction', { detail: data }));
      },
      onConnect:    () => console.log('[WS] connected'),
      onDisconnect: () => console.log('[WS] disconnected'),
    });

    ws.connect();
    wsRef.current = ws;

    loadBalance();
    loadNotifications();

    return () => { ws.disconnect(); wsRef.current = null; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadBalance = async () => {
    try {
      const data = await dashboardAPI.getBalance();
      if (data) {
        setMpesaBalance(data.mpesa_balance ?? null);
        if (data.mshwari_balance) setMshwariBalance(data.mshwari_balance);
        if (data.kcb_balance)     setKcbBalance(data.kcb_balance);
      }
    } catch (_) {}
  };

  const loadNotifications = async () => {
    try {
      const data = await accountAPI.getNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    } catch (_) {}
  };

  const login = useCallback((authData) => {
    authHelpers.saveAuth(authData);
    setUser(authData.user);
    if (authData.mpesa_account?.balance !== undefined) {
      setMpesaBalance(authData.mpesa_account.balance);
    }
  }, []);

  const logout = useCallback(() => {
    wsRef.current?.disconnect();
    wsRef.current = null;
    authHelpers.logout();
    setUser(null);
    setMpesaBalance(null);
    setMshwariBalance(null);
    setKcbBalance(null);
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const markNotificationsRead = useCallback(async () => {
    try {
      await accountAPI.markNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (_) {}
  }, []);

  return (
    <AuthContext.Provider value={{
      user, login, logout, isLoading, setIsLoading,
      mpesaBalance, mshwariBalance, kcbBalance,
      setMpesaBalance, setMshwariBalance, setKcbBalance,
      notifications, unreadCount,
      markNotificationsRead, loadNotifications,
      refreshBalance: loadBalance,
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