import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';

const StudentReview = () => {
  const navigate = useNavigate();
  const { id: attemptId } = useParams();
  
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/attempts/${attemptId}`);
        const data = await res.json();
        setAttempt(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttempt();
  }, [attemptId]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Review...</div>;
  if (!attempt || !attempt.exam) return <div style={{ padding: '2rem', textAlign: 'center' }}>Review not found.</div>;

  const exam = attempt.exam;
  const userAnswers = attempt.answers || [];

  const getUserAnswer = (qId) => {
    const ans = userAnswers.find(a => a.question_id === qId);
    return ans ? ans.answer : null;
  };

  const getPercentage = () => {
    return ((attempt.score / exam.questions.length) * 100).toFixed(2);
  };

  const handleDownloadDocument = () => {
    window.print();
  };

  return (
    <>
      <style>
        {`
          @media print {
            body { background: white !important; }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            .print-container { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
            .print-box { border: none !important; box-shadow: none !important; }
            .print-break { page-break-inside: avoid; }
          }
        `}
      </style>
      <div className="print-container" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '4rem' }}>
        
        {/* Breadcrumbs */}
        <div className="no-print" style={{ background: 'var(--surface-color)', padding: '0.75rem 2rem', borderBottom: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#3b82f6' }}>
         <Link to="/student" style={{ color: '#3b82f6', textDecoration: 'none' }}>Dashboard</Link> / 
         <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>{exam.title} / Review</span>
      </div>

      <div style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Main Content Area */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
             <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', margin: 0, fontWeight: '500' }}>{exam.title}</h2>
             <button onClick={handleDownloadDocument} className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0f172a', color: 'white', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>
               <ArrowLeft size={16} style={{ transform: 'rotate(-90deg)' }} /> Download PDF
             </button>
          </div>
          
          <div className="print-box" style={{ background: 'var(--surface-color)', border: '1px solid #cbd5e1', borderRadius: '4px', marginBottom: '2rem', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <tbody>
                <tr style={{ background: '#f8fafc' }}><td style={{ padding: '0.75rem 1.5rem', fontWeight: 'bold', color: '#475569', width: '200px', textAlign: 'right' }}>Started on</td><td style={{ padding: '0.75rem 1.5rem', color: '#0f172a' }}>{new Date(attempt.start_time).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}</td></tr>
                <tr><td style={{ padding: '0.75rem 1.5rem', fontWeight: 'bold', color: '#475569', textAlign: 'right' }}>State</td><td style={{ padding: '0.75rem 1.5rem', color: '#0f172a' }}>{attempt.status || 'Finished'}</td></tr>
                <tr style={{ background: '#f8fafc' }}><td style={{ padding: '0.75rem 1.5rem', fontWeight: 'bold', color: '#475569', textAlign: 'right' }}>Completed on</td><td style={{ padding: '0.75rem 1.5rem', color: '#0f172a' }}>{new Date(attempt.updatedAt).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}</td></tr>
                <tr><td style={{ padding: '0.75rem 1.5rem', fontWeight: 'bold', color: '#475569', textAlign: 'right' }}>Time taken</td><td style={{ padding: '0.75rem 1.5rem', color: '#0f172a' }}>5 mins 26 secs</td></tr>
                <tr style={{ background: '#f8fafc' }}><td style={{ padding: '0.75rem 1.5rem', fontWeight: 'bold', color: '#475569', textAlign: 'right' }}>Marks</td><td style={{ padding: '0.75rem 1.5rem', color: '#0f172a' }}>{attempt.score}.00/{exam.questions.length}.00</td></tr>
                <tr><td style={{ padding: '0.75rem 1.5rem', fontWeight: 'bold', color: '#475569', textAlign: 'right' }}>Grade</td><td style={{ padding: '0.75rem 1.5rem', color: '#0f172a', fontWeight: 'bold' }}>{getPercentage()} out of 100.00</td></tr>
              </tbody>
            </table>
          </div>

          {exam.questions.map((q, idx) => {
            const userAnswer = getUserAnswer(q._id);
            const isCorrect = userAnswer === q.correct_answer;
            return (
              <div key={idx} className="print-break" style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {/* Visual Marker Box */}
                <div className="print-box" style={{ width: '120px', background: 'var(--surface-color)', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '1rem', flexShrink: 0, alignSelf: 'flex-start' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1rem' }}>Question <span style={{ fontSize: '1.25rem' }}>{idx + 1}</span></div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>
                    {isCorrect ? 'Correct' : 'Incorrect'}<br/>
                    Mark {isCorrect ? '1.00' : '0.00'} out of 1.00
                  </div>
                  <div className="no-print" style={{ fontSize: '0.75rem', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#ef4444' }}>⚑</span> Flag question
                  </div>
                </div>

                {/* Question Body */}
                <div className="print-box" style={{ flex: 1, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '2rem' }}>
                  <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)', fontSize: '1.1rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{q.text}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {q.type === 'Jumble' ? (
                      <div style={{ background: 'var(--surface-color)', padding: '1rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: '#475569' }}>Your Arrangement:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {(() => {
                            try {
                              const parsedAnswer = JSON.parse(userAnswer);
                              return parsedAnswer.map((word, i) => (
                                <span key={i} style={{ background: '#f1f5f9', padding: '0.25rem 0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>{word}</span>
                              ));
                            } catch {
                              return <span>{userAnswer || 'No answer'}</span>;
                            }
                          })()}
                        </div>
                      </div>
                    ) : (
                      q.options && q.options.map((opt, i) => {
                        const isSelected = userAnswer === opt;
                        const isActuallyCorrect = opt === q.correct_answer;
                        
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input type="radio" checked={isSelected} readOnly style={{ width: '18px', height: '18px' }} />
                            <div style={{ flex: 1, fontSize: '1rem', color: isSelected ? '#1e293b' : '#475569', fontWeight: isSelected ? '600' : 'normal' }}>
                               {String.fromCharCode(97 + i)}. {opt}
                            </div>
                            {isSelected && isActuallyCorrect && <Check size={18} color="#16a34a" />}
                            {isSelected && !isActuallyCorrect && <X size={18} color="#dc2626" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                  {/* Feedback block */}
                  <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--surface-color)', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    The correct answer is: <strong>{q.type === 'Jumble' ? (() => { try { return JSON.parse(q.correct_answer).join(' → '); } catch { return q.correct_answer; } })() : q.correct_answer}</strong>
                  </div>
                </div>
              </div>
            );
          })}

        </div>

        {/* Sidebar Nav Box */}
        <div className="no-print" style={{ width: '280px', background: 'var(--surface-color)', border: '1px solid #cbd5e1', borderRadius: '4px', position: 'sticky', top: '2rem' }}>
          <h3 style={{ background: '#0f172a', color: 'white', margin: 0, padding: '1rem', fontSize: '1.1rem', borderTopLeftRadius: '4px', borderTopRightRadius: '4px', fontWeight: '500' }}>Quiz navigation</h3>
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
               {exam.questions.map((q, idx) => {
                const isCorrect = getUserAnswer(q._id) === q.correct_answer;
                return (
                    <div key={idx} style={{ 
                    height: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', 
                    border: '1px solid #94a3b8', background: 'var(--surface-color)', position: 'relative', borderRadius: '2px'
                    }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 'bold', flex: 1, display: 'flex', alignItems: 'center' }}>{idx + 1}</div>
                    <div style={{ width: '100%', height: '12px', background: isCorrect ? '#16a34a' : '#dc2626', opacity: 0.8 }}></div>
                    </div>
                );
               })}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#3b82f6', cursor: 'pointer', fontWeight: '600' }} onClick={() => navigate(`/student/summary/${exam._id}`)}>
               Finish review
            </div>
          </div>
        </div>

      </div>
      </div>
    </>
  );
};

export default StudentReview;
