import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Header from '../components/Header';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [checkinRecords, setCheckinRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'records'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, membersData, recordsData] = await Promise.all([
        api('/admin/stats'),
        api('/admin/members'),
        api('/admin/checkin-records')
      ]);
      setStats(statsData);
      setMembers(membersData);
      setCheckinRecords(recordsData);
    } catch (err) {
      console.error('加载管理数据失败', err);
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

  return (
    <div className="app-container">
      <Header />
      <div className="main-content">
        <div className="page-title">管理员后台</div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">今日入场</div>
            <div className="stat-value">{stats?.todayCheckins || 0}</div>
            <div className="stat-label">人</div>
          </div>
          <div className="stat-card stat-green">
            <div className="stat-label">总会员数</div>
            <div className="stat-value">{stats?.totalMembers || 0}</div>
            <div className="stat-label">人</div>
          </div>
          <div className="stat-card stat-orange">
            <div className="stat-label">次卡销售额</div>
            <div className="stat-value">¥{stats?.totalRevenue || 0}</div>
          </div>
          <div className="stat-card stat-purple">
            <div className="stat-label">团课满座率</div>
            <div className="stat-value">{stats?.classStats?.avgFillRate || 0}%</div>
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-title">次卡销售统计</div>
            {stats?.passSales?.length > 0 ? (
              <div className="table-container" style={{ boxShadow: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>套餐类型</th>
                      <th>销售数量</th>
                      <th>销售额</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.passSales.map((sale: any, i: number) => (
                      <tr key={i}>
                        <td>{sale.name}</td>
                        <td>{sale.count}张</td>
                        <td style={{ fontWeight: 700, color: '#fa8c16' }}>¥{sale.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无销售数据</div>
            )}
          </div>

          <div className="card">
            <div className="card-title">
              会员活跃度排行
              <span style={{ float: 'right', fontSize: 12, color: '#999', fontWeight: 400 }}>按入场次数</span>
            </div>
            {stats?.memberRanking?.length > 0 ? (
              <ul className="ranking-list">
                {stats.memberRanking.map((member: any, index: number) => (
                  <li key={index} className="ranking-item">
                    <span className={`ranking-num ${index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : ''}`}>
                      {index + 1}
                    </span>
                    <span className="ranking-name">{member.name}</span>
                    <span className="ranking-count">{member.checkin_count}次</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无数据</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-title">团课数据概览</div>
          <div className="stats-grid" style={{ marginBottom: 0 }}>
            <div className="stat-card">
              <div className="stat-label">团课总数</div>
              <div className="stat-value">{stats?.classStats?.totalClasses || 0}</div>
              <div className="stat-label">节</div>
            </div>
            <div className="stat-card stat-green">
              <div className="stat-label">满座团课</div>
              <div className="stat-value">{stats?.classStats?.fullClasses || 0}</div>
              <div className="stat-label">节</div>
            </div>
            <div className="stat-card stat-orange">
              <div className="stat-label">平均满座率</div>
              <div className="stat-value">{stats?.classStats?.avgFillRate || 0}%</div>
            </div>
            <div className="stat-card stat-purple">
              <div className="stat-label">总次卡销售</div>
              <div className="stat-value">{stats?.totalPassSales || 0}</div>
              <div className="stat-label">张</div>
            </div>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            数据总览
          </button>
          <button className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
            会员列表
          </button>
          <button className={`tab ${activeTab === 'records' ? 'active' : ''}`} onClick={() => setActiveTab('records')}>
            入场记录
          </button>
        </div>

        {activeTab === 'members' && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>手机号</th>
                  <th>入场次数</th>
                  <th>有效次卡</th>
                  <th>注册时间</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member: any) => (
                  <tr key={member.id}>
                    <td>{member.name}</td>
                    <td>{member.phone}</td>
                    <td>{member.total_checkins}次</td>
                    <td>{member.active_passes}张</td>
                    <td>{formatTime(member.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>会员</th>
                  <th>手机号</th>
                  <th>次卡类型</th>
                  <th>核销码</th>
                  <th>入场时间</th>
                </tr>
              </thead>
              <tbody>
                {checkinRecords.map((record: any) => (
                  <tr key={record.id}>
                    <td>{record.user_name}</td>
                    <td>{record.user_phone}</td>
                    <td>{record.pass_type_name}</td>
                    <td style={{ fontFamily: 'monospace' }}>{record.verify_code}</td>
                    <td>{formatTime(record.checkin_time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
