import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationRead, markAllNotificationsRead, getUnreadCount } from '../utils/api';
import Header from '../components/Header';

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const [data, count] = await Promise.all([
        getNotifications(),
        getUnreadCount()
      ]);
      setNotifications(data);
      setUnreadCount(count);
    } catch (err) {
      console.error('加载通知失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: 1 } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('标记已读失败', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('全部标记已读失败', err);
    }
  };

  const handleClickNotification = (notification: any) => {
    if (!notification.is_read) {
      handleMarkRead(notification.id);
    }
    if (notification.type === 'waitlist_promoted' && notification.related_id) {
      navigate('/my-classes');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'waitlist_promoted': return '✅';
      default: return '🔔';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'waitlist_promoted': return '候补转正';
      default: return '通知';
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <Header />
        <div className="main-content"><div className="loading">加载中</div></div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header />
      <div className="main-content">
        <div className="page-title">
          消息通知
          <span className="page-subtitle">
            {unreadCount > 0 ? `${unreadCount} 条未读` : '暂无未读消息'}
          </span>
          {unreadCount > 0 && (
            <button
              className="btn btn-default"
              style={{ marginLeft: 'auto', fontSize: 13 }}
              onClick={handleMarkAllRead}
            >
              全部已读
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <div className="empty-text">暂无消息通知</div>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              className="card"
              style={{
                marginBottom: 8,
                cursor: 'pointer',
                borderLeft: notification.is_read ? 'none' : '3px solid #1890ff',
                opacity: notification.is_read ? 0.7 : 1,
              }}
              onClick={() => handleClickNotification(notification)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>{getTypeIcon(notification.type)}</span>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>
                      {notification.title}
                    </span>
                    {!notification.is_read && (
                      <span style={{
                        background: '#f5222d',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 8,
                        padding: '1px 6px',
                      }}>
                        新
                      </span>
                    )}
                    <span className="badge" style={{
                      background: notification.type === 'waitlist_promoted' ? '#e6f7ff' : '#f0f0f0',
                      color: notification.type === 'waitlist_promoted' ? '#1890ff' : '#666',
                      fontSize: 11,
                    }}>
                      {getTypeLabel(notification.type)}
                    </span>
                  </div>
                  <div style={{ color: '#666', fontSize: 13, lineHeight: 1.6 }}>
                    {notification.content}
                  </div>
                  <div style={{ color: '#999', fontSize: 12, marginTop: 6 }}>
                    {notification.created_at}
                  </div>
                </div>
                {!notification.is_read && (
                  <button
                    className="btn btn-default btn-sm"
                    style={{ marginLeft: 8, whiteSpace: 'nowrap', fontSize: 12 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkRead(notification.id);
                    }}
                  >
                    标记已读
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
