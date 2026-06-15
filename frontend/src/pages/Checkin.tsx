import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Header from '../components/Header';

export default function Checkin() {
  const [passes, setPasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPassId, setSelectedPassId] = useState<number | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [checkinResult, setCheckinResult] = useState<{ success: boolean; message: string; remaining?: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPasses();
  }, []);

  const loadPasses = async () => {
    try {
      const data = await api('/passes/my');
      const activePasses = data.filter((p: any) => p.status === 'active' && new Date(p.end_date) > new Date() && p.remaining_times > 0);
      setPasses(activePasses);
      if (activePasses.length > 0) {
        setSelectedPassId(activePasses[0].id);
      }
    } catch (err) {
      console.error('加载次卡失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!selectedPassId) return;
    setMessage(null);
    setCheckinResult(null);

    try {
      const data = await api('/checkin/generate-code', {
        method: 'POST',
        body: { passId: selectedPassId }
      });
      setVerifyCode(data.verifyCode);
      setMessage({ type: 'info', text: '验证码已生成，请输入或使用自动填入的验证码进行核销' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleVerify = async () => {
    if (!selectedPassId || !inputCode.trim()) {
      setMessage({ type: 'error', text: '请选择次卡并输入验证码' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const data = await api('/checkin/verify', {
        method: 'POST',
        body: { passId: selectedPassId, verifyCode: inputCode.trim() }
      });
      setCheckinResult({ success: true, message: data.message, remaining: data.remainingTimes });
      setVerifyCode('');
      setInputCode('');
      loadPasses();
    } catch (err: any) {
      setCheckinResult({ success: false, message: err.message });
    } finally {
      setSubmitting(false);
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
        <div className="page-title">入场核销</div>

        {passes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"> </div>
            <div className="empty-text">暂无可用次卡，请先购买</div>
          </div>
        ) : (
          <div className="card" style={{ maxWidth: 500, margin: '0 auto' }}>
            <div className="card-title">扫码 / 输入验证码核销入场</div>

            <div className="form-group">
              <label>选择次卡</label>
              <select
                className="form-input"
                value={selectedPassId || ''}
                onChange={e => {
                  setSelectedPassId(Number(e.target.value));
                  setVerifyCode('');
                  setInputCode('');
                  setCheckinResult(null);
                }}
              >
                {passes.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.pass_type_name} - 剩余{p.remaining_times}次 - 到期{p.end_date.split(' ')[0]}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ textAlign: 'center', margin: '16px 0' }}>
              <button className="btn btn-primary btn-lg" onClick={handleGenerateCode}>
                生成验证码
              </button>
            </div>

            {verifyCode && (
              <div className="verify-code-display">
                <div className="code">{verifyCode}</div>
                <div className="code-label">入场验证码 - 请向工作人员出示或在下方输入核销</div>
                <button
                  className="btn btn-default btn-sm"
                  style={{ marginTop: 8 }}
                  onClick={() => setInputCode(verifyCode)}
                >
                  自动填入
                </button>
              </div>
            )}

            <div className="form-group">
              <label>输入验证码</label>
              <input
                type="text"
                className="form-input"
                placeholder="请输入8位验证码"
                value={inputCode}
                onChange={e => setInputCode(e.target.value.toUpperCase())}
                maxLength={8}
                style={{ textAlign: 'center', fontSize: 20, letterSpacing: 4, fontWeight: 700 }}
              />
            </div>

            <button
              className="btn btn-success btn-lg btn-block"
              onClick={handleVerify}
              disabled={submitting || !inputCode.trim()}
            >
              {submitting ? '核销中...' : '确认核销入场'}
            </button>

            {message && (
              <div className={`alert alert-${message.type}`} style={{ marginTop: 16 }}>
                {message.text}
              </div>
            )}

            {checkinResult && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                {checkinResult.success ? (
                  <div className="checkin-container">
                    <div className="checkin-icon"> </div>
                    <div className="checkin-message" style={{ color: '#52c41a' }}>核销成功，欢迎入场！</div>
                    {checkinResult.remaining !== undefined && (
                      <div style={{ color: '#999', fontSize: 14, marginTop: 8 }}>
                        剩余次数：{checkinResult.remaining}次
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="checkin-container">
                    <div className="checkin-icon"> </div>
                    <div className="checkin-message" style={{ color: '#f5222d' }}>核销失败</div>
                    <div style={{ color: '#999', fontSize: 14 }}>{checkinResult.message}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
