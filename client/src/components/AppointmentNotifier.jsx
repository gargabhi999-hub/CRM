import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, X } from 'lucide-react';

const MAX_TOASTS = 5;

const AppointmentNotifier = () => {
  const { socket } = useSocket();
  const { isAuthenticated } = useAuth();
  const [toasts, setToasts] = useState([]);

  const add = (toast) =>
    setToasts(prev => [toast, ...prev].slice(0, MAX_TOASTS));

  const remove = (id) =>
    setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    socket.on('appointment_reminder', (data) => {
      add({
        id: Date.now(),
        type: 'appointment',
        title: 'Appointment Reminder',
        message: `${data.contactName} — in ${data.minutesUntil} minutes`,
      });
    });

    socket.on('callback_due', (data) => {
      add({
        id: Date.now(),
        type: 'callback',
        title: 'Callback Due',
        message: data.contactName,
      });
    });

    return () => {
      socket.off('appointment_reminder');
      socket.off('callback_due');
    };
  }, [socket, isAuthenticated]);

  /* Auto-dismiss after 8s */
  useEffect(() => {
    if (toasts.length === 0) return;
    const oldest = toasts[toasts.length - 1];
    const timer = setTimeout(() => remove(oldest.id), 8000);
    return () => clearTimeout(timer);
  }, [toasts]);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 76,
      right: 20,
      zIndex: 3000,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      maxWidth: 340,
      width: 'calc(100vw - 40px)',
    }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className="glass-panel animate-fade-up"
          style={{
            padding: '14px 16px',
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            borderLeft: `4px solid ${t.type === 'appointment' ? '#8b5cf6' : '#06b6d4'}`,
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{
            width: 34, height: 34,
            borderRadius: 'var(--r-sm)',
            background: t.type === 'appointment' ? 'var(--violet-light)' : 'var(--cyan-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            color: t.type === 'appointment' ? '#8b5cf6' : '#06b6d4',
          }}>
            {t.type === 'appointment' ? <Calendar size={16} /> : <Clock size={16} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: t.type === 'appointment' ? '#8b5cf6' : '#06b6d4', marginBottom: 3 }}>
              {t.title}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.message}
            </div>
          </div>
          <button
            onClick={() => remove(t.id)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, flexShrink: 0 }}
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AppointmentNotifier;
