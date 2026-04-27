import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import LiveMonitoring from './pages/LiveMonitoring';
import Analytics from './pages/Analytics';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAttemptSummary from './pages/student/StudentAttemptSummary';
import StudentCodeIDE from './pages/student/StudentCodeIDE';
import StudentSQLIDE from './pages/student/StudentSQLIDE';
import StudentReview from './pages/student/StudentReview';
import StudentHistory from './pages/student/StudentHistory';
import StudentJumbleQuiz from './pages/student/StudentJumbleQuiz';
import StudentProfile from './pages/student/StudentProfile';
import LoginPage from './pages/LoginPage';
import API_BASE_URL from './config';
import './App.css';
import SimpleChatbot from './pages/student/SimpleChatbot';
import { Moon, Sun } from 'lucide-react';

/* ─────────── Dark Mode Toggle ─────────── */
const DarkModeToggle = () => {
  const [isDark, setIsDark] = useState(() => document.body.classList.contains('dark-mode'));
  const toggle = () => {
    document.body.classList.toggle('dark-mode');
    setIsDark(!isDark);
  };
  return (
    <button onClick={toggle} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Toggle Dark Mode">
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
};

/* ─────────── Admin Layout ─────────── */
const AdminLayout = ({ children }) => (
  <div className="app-container">
    <nav className="sidebar">
      <div className="brand" style={{ background: '#0f172a', color: 'white', padding: '1.5rem', fontWeight: '900', fontStyle: 'italic', letterSpacing: '1px', fontSize: '1.5rem' }}>SMART QUIZ</div>
      <ul className="nav-links">
        <li><Link to="/admin">Dashboard</Link></li>
        <li><Link to="/admin/analytics">Analytics</Link></li>
        <li style={{ marginTop: 'auto', paddingTop: '2rem' }}><DarkModeToggle /></li>
        <li><Link to="/" onClick={() => { localStorage.removeItem('user'); }} style={{ color: 'var(--danger-color)', marginTop: '2rem' }}>Logout</Link></li>
      </ul>
    </nav>
    <main className="main-content">{children}</main>
  </div>
);

/* ─────────── Notification Bell ─────────── */
const NotificationBell = ({ userId }) => {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const dropRef = useRef(null);

  const fetchNotifs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${userId}`);
      const data = await res.json();
      setNotifs(Array.isArray(data) ? data : []);
      setUnread((Array.isArray(data) ? data : []).filter(n => !n.isRead).length);
    } catch (e) {}
  };

  useEffect(() => {
    if (userId) {
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 30000); // poll every 30s
      return () => clearInterval(interval);
    }
  }, [userId]);

  useEffect(() => {
    const handleOutside = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/student/${userId}/read-all`, { method: 'PUT' });
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch (e) {}
  };

  const markRead = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const typeIcon = { welcome: '👋', assignment_started: '📋', score_updated: '🏆', general: '🔔' };
  const typeColor = { welcome: '#3b82f6', assignment_started: '#f36d44', score_updated: '#16a34a', general: '#7c3aed' };

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(v => !v); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        title="Notifications"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span style={{ position: 'absolute', top: -2, right: -2, background: '#ef4444', color: 'white', fontSize: '0.6rem', fontWeight: '900', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #071125' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: '120%', right: 0, width: 340, background: 'white', borderRadius: '14px', boxShadow: '0 12px 40px rgba(0,0,0,0.18)', zIndex: 9999, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '0.85rem 1rem', background: '#071125', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '900', fontSize: '0.9rem' }}>🔔 Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: '0.72rem', padding: '0.25rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No notifications yet</div>
            ) : notifs.map(n => (
              <div
                key={n._id}
                onClick={() => markRead(n._id)}
                style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #f1f5f9', background: n.isRead ? 'white' : '#f0f9ff', cursor: 'pointer', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', transition: 'background 0.15s' }}
              >
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: (typeColor[n.type] || '#3b82f6') + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                  {typeIcon[n.type] || '🔔'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: n.isRead ? '600' : '800', fontSize: '0.82rem', color: '#1e293b', marginBottom: '0.2rem' }}>{n.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>{n.message}</div>
                  <div style={{ fontSize: '0.67rem', color: '#94a3b8', marginTop: '0.3rem' }}>{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: '4px' }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────── Student Layout ─────────── */
const StudentLayout = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const navLink = (to, label) => ({
    style: {
      color: 'white', textDecoration: 'none',
      borderBottom: path === to || (to !== '/student' && path.startsWith(to)) ? '2px solid #f36d44' : 'none',
      paddingBottom: '4px', fontSize: '0.875rem', fontWeight: '600', whiteSpace: 'nowrap'
    }
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ background: '#071125', color: 'white', padding: '0.85rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.25)', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ background: 'white', padding: '0.3rem 0.7rem', borderRadius: '4px' }}>
            <span style={{ color: '#000', fontWeight: '900', fontStyle: 'italic', fontSize: '1.2rem' }}>SMART QUIZ</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Link to="/student" {...navLink('/student', 'Dashboard')}>Dashboard</Link>
            <Link to="/student/assignments" {...navLink('/student/assignments', 'Assignments')}>Assignments</Link>
            <Link to="/student/completed" {...navLink('/student/completed', 'Completed Tasks')}>Completed</Link>
            <Link to="/student/reports" {...navLink('/student/reports', 'Reports')}>Reports</Link>
            <Link to="/student/profile" {...navLink('/student/profile', 'Profile')}>Profile</Link>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <DarkModeToggle />
          {user && <NotificationBell userId={user.id} />}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: user?.avatar_color || '#f36d44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '0.75rem', color: 'white' }}>
              {user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??'}
            </div>
            <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>{user?.name}</span>
          </div>
          <button
            onClick={() => { localStorage.removeItem('user'); navigate('/'); }}
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', padding: '0.3rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}
          >
            Log out
          </button>
        </div>
      </nav>
      <main style={{ flex: 1, background: '#f5f7fa' }}>
        {children}
      </main>
      {user && <SimpleChatbot userId={user.id} />}
    </div>
  );
};

/* ─────────── App ─────────── */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <AdminLayout>
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/live/:taskId" element={<LiveMonitoring />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </AdminLayout>
        } />

        {/* Student Routes */}
        <Route path="/student/*" element={
          <StudentLayout>
            <Routes>
              <Route path="/" element={<StudentDashboard tab="Dashboard" />} />
              <Route path="/assignments" element={<StudentDashboard tab="Assignments" />} />
              <Route path="/completed" element={<StudentDashboard tab="Completed Tasks" />} />
              <Route path="/reports" element={<StudentDashboard tab="Reports" />} />
              <Route path="/profile" element={<StudentProfile />} />
              <Route path="/summary/:id" element={<StudentAttemptSummary />} />
              <Route path="/quiz/:id" element={<StudentCodeIDE />} />
              <Route path="/sql/:id" element={<StudentSQLIDE />} />
              <Route path="/review/:id" element={<StudentReview />} />
              <Route path="/history" element={<StudentHistory />} />
              <Route path="/jumble/:id" element={<StudentJumbleQuiz />} />
            </Routes>
          </StudentLayout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
