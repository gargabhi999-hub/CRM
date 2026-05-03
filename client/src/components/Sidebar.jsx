import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, Upload, Database, Star, Calendar, Layers, Download, LogOut, Sparkles } from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'agent';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const adminItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/upload', icon: Upload, label: 'Upload Data' },
    { path: '/contacts', icon: Database, label: 'All Contacts' },
    { path: '/leads', icon: Star, label: 'Leads' },
    { path: '/appointments', icon: Calendar, label: 'Appointments' },
    { path: '/reports', icon: Download, label: 'Reports' },
  ];

  const tlItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/upload', icon: Upload, label: 'Upload Data' },
    { path: '/contacts', icon: Database, label: 'Team Contacts' },
    { path: '/leads', icon: Star, label: 'Leads' },
    { path: '/appointments', icon: Calendar, label: 'Appointments' },
    { path: '/agent_queues', icon: Layers, label: 'Agent Queues' },
    { path: '/reports', icon: Download, label: 'Reports' },
  ];

  const agentItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/workflow', icon: Database, label: 'Workflow' },
    { path: '/leads', icon: Star, label: 'My Leads' },
    { path: '/appointments', icon: Calendar, label: 'My Appointments' },
  ];

  const items = role === 'admin' ? adminItems : role === 'tl' ? tlItems : agentItems;

  return (
    <div style={{ 
      width: '260px', height: '100vh', background: 'var(--bg-surface)', 
      borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, zIndex: 100
    }}>
      {/* Brand */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
            boxShadow: '0 0 10px var(--primary-glow)'
          }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', letterSpacing: '-0.5px' }}>Spike DMS</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {role === 'admin' ? 'Admin Panel' : role === 'tl' ? 'Team Lead' : 'Agent'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <NavLink 
                key={index}
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                  borderRadius: '10px', textDecoration: 'none',
                  color: isActive ? 'var(--primary)' : 'var(--text-primary)',
                  background: isActive ? 'var(--primary-glow)' : 'transparent',
                  fontWeight: isActive ? '600' : '500',
                  transition: 'all 0.2s ease'
                })}
              >
                <Icon size={20} />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* User Profile Footer */}
      <div style={{ padding: '20px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-surface-hover)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
              color: role === 'admin' ? '#f59e0b' : role === 'tl' ? '#3b82f6' : '#10b981'
            }}>
              {getInitials(user?.name)}
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{user?.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{user?.username}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px' }}>
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
