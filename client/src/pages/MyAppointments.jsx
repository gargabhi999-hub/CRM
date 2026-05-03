import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Calendar, Clock, User, Phone, MapPin, ChevronRight, Bell } from 'lucide-react';

const MyAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leads/appointments');
      setAppointments(res.data);
    } catch (err) {
      console.error('Failed to fetch appointments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const isToday = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: '16px' }} className="appointments-header">
        <div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 6vw, 2.5rem)', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Calendar className="text-primary" size={clampIcon(32, 40)} /> My Appointments
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)' }}>
            Your scheduled callbacks and meetings with potential leads
          </p>
        </div>
        <div className="badge badge-primary appointment-count-badge" style={{ padding: '12px 24px', fontSize: '1.1rem' }}>
          {appointments.length} <span className="hidden-mobile">Scheduled</span><span className="mobile-only">Slots</span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>Loading appointments...</div>
      ) : appointments.length === 0 ? (
        <div className="glass-panel" style={{ padding: '80px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Calendar size={64} style={{ opacity: 0.1, margin: '0 auto 24px' }} />
          <h2>No upcoming appointments</h2>
          <p>Schedule appointments during your workflow to see them here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {appointments.map(app => {
            const fields = app.fields || {};
            const name = fields.Name || fields.name || 'Unknown Client';
            const phone = fields.Phone || fields.phone || fields.Mobile || 'N/A';
            const today = isToday(app.appointmentDt);

            return (
              <div 
                key={app._id} 
                className="glass-panel appointment-card" 
                style={{ 
                  padding: '0', 
                  overflow: 'hidden',
                  border: today ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  display: 'flex'
                }}
              >
                <div className="appointment-date-side" style={{ 
                  width: '120px', 
                  background: today ? 'var(--primary)' : 'var(--bg-surface-hover)',
                  color: today ? 'white' : 'var(--text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                  flexShrink: 0
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px', opacity: 0.8 }}>
                    {today ? 'TODAY' : new Date(app.appointmentDt).toLocaleDateString('en-IN', { month: 'short' })}
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '800' }}>
                    {new Date(app.appointmentDt).getDate()}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                    {formatTime(app.appointmentDt)}
                  </div>
                </div>

                <div className="appointment-content" style={{ flex: 1, padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span> {today && <Bell size={18} className="text-primary" style={{ animation: 'bounce 2s infinite', flexShrink: 0 }} />}
                    </h3>
                    <div className="appointment-meta" style={{ display: 'flex', gap: '20px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={16} /> {phone}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} /> <span className="hidden-mobile">Scheduled by</span> {app.agentName}</span>
                    </div>
                    {app.remarks && (
                      <div style={{ marginTop: '12px', padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '8px', fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                        "{app.remarks}"
                      </div>
                    )}
                  </div>
                  <button className="btn btn-primary appointment-action-btn" style={{ padding: '12px 24px', flexShrink: 0 }}>
                    <span className="hidden-mobile">Contact Now</span> <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <style>{`
        .appointments-header {
          flex-direction: row;
        }
        @media (max-width: 768px) {
          .appointments-header {
            flex-direction: column;
            align-items: flex-start !important;
          }
          .appointment-count-badge {
            width: 100%;
            justify-content: center;
          }
          .appointment-card {
            flex-direction: column;
          }
          .appointment-date-side {
            width: 100% !important;
            flex-direction: row !important;
            gap: 20px;
            padding: 12px !important;
            justify-content: center !important;
          }
          .appointment-date-side div {
            margin: 0 !important;
          }
          .appointment-content {
            flex-direction: column;
            align-items: stretch !important;
            gap: 16px !important;
          }
          .appointment-action-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

const clampIcon = (min, max) => `clamp(${min}px, 5vw, ${max}px)`;

export default MyAppointments;
