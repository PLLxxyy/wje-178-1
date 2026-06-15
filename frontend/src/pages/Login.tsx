import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/api';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(phone, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>社区健身房</h1>
        <p className="auth-subtitle">次卡管理系统 - 登录</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>手机号</label>
            <input
              type="tel"
              className="form-input"
              placeholder="请输入手机号"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              maxLength={11}
            />
          </div>

          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              className="form-input"
              placeholder="请输入密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <div className="auth-footer">
          还没有账号？<a onClick={() => navigate('/register')}>立即注册</a>
        </div>
      </div>
    </div>
  );
}
