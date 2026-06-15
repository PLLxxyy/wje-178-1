import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../utils/api';

export default function Register() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      await register(phone, password, name);
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
        <p className="auth-subtitle">次卡管理系统 - 注册</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>姓名</label>
            <input
              type="text"
              className="form-input"
              placeholder="请输入您的姓名"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

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
              placeholder="至少6位密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>确认密码</label>
            <input
              type="password"
              className="form-input"
              placeholder="再次输入密码"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
            {loading ? '注册中...' : '注 册'}
          </button>
        </form>

        <div className="auth-footer">
          已有账号？<a onClick={() => navigate('/login')}>返回登录</a>
        </div>
      </div>
    </div>
  );
}
