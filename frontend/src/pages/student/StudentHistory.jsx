import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, Clock, ChevronRight } from 'lucide-react';

const StudentHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      navigate('/');
      return;
    }

    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/attempts/student/${user.id}`);
        const data = await res.json();
        setHistory(data);
      } catch (err) {
        console.error('Failed to fetch history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [navigate]);

  if (loading) return <div className="moodle-container" style={{ textAlign: 'center', marginTop: '4rem' }}>Loading History...</div>;

  return (
    <div className="moodle-container">
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>Attempts History</h1>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
           <span style={{ color: '#3b82f6', cursor: 'pointer' }} onClick={() => navigate('/student')}>Dashboard</span> / <span>History</span>
        </div>
      </header>

      <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
        <table className="moodle-table" style={{ border: 'none' }}>
          <thead>
            <tr>
              <th style={{ width: '80px', textAlign: 'center' }}>S No</th>
              <th>Task / Exam Name</th>
              <th>Date Attempted</th>
              <th>Grade / Score</th>
              <th style={{ textAlign: 'center' }}>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {history.map((att, idx) => (
              <tr key={att._id}>
                <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                <td>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{att.exam?.title || 'Unknown Task'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Attempt #{att.attemptNumber || 1}</div>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={14} /> {new Date(att.createdAt).toLocaleDateString('en-GB')}
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: 'bold', fontSize: '1.125rem', color: '#1e293b' }}>{att.score}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}> / {att.exam?.questions?.length || 0}</span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{ 
                    padding: '0.25rem 0.6rem', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    background: att.status === 'completed' ? '#dcfce7' : '#fee2e2',
                    color: att.status === 'completed' ? '#166534' : 'var(--danger-color)'
                  }}>
                    {att.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button 
                    onClick={() => navigate(`/student/review/${att._id}`)}
                    className="view-report-link" 
                    style={{ background: '#3b82f6', color: 'white', padding: '0.4rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
                  >
                    Review Effort
                  </button>
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  You haven't attempted any quizzes yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentHistory;
