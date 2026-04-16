import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config';
import { ArrowLeft, CheckCircle, XCircle, Clock, Award } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';

const StudentAttemptSummary = () => {
  const navigate = useNavigate();
  const { id: examId } = useParams();
  
  const [attempts, setAttempts] = useState([]);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) { navigate('/'); return; }

    const fetchData = async () => {
      try {
        const examRes = await fetch(`${API_BASE_URL}/api/exams`);
        const allExams = await examRes.json();
        const currentExam = allExams.find(e => e._id === examId);
        if (currentExam) setExam(currentExam);

        const attemptRes = await fetch(`${API_BASE_URL}/api/attempts/exam/${examId}/student/${user.id}`);
        const attemptData = await attemptRes.json();
        setAttempts(attemptData);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [examId, navigate]);

  if (loading) return <div className="moodle-container" style={{ textAlign: 'center', marginTop: '4rem' }}>Loading Summary...</div>;
  if (!exam) return <div className="moodle-container" style={{ textAlign: 'center', marginTop: '4rem' }}>Exam not found.</div>;

  const calculateGrade = (att) => {
    // Priority 1: Use attempt.maxScore (saved at start time)
    // Priority 2: Use current exam length
    const max = att.maxScore || exam.questions?.length || 1;
    const grade = (att.score / max) * 100;
    return Math.min(grade, 100).toFixed(2); // Cap at 100%
  };

  const getHighestGrade = () => {
    if (attempts.length === 0) return "0.00";
    const grades = attempts.map(a => parseFloat(calculateGrade(a)));
    return Math.max(...grades).toFixed(2);
  };

  return (
    <div className="moodle-container" style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ marginBottom: '0.5rem', fontWeight: '900', color: '#071125' }}>{exam.title}</h1>
        <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
           <Link to="/student" style={{ color: '#f36d44', textDecoration: 'none', fontWeight: 'bold' }}>Dashboard</Link> / <span>Final Assessment Summary</span>
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '2rem', color: '#071125', textAlign: 'center' }}>Official Attempt Records</h2>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '3rem' }}>
           <div style={{ textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', minWidth: '240px' }}>
              <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>CERTIFIED HIGHEST GRADE</div>
              <div style={{ fontSize: '3rem', fontWeight: '900', color: '#f36d44' }}>{getHighestGrade()}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>Calculated from {attempts.length} authorized attempts</div>
           </div>
        </div>

        <table className="moodle-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>Attempt</th>
              <th style={{ textAlign: 'left', color: '#64748b' }}>State</th>
              <th style={{ textAlign: 'center', color: '#64748b' }}>Points Earned</th>
              <th style={{ textAlign: 'center', color: '#64748b' }}>Final Grade (%)</th>
              <th style={{ textAlign: 'right', paddingRight: '2rem', color: '#64748b' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt, idx) => {
              const max = attempt.maxScore || exam.questions?.length || 1;
              return (
                <tr key={attempt._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', padding: '1.25rem' }}>{idx + 1}</td>
                  <td>
                    <div style={{ fontWeight: '900', color: '#071125' }}>Finished</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{new Date(attempt.updatedAt).toLocaleDateString()} at {new Date(attempt.updatedAt).toLocaleTimeString()}</div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: '900', color: '#f36d44', fontSize: '1.1rem' }}>{attempt.score}.00 / {max}.00</td>
                  <td style={{ textAlign: 'center', fontWeight: '900' }}>{calculateGrade(attempt)}%</td>
                  <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                     <Link to={`/student/review/${attempt._id}`} style={{ background: '#f36d44', color: 'white', padding: '0.5rem 1.25rem', borderRadius: '4px', fontSize: '0.8rem', textDecoration: 'none', fontWeight: '900' }}>REVIEW</Link>
                  </td>
                </tr>
              );
            })}
            {attempts.length === 0 && (
              <tr><td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>No recorded attempts for this assessment sector.</td></tr>
            )}
          </tbody>
        </table>

        {attempts.length < (exam.attempt_limit || 1) && (
           <div style={{ marginTop: '3rem', textAlign: 'center' }}>
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.85rem 3rem', borderRadius: '6px', fontSize: '1.1rem', fontWeight: '900', background: '#071125' }} 
                onClick={() => navigate(`/student/quiz/${exam._id}`)}
              >
                RE-ATTEMPT MODULE
              </button>
           </div>
        )}
      </div>

      <div style={{ textAlign: 'center' }}>
         <button onClick={() => navigate('/student')} style={{ background: 'transparent', border: 'none', color: '#64748b', fontWeight: '900', cursor: 'pointer', fontSize: '0.9rem' }}>RETURN TO COMMAND CENTER</button>
      </div>
    </div>
  );
};

export default StudentAttemptSummary;
