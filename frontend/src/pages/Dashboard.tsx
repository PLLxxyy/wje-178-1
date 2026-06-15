import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getUser } from '../utils/api';
import Header from '../components/Header';

export default function Dashboard() {
  const [passes, setPasses] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [passesData, classesData, annData] = await Promise.all([
        api('/passes/my'),
        api('/classes'),
        api('/admin/announcements')
      ]);
      setPasses(passesData);
      setClasses(classesData.filter((c: any) => c.status !== 'cancelled').slice(0, 5));
      setAnnouncements(annData.slice(0, 3));
    } catch (err) {
      console.error('加载数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  const activePasses = passes.filter(p => p.status === 'active');

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
          欢迎回来，{user?.name}！
        </div>

        <div className="stats-grid">
          <div className="stat-card" onClick={() => navigate('/my-passes')} style={{ cursor: 'pointer' }}>
            <div className="stat-label">有效次卡</div>
            <div className="stat-value">{activePasses.length}</div>
            <div className="stat-label">张</div>
          </div>
          <div className="stat-card stat-green" onClick={() => navigate('/my-classes')} style={{ cursor: 'pointer' }}>
            <div className="stat-label">待上课团课</div>
            <div className="stat-value">{classes.length}</div>
            <div className="stat-label">节</div>
          </div>
          <div className="stat-card stat-orange" onClick={() => navigate('/pass-store')} style={{ cursor: 'pointer' }}>
            <div className="stat-label">次卡套餐</div>
            <div className="stat-value">4</div>
            <div className="stat-label">种可选</div>
          </div>
          <div className="stat-card stat-purple" onClick={() => navigate('/checkin')} style={{ cursor: 'pointer' }}>
            <div className="stat-label">快速核销</div>
            <div className="stat-value" style={{ fontSize: '24px' }}>扫码入场</div>
          </div>
        </div>

        <div className="grid-2">
          <div>
            <div className="card">
              <div className="card-title">我的次卡</div>
              {activePasses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"> </div>
                  <div className="empty-text">暂无有效次卡</div>
                  <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/pass-store')}>
                    购买次卡
                  </button>
                </div>
              ) : (
                activePasses.map((pass: any) => (
                  <div key={pass.id} className="pass-card pass-active" style={{ marginBottom: 8, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>{pass.pass_type_name}</span>
                      <span style={{ color: '#1890ff', fontWeight: 700, fontSize: 18 }}>
                        {pass.pass_type === 'times' ? `${pass.remaining_times}次` : '不限次'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      到期时间：{pass.end_date.split(' ')[0]}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/checkin')}>
              <div className="card-title">入场核销</div>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}> </div>
                <div style={{ color: '#666' }}>选择次卡生成验证码，快速入场</div>
                <button className="btn btn-primary" style={{ marginTop: 12 }}>前往核销</button>
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <div className="card-title">
                热门团课
                <span style={{ float: 'right', fontSize: 12, color: '#1890ff', cursor: 'pointer', fontWeight: 400 }} onClick={() => navigate('/classes')}>
                  查看全部 &gt;
                </span>
              </div>
              {classes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"> </div>
                  <div className="empty-text">暂无团课</div>
                </div>
              ) : (
                classes.map((cls: any) => {
                  const fillRate = Math.round((cls.booked_count / cls.max_capacity) * 100);
                  const fillClass = fillRate >= 100 ? 'fill-red' : fillRate >= 80 ? 'fill-orange' : 'fill-green';
                  return (
                    <div key={cls.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>{cls.name}</span>
                        <span className={`badge ${cls.status === 'full' ? 'badge-full' : 'badge-open'}`}>
                          {cls.status === 'full' ? '已满' : '可预约'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                        {cls.coach} | {cls.class_time.replace('T', ' ').substring(0, 16)}
                      </div>
                      <div className="capacity-bar" style={{ marginTop: 6 }}>
                        <div className={`capacity-fill ${fillClass}`} style={{ width: `${Math.min(fillRate, 100)}%` }}></div>
                      </div>
                      <div className="capacity-text">{cls.booked_count}/{cls.max_capacity}人</div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="card">
              <div className="card-title">最新公告</div>
              {announcements.length === 0 ? (
                <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无公告</div>
              ) : (
                announcements.map((ann: any) => (
                  <div key={ann.id} className={`announcement-card type-${ann.type}`}>
                    <div className="ann-title">{ann.title}</div>
                    <div className="ann-content">{ann.content}</div>
                    <div className="ann-time">{ann.created_at}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
