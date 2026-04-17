import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import LiveMonitoring from './pages/LiveMonitoring';
import Analytics from './pages/Analytics';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAttemptSummary from './pages/student/StudentAttemptSummary';
import StudentCodeIDE from './pages/student/StudentCodeIDE';
import StudentSQLIDE from './pages/student/StudentSQLIDE';
import StudentReview from './pages/student/StudentReview';
import StudentHistory from './pages/student/StudentHistory';
import LoginPage from './pages/LoginPage';
import './App.css';

// Layout wrapper for Admin
const AdminLayout = ({ children }) => (
  <div className="app-container">
    <nav className="sidebar">
      <div className="brand" style={{ background: '#0f172a', color: 'white', padding: '1.5rem', fontWeight: '900', fontStyle: 'italic', letterSpacing: '1px', fontSize: '1.5rem' }}>SMART QUIZ</div>
      <ul className="nav-links">
        <li><Link to="/admin">Dashboard</Link></li>
        <li><Link to="/admin/analytics">Analytics</Link></li>
        <li><Link to="/" onClick={() => { localStorage.removeItem('user'); }} style={{ color: 'var(--danger-color)', marginTop: '2rem' }}>Logout</Link></li>
      </ul>
    </nav>
    <main className="main-content">
      {children}
    </main>
  </div>
);

// Layout wrapper for Student
const StudentLayout = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ background: '#071125', color: 'white', padding: '0.875rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ background: 'white', padding: '0.35rem 0.75rem', borderRadius: '4px', border: '1px solid #ddd' }}>
             <span style={{ color: '#000', fontWeight: '900', fontStyle: 'italic', fontSize: '1.4rem' }}>SMART QUIZ</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', fontWeight: 'bold' }}>
            <Link to="/student" style={{ color: 'white', textDecoration: 'none', borderBottom: window.location.pathname === '/student' ? '3px solid #3b82f6' : 'none', paddingBottom: '4px' }}>Dashboard</Link>
            <Link to="/student/assignments" style={{ color: 'white', textDecoration: 'none', borderBottom: window.location.pathname.includes('assignments') ? '3px solid #3b82f6' : 'none', paddingBottom: '4px' }}>Assignments</Link>
            <Link to="/student/completed" style={{ color: 'white', textDecoration: 'none', borderBottom: window.location.pathname.includes('completed') ? '3px solid #3b82f6' : 'none', paddingBottom: '4px' }}>Completed Tasks</Link>
            <Link to="/student/reports" style={{ color: 'white', textDecoration: 'none', borderBottom: window.location.pathname.includes('reports') ? '3px solid #3b82f6' : 'none', paddingBottom: '4px' }}>Reports</Link>
            <span style={{ color: 'white', cursor: 'pointer' }}>API Reference ⌄</span>
            <span style={{ color: 'white', cursor: 'pointer' }}>More ⌄</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', fontSize: '0.85rem', fontWeight: 'bold' }}>
           <span style={{ color: '#ef4444', cursor: 'pointer' }} onClick={() => { localStorage.removeItem('user'); window.location.href = '/'; }}>Log out ({user?.name || 'User'})</span>
        </div>
      </nav>
      <main style={{ flex: 1, background: '#f5f5f5' }}>
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        
        {/* Admin Routes with Layout */}
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
              <Route path="/summary/:id" element={<StudentAttemptSummary />} />
              <Route path="/quiz/:id" element={<StudentCodeIDE />} />
              <Route path="/sql/:id" element={<StudentSQLIDE />} />
              <Route path="/review/:id" element={<StudentReview />} />
              <Route path="/history" element={<StudentHistory />} />
            </Routes>
          </StudentLayout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
