import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { useSocket } from '../contexts/SocketContext';
import { Users as UsersIcon, Plus, Edit2, Trash2, Shield, UserCheck, Search, X } from 'lucide-react';

const Users = () => {
  const { user }   = useAuth();
  const { socket } = useSocket();
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [editingUser,  setEditingUser]  = useState(null);
  const [formData,     setFormData]     = useState({ name: '', username: '', password: '', role: 'agent', active: true, tlId: '' });

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Fetch users failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    if (!socket) return;
    socket.on('users_updated', fetchUsers);
    return () => socket.off('users_updated', fetchUsers);
  }, [socket]);

  const tls     = users.filter(u => u.role === 'tl');
  const admins  = users.filter(u => u.role === 'admin');
  const agents  = users.filter(u => u.role === 'agent');

  const filtered = users
    .filter(u => u.role !== 'admin')
    .filter(u =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (a.role === 'tl' && b.role === 'agent') ? -1 : (a.role === 'agent' && b.role === 'tl') ? 1 : 0);

  const openModal = (u = null) => {
    if (u) {
      setEditingUser(u);
      setFormData({ name: u.name, username: u.username, password: '', role: u.role, active: u.active, tlId: u.tlId || '' });
    } else {
      setEditingUser(null);
      setFormData({ name: '', username: '', password: '', role: 'agent', active: true, tlId: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const payload = { name: formData.name, active: formData.active };
        if (formData.password) payload.password = formData.password;
        if (formData.role === 'agent') payload.tlId = formData.tlId;
        await api.put(`/users/${editingUser._id}`, payload);
      } else {
        await api.post('/users', formData);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  };

  const roleStyles = {
    admin: { label: 'Admin',     cls: 'badge-primary' },
    tl:    { label: 'Team Lead', cls: 'badge-warning' },
    agent: { label: 'Agent',     cls: 'badge-success' },
  };

  if (user?.role !== 'admin') {
    return (
      <div className="glass-panel" style={{ padding: 60, textAlign: 'center' }}>
        <Shield size={48} style={{ opacity: 0.15, margin: '0 auto 16px', display: 'block' }} />
        <h3>Access Denied</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ fontSize: 'var(--h1)' }}>
            <UsersIcon size={24} style={{ color: 'var(--primary)' }} /> User Management
          </h1>
          <p className="page-subtitle">Manage team leads and agents across your organization</p>
        </div>
        <button id="add-user-btn" className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Stat pills */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 'var(--gap)', flexWrap: 'wrap' }}>
        <div className="glass-panel" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={16} style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Admins</span>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{admins.length}</span>
        </div>
        <div className="glass-panel" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <UserCheck size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Team Leads</span>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{tls.length}</span>
        </div>
        <div className="glass-panel" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <UsersIcon size={16} style={{ color: 'var(--success)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Agents</span>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{agents.length}</span>
        </div>
      </div>

      {/* Search */}
      <div className="glass-panel" style={{ marginBottom: 'var(--gap)', padding: '12px 18px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="input-field" placeholder="Search by name or username…" style={{ paddingLeft: 42, marginBottom: 0 }}
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="crm-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Reports To</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 14, width: '80%', borderRadius: 6 }} /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No users found</td></tr>
              ) : filtered.map(u => {
                const tl = tls.find(t => t._id === u.tlId);
                const rs = roleStyles[u.role] || roleStyles.agent;
                return (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="avatar avatar-md" style={{
                          background: u.role === 'admin' ? 'rgba(245,158,11,0.15)' : u.role === 'tl' ? 'var(--primary-light)' : 'var(--success-light)',
                          color: u.role === 'admin' ? '#f59e0b' : u.role === 'tl' ? 'var(--primary)' : 'var(--success)',
                        }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${rs.cls}`}>{rs.label}</span></td>
                    <td><span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`}>{u.active ? 'Active' : 'Inactive'}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{u.role === 'agent' ? (tl?.name || 'Unassigned') : '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline btn-icon" onClick={() => openModal(u)} title="Edit"><Edit2 size={15} /></button>
                        {u.role !== 'admin' && (
                          <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(u._id)} title="Delete">
                            <Trash2 size={15} style={{ color: 'var(--danger)' }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal-box animate-fade-in" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2>{editingUser ? 'Edit User' : 'Create New User'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid-2" style={{ gap: 12 }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Full Name *</label>
                  <input type="text" className="input-field" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Username *</label>
                  <input type="text" className="input-field" value={formData.username} onChange={e => setFormData(p => ({ ...p, username: e.target.value }))} disabled={!!editingUser} required />
                </div>
              </div>
              <div className="input-group" style={{ marginTop: 12 }}>
                <label>{editingUser ? 'New Password (blank = keep)' : 'Password *'}</label>
                <input type="password" className="input-field" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} required={!editingUser} />
              </div>
              {!editingUser && (
                <div className="input-group">
                  <label>Role</label>
                  <select className="input-field" value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}>
                    <option value="agent">Agent</option>
                    <option value="tl">Team Lead</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}
              {editingUser && (
                <div className="input-group">
                  <label>Status</label>
                  <select className="input-field" value={formData.active} onChange={e => setFormData(p => ({ ...p, active: e.target.value === 'true' }))}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              )}
              {formData.role === 'agent' && (
                <div className="input-group">
                  <label>Assign to Team Lead</label>
                  <select className="input-field" value={formData.tlId} onChange={e => setFormData(p => ({ ...p, tlId: e.target.value }))}>
                    <option value="">-- Select Team Lead --</option>
                    {tls.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingUser ? 'Save Changes' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
