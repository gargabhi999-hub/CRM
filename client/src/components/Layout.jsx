import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Sparkles } from 'lucide-react';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)' }}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div style={{ 
        flex: 1, 
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100vh',
        overflow: 'hidden'
      }}>
        {/* Mobile Header */}
        <div 
          className="mobile-only"
          style={{
            height: 'var(--header-height)',
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            zIndex: 900
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Sparkles size={16} />
            </div>
            <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>Spike CRM</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '8px' }}
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Main Content Area */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px',
          width: '100%'
        }} className="main-content">
          <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 1025px) {
          .main-content {
            margin-left: var(--sidebar-width);
            padding: 32px 40px !important;
          }
        }
        @media (max-width: 768px) {
          .main-content {
            padding: 20px 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;

