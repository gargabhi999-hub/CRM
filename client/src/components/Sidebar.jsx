import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, Users, Upload, Database, Star, Calendar, 
  Layers, Download, LogOut, Sparkles, X, ChevronLeft, ChevronRight 
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, isCollapsed, setIsCollapsed }) => {
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

  const currentWidth = isCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)';

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
            zIndex: 998, transition: 'opacity 0.3s ease'
          }}
          className="mobile-only"
        />
      )}

      <div style={{ 
        width: currentWidth, height: '100vh', background: 'var(--bg-surface)', 
        borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column',
        position: 'fixed', left: 0, top: 0, zIndex: 1000,
        transform: isOpen ? 'translateX(0)' : (window.innerWidth <= 1024 ? 'translateX(-100%)' : 'translateX(0)'),
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }} className="sidebar-container">
        
        {/* Toggle Button for Desktop */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="desktop-only"
          style={{
            position: 'absolute', right: '-12px', top: '32px',
            width: '24px', height: '24px', borderRadius: '50%',
            background: 'var(--primary)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px var(--primary-glow)',
            zIndex: 1001
          }}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Brand */}
        <div style={{ 
          padding: isCollapsed ? '24px 0' : '24px 20px', 
          borderBottom: '1px solid var(--border-color)', 
          display: 'flex', 
          justifyContent: isCollapsed ? 'center' : 'space-between', 
          alignItems: 'center' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
              boxShadow: '0 0 10px var(--primary-glow)',
              flexShrink: 0
            }}>
              <Sparkles size={20} />
            </div>
            {!isCollapsed && (
              <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700', letterSpacing: '-0.5px' }}>Spike DMS</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {role === 'admin' ? 'Admin Panel' : role === 'tl' ? 'Team Lead' : 'Agent'}
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button 
              onClick={onClose} 
              className="mobile-only"
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
            >
              <X size={24} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isCollapsed ? '20px 8px' : '20px 12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {items.map((item, index) => {
              const Icon = item.icon;
              return (
                <NavLink 
                  key={index}
                  to={item.path}
                  title={isCollapsed ? item.label : ''}
                  onClick={() => { if(window.innerWidth <= 1024) onClose(); }}
                  style={({ isActive }) => ({
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    gap: '12px', 
                    padding: isCollapsed ? '12px' : '12px 16px',
                    borderRadius: '10px', textDecoration: 'none',
                    color: isActive ? 'var(--primary)' : 'var(--text-primary)',
                    background: isActive ? 'var(--primary-glow)' : 'transparent',
                    fontWeight: isActive ? '600' : '500',
                    transition: 'all 0.2s ease'
                  })}
                >
                  <Icon size={20} style={{ flexShrink: 0 }} />
                  {!isCollapsed && <span style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* User Profile Footer */}
        <div style={{ 
          padding: isCollapsed ? '20px 0' : '20px', 
          borderTop: '1px solid var(--border-color)', 
          background: 'var(--bg-surface)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div style={{ 
                width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-surface-hover)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                color: role === 'admin' ? '#f59e0b' : role === 'tl' ? '#3b82f6' : '#10b981',
                flexShrink: 0
              }}>
                {getInitials(user?.name)}
              </div>
              {!isCollapsed && (
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{user?.username}</div>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px' }}>
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

