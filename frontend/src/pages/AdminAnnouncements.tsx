import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Header from '../components/Header';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'maintenance'
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await api('/admin/announcements');
      setAnnouncements(data);
    } catch (err) {
      console.error('加载公告失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      setMessage({ type: 'error', text: '标题和内容不能为空' });
      return;
    }

    try {
      await api('/admin/announcements', {
        method: 'POST',
        body: formData
      });
      setMessage({ type: 'success', text: '公告发布成功' });
      setFormData({ title: '', content: '', type: 'maintenance' });
      setShowForm(false);
      loadAnnouncements();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该公告吗？')) return;
    try {
      await api(`/admin/announcements/${id}`, { method: 'DELETE' });
      setMessage({ type: 'success', text: '公告已删除' });
      loadAnnouncements();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'maintenance': return '器械维护';
      case 'info': return '通知公告';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance': return '#fa8c16';
      case 'info': return '#1890ff';
      default: return '#999';
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
        <div className="page-title">
          公告管理
          <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setShowForm(!showForm)}>
            {showForm ? '收起表单' : '发布公告'}
          </button>
        </div>

        {message && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        {showForm && (
          <div className="card">
            <div className="card-title">发布公告</div>
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label>公告标题</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="输入公告标题"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>公告类型</label>
                  <select
                    className="form-input"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="maintenance">器械维护</option>
                    <option value="info">通知公告</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>公告内容</label>
                <textarea
                  className="form-input"
                  placeholder="输入公告详细内容"
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  style={{ minHeight: 100 }}
                />
              </div>
              <button type="submit" className="btn btn-primary">发布公告</button>
            </form>
          </div>
        )}

        {announcements.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"> </div>
            <div className="empty-text">暂无公告</div>
          </div>
        ) : (
          announcements.map(ann => (
            <div key={ann.id} className={`announcement-card type-${ann.type}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div className="ann-title">
                    <span style={{
                      display: 'inline-block',
                      background: getTypeColor(ann.type),
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      marginRight: 8,
                      fontWeight: 600
                    }}>
                      {getTypeLabel(ann.type)}
                    </span>
                    {ann.title}
                  </div>
                  <div className="ann-content">{ann.content}</div>
                  <div className="ann-time">{ann.created_at}</div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ann.id)}>
                  删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
