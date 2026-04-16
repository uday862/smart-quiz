import React from 'react';
import StudentDashboard from './StudentDashboard';

const StudentLayout = ({ children }) => {
  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="brand">SmartQuiz</div>
        <ul className="nav-links">
          <li><a href="/student">Dashboard</a></li>
          <li><a href="/student/assignments">Assignments</a></li>
          <li><a href="/student/reports">Reports</a></li>
          <li><a href="/" style={{ color: 'var(--danger-color)', marginTop: '2rem' }}>Logout</a></li>
        </ul>
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default StudentLayout;

