import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import Header from '../components/Header';

export default function MyClasses() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const data = await api('/classes/my');
      setBookings(data);
    } catch (err) {
      console.error('加载团课预约失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (classId: number) => {
    if (!confirm('确定要取消预约吗？取消后候补用户将自动递补。')) return;
    try {
      await api(`/classes/${classId}/cancel`, { method: 'POST' });
      setMessage({ type: 'success', text: '取消预约成功' });
      loadBookings();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCheckin = async (classId: number) => {
    try {
      await api(`/classes/${classId}/checkin`, { method: 'POST' });
      setMessage({ type: 'success', text: '签到成功！' });
      loadBookings();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const formatTime = (time: string) => {
    const d = new Date(time);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekDay = weekDays[d.getDay()];
    return `${month}月${day}日 周${weekDay} ${hours}:${minutes}`;
  };

  const isToday = (time: string) => {
    const d = new Date(time);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  };

  const isFuture = (time: string) => {
    return new Date(time) > new Date();
  };

  if (loading) {
    return (
      <div className="app-container">
        <Header />
        <div className="main-content"><div className="loading">加载中</div></div>
      </div>
    );
  }

  const futureBookings = bookings.filter(b => isFuture(b.class_time));
  const pastBookings = bookings.filter(b => !isFuture(b.class_time));

  return (
    <div className="app-container">
      <Header />
      <div className="main-content">
        <div className="page-title">
          我的团课
          <span className="page-subtitle">查看已预约的课程</span>
          <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => navigate('/classes')}>
            预约新课程
          </button>
        </div>

        {message && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        {bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"> </div>
            <div className="empty-text">暂无团课预约</div>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/classes')}>
              查看团课列表
            </button>
          </div>
        ) : (
          <>
            {futureBookings.length > 0 && (
              <>
                <div style={{ fontSize: 16, fontWeight: 600, margin: '16px 0 12px', color: '#666' }}>待上课</div>
                {futureBookings.map((booking: any) => (
                  <div key={booking.id} className="class-card">
                    <div className="class-info">
                      <div className="class-name">
                        {booking.name}
                        {booking.status === 'waitlisted' && (
                          <span className="badge badge-waitlisted" style={{ marginLeft: 8 }}>
                            候补第{booking.queue_position}位
                          </span>
                        )}
                        {booking.status === 'booked' && (
                          <span className="badge badge-booked" style={{ marginLeft: 8 }}>已预约</span>
                        )}
                        {booking.checked_in ? (
                          <span className="badge badge-checked-in" style={{ marginLeft: 8 }}>已签到</span>
                        ) : isToday(booking.class_time) ? (
                          <span className="badge" style={{ background: '#fff7e6', color: '#fa8c16', marginLeft: 8 }}>今日上课</span>
                        ) : null}
                      </div>
                      <div className="class-coach">教练：{booking.coach}</div>
                      <div className="class-meta">
                        <span className="class-meta-item">
                          <span className="meta-icon"> </span>
                          {formatTime(booking.class_time)}
                        </span>
                        <span className="class-meta-item">
                          <span className="meta-icon"> </span>
                          {booking.booked_count}/{booking.max_capacity}人
                        </span>
                      </div>
                    </div>

                    <div className="class-actions">
                      {booking.status === 'booked' && !booking.checked_in && isToday(booking.class_time) && (
                        <button className="btn btn-success" onClick={() => handleCheckin(booking.class_id)}>
                          签到
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancel(booking.class_id)}>
                        取消预约
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {pastBookings.length > 0 && (
              <>
                <div style={{ fontSize: 16, fontWeight: 600, margin: '24px 0 12px', color: '#999' }}>已结束</div>
                {pastBookings.map((booking: any) => (
                  <div key={booking.id} className="class-card" style={{ opacity: 0.6 }}>
                    <div className="class-info">
                      <div className="class-name">
                        {booking.name}
                        {booking.checked_in ? (
                          <span className="badge badge-checked-in" style={{ marginLeft: 8 }}>已签到</span>
                        ) : (
                          <span className="badge" style={{ background: '#f5f5f5', color: '#999', marginLeft: 8 }}>未签到</span>
                        )}
                      </div>
                      <div className="class-coach">教练：{booking.coach}</div>
                      <div className="class-meta">
                        <span className="class-meta-item">
                          <span className="meta-icon"> </span>
                          {formatTime(booking.class_time)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
