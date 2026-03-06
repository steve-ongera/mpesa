import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../services/api';

const NotificationPanel = ({ open, onClose }) => {
  const { notifications, unreadCount, markNotificationsRead } = useAuth();

  const handleMarkRead = () => {
    markNotificationsRead();
  };

  return (
    <div className={`notification-panel ${open ? 'open' : ''}`}>
      <div className="notification-header">
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Notifications</div>
          {unreadCount > 0 && (
            <div style={{ fontSize: 12, color: 'var(--mpesa-gray-500)', marginTop: 2 }}>
              {unreadCount} unread
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleMarkRead}
              style={{ fontSize: 12 }}
            >
              Mark all read
            </button>
          )}
          <button className="topbar-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <div className="empty-state-text">No notifications yet</div>
          </div>
        ) : (
          notifications.map(notif => (
            <div key={notif.id} className={`notification-item ${!notif.is_read ? 'unread' : ''}`}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {!notif.is_read && <div className="notification-dot" style={{ marginTop: 6 }}></div>}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--mpesa-gray-900)', lineHeight: 1.5 }}>
                    {notif.message}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--mpesa-gray-400)', marginTop: 4 }}>
                    {formatDate(notif.created_at)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;