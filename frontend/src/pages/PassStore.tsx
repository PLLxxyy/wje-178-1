import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import Header from '../components/Header';

export default function PassStore() {
  const [passTypes, setPassTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadPassTypes();
  }, []);

  const loadPassTypes = async () => {
    try {
      const data = await api('/passes/types');
      setPassTypes(data);
    } catch (err) {
      console.error('加载次卡类型失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (passTypeId: number) => {
    if (purchasing) return;
    setPurchasing(passTypeId);
    setMessage(null);

    try {
      const data = await api('/passes/purchase', {
        method: 'POST',
        body: { passTypeId }
      });
      setMessage({ type: 'success', text: `购买成功！${data.pass.passType}已激活，验证码：${data.pass.verifyCode}` });
      setTimeout(() => navigate('/my-passes'), 2000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setPurchasing(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'times': return ' ';
      case 'monthly': return ' ';
      case 'quarterly': return ' ';
      default: return ' ';
    }
  };

  const getDurationText = (type: any) => {
    if (type.type === 'monthly') return '30天不限次';
    if (type.type === 'quarterly') return '90天不限次';
    return `${type.duration_days}天内${type.times}次`;
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
          次卡商城
          <span className="page-subtitle">选择适合您的健身套餐</span>
        </div>

        {message && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        <div className="pass-store-grid">
          {passTypes.map(pt => (
            <div key={pt.id} className="pass-store-card">
              <div style={{ fontSize: 48, marginBottom: 8 }}>{getTypeIcon(pt.type)}</div>
              <div className="store-pass-name">{pt.name}</div>
              <div className="store-pass-price">
                <span className="currency">¥</span>{pt.price}
              </div>
              <div className="store-pass-desc">{pt.description}</div>
              <div className="store-pass-detail">
                <div>有效期：{getDurationText(pt)}</div>
                {pt.type === 'times' && <div>可用次数：{pt.times}次</div>}
                {pt.type !== 'times' && <div>使用次数：不限次</div>}
              </div>
              <button
                className="btn btn-primary btn-lg btn-block"
                onClick={() => handlePurchase(pt.id)}
                disabled={purchasing === pt.id}
              >
                {purchasing === pt.id ? '购买中...' : '立即购买'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
