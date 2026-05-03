import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, LogIn, Sparkles, Eye, EyeOff, Copy, Check } from 'lucide-react';

const DEMO_CREDS = [
  { role: 'Admin',      user: 'admin',       pass: 'admin123', color: '#f59e0b' },
  { role: 'Team Lead',  user: 'tl_rohit',    pass: 'tl123',    color: '#6366f1' },
  { role: 'Agent',      user: 'agent_priya', pass: 'ag123',    color: '#10b981' },
];

const Login = () => {
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied]       = useState(null);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    if (!username || !password) {
      setError('Please enter both username and password.');
      setIsLoading(false);
      return;
    }
    const result = await login(username, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
      setIsLoading(false);
    }
  };

  const fillCreds = (cred) => {
    setUsername(cred.user);
    setPassword(cred.pass);
    setError('');
  };

  const copyCred = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="login-root">
      {/* Left brand panel — hidden on mobile */}
      <div className="login-brand-panel">
        <div className="login-brand-content">
          <div className="login-brand-logo">
            <Sparkles size={36} />
          </div>
          <h1 className="login-brand-title">Spike CRM</h1>
          <p className="login-brand-tagline">
            The intelligent contact management platform for high-performance sales teams.
          </p>
          <div className="login-brand-pills">
            <div className="login-brand-pill">📊 Real-time analytics</div>
            <div className="login-brand-pill">📞 Agent workflow engine</div>
            <div className="login-brand-pill">🔒 Role-based access</div>
            <div className="login-brand-pill">⚡ Live Socket.io sync</div>
          </div>
        </div>
        {/* Decorative blobs */}
        <div className="login-blob blob-1" />
        <div className="login-blob blob-2" />
      </div>

      {/* Right form panel */}
      <div className="login-form-panel">
        <div className="login-card animate-fade-up">
          {/* Mobile logo */}
          <div className="login-mobile-logo">
            <div className="login-brand-logo" style={{ width: 52, height: 52, borderRadius: 14, margin: '0 auto 12px' }}>
              <Sparkles size={24} />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: '1.3rem' }}>Spike CRM</h2>
          </div>

          <h2 className="login-form-title">Welcome back</h2>
          <p className="login-form-subtitle">Sign in to your account to continue</p>

          {error && (
            <div className="login-error">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="login-username">Username</label>
              <input
                id="login-username"
                type="text"
                className="input-field"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label htmlFor="login-password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    color: 'var(--text-muted)', cursor: 'pointer', padding: 0,
                    display: 'flex',
                  }}
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '48px', fontSize: '0.95rem' }}
              disabled={isLoading}
            >
              {isLoading
                ? <span className="animate-spin" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
                : <><LogIn size={17} /> Sign In</>
              }
            </button>
          </form>

          {/* Demo credentials */}
          <div className="login-demo">
            <div className="login-demo-label">Quick Access — Demo Credentials</div>
            <div className="login-demo-list">
              {DEMO_CREDS.map((c) => (
                <button
                  key={c.role}
                  className="login-demo-chip"
                  onClick={() => fillCreds(c)}
                  style={{ borderColor: `${c.color}40` }}
                  type="button"
                >
                  <span className="login-demo-dot" style={{ background: c.color }} />
                  <div className="login-demo-info">
                    <span className="login-demo-role" style={{ color: c.color }}>{c.role}</span>
                    <span className="login-demo-un">{c.user}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); copyCred(`${c.user} / ${c.pass}`, c.role); }}
                    className="login-copy-btn"
                    title="Copy credentials"
                  >
                    {copied === c.role ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                  </button>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .login-root {
          display: flex;
          min-height: 100vh;
          background: var(--bg-base);
        }

        /* ── Brand Panel ── */
        .login-brand-panel {
          flex: 1;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(145deg, #1e40af 0%, #1d4ed8 40%, #2563eb 70%, #3b82f6 100%);
          padding: 48px;
        }
        @media (max-width: 768px) { .login-brand-panel { display: none; } }

        .login-brand-content { position: relative; z-index: 1; max-width: 400px; }
        .login-brand-logo {
          width: 72px; height: 72px;
          border-radius: 18px;
          background: rgba(255,255,255,0.18);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.3);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          box-shadow: 0 12px 32px rgba(0,0,0,0.15);
          margin-bottom: 28px;
        }
        .login-brand-title {
          font-size: 2.4rem; font-weight: 900;
          color: #fff;
          margin-bottom: 16px;
          line-height: 1.1;
        }
        .login-brand-tagline {
          font-size: 1rem;
          color: rgba(255,255,255,0.84);
          line-height: 1.7;
          margin-bottom: 36px;
        }
        .login-brand-pills { display: flex; flex-direction: column; gap: 10px; }
        .login-brand-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.22);
          border-radius: var(--r-md);
          font-size: 0.875rem;
          color: rgba(255,255,255,0.92);
          backdrop-filter: blur(8px);
        }

        /* Decorative blobs */
        .login-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.22;
        }
        .blob-1 {
          width: 420px; height: 420px;
          background: #93c5fd;
          top: -120px; left: -100px;
        }
        .blob-2 {
          width: 300px; height: 300px;
          background: #818cf8;
          bottom: -60px; right: -60px;
        }

        /* ── Form Panel ── */
        .login-form-panel {
          width: 100%;
          max-width: 480px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          background: rgba(255,255,255,0.90);
          backdrop-filter: blur(24px);
        }
        @media (max-width: 768px) {
          .login-form-panel {
            max-width: 100%;
            background: var(--bg-base);
            padding: 32px 20px;
          }
        }

        .login-card { width: 100%; }

        .login-mobile-logo {
          display: none;
          text-align: center;
          margin-bottom: 28px;
        }
        @media (max-width: 768px) { .login-mobile-logo { display: block; } }

        .login-form-title {
          font-size: 1.6rem; font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 6px;
        }
        .login-form-subtitle {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-bottom: 28px;
        }

        .login-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--danger-light);
          color: var(--danger);
          border: 1px solid rgba(239,68,68,0.25);
          padding: 12px 14px;
          border-radius: var(--r-md);
          font-size: 0.875rem;
          margin-bottom: 20px;
        }

        /* Demo credentials */
        .login-demo {
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px solid var(--border);
        }
        .login-demo-label {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin-bottom: 12px;
        }
        .login-demo-list { display: flex; flex-direction: column; gap: 8px; }
        .login-demo-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: var(--bg-surface-2);
          border: 1px solid;
          border-radius: var(--r-md);
          cursor: pointer;
          transition: all var(--t-fast);
          text-align: left;
          width: 100%;
          font-family: var(--font);
        }
        .login-demo-chip:hover { background: var(--bg-surface-hover); }
        .login-demo-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .login-demo-info { flex: 1; display: flex; flex-direction: column; gap: 1px; }
        .login-demo-role { font-size: 0.72rem; font-weight: 700; }
        .login-demo-un   { font-size: 0.78rem; color: var(--text-secondary); }
        .login-copy-btn {
          background: none; border: none;
          color: var(--text-muted); cursor: pointer;
          padding: 4px; display: flex;
          transition: color var(--t-fast);
        }
        .login-copy-btn:hover { color: var(--text-primary); }
      `}</style>
    </div>
  );
};

export default Login;
