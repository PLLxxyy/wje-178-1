import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Header from '../components/Header';

export default function GroupClasses() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await api('/classes');
      setClasses(data.filter((c: any) => c.status !== 'cancelled'));
    } catch (err) {
      console.error('加载团课失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (classId: number) => {
    setBookingId(classId);
    setMessage(null);
    try {
      const data = await api(`/classes/${classId}/book`, { method: 'POST' });
      setMessage({ type: 'success', text: data.message });
      loadClasses();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBookingId(null);
    }
  };

  const handleCancel = async (classId: number) => {
    if (!confirm('确定要取消预约吗？')) return;
    try {
      await api(`/classes/${classId}/cancel`, { method: 'POST' });
      setMessage({ type: 'success', text: '取消预约成功' });
      loadClasses();
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

  const futureClasses = classes.filter(c => isFuture(c.class_time));
  const pastClasses = classes.filter(c => !isFuture(c.class_time));

  return (
    <div className="app-container">
      <Header />
      <div className="main-content">
        <div className="page-title">
          团课列表
          <span className="page-subtitle">预约您喜欢的课程</span>
        </div>

        {message && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        {futureClasses.length === 0 && pastClasses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"> </div>
            <div className="empty-text">暂无团课安排</div>
          </div>
        ) : (
          <>
            {futureClasses.length > 0 && (
              <>
                <div style={{ fontSize: 16, fontWeight: 600, margin: '16px 0 12px', color: '#666' }}>即将开课</div>
                {futureClasses.map(cls => {
                  const fillRate = Math.round((cls.booked_count / cls.max_capacity) * 100);
                  const fillClass = fillRate >= 100 ? 'fill-red' : fillRate >= 80 ? 'fill-orange' : 'fill-green';
                  const isFull = cls.booked_count >= cls.max_capacity;

                  return (
                    <div key={cls.id} className="class-card">
                      <div className="class-info">
                        <div className="class-name">
                          {cls.name}
                          {isFull && <span className="badge badge-full" style={{ marginLeft: 8 }}>已满</span>}
                          {!isFull && <span className="badge badge-open" style={{ marginLeft: 8 }}>可预约</span>}
                        </div>
                        <div className="class-coach">教练：{cls.coach}</div>
                        <div className="class-desc">{cls.description}</div>
                        <div className="class-meta">
                          <span className="class-meta-item">
                            <span className="meta-icon"> </span>
                            {formatTime(cls.class_time)}
                          </span>
                          <span className="class-meta-item">
                            <span className="meta-icon"> </span>
                            {cls.waitlist_count > 0 ? `候补${cls.waitlist_count}人` : '无候补'}
                          </span>
                        </div>
                      </div>

                      <div className="class-capacity">
                        <div style={{ fontSize: 24, fontWeight: 700, color: isFull ? '#f5222d' : '#1890ff' }}>
                          {cls.booked_count}/{cls.max_capacity}
                        </div>
                        <div className="capacity-bar">
                          <div className={`capacity-fill ${fillClass}`} style={{ width: `${Math.min(fillRate, 100)}%` }}></div>
                        </div>
                        <div className="capacity-text">{isFull ? '名额已满' : `还剩${cls.max_capacity - cls.booked_count}个名额`}</div>
                      </div>

                      <div className="class-actions">
                        {!isFull ? (
                          <button
                            className="btn btn-primary"
                            onClick={() => handleBook(cls.id)}
                            disabled={bookingId === cls.id}
                          >
                            {bookingId === cls.id ? '预约中...' : '立即预约'}
                          </button>
                        ) : (
                          <button
                            className="btn btn-default"
                            onClick={() => handleBook(cls.id)}
                            disabled={bookingId === cls.id}
                          >
                            {bookingId === cls.id ? '加入中...' : '加入候补'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {pastClasses.length > 0 && (
              <>
                <div style={{ fontSize: 16, fontWeight: 600, margin: '24px 0 12px', color: '#999' }}>已结束</div>
                {pastClasses.map(cls => (
                  <div key={cls.id} className="class-card" style={{ opacity: 0.6 }}>
                    <div className="class-info">
                      <div className="class-name">{cls.name}</div>
                      <div className="class-coach">教练：{cls.coach}</div>
                      <div className="class-meta">
                        <span className="class-meta-item">
                          <span className="meta-icon"> </span>
                          {formatTime(cls.class_time)}
                        </span>
                      </div>
                    </div>
                    <div className="class-capacity">
                      <div style={{ fontSize: 14, color: '#999' }}>{cls.booked_count}/{cls.max_capacity}人</div>
                    </div>
                    <div className="class-actions">
                      <span className="badge" style={{ background: '#f5f5f5', color: '#999' }}>已结束</span>
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
