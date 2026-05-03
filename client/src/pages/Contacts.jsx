import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../utils/api';
import { Database, Search, PhoneCall, Check, X, Calendar, Star, Clock, Plus, Trash2 } from 'lucide-react';

const DISPS = [
  { key: 'Lead', label: 'Lead', color: 'var(--success)' },
  { key: 'Appointment', label: 'Appointment', color: '#8b5cf6' },
  { key: 'CallNotAnswered', label: 'Call Not Answered', color: 'var(--warning)' },
  { key: 'Invalid', label: 'Invalid / Wrong No.', color: 'var(--danger)' },
  { key: 'DoNotCall', label: 'Do Not Call', color: 'var(--text-secondary)' },
  { key: 'CallBack', label: 'Call Back', color: '#06b6d4' },
];

const Contacts = ({ filterType }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Disposition modal
  const [selectedContact, setSelectedContact] = useState(null);
  const [dispForm, setDispForm] = useState({ disposition: '', remarks: '', appointmentDt: '', leadAmount: '' });
  
  // Reassign modal (TL Only)
  const [reassigning, setReassigning] = useState(null);
  const [targetAgent, setTargetAgent] = useState('');
  const [teamAgents, setTeamAgents] = useState([]);

  // Admin Filters
  const [selectedTl, setSelectedTl] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [tls, setTls] = useState([]);
  const [allAgents, setAllAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);

  const fetchContacts = async () => {
    try {
      let query = '';
      if (filterType === 'leads') query = '?disposition=Lead';
      else if (filterType === 'appointments') query = '?disposition=Appointment';
      else if (filterType === 'workflow') query = '?disposition=pending';
      
      const connector = query ? '&' : '?';
      if (selectedTl) query += `${connector}tlId=${selectedTl}`;
      if (selectedAgent) query += `${query.includes('?') ? '&' : '?'}agentId=${selectedAgent}`;

      const res = await api.get(`/contacts${query}`);
      setContacts(res.data);

      if (user?.role === 'tl') {
        const teamRes = await api.get('/users/my-agents');
        setTeamAgents(teamRes.data);
      }

      if (user?.role === 'admin' && tls.length === 0) {
        const usersRes = await api.get('/users');
        const allUsers = usersRes.data;
        setTls(allUsers.filter(u => u.role === 'tl'));
        setAllAgents(allUsers.filter(u => u.role === 'agent'));
        setFilteredAgents(allUsers.filter(u => u.role === 'agent'));
      }
    } catch (err) {
      console.error('Failed to fetch contacts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();

    if (socket) {
      socket.on('contacts_updated', () => fetchContacts());
      socket.on('batch_uploaded', () => fetchContacts());
      socket.on('users_updated', () => fetchContacts());
    }

    return () => {
      if (socket) {
        socket.off('contacts_updated');
        socket.off('batch_uploaded');
        socket.off('users_updated');
      }
    };
  }, [filterType, socket, location.pathname, selectedTl, selectedAgent]);

  useEffect(() => {
    if (selectedTl) {
      setFilteredAgents(allAgents.filter(a => a.tlId === selectedTl));
      if (selectedAgent && !allAgents.find(a => a._id === selectedAgent && a.tlId === selectedTl)) {
        setSelectedAgent('');
      }
    } else {
      setFilteredAgents(allAgents);
    }
  }, [selectedTl, allAgents]);

  const filteredContacts = contacts.filter(c => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return Object.values(c.fields || {}).some(v => String(v).toLowerCase().includes(q)) ||
           (c.agentName && c.agentName.toLowerCase().includes(q));
  });

  const handleDispose = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/contacts/${selectedContact._id}/dispose`, dispForm);
      setSelectedContact(null);
      setDispForm({ disposition: '', remarks: '', appointmentDt: '' });
      // Socket will trigger refresh
    } catch (error) {
      alert(error.response?.data?.error || 'Disposition failed');
    }
  };

  const handleReassign = async () => {
    try {
      await api.put(`/contacts/${reassigning._id}`, { assignedTo: targetAgent });
      setReassigning(null);
      setTargetAgent('');
      fetchContacts();
    } catch (error) {
      alert(error.response?.data?.error || 'Reassignment failed');
    }
  };

  const handleDeleteContact = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await api.delete(`/contacts/${id}`);
        fetchContacts();
      } catch (error) {
        alert(error.response?.data?.error || 'Delete failed');
      }
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected contacts?`)) {
      try {
        await api.post('/contacts/bulk-delete', { ids: selectedIds });
        setSelectedIds([]);
        fetchContacts();
      } catch (error) {
        alert('Bulk delete failed');
      }
    }
  };

  const getPageTitle = () => {
    if (filterType === 'leads') return { title: 'Leads', icon: <Star className="text-success" size={32}/> };
    if (filterType === 'appointments') return { title: 'Appointments', icon: <Calendar className="text-purple-500" size={32}/> };
    if (filterType === 'workflow') return { title: 'Workflow Queue', icon: <Clock className="text-warning" size={32}/> };
    return { title: 'All Contacts', icon: <Database className="text-primary" size={32}/> };
  };

  const { title, icon } = getPageTitle();
  const totalLeadValue = contacts.reduce((sum, c) => sum + (Number(c.leadAmount) || 0), 0);

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '32px',
        gap: '20px'
      }} className="page-header-container">
        <div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {icon} {title}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {filterType === 'workflow' ? 'Your pending contacts to call' : `Manage and view your ${title.toLowerCase()}`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} className="header-actions">
          {selectedIds.length > 0 && user?.role === 'admin' && (
            <button className="btn btn-danger" onClick={handleBulkDelete}>
              <Trash2 size={18} /> <span className="hidden-mobile">Delete {selectedIds.length}</span><span className="mobile-only">Delete</span>
            </button>
          )}
          <div className="badge badge-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
            {filteredContacts.length} Records
          </div>
        </div>
      </div>
      
      {filterType === 'leads' && (
        <div className="glass-panel revenue-banner" style={{ 
          marginBottom: '24px', 
          padding: '24px', 
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '20px',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3)',
          border: 'none'
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '6px', fontWeight: '500' }}>TOTAL REVENUE GENERATED</div>
            <div style={{ fontSize: 'clamp(1.8rem, 8vw, 2.5rem)', fontWeight: '800', letterSpacing: '-0.02em' }}>₹{totalLeadValue.toLocaleString()}</div>
          </div>
          <div className="banner-secondary-info">
            <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '6px', fontWeight: '500' }}>TOTAL LEADS</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{filteredContacts.length}</div>
          </div>
        </div>
      )}



      <div className="glass-panel" style={{ marginBottom: '24px', padding: '16px 24px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            className="input-field" 
            placeholder="Search contacts by name, phone, email, or agent..." 
            style={{ paddingLeft: '44px', marginBottom: 0 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid-cards">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1' }}>Loading...</div>
        ) : filteredContacts.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-secondary)' }}>
            <Database size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
            <h3>No contacts found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          filteredContacts.map(contact => {
            const fields = contact.fields || {};
            const mainName = fields.Name || fields.name || 'Unknown Contact';
            const phone = fields.Phone || fields.phone || fields.Mobile || 'No Phone';
            const disp = DISPS.find(d => d.key === contact.disposition);
            const isSelected = selectedIds.includes(contact._id);
            
            return (
              <div 
                key={contact._id} 
                className="glass-panel" 
                style={{ 
                  padding: '20px', 
                  display: 'flex', 
                  flexDirection: 'column',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  position: 'relative'
                }}
              >
                {user?.role === 'admin' && (
                  <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10 }}>
                    <input 
                      type="checkbox" 
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      checked={isSelected}
                      onChange={() => toggleSelect(contact._id)}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', paddingLeft: user?.role === 'admin' ? '28px' : '0' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '4px' }}>{mainName}</h3>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <PhoneCall size={14} /> {phone}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    {disp ? (
                      <span className="badge" style={{ background: `${disp.color}22`, color: disp.color, border: `1px solid ${disp.color}44` }}>
                        {disp.label}
                      </span>
                    ) : (
                      <span className="badge badge-warning">Pending</span>
                    )}
                    {contact.leadAmount > 0 && (
                      <span className="badge badge-success" style={{ fontWeight: '800' }}>
                        ₹{contact.leadAmount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1, background: 'var(--bg-color)', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '0.85rem' }}>
                  <div className="contact-fields-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {(filterType === 'leads' ? Object.entries(fields) : Object.entries(fields).slice(0, 4)).map(([k, v]) => (
                      <div key={k} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ color: 'var(--text-secondary)', marginRight: '4px' }}>{k}:</span>
                        <strong>{String(v)}</strong>
                      </div>
                    ))}
                  </div>

                  {contact.leadAmount > 0 && (
                    <div style={{ marginTop: '12px', padding: '8px', borderRadius: '4px', background: 'var(--success)', color: 'white', fontWeight: '700', fontSize: '0.9rem', textAlign: 'center' }}>
                      Lead Amount: ₹{contact.leadAmount.toLocaleString()}
                    </div>
                  )}
                  {contact.remarks && (
                    <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'rgba(0,0,0,0.03)', padding: '8px', borderRadius: '4px' }}>
                      " {contact.remarks} "
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Agent: <strong style={{ color: 'var(--text-primary)' }}>{contact.agentName}</strong>
                  </div>
                  
                  {user?.role === 'agent' && !contact.disposition && (
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => {
                        setSelectedContact(contact);
                        setDispForm({ disposition: '', remarks: '', appointmentDt: '', leadAmount: '' });
                      }}
                    >
                      <Check size={14} /> Dispose
                    </button>
                  )}

                  {user?.role === 'tl' && !contact.disposition && (
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => {
                        setReassigning(contact);
                        setTargetAgent('');
                      }}
                    >
                      <Plus size={14} /> Assign Agent
                    </button>
                  )}

                  {user?.role === 'admin' && (
                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '6px', marginLeft: '8px' }}
                      onClick={() => handleDeleteContact(contact._id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Disposition Modal */}
      {selectedContact && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', padding: '32px', background: 'var(--bg-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.5rem' }}>Update Status</h2>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setSelectedContact(null)}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleDispose}>
              <div className="input-group">
                <label>Outcome / Disposition *</label>
                <select 
                  className="input-field" 
                  value={dispForm.disposition} 
                  onChange={e => setDispForm({...dispForm, disposition: e.target.value})}
                  required
                >
                  <option value="">-- Select Outcome --</option>
                  {DISPS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                </select>
              </div>

              {dispForm.disposition === 'Appointment' && (
                <div className="input-group">
                  <label>Appointment Date & Time *</label>
                  <input 
                    type="datetime-local" 
                    className="input-field" 
                    value={dispForm.appointmentDt} 
                    onChange={e => setDispForm({...dispForm, appointmentDt: e.target.value})}
                    required
                  />
                </div>
              )}

              {dispForm.disposition === 'Lead' && (
                <div className="input-group">
                  <label>Lead Amount (Currency) *</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="Enter final deal amount"
                    value={dispForm.leadAmount} 
                    onChange={e => setDispForm({...dispForm, leadAmount: e.target.value})}
                    required
                  />
                </div>
              )}

              <div className="input-group">
                <label>Remarks / Notes</label>
                <textarea 
                  className="input-field" 
                  rows="3" 
                  value={dispForm.remarks} 
                  onChange={e => setDispForm({...dispForm, remarks: e.target.value})}
                  placeholder="Enter any additional details..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setSelectedContact(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!dispForm.disposition}>Save Disposition</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Modal (TL Only) */}
      {reassigning && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '32px', background: 'var(--bg-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.2rem' }}>Distribute to Agent</h2>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setReassigning(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="input-group">
              <label>Select Agent in your Team</label>
              <select className="input-field" value={targetAgent} onChange={e => setTargetAgent(e.target.value)}>
                <option value="">-- Choose Agent --</option>
                {teamAgents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <button className="btn btn-outline" onClick={() => setReassigning(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleReassign} disabled={!targetAgent}>Confirm Assignment</button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .page-header-container {
          flex-direction: row;
          align-items: center;
        }
        .revenue-banner {
          flex-direction: row;
          align-items: center;
        }
        .banner-secondary-info {
          text-align: right;
        }
        @media (max-width: 768px) {
          .page-header-container {
            flex-direction: column;
            align-items: flex-start;
          }
          .header-actions {
            width: 100%;
            justify-content: space-between;
          }
          .header-actions button {
            flex: 1;
          }
          .revenue-banner {
            flex-direction: column;
            align-items: flex-start;
          }
          .banner-secondary-info {
            text-align: left;
          }
        }
        @media (max-width: 480px) {
          .contact-fields-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Contacts;
