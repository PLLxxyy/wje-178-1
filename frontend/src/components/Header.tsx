import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUser, logout, isAdmin } from '../utils/api';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const memberNavItems = [
    { path: '/dashboard', label: '首页' },
    { path: '/pass-store', label: '购买次卡' },
    { path: '/my-passes', label: '我的次卡' },
    { path: '/classes', label: '团课列表' },
    { path: '/my-classes', label: '我的团课' },
    { path: '/checkin', label: '入场核销' },
    { path: '/history', label: '历史记录' },
  ];

  const adminNavItems = [
    { path: '/admin/dashboard', label: '管理后台' },
    { path: '/admin/classes', label: '团课管理' },
    { path: '/admin/announcements', label: '公告管理' },
    { path: '/dashboard', label: '会员端' },
  ];

  const navItems = isAdmin() && location.pathname.startsWith('/admin') ? adminNavItems : memberNavItems;

  return (
    <>
      <div className="header">
        <div className="header-left">
          <span className="header-logo">社区健身房</span>
        </div>
        <div className="header-user">
          <span className="user-name">{user?.name}</span>
          <span className="user-role">{user?.role === 'admin' ? '管理员' : '会员'}</span>
          {isAdmin() && (
            <button
              className="btn-logout"
              onClick={() => navigate(location.pathname.startsWith('/admin') ? '/dashboard' : '/admin/dashboard')}
            >
              {location.pathname.startsWith('/admin') ? '会员端' : '管理后台'}
            </button>
          )}
          <button className="btn-logout" onClick={handleLogout}>退出</button>
        </div>
      </div>
      <div className="nav">
        {navItems.map(item => (
          <span
            key={item.path}
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </span>
        ))}
      </div>
    </>
  );
}
