import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Header from '../components/Header';

export default function AdminClasses() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coach: '',
    classTime: '',
    maxCapacity: 15
  });

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await api('/classes');
      setClasses(data);
    } catch (err) {
      console.error('加载团课失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.coach || !formData.classTime) {
      setMessage({ type: 'error', text: '请填写完整信息' });
      return;
    }

    try {
      if (editingId) {
        await api(`/admin/classes/${editingId}`, {
          method: 'PUT',
          body: formData
        });
        setMessage({ type: 'success', text: '团课更新成功' });
      } else {
        await api('/admin/classes', {
          method: 'POST',
          body: formData
        });
        setMessage({ type: 'success', text: '团课创建成功' });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', description: '', coach: '', classTime: '', maxCapacity: 15 });
      loadClasses();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleEdit = (cls: any) => {
    setEditingId(cls.id);
    setFormData({
      name: cls.name,
      description: cls.description || '',
      coach: cls.coach,
      classTime: cls.class_time.replace(' ', 'T').substring(0, 16),
      maxCapacity: cls.max_capacity
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要取消该团课吗？已预约的会员将自动取消。')) return;
    try {
      await api(`/admin/classes/${id}`, { method: 'DELETE' });
      setMessage({ type: 'success', text: '团课已取消' });
      loadClasses();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api(`/admin/classes/${id}`, {
        method: 'PUT',
        body: { status }
      });
      loadClasses();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    return time.replace('T', ' ').substring(0, 16);
  };

  const getStatusBadge = (status: string, booked: number, max: number) => {
    if (status === 'cancelled') return <span className="badge" style={{ background: '#f5f5f5', color: '#999' }}>已取消</span>;
    if (status === 'completed') return <span className="badge" style={{ background: '#f0f0f0', color: '#999' }}>已结束</span>;
    if (booked >= max) return <span className="badge badge-full">已满</span>;
    return <span className="badge badge-open">报名中</span>;
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
          团课管理
          <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ name: '', description: '', coach: '', classTime: '', maxCapacity: 15 });
          }}>
            发布新团课
          </button>
        </div>

        {message && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        {showForm && (
          <div className="card">
            <div className="card-title">{editingId ? '编辑团课' : '发布新团课'}</div>
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label>课程名称</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="如：晨间瑜伽、动感单车"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>教练</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="授课教练姓名"
                    value={formData.coach}
                    onChange={e => setFormData({ ...formData, coach: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>上课时间</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={formData.classTime}
                    onChange={e => setFormData({ ...formData, classTime: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>名额上限</label>
                  <input
                    type="number"
                    className="form-input"
                    min={1}
                    max={100}
                    value={formData.maxCapacity}
                    onChange={e => setFormData({ ...formData, maxCapacity: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>课程描述</label>
                <textarea
                  className="form-input"
                  placeholder="课程内容介绍"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary">
                  {editingId ? '保存修改' : '发布团课'}
                </button>
                <button type="button" className="btn btn-default" onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}>
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>课程名称</th>
                <th>教练</th>
                <th>上课时间</th>
                <th>名额</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(cls => (
                <tr key={cls.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{cls.name}</div>
                    {cls.description && <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{cls.description}</div>}
                  </td>
                  <td>{cls.coach}</td>
                  <td>{formatTime(cls.class_time)}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: cls.booked_count >= cls.max_capacity ? '#f5222d' : '#1890ff' }}>
                      {cls.booked_count}
                    </span>
                    /{cls.max_capacity}
                  </td>
                  <td>{getStatusBadge(cls.status, cls.booked_count, cls.max_capacity)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      <button className="btn btn-default btn-sm" onClick={() => handleEdit(cls)}>编辑</button>
                      {cls.status !== 'cancelled' && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(cls.id)}>取消</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
