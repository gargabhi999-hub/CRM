import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../utils/api';
import { Users, PhoneCall, Star, Calendar, Clock, XCircle, BarChart3, TrendingUp, Database } from 'lucide-react';

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, gradient }) => (
  <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: gradient, filter: 'blur(40px)', opacity: 0.5, borderRadius: '50%' }}></div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>{title}</div>
      <div className={colorClass} style={{ padding: '8px', borderRadius: '12px', background: 'var(--bg-surface)' }}>
        <Icon size={20} />
      </div>
    </div>
    <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
      {value}
    </div>
    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{subtext}</div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [stats, setStats] = useState({ total: 0, pending: 0, lead: 0, appointment: 0, callBack: 0, doNotCall: 0 });
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await api.get('/contacts/stats');
      const statsData = statsRes.data;
      
      setStats({
        ...statsData,
        totalLeadValue: statsData.totalLeadAmount || 0
      });
      
      if (user?.role !== 'agent') {
        const queuesRes = await api.get('/contacts/agent-queues');
        setQueues(queuesRes.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    if (socket) {
      // Listen for real-time updates
      socket.on('contacts_updated', () => {
        fetchDashboardData(); // Refresh data when contacts are updated
      });
      
      socket.on('contact_disposed', fetchDashboardData);
      socket.on('lead_disposed', fetchDashboardData);
      socket.on('dashboard_update', fetchDashboardData);
      socket.on('batch_uploaded', fetchDashboardData);
      socket.on('users_updated', fetchDashboardData);
      socket.on('appointment_scheduled', fetchDashboardData);
      socket.on('appointment_cancelled', fetchDashboardData);
    }

    return () => {
      if (socket) {
        socket.off('contacts_updated', fetchDashboardData);
        socket.off('contact_disposed', fetchDashboardData);
        socket.off('lead_disposed', fetchDashboardData);
        socket.off('dashboard_update', fetchDashboardData);
        socket.off('batch_uploaded', fetchDashboardData);
        socket.off('users_updated', fetchDashboardData);
        socket.off('appointment_scheduled', fetchDashboardData);
        socket.off('appointment_cancelled', fetchDashboardData);
      }
    };
  }, [socket, user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <div className="pulse-primary" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)' }}></div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user?.name}. Here's what's happening today.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="badge badge-success" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor', display: 'inline-block', animation: 'pulse-glow 2s infinite' }}></span>
            Live Updates Active
          </div>
        </div>
      </div>

      <div className="grid-cards" style={{ marginBottom: '32px' }}>
        <StatCard 
          title="Total Contacts" 
          value={stats.total || 0} 
          subtext="In system" 
          icon={Users} 
          colorClass="text-blue-500"
          gradient="var(--primary)"
        />
        <StatCard 
          title="Pending Queue" 
          value={stats.pending || 0} 
          subtext="Awaiting disposition" 
          icon={Clock} 
          colorClass="text-amber-500"
          gradient="var(--warning)"
        />
        <StatCard 
          title="Leads Converted" 
          value={stats.lead || 0} 
          subtext="Total leads" 
          icon={Star} 
          colorClass="text-emerald-500"
          gradient="var(--success)"
        />
        <StatCard 
          title="Total Revenue" 
          value={`₹${stats.totalLeadValue?.toLocaleString() || 0}`} 
          subtext="Aggregate lead value" 
          icon={Database} 
          colorClass="text-violet-500"
          gradient="#8b5cf6"
        />
        <StatCard 
          title="Appointments" 
          value={stats.appointment || 0} 
          subtext="Scheduled" 
          icon={Calendar} 
          colorClass="text-purple-500"
          gradient="#8b5cf6"
        />
        <StatCard 
          title="Call Backs" 
          value={stats.callBack || 0} 
          subtext="Follow up required" 
          icon={PhoneCall} 
          colorClass="text-cyan-500"
          gradient="#06b6d4"
        />
        <StatCard 
          title="Do Not Call" 
          value={stats.doNotCall || 0} 
          subtext="Excluded contacts" 
          icon={XCircle} 
          colorClass="text-slate-500"
          gradient="#64748b"
        />
      </div>

      {user?.role !== 'agent' && queues.length > 0 && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={20} className="text-primary" />
              Agent Queue Status
            </h2>
            <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={fetchDashboardData}>
              Refresh
            </button>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Agent</th>
                  {user?.role === 'admin' && <th style={{ padding: '12px 16px', fontWeight: '600' }}>Team Leader</th>}
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Total</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Pending</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Disposed</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Leads</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Lead Value</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Appts</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {queues.map((q, i) => {
                  const progress = q.total > 0 ? Math.round((q.disposed / q.total) * 100) : 0;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '16px', fontWeight: '500' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', color: 'white' }}>
                            {q.agent?.name?.charAt(0) || 'U'}
                          </div>
                          {q.agent?.name || 'Unknown'}
                        </div>
                      </td>
                      {user?.role === 'admin' && (
                        <td style={{ padding: '16px' }}>
                          <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>{q.tlName}</span>
                        </td>
                      )}
                      <td style={{ padding: '16px' }}>{q.total || 0}</td>
                      <td style={{ padding: '16px', color: 'var(--warning)', fontWeight: '600' }}>{q.pending || 0}</td>
                      <td style={{ padding: '16px' }}>{q.disposed || 0}</td>
                      <td style={{ padding: '16px', color: 'var(--success)', fontWeight: '600' }}>{q.lead || 0}</td>
                      <td style={{ padding: '16px', fontWeight: '600' }}>₹{q.totalLeadAmount?.toLocaleString() || 0}</td>
                      <td style={{ padding: '16px', color: '#a855f7', fontWeight: '600' }}>{q.appointment || 0}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '6px', background: 'var(--bg-color)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px' }}></div>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '35px' }}>{progress}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
