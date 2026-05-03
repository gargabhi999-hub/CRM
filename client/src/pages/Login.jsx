import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, LogIn, Sparkles } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

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
    }
    setIsLoading(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
            width: '64px', height: '64px', borderRadius: '16px', background: 'var(--primary)', 
            color: 'white', marginBottom: '16px', boxShadow: '0 0 20px var(--primary-glow)' 
          }}>
            <Sparkles size={32} />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '8px' }}>Spike CRM</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back! Please enter your details.</p>
        </div>

        {error && (
          <div style={{ 
            background: 'var(--danger-bg)', color: 'var(--danger)', padding: '12px', 
            borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' 
          }}>
            <ShieldAlert size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Username</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. admin" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="input-group" style={{ marginBottom: '24px' }}>
            <label>Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : <><LogIn size={18} /> Sign In</>}
          </button>
        </form>

        <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', fontSize: '0.85rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: '600' }}>Demo Credentials</p>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Admin:</span> <strong style={{ color: 'var(--text-primary)' }}>admin / admin123</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>TL:</span> <strong style={{ color: 'var(--text-primary)' }}>tl_rohit / tl123</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Agent:</span> <strong style={{ color: 'var(--text-primary)' }}>agent_priya / ag123</strong></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
