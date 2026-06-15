import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import Header from '../components/Header';

export default function MyPasses() {
  const [passes, setPasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyCodes, setVerifyCodes] = useState<Record<number, string>>({});
  const navigate = useNavigate();

  useEffect(() => {
    loadPasses();
  }, []);

  const loadPasses = async () => {
    try {
      const data = await api('/passes/my');
      setPasses(data);
    } catch (err) {
      console.error('加载次卡失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async (passId: number) => {
    try {
      const data = await api(`/checkin/generate-code`, {
        method: 'POST',
        body: { passId }
      });
      setVerifyCodes(prev => ({ ...prev, [passId]: data.verifyCode }));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '使用中';
      case 'expired': return '已过期';
      case 'used_up': return '次数用完';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'expired': return 'status-expired';
      case 'used_up': return 'status-used-up';
      default: return '';
    }
  };

  const getPassCardClass = (status: string) => {
    switch (status) {
      case 'active': return 'pass-active';
      case 'expired': return 'pass-expired';
      case 'used_up': return 'pass-used-up';
      default: return '';
    }
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
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
          我的次卡
          <span className="page-subtitle">管理您的健身次卡</span>
          <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => navigate('/pass-store')}>
            购买新次卡
          </button>
        </div>

        {passes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"> </div>
            <div className="empty-text">您还没有购买次卡</div>
            <button className="btn btn-primary btn-lg" style={{ marginTop: 16 }} onClick={() => navigate('/pass-store')}>
              前往购买
            </button>
          </div>
        ) : (
          passes.map((pass: any) => (
            <div key={pass.id} className={`pass-card ${getPassCardClass(pass.status)}`}>
              <div className="pass-header">
                <div>
                  <div className="pass-name">{pass.pass_type_name}</div>
                  <div style={{ fontSize: 13, color: '#999', marginTop: 4 }}>
                    购买时间：{pass.created_at.split(' ')[0]}
                  </div>
                </div>
                <span className={`pass-status ${getStatusClass(pass.status)}`}>
                  {getStatusText(pass.status)}
                  {pass.status === 'active' && isExpired(pass.end_date) && ' (已到期)'}
                </span>
              </div>

              <div className="pass-info">
                <div className="pass-info-item">
                  <div className="label">{pass.pass_type === 'times' ? '剩余次数' : '使用状态'}</div>
                  <div className="value" style={{ color: pass.remaining_times <= 2 && pass.pass_type === 'times' ? '#f5222d' : '#1a1a1a' }}>
                    {pass.pass_type === 'times' ? pass.remaining_times : '不限次'}
                  </div>
                </div>
                <div className="pass-info-item">
                  <div className="label">开始日期</div>
                  <div className="value" style={{ fontSize: 16 }}>{pass.start_date.split(' ')[0]}</div>
                </div>
                <div className="pass-info-item">
                  <div className="label">到期日期</div>
                  <div className="value" style={{ fontSize: 16, color: isExpired(pass.end_date) ? '#f5222d' : '#1a1a1a' }}>
                    {pass.end_date.split(' ')[0]}
                  </div>
                </div>
                <div className="pass-info-item">
                  <div className="label">套餐价格</div>
                  <div className="value" style={{ fontSize: 16, color: '#fa8c16' }}>¥{pass.price}</div>
                </div>
              </div>

              {pass.status === 'active' && !isExpired(pass.end_date) && pass.remaining_times > 0 && (
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  {verifyCodes[pass.id] ? (
                    <div className="verify-code-display">
                      <div className="code">{verifyCodes[pass.id]}</div>
                      <div className="code-label">入场验证码 - 请向工作人员出示</div>
                    </div>
                  ) : (
                    <button className="btn btn-primary btn-lg" onClick={() => handleGenerateCode(pass.id)}>
                      生成入场验证码
                    </button>
                  )}
                </div>
              )}

              {(pass.status === 'used_up' || pass.status === 'expired') && (
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <button className="btn btn-primary" onClick={() => navigate('/pass-store')}>
                    续费 / 购买新次卡
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
