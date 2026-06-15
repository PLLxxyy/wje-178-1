import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Header from '../components/Header';

export default function History() {
  const [records, setRecords] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);
  const [classBookings, setClassBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'checkin' | 'classes' | 'stats'>('checkin');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [recordsData, statsData, classesData] = await Promise.all([
        api('/checkin/records'),
        api('/checkin/stats/monthly'),
        api('/classes/my')
      ]);
      setRecords(recordsData);
      setMonthlyStats(statsData);
      setClassBookings(classesData);
    } catch (err) {
      console.error('加载历史记录失败', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    return time.replace('T', ' ').substring(0, 16);
  };

  if (loading) {
    return (
      <div className="app-container">
        <Header />
        <div className="main-content"><div className="loading">加载中</div></div>
      </div>
    );
  }

  const totalCheckins = monthlyStats.reduce((sum, s) => sum + s.count, 0);
  const maxMonthly = Math.max(...monthlyStats.map(s => s.count), 1);

  return (
    <div className="app-container">
      <Header />
      <div className="main-content">
        <div className="page-title">
          历史记录
          <span className="page-subtitle">查看您的健身记录</span>
        </div>

        <div className="stats-grid" style={{ marginBottom: 16 }}>
          <div className="stat-card">
            <div className="stat-label">总入场次数</div>
            <div className="stat-value">{totalCheckins}</div>
            <div className="stat-label">次</div>
          </div>
          <div className="stat-card stat-green">
            <div className="stat-label">团课预约</div>
            <div className="stat-value">{classBookings.length}</div>
            <div className="stat-label">次</div>
          </div>
          <div className="stat-card stat-orange">
            <div className="stat-label">本月入场</div>
            <div className="stat-value">{monthlyStats.length > 0 && monthlyStats[0].month === new Date().toISOString().substring(0, 7) ? monthlyStats[0].count : 0}</div>
            <div className="stat-label">次</div>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${activeTab === 'checkin' ? 'active' : ''}`} onClick={() => setActiveTab('checkin')}>
            入场记录
          </button>
          <button className={`tab ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => setActiveTab('classes')}>
            团课记录
          </button>
          <button className={`tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
            月度统计
          </button>
        </div>

        {activeTab === 'checkin' && (
          <div className="table-container">
            {records.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"> </div>
                <div className="empty-text">暂无入场记录</div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>次卡类型</th>
                    <th>核销码</th>
                    <th>入场时间</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, index) => (
                    <tr key={record.id}>
                      <td>{index + 1}</td>
                      <td>{record.pass_type_name}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{record.verify_code}</td>
                      <td>{formatTime(record.checkin_time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="table-container">
            {classBookings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"> </div>
                <div className="empty-text">暂无团课记录</div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>课程名称</th>
                    <th>教练</th>
                    <th>上课时间</th>
                    <th>状态</th>
                    <th>签到</th>
                  </tr>
                </thead>
                <tbody>
                  {classBookings.map((booking: any) => (
                    <tr key={booking.id}>
                      <td>{booking.name}</td>
                      <td>{booking.coach}</td>
                      <td>{formatTime(booking.class_time)}</td>
                      <td>
                        <span className={`badge ${booking.status === 'booked' ? 'badge-booked' : 'badge-waitlisted'}`}>
                          {booking.status === 'booked' ? '已预约' : `候补第${booking.queue_position}位`}
                        </span>
                      </td>
                      <td>
                        {booking.checked_in ? (
                          <span className="badge badge-checked-in">已签到</span>
                        ) : (
                          <span className="badge" style={{ background: '#f5f5f5', color: '#999' }}>未签到</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="card">
            <div className="card-title">按月入场统计</div>
            {monthlyStats.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"> </div>
                <div className="empty-text">暂无统计数据</div>
              </div>
            ) : (
              <>
                <div className="monthly-stats">
                  {monthlyStats.map(stat => (
                    <div key={stat.month} className="monthly-stat-item">
                      <div className="month">{stat.month}</div>
                      <div className="count">{stat.count}</div>
                      <div className="month">次</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 24 }}>
                  <div className="card-title">趋势图</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 200, padding: '0 8px' }}>
                    {monthlyStats.slice().reverse().map(stat => (
                      <div key={stat.month} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{
                          background: 'linear-gradient(180deg, #1890ff 0%, #69c0ff 100%)',
                          height: `${(stat.count / maxMonthly) * 160}px`,
                          borderRadius: '4px 4px 0 0',
                          minHeight: 8,
                          transition: 'height 0.3s'
                        }}></div>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{stat.month.substring(5)}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1890ff' }}>{stat.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
