import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Bell, X, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AppointmentNotifier = () => {
  const { isAuthenticated } = useAuth();
  const [activeAppointments, setActiveAppointments] = useState([]);
  const [notifiedIds, setNotifiedIds] = useState(new Set());

  const checkAppointments = async () => {
    try {
      const res = await api.get('/leads/appointments');
      const now = new Date();
      
      const due = res.data.filter(app => {
        const appDt = new Date(app.appointmentDt);
        // If appointment is within the next 5 minutes or was in the last 15 minutes
        const diff = appDt - now;
        const diffMinutes = diff / (1000 * 60);
        
        return diffMinutes <= 5 && diffMinutes >= -15 && !notifiedIds.has(app._id);
      });

      if (due.length > 0) {
        setActiveAppointments(prev => [...prev, ...due]);
        setNotifiedIds(prev => {
          const next = new Set(prev);
          due.forEach(d => next.add(d._id));
          return next;
        });
      }
    } catch (err) {
      console.error('Notifier error:', err);
    }
  };

  useEffect(() => {
    // Only run if user is authenticated
    if (!isAuthenticated) return;
    
    // Check every minute
    const interval = setInterval(checkAppointments, 60000);
    checkAppointments(); // Initial check
    return () => clearInterval(interval);
  }, [notifiedIds, isAuthenticated]);

  const dismiss = (id) => {
    setActiveAppointments(prev => prev.filter(a => a._id !== id));
  };

  if (activeAppointments.length === 0) return null;

  return (
    <div className="appointment-notifier-container" style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '350px', width: 'calc(100% - 48px)' }}>
      {activeAppointments.map(app => (
        <div key={app._id} className="glass-panel animate-slide-in" style={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          borderLeft: '4px solid var(--primary)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          padding: '20px',
          display: 'flex',
          gap: '16px',
          position: 'relative'
        }}>
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-glow)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' 
          }}>
            <Bell className="animate-bounce" size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontWeight: '700', marginBottom: '4px' }}>Appointment Reminder!</h4>
            <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Call <strong>{app.fields?.Name || app.fields?.name || 'Contact'}</strong> now.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <Clock size={12} /> Scheduled for {new Date(app.appointmentDt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <button 
            onClick={() => dismiss(app._id)}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', alignSelf: 'flex-start' }}
          >
            <X size={18} />
          </button>
        </div>
      ))}
      <style>{`
        @media (max-width: 640px) {
          .appointment-notifier-container {
            top: auto !important;
            bottom: 24px !important;
            right: 12px !important;
            left: 12px !important;
            width: calc(100% - 24px) !important;
            max-width: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AppointmentNotifier;
