import React, { useState } from 'react';
import API_BASE_URL from '../config';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          name: role === 'admin' ? identifier : undefined,
          roll_no: role === 'student' ? identifier : undefined,
          password
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        showToast(data.message || 'Verification Failed', 'error');
        return;
      }
      
      localStorage.setItem('user', JSON.stringify(data.user));
      showToast(`${role === 'admin' ? 'Administrator' : 'Student'} Session Verified!`);
      
      setTimeout(() => {
        if (role === 'admin') navigate('/admin');
        else navigate('/student');
      }, 1000);

    } catch (err) {
      showToast('Network error. Is server running?', 'error');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 style={{ textAlign: 'center', color: 'var(--primary-color)', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '2rem' }}>SMARTQUIZ</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.875rem' }}>Precision Assessment Platform</p>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.5rem' }}>
            <button 
              type="button"
              onClick={() => setRole('student')}
              style={{ flex: 1, padding: '0.75rem', background: role === 'student' ? 'var(--primary-color)' : 'transparent', color: role === 'student' ? 'white' : 'var(--text-primary)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Student Portal
            </button>
            <button 
              type="button"
              onClick={() => setRole('admin')}
              style={{ flex: 1, padding: '0.75rem', background: role === 'admin' ? 'var(--primary-color)' : 'transparent', color: role === 'admin' ? 'white' : 'var(--text-primary)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Control Center
            </button>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8125rem', fontWeight: 'bold', color: '#64748b' }}>
              {role === 'admin' ? 'ADMIN ACCESS KEY' : 'ROLL NUMBER'}
            </label>
            <input 
              type="text" 
              className="input-field" 
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder={role === 'admin' ? 'Enter admin username' : 'roll no'}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8125rem', fontWeight: 'bold', color: '#64748b' }}>PASSWORD</label>
            <input 
              type="password" 
              className="input-field" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem', fontSize: '1.1rem', fontWeight: '900', letterSpacing: '1px' }}>
            ENTER PORTAL
          </button>
        </form>
      </div>

      {toast.show && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', padding: '1rem 2.5rem', background: toast.type === 'success' ? '#16a34a' : '#ef4444', color: 'white', borderRadius: '8px', fontWeight: 'bold', zIndex: 9999, boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default LoginPage;
