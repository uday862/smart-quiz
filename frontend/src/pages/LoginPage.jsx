import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {

  const navigate = useNavigate();
  const { user, login, isAuthenticated } = useAuth();
  const [role, setRole] = useState('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Forgot password flow state variables
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOTP, setForgotOTP] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'student') navigate('/student', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

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
      
      login(data.user, data.token);
      showToast(`${role === 'admin' ? 'Administrator' : 'Student'} Session Verified!`);

    } catch (err) {
      showToast('Network error. Is server running?', 'error');
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setIsForgotLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Failed to send OTP', 'error');
        return;
      }
      showToast(data.message || 'OTP Sent!');
      setForgotStep(2);
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsForgotLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOTP, newPassword: forgotNewPass })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Failed to reset password', 'error');
        return;
      }
      showToast('Password updated successfully!');
      setShowForgot(false);
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 style={{ textAlign: 'center', color: 'var(--primary-color)', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '2rem' }}>SMARTQUIZ</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.875rem' }}>Precision Assessment Platform</p>
        
        {!showForgot ? (
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

            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => { setShowForgot(true); setForgotStep(1); setForgotEmail(''); setForgotOTP(''); setForgotNewPass(''); }} 
                style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Forgot Password?
              </button>
            </div>
          </form>
        ) : (
          <div>
            <h3 style={{ textAlign: 'center', color: 'var(--text-primary)', marginBottom: '1.5rem', fontWeight: 'bold', fontSize: '1.25rem' }}>
              {forgotStep === 1 ? 'Recover Password' : 'Enter OTP & Reset'}
            </h3>
            
            {forgotStep === 1 ? (
              <form onSubmit={handleRequestOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8125rem', fontWeight: 'bold', color: '#64748b' }}>EMAIL ADDRESS</label>
                  <input 
                    type="email" 
                    className="input-field" 
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="student@university.com"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem', fontSize: '1.1rem', fontWeight: '900', letterSpacing: '1px' }} disabled={isForgotLoading}>
                  {isForgotLoading ? 'SENDING...' : 'SEND OTP'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setShowForgot(false)} 
                    style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8125rem', fontWeight: 'bold', color: '#64748b' }}>EMAIL ADDRESS</label>
                  <input 
                    type="email" 
                    className="input-field" 
                    value={forgotEmail}
                    disabled
                    style={{ background: '#f1f5f9' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8125rem', fontWeight: 'bold', color: '#64748b' }}>ONE-TIME OTP</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={forgotOTP}
                    onChange={e => setForgotOTP(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8125rem', fontWeight: 'bold', color: '#64748b' }}>NEW PASSWORD</label>
                  <input 
                    type="password" 
                    className="input-field" 
                    value={forgotNewPass}
                    onChange={e => setForgotNewPass(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '1rem', fontSize: '1.1rem', fontWeight: '900', letterSpacing: '1px' }} disabled={isForgotLoading}>
                  {isForgotLoading ? 'RESETTING...' : 'RESET & UPDATE PASSWORD'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                  <button 
                    type="button" 
                    onClick={() => setForgotStep(1)} 
                    style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Resend OTP
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowForgot(false)} 
                    style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
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
