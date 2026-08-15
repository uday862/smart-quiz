import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, ShieldCheck, User, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { user, login, isAuthenticated } = useAuth();
  const [role, setRole] = useState('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'admin') navigate('/admin', { replace: true });
      else if (user?.role === 'student') navigate('/student', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
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
        setLoading(false);
        return;
      }
      
      login(data.user, data.token);
      showToast(`${role === 'admin' ? 'Administrator' : 'Student'} Session Verified!`);

    } catch (err) {
      showToast('Network error. Is server running?', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clean-login-wrapper">
      <div className="clean-login-card">
        {/* Brand Header */}
        <div className="clean-login-header">
          <div className="clean-brand-logo">SMART QUIZ</div>
          <p className="clean-brand-sub">Precision Assessment Platform</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="clean-role-toggle">
          <button
            type="button"
            className={`clean-role-btn ${role === 'student' ? 'active' : ''}`}
            onClick={() => { setRole('student'); setIdentifier(''); }}
          >
            <GraduationCap size={18} />
            <span>Student Portal</span>
          </button>
          <button
            type="button"
            className={`clean-role-btn ${role === 'admin' ? 'active' : ''}`}
            onClick={() => { setRole('admin'); setIdentifier(''); }}
          >
            <ShieldCheck size={18} />
            <span>Control Center</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="clean-login-form">
          <div className="clean-input-group">
            <label className="clean-label">
              {role === 'admin' ? 'ADMIN ACCESS KEY' : 'ROLL NUMBER'}
            </label>
            <div className="clean-input-wrapper">
              <span className="clean-input-icon">
                {role === 'admin' ? <ShieldCheck size={18} /> : <User size={18} />}
              </span>
              <input
                type="text"
                className="clean-input"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder={role === 'admin' ? 'Enter admin username' : 'Enter roll no (e.g. 22CS001)'}
                required
              />
            </div>
          </div>

          <div className="clean-input-group">
            <label className="clean-label">PASSWORD</label>
            <div className="clean-input-wrapper">
              <span className="clean-input-icon"><Lock size={18} /></span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="clean-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="clean-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`clean-submit-btn ${role === 'admin' ? 'admin' : 'student'}`}
          >
            {loading ? 'AUTHENTICATING...' : (
              <>
                <LogIn size={18} />
                <span>SIGN IN TO {role === 'admin' ? 'CONTROL CENTER' : 'STUDENT PORTAL'}</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Options */}
        <div className="clean-demo-section">
          <span className="clean-demo-title">Quick Demo Access:</span>
          <div className="clean-demo-buttons">
            <button
              type="button"
              onClick={() => { setRole('student'); setIdentifier('22CS001'); setPassword('alice123'); }}
              className="clean-demo-btn"
            >
              🎓 Student Demo
            </button>
            <button
              type="button"
              onClick={() => { setRole('admin'); setIdentifier('admin'); setPassword('admin123'); }}
              className="clean-demo-btn admin"
            >
              ⚡ Admin Demo
            </button>
          </div>
        </div>
      </div>

      {toast.show && (
        <div className={`clean-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default LoginPage;
