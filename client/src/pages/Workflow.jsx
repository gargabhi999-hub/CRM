import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../utils/api';
import { PhoneCall, Check, Clock, Database, CheckCircle2, LayoutPanelLeft, AlertCircle, RotateCw } from 'lucide-react';

const DISPS = [
  { key: 'Lead', label: 'Lead', color: 'var(--success)' },
  { key: 'Appointment', label: 'Appointment', color: '#8b5cf6' },
  { key: 'CallNotAnswered', label: 'Call Not Answered', color: 'var(--warning)' },
  { key: 'Invalid', label: 'Invalid / Wrong No.', color: 'var(--danger)' },
  { key: 'DoNotCall', label: 'Do Not Call', color: 'var(--text-secondary)' },
  { key: 'CallBack', label: 'Call Back', color: '#06b6d4' },
];

const Workflow = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dispForm, setDispForm] = useState({ disposition: '', remarks: '', appointmentDt: '', leadAmount: '', callBackDt: '' });
  const [submitting, setSubmitting] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchNext = async () => {
    try {
      setLoading(true);
      const res = await api.get('/contacts/queue');
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNext();

    if (socket) {
      socket.on('contacts_updated', fetchNext);
      socket.on('batch_uploaded', fetchNext);
      socket.on('contact_disposed', fetchNext);
      socket.on('appointment_reminder', (data) => {
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'appointment',
          message: `Appointment reminder: ${data.contactName} in ${data.minutesUntil} minutes`,
          data
        }]);
      });
      socket.on('callback_due', (data) => {
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'callback',
          message: `Callback due: ${data.contactName}`,
          data
        }]);
      });
    }

    return () => {
      if (socket) {
        socket.off('contacts_updated', fetchNext);
        socket.off('batch_uploaded', fetchNext);
        socket.off('contact_disposed', fetchNext);
        socket.off('appointment_reminder');
        socket.off('callback_due');
      }
    };
  }, [socket]);

  const handleDispose = async (e) => {
    e.preventDefault();
    if (!data?.contact) return;
    
    if (dispForm.disposition === 'Lead' && (!dispForm.leadAmount || dispForm.leadAmount <= 0)) {
      alert('Valid Lead Amount is mandatory');
      return;
    }

    if (dispForm.disposition === 'Appointment' && !dispForm.appointmentDt) {
      alert('Appointment date and time is required');
      return;
    }

    if (dispForm.disposition === 'CallBack' && !dispForm.callBackDt) {
      alert('Callback date and time is required');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/contacts/${data.contact._id}/dispose`, dispForm);
      setDispForm({ disposition: '', remarks: '', appointmentDt: '', leadAmount: '', callBackDt: '' });
      fetchNext();
    } catch (error) {
      alert(error.response?.data?.error || 'Disposition failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !data) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading workflow...</div>;
  }

  if (!data?.contact) {
    return (
      <div className="glass-panel" style={{ padding: '80px', textAlign: 'center', marginTop: '40px' }}>
        <CheckCircle2 size={64} className="text-success" style={{ margin: '0 auto 24px', opacity: 0.5 }} />
        <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>Queue Completed!</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Great job! You have disposed all contacts in your queue.</p>
        <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={fetchNext}>Refresh Queue</button>
      </div>
    );
  }

  const { contact, remaining, total, disposed } = data;
  const fields = contact.fields || {};
  const progress = total > 0 ? Math.round((disposed / total) * 100) : 0;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Notifications */}
      {notifications.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          {notifications.map(notif => (
            <div key={notif.id} className={`glass-panel`} style={{
              padding: '12px 16px',
              marginBottom: '8px',
              borderLeft: `4px solid ${notif.type === 'appointment' ? '#8b5cf6' : '#06b6d4'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{notif.message}</span>
              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: '16px' }} className="workflow-header">
        <div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <PhoneCall className="text-primary" size={32} /> Agent Workflow
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="workflow-subtext">
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Contacting: <strong>{fields.Name || fields.name || 'Unknown Contact'}</strong></p>
            {contact.disposition === 'CallNotAnswered' && (
              <span className="badge badge-warning" style={{ display: 'flex', alignItems: 'center', gap: '4px', animation: 'pulse 2s infinite' }}>
                <RotateCw size={14} /> RECALL!
              </span>
            )}
            {data.type === 'callback_due' && (
              <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '4px', animation: 'pulse 2s infinite' }}>
                <Clock size={14} /> CALLBACK!
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' }} className="workflow-progress-badge">
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Queue Progress</div>
          <div className="badge badge-primary" style={{ padding: '8px 16px', fontSize: '1rem' }}>
            {remaining} Remaining
          </div>
        </div>
      </div>

      {/* Upcoming Appointments */}
      {data.upcomingAppointments && data.upcomingAppointments.length > 0 && (
        <div className="glass-panel" style={{ marginBottom: '20px', padding: '16px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} /> Upcoming Appointments
          </h3>
          {data.upcomingAppointments.map(apt => (
            <div key={apt._id} style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              {apt.fields?.Name || apt.fields?.name} - {new Date(apt.appointmentDt).toLocaleString()}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
          <span>{disposed} of {total} contacts disposed</span>
          <span>{progress}%</span>
        </div>
        <div style={{ height: '8px', background: 'var(--bg-surface)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.5s ease' }}></div>
        </div>
      </div>

      <div className="workflow-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', alignItems: 'start' }}>
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={20} className="text-primary" /> Contact Details
          </h2>
          
          <div className="contact-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {Object.entries(fields).map(([k, v]) => (
              <div key={k} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'capitalize' }}>{k}</label>
                <div style={{ fontWeight: '600', wordBreak: 'break-word' }}>{String(v) || '—'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LayoutPanelLeft size={20} className="text-primary" /> Disposition
          </h2>
          
          <form onSubmit={handleDispose}>
            <div className="input-group">
              <label>Outcome *</label>
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
                <label>Date & Time *</label>
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
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            )}

            {dispForm.disposition === 'CallBack' && (
              <div className="input-group">
                <label>Callback Date & Time *</label>
                <input 
                  type="datetime-local" 
                  className="input-field" 
                  value={dispForm.callBackDt} 
                  onChange={e => setDispForm({...dispForm, callBackDt: e.target.value})}
                  min={new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)} // Minimum 1 hour from now
                  required
                />
                <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  Schedule callback at least 1 hour from now
                </small>
              </div>
            )}

            <div className="input-group">
              <label>Remarks</label>
              <textarea 
                className="input-field" 
                rows="4" 
                value={dispForm.remarks} 
                onChange={e => setDispForm({...dispForm, remarks: e.target.value})}
                placeholder="Enter call notes..."
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '16px', height: '48px' }}
              disabled={!dispForm.disposition || submitting}
            >
              {submitting ? 'Submitting...' : 'Next Contact'} <Check size={18} style={{ marginLeft: '8px' }} />
            </button>
          </form>
        </div>
      </div>
      <style>{`
        .workflow-header {
          flex-direction: row;
        }
        @media (max-width: 768px) {
          .workflow-header {
            flex-direction: column;
            align-items: flex-start !important;
          }
          .workflow-progress-badge {
            text-align: left !important;
            width: 100%;
          }
          .workflow-progress-badge .badge {
            width: 100%;
            justify-content: center;
          }
          .workflow-grid {
            grid-template-columns: 1fr !important;
          }
          .contact-details-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
        @media (max-width: 480px) {
          .workflow-subtext {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 4px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Workflow;
