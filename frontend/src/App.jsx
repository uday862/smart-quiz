import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
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
import { useAuth } from './contexts/AuthContext';
import { AdminProtectedRoute, StudentProtectedRoute } from './components/ProtectedRoute';
import { Moon, Sun, LogOut, ShieldCheck, LayoutDashboard, BarChart3, GraduationCap, Users, Layers, FileText } from 'lucide-react';

/* ─────────── Admin Layout ─────────── */
const AdminLayout = (props) => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const query = new URLSearchParams(location.search);
  const currentTab = query.get('tab') || 'Days';

  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={18} />, to: '/admin' },
    { label: 'Analytics', icon: <BarChart3 size={18} />, to: '/admin/analytics' },
    { label: 'Resource Hub', icon: <Layers size={18} />, to: '/admin?tab=Resource+Hub' },
    { label: 'Students', icon: <Users size={18} />, to: '/admin?tab=Students' },
    { label: 'Groups', icon: <Layers size={18} />, to: '/admin?tab=Groups' },
    { label: 'Reports', icon: <FileText size={18} />, to: '/admin?tab=Reports' },
    { label: 'Admins', icon: <ShieldCheck size={18} />, to: '/admin?tab=Admins' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: 'var(--bg-color)', overflow: 'hidden' }}>
      {/* ── Left Sidebar Navigation ── */}
      <aside className="admin-sidebar" style={{
        width: '260px',
        background: '#071125',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.5rem 1.25rem',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        zIndex: 100,
        flexShrink: 0
      }}>
        <div>
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', paddingLeft: '0.5rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(249,115,22,0.4)' }}>
              <GraduationCap size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: '900', letterSpacing: '0.5px', color: 'white', lineHeight: 1.1 }}>
                SMART QUIZ <span style={{ color: '#f97316', fontSize: '0.7rem', verticalAlign: 'super' }}>PRO</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: '600' }}>Admin Control</div>
            </div>
          </div>

          {/* Sidebar Nav Links */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {navItems.map(item => {
              const isPathActive = item.to === '/admin' ? (location.pathname === '/admin' && (currentTab === 'Days' || !location.search)) :
                item.to === '/admin/analytics' ? location.pathname === '/admin/analytics' :
                (location.pathname === '/admin' && location.search.includes(item.label.replace(' ', '+')));

              return (
                <Link
                  key={item.label}
                  to={item.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    color: isPathActive ? '#ffffff' : '#94a3b8',
                    background: isPathActive ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'transparent',
                    textDecoration: 'none',
                    fontWeight: isPathActive ? '800' : '600',
                    fontSize: '0.88rem',
                    boxShadow: isPathActive ? '0 4px 14px rgba(249,115,22,0.35)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Status Banner & Logout Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '1rem', color: 'white' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '800', marginBottom: '0.25rem' }}>🏆 Great job!</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.3 }}>Your system is running smoothly.</div>
            <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', height: '4px', borderRadius: '2px', marginTop: '0.65rem', overflow: 'hidden' }}>
              <div style={{ width: '100%', background: '#f97316', height: '100%' }}></div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              padding: '0.75rem',
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '12px',
              color: '#fca5a5',
              fontWeight: '800',
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <LogOut size={18} color="#ef4444" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="main-content" style={{ flex: 1, height: '100vh', overflowY: 'auto', background: 'var(--bg-color)' }}>
        {props.children}
      </main>
    </div>
  );
};

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
      const interval = setInterval(fetchNotifs, 30000);
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
                  <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.4' }}>{n.message}</div>
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
const StudentLayout = (props) => {
  const { logout } = useAuth();
  const user = JSON.parse(localStorage.getItem('user'));
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const [news, setNews] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [hideLayout, setHideLayout] = useState(false);

  useEffect(() => {
    const handleExamConfig = (e) => {
      setHideLayout(!!e.detail?.fullWindow);
    };
    window.addEventListener('active_exam_config', handleExamConfig);
    return () => {
      window.removeEventListener('active_exam_config', handleExamConfig);
    };
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/announcements`)
      .then(res => res.json())
      .then(data => setNews(data.message || ''))
      .catch(e => console.error(e));
  }, []);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackMsg.trim()) return;
    try {
      await fetch(`${API_BASE_URL}/api/feedback`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student: user?.id, message: feedbackMsg })
      });
      alert('Feedback submitted successfully. Thank you!');
      setShowFeedback(false); setFeedbackMsg('');
    } catch(e) { alert('Error submitting feedback'); }
  };

  const isNavActive = (to) => {
    if (to === '/student') return path === '/student' || path === '/student/';
    return path.startsWith(to);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Modern Top Navbar ── */}
      <nav style={{
        display: hideLayout ? 'none' : 'flex',
        background: '#071125',
        color: 'white',
        padding: '0.75rem 2rem',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        {/* Left Brand & Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {/* Brand Badge */}
          <Link to="/student" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(249,115,22,0.4)'
            }}>
              <GraduationCap size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: '900', letterSpacing: '0.5px', color: 'white', lineHeight: 1.1 }}>
                SMART QUIZ <span style={{ color: '#f97316', fontSize: '0.7rem', verticalAlign: 'super' }}>PRO</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '600' }}>Student Portal</div>
            </div>
          </Link>

          {/* Navigation Pill Links */}
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            {[
              { to: '/student', label: 'Dashboard' },
              { to: '/student/assignments', label: 'Assignments' },
              { to: '/student/completed', label: 'Completed' },
              { to: '/student/reports', label: 'Reports' },
              { to: '/student/profile', label: 'Profile' },
            ].map(item => {
              const active = isNavActive(item.to);
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  style={{
                    color: active ? '#ffffff' : '#cbd5e1',
                    background: active ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'transparent',
                    textDecoration: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '10px',
                    fontSize: '0.88rem',
                    fontWeight: active ? '800' : '600',
                    boxShadow: active ? '0 4px 12px rgba(249,115,22,0.35)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => setShowFeedback(true)}
              style={{
                background: 'rgba(249,115,22,0.12)',
                border: '1px solid rgba(249,115,22,0.3)',
                color: '#f97316',
                cursor: 'pointer',
                fontWeight: '800',
                fontSize: '0.82rem',
                padding: '0.5rem 0.9rem',
                borderRadius: '10px',
                marginLeft: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              💬 Feedback
            </button>
          </div>
        </div>

        {/* Right User & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {user && <NotificationBell userId={user.id} />}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', background: 'rgba(255,255,255,0.06)', padding: '0.35rem 0.85rem', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '0.8rem',
              color: 'white',
              boxShadow: '0 2px 8px rgba(249,115,22,0.4)'
            }}>
              {user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'S'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: '800', lineHeight: 1.1 }}>{user?.name || 'Student'}</div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '600' }}>{user?.roll_no ? `Roll: ${user.roll_no}` : 'Student'}</div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5',
              padding: '0.5rem 1rem',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s'
            }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>
      
      {news && (
        <div style={{ display: hideLayout ? 'none' : 'flex', background: '#1e3a8a', color: 'white', padding: '0.4rem 0', fontSize: '0.85rem', fontWeight: 'bold' }}>
          <marquee scrollamount="6">{news}</marquee>
        </div>
      )}

      {!hideLayout && showFeedback && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 1rem 0' }}>Submit Feedback</h3>
            <form onSubmit={handleFeedbackSubmit}>
              <textarea className="input-field" rows="4" placeholder="Type your feedback, suggestion, or issue here..." value={feedbackMsg} onChange={e => setFeedbackMsg(e.target.value)} required />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit</button>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowFeedback(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main style={{ flex: 1, background: 'var(--bg-color)' }}>
        {props.children}
      </main>
      
      {user && (
        <div style={{ display: hideLayout ? 'none' : 'block' }}>
          <SimpleChatbot userId={user.id} />
        </div>
      )}
    </div>
  );
};

/* ─────────── App ─────────── */
function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      {/* Admin Routes */}
      <Route path="/admin/*" element={
        <AdminProtectedRoute>
          <AdminLayout>
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/live/:taskId" element={<LiveMonitoring />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </AdminLayout>
        </AdminProtectedRoute>
      } />

      {/* Student Routes */}
      <Route path="/student/*" element={
        <StudentProtectedRoute>
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
        </StudentProtectedRoute>
      } />
    </Routes>
  );
}

export default App;

