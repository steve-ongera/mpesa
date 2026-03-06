import React, { useState, useEffect } from 'react';

let toastId = 0;
let addToast = null;

export const toast = {
  success: (title, msg) => addToast?.({ type: 'success', title, msg }),
  error: (title, msg) => addToast?.({ type: 'error', title, msg }),
  info: (title, msg) => addToast?.({ type: 'info', title, msg }),
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToast = (t) => {
      const id = ++toastId;
      setToasts(prev => [...prev, { ...t, id }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== id));
      }, 5000);
    };
    return () => { addToast = null; };
  }, []);

  // Listen for WebSocket notifications
  useEffect(() => {
    const handler = (e) => {
      const data = e.detail;
      toast.success('M-PESA', data.message?.substring(0, 80) + (data.message?.length > 80 ? '...' : ''));
    };
    window.addEventListener('mpesa-notification', handler);
    return () => window.removeEventListener('mpesa-notification', handler);
  }, []);

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">{icons[t.type]}</span>
          <div className="toast-content">
            <div className="toast-title">{t.title}</div>
            {t.msg && <div className="toast-msg">{t.msg}</div>}
          </div>
          <button
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mpesa-gray-400)', fontSize: 16, padding: '0 4px' }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;