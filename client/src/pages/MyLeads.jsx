import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../utils/api';
import { Star, TrendingUp, Users, Calendar, Search, Filter, PhoneCall, IndianRupee, Award, Target } from 'lucide-react';

const MyLeads = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ totalLeads: 0, totalAmount: 0 });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [leadsRes, statsRes] = await Promise.all([
        api.get('/leads/my-leads'),
        api.get('/leads/stats')
      ]);
      setLeads(leadsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch leads', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (socket) {
      socket.on('contact_disposed', fetchData);
      socket.on('dashboard_update', fetchData);
    }

    return () => {
      if (socket) {
        socket.off('contact_disposed', fetchData);
        socket.off('dashboard_update', fetchData);
      }
    };
  }, [socket]);

  const filteredLeads = leads.filter(l => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return Object.values(l.fields || {}).some(v => String(v).toLowerCase().includes(q)) ||
           (l.agentName && l.agentName.toLowerCase().includes(q));
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Star className="text-success" size={40} fill="var(--success)" /> My Leads
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Tracking your converted sales and revenue performance
          </p>
        </div>
        <div className="badge badge-primary" style={{ padding: '12px 24px', fontSize: '1.1rem' }}>
          {filteredLeads.length} Converted Leads
        </div>
      </div>

      <div className="grid-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ 
          padding: '24px', 
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          border: 'none'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontWeight: '600', opacity: 0.9 }}>TOTAL REVENUE</span>
            <TrendingUp size={24} />
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>₹{stats.totalAmount.toLocaleString()}</div>
          <div style={{ marginTop: '8px', fontSize: '0.9rem', opacity: 0.8 }}>Gross converted amount</div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: '600' }}>TOTAL LEADS</span>
            <Users size={24} className="text-primary" />
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{stats.totalLeads}</div>
          <div style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Successfully converted clients</div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: '600' }}>AVG. LEAD VALUE</span>
            <Target size={24} className="text-purple-500" />
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>
            ₹{stats.totalLeads > 0 ? Math.round(stats.totalAmount / stats.totalLeads).toLocaleString() : 0}
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Average per conversion</div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: '600' }}>TODAY'S PERFORMANCE</span>
            <Award size={24} className="text-amber-500" />
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>
            ₹{leads.filter(l => new Date(l.lastModified).toDateString() === new Date().toDateString())
                 .reduce((sum, l) => sum + (l.leadAmount || 0), 0).toLocaleString()}
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Lead amount today</div>
        </div>
      </div>

      <div className="glass-panel" style={{ marginBottom: '32px', padding: '24px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            className="input-field" 
            placeholder="Search leads by client name, phone, or details..." 
            style={{ paddingLeft: '52px', marginBottom: 0, height: '56px', fontSize: '1.1rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>Loading leads...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="glass-panel" style={{ padding: '80px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Star size={64} style={{ opacity: 0.1, margin: '0 auto 24px' }} />
          <h2>No leads found</h2>
          <p>You haven't converted any leads yet. Keep calling!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          {filteredLeads.map(lead => {
            const fields = lead.fields || {};
            const name = fields.Name || fields.name || 'Unknown';
            const phone = fields.Phone || fields.phone || fields.Mobile || 'N/A';
            
            return (
              <div key={lead._id} className="glass-panel lead-card" style={{ 
                padding: '24px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderLeft: `4px solid var(--success)`,
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)'
              }}>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flex: 1 }}>
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '16px', 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}>
                    <Star size={32} fill="white" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '4px', color: 'var(--success)' }}>{name}</h3>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><PhoneCall size={14} /> {phone}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> {new Date(lead.lastModified).toLocaleDateString()}</span>
                      {lead.remarks && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontStyle: 'italic' }}>
                          "{lead.remarks.substring(0, 50)}{lead.remarks.length > 50 ? '...' : ''}"
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div style={{ textAlign: 'right', minWidth: '200px' }}>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--success)', 
                    marginBottom: '4px', 
                    fontWeight: '700', 
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    💰 LEAD AMOUNT
                  </div>
                  <div style={{ 
                    fontSize: '2.2rem', 
                    fontWeight: '900', 
                    color: 'var(--success)',
                    textShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                    marginBottom: '8px'
                  }}>
                    ₹{lead.leadAmount?.toLocaleString() || 0}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    by {lead.agentName}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyLeads;
