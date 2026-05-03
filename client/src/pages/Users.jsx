import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { useSocket } from '../contexts/SocketContext';
import { Users as UsersIcon, Plus, Edit2, Trash2, Shield, UserCheck, Search } from 'lucide-react';

const Users = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: 'agent', active: true, tlId: '' });

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    if (socket) {
      socket.on('users_updated', fetchUsers);
    }

    return () => {
      if (socket) {
        socket.off('users_updated', fetchUsers);
      }
    };
  }, [socket]);

  const tls = users.filter(u => u.role === 'tl');
  const admins = users.filter(u => u.role === 'admin');
  const agents = users.filter(u => u.role === 'agent');

  const filteredUsers = users
    .filter(u => u.role !== 'admin') // Remove admins from list
    .filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Sort: tl first, then agent
      if (a.role === 'tl' && b.role === 'agent') return -1;
      if (a.role === 'agent' && b.role === 'tl') return 1;
      return 0;
    });

  const openModal = (userToEdit = null) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({ 
        name: userToEdit.name, 
        username: userToEdit.username, 
        password: '', 
        role: userToEdit.role, 
        active: userToEdit.active, 
        tlId: userToEdit.tlId || '' 
      });
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
    } catch (error) {
      alert(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (error) {
        alert(error.response?.data?.error || 'Delete failed');
      }
    }
  };

  if (user?.role !== 'admin') {
    return <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>You do not have permission to view this page.</div>;
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        flexDirection: window.innerWidth < 768 ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: window.innerWidth < 768 ? 'flex-start' : 'center', 
        marginBottom: '32px',
        gap: '20px'
      }} className="page-header">
        <div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <UsersIcon className="text-primary" size={32} /> User Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage administrators, team leads, and agents</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()} style={{ width: window.innerWidth < 768 ? '100%' : 'auto' }}>
          <Plus size={18} /> Add New User
        </button>
      </div>

      <div className="glass-panel" style={{ 
        marginBottom: '24px', 
        padding: '16px 24px', 
        display: 'flex', 
        flexDirection: window.innerWidth < 768 ? 'column' : 'row',
        gap: '20px', 
        alignItems: window.innerWidth < 768 ? 'stretch' : 'center' 
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            className="input-field" 
            placeholder="Search users by name or username..." 
            style={{ paddingLeft: '44px', marginBottom: 0 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div className="badge badge-primary"><Shield size={14}/> {admins.length}</div>
          <div className="badge badge-warning"><UserCheck size={14}/> {tls.length}</div>
          <div className="badge badge-success"><UsersIcon size={14}/> {agents.length}</div>
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-color)' }}>
            <tr>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Name</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Role</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '16px 24px', fontWeight: '600' }}>Reports To</th>
              <th style={{ padding: '16px 24px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center' }}>Loading...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No users found</td></tr>
            ) : (
              filteredUsers.map((u) => {
                const tl = tls.find(t => t._id === u.tlId);
                return (
                  <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600' }}>{u.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className={`badge ${u.role === 'admin' ? 'badge-primary' : u.role === 'tl' ? 'badge-warning' : 'badge-success'}`} style={{ textTransform: 'capitalize' }}>
                        {u.role === 'tl' ? 'Team Lead' : u.role}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className={`badge ${u.active ? 'badge-success' : 'badge-danger'}`}>
                        {u.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                      {u.role === 'agent' ? (tl?.name || 'Unassigned') : '—'}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <button className="btn btn-outline" style={{ padding: '6px', marginRight: '8px' }} onClick={() => openModal(u)}>
                        <Edit2 size={16} />
                      </button>
                      {u.role !== 'admin' && (
                        <button className="btn btn-danger" style={{ padding: '6px' }} onClick={() => handleDelete(u._id)}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '32px', background: 'var(--bg-color)' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '1.5rem' }}>{editingUser ? 'Edit User' : 'Create New User'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="input-group">
                  <label>Full Name</label>
                  <input type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label>Username</label>
                  <input type="text" className="input-field" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} disabled={!!editingUser} required />
                </div>
              </div>
              
              <div className="input-group">
                <label>{editingUser ? 'New Password (leave blank to keep)' : 'Password'}</label>
                <input type="password" className="input-field" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!editingUser} />
              </div>

              {!editingUser && (
                <div className="input-group">
                  <label>Role</label>
                  <select className="input-field" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="agent">Agent</option>
                    <option value="tl">Team Lead</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}

              {editingUser && (
                <div className="input-group">
                  <label>Status</label>
                  <select className="input-field" value={formData.active} onChange={e => setFormData({...formData, active: e.target.value === 'true'})}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              )}

              {formData.role === 'agent' && (
                <div className="input-group">
                  <label>Assign to Team Lead</label>
                  <select className="input-field" value={formData.tlId} onChange={e => setFormData({...formData, tlId: e.target.value})}>
                    <option value="">-- Select Team Lead --</option>
                    {tls.map(tl => <option key={tl._id} value={tl._id}>{tl.name}</option>)}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
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
