import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '260px', padding: '32px 40px', overflowY: 'auto', height: '100vh' }}>
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
