import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { PieChart as PieChartIcon, Download, FileSpreadsheet, User } from 'lucide-react';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#64748b'];

const Reports = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [stats, setStats] = useState(null);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const statsQuery = selectedAgent ? `?agentId=${selectedAgent}` : '';
      const [statsRes, agentsRes] = await Promise.all([
        api.get(`/contacts/stats${statsQuery}`),
        user.role !== 'agent' ? api.get(user.role === 'admin' ? '/users' : '/users/my-agents') : Promise.resolve({ data: [] })
      ]);
      setStats(statsRes.data);
      if (agentsRes.data) {
        setAgents(agentsRes.data.filter(u => u.role === 'agent'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (socket) {
      socket.on('contacts_updated', fetchData);
      socket.on('batch_uploaded', fetchData);
      socket.on('users_updated', fetchData);
    }

    return () => {
      if (socket) {
        socket.off('contacts_updated', fetchData);
        socket.off('batch_uploaded', fetchData);
        socket.off('users_updated', fetchData);
      }
    };
  }, [selectedAgent, socket]);

  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      const agentQuery = selectedAgent ? `&agentId=${selectedAgent}` : '';
      const response = await api.get(`/reports/download?format=${format}${agentQuery}`, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `crm_report_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to export report');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Reports...</div>;

  const data = [
    { name: 'Pending', value: stats.pending },
    { name: 'Leads', value: stats.lead },
    { name: 'Appointments', value: stats.appointment },
    { name: 'No Answer', value: stats.callNotAnswered },
    { name: 'Invalid', value: stats.invalid },
    { name: 'Call Back', value: stats.callBack },
  ].filter(d => d.value > 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <PieChartIcon className="text-primary" size={32} /> Reports & Export
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>View analytics and export complete contact data</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Download size={16} /> {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => handleExport('xlsx')}
            disabled={isExporting}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FileSpreadsheet size={16} /> {isExporting ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="glass-panel" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Disposition Distribution</h2>
          <div style={{ flex: 1, minHeight: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                  {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Performance Overview</h2>
          <div style={{ flex: 1, minHeight: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'var(--text-secondary)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
