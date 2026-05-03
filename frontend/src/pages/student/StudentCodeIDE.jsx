import React, { useState, useEffect, useRef } from 'react';
import API_BASE_URL from '../../config';
import { ArrowLeft, Play, CheckSquare, Clock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io(`${API_BASE_URL}`);

const StudentQuizMode = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [user, setUser] = useState(null);
  const [flags, setFlags] = useState(0);
  const [activeAttemptId, setActiveAttemptId] = useState(null);
  const timerRef = useRef(null);
  const answersRef = useRef({});
  const flagsRef = useRef(0);

  const activeAttemptIdRef = useRef(null);

  useEffect(() => {
    answersRef.current = answers;
    flagsRef.current = flags;
    activeAttemptIdRef.current = activeAttemptId;
  }, [answers, flags, activeAttemptId]);

  useEffect(() => {
    const activeUser = JSON.parse(localStorage.getItem('user'));
    setUser(activeUser);
    
    if (!activeUser) {
      navigate('/');
      return;
    }

    const initQuiz = async () => {
      try {
        // Fetch Exam
        const res = await fetch(`${API_BASE_URL}/api/exams`);
        const exams = await res.json();
        const found = exams.find(e => e._id === id);
        
        if (found) {
          // Check past attempts
          const attemptRes = await fetch(`${API_BASE_URL}/api/attempts/exam/${found._id}/student/${activeUser.id}`);
          const pastAttempts = await attemptRes.json();
          
          if (found.status !== 'running') {
            alert('This task is currently not active.');
            navigate(`/student/summary/${found._id}`);
            return;
          }
          
          if (pastAttempts.length >= (found.attempt_limit || 1)) {
            navigate(`/student/summary/${found._id}`);
            return;
          }
          
          setExam(found);
          setTimeLeft(found.time_limit * 60);

          // FIRE START ATTEMPT
          try {
            const startRes = await fetch(`${API_BASE_URL}/api/attempts/start`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                student: activeUser.id,
                exam: found._id,
                ipAddress: '192.168.1.xxx'
              })
            });
            const startData = await startRes.json();
            setActiveAttemptId(startData._id);
          } catch(e) { console.error('Start attmpt failed', e); }

          // Tell admin we started
          socket.emit('student_update', {
            id: activeUser.id,
            roll: activeUser.roll_no,
            name: activeUser.name,
            marks: 0,
            ip: '192.168.1.xxx', 
            subs: pastAttempts.length,
            flags: 0,
            learning: 0,
            status: 'attempting',
            stars: 0
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    initQuiz();
    
    return () => clearInterval(timerRef.current);
  }, [id, navigate]);

  useEffect(() => {
    if (exam && !submitted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [exam, submitted]);

  useEffect(() => {
    if (exam && !submitted && timeLeft === 0) {
      handleSubmit(new Event('submit'));
    }
  }, [timeLeft, exam, submitted]);

  // Removed CHEATING DETECTION LOGIC as requested by user

  useEffect(() => {
    // Blast live updates on changes
    if (exam && user && !submitted) {
       const progress = Object.keys(answers).length / exam.questions.length * 100;
       socket.emit('student_update', {
          id: user.id,
          learning: Math.round(progress),
          flags
       });
    }
  }, [answers, flags]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleOptionSelect = (qId, option) => {
    setAnswers({ ...answers, [qId]: option });
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!exam || submitted) return;
    
    const currentAnswers = answersRef.current;
    let calculatedScore = 0;
    exam.questions.forEach(q => {
      if (q.type === 'MCQ' && currentAnswers[q._id] === q.correct_answer) {
        calculatedScore += q.marks || 1;
      }
    });

    setScore(calculatedScore);
    setSubmitted(true);
    clearInterval(timerRef.current);

    // Save to DB via PUT
    try {
      const currentAttemptId = activeAttemptIdRef.current;
      if (currentAttemptId) {
        await fetch(`${API_BASE_URL}/api/attempts/${currentAttemptId}/submit`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            score: calculatedScore,
            flags: flagsRef.current,
            status: 'completed',
            answers: Object.keys(currentAnswers).map(key => ({ question_id: key, answer: currentAnswers[key] }))
          })
        });
      }

      socket.emit('student_update', {
        id: user.id,
        status: 'completed',
        marks: calculatedScore,
        stars: calculatedScore > (exam.questions.length / 2) ? 5 : 2
      });
      
      setTimeout(() => navigate(`/student/summary/${exam._id}`), 3000);
    } catch(err) { console.error('Attempt push failed', err); }
  };

  if (!exam) return <div className="page-container" style={{ textAlign: 'center', marginTop: '4rem' }}>Loading Exam...</div>;

  const isCoding = exam.questions[0]?.type === 'Coding';

  return (
    <div className="page-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
      
      <header style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '1rem 2rem', background: 'var(--header-bg)', color: 'white', borderBottom: '1px solid var(--border-color)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button onClick={() => navigate('/student')} style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={18} /> Back
          </button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{exam.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: timeLeft < 60 ? 'var(--danger-color)' : '#f59e0b', fontSize: '1.25rem' }}>
            <Clock size={20} /> {formatTime(timeLeft)}
          </span>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: 'var(--bg-color)' }}>
        
        {/* Left Pane (Questions) */}
        <div style={{ flex: '2', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)', background: 'var(--surface-color)' }}>
          
          <div style={{ padding: '1.5rem', background: '#f1f5f9', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>{isCoding ? 'Problem Statement' : 'Multiple Choice Questions'}</h2>
          </div>

          <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
            {exam.questions.map((q, idx) => (
              <div key={q._id || idx} style={{ marginBottom: '2.5rem', padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  <span style={{ color: 'var(--primary-color)', marginRight: '0.5rem' }}>Q{idx + 1}.</span> {q.text}
                </h3>
                
                {q.type === 'MCQ' && q.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                    {q.options.map((opt, i) => (
                      <label 
                        key={i} 
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', 
                          border: answers[q._id] === opt ? '2px solid var(--primary-color)' : '1px solid var(--border-color)', 
                          borderRadius: '6px', cursor: 'pointer',
                          background: answers[q._id] === opt ? '#fff7ed' : 'transparent',
                          transition: 'all 0.2s', fontWeight: '500'
                        }}
                      >
                        <input 
                          type="radio" 
                          name={`q_${q._id}`} 
                          value={opt} 
                          checked={answers[q._id] === opt} 
                          onChange={() => handleOptionSelect(q._id, opt)}
                          disabled={submitted}
                          style={{ accentColor: 'var(--primary-color)', transform: 'scale(1.2)' }}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}
                
                {q.type === 'Coding' && (
                  <textarea 
                    placeholder="// Write your code here..."
                    disabled={submitted}
                    style={{ 
                      width: '100%', height: '200px', background: '#1e293b', border: '1px solid var(--border-color)', 
                      color: '#e2e8f0', fontFamily: 'monospace', padding: '1rem', resize: 'vertical', outline: 'none',
                      borderRadius: '8px', marginTop: '1rem'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane (Submit / Summary) */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', background: 'var(--surface-color)' }}>
          
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontWeight: '600', fontSize: '1.125rem' }}>Action Panel</span>
          </div>
          
          <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
            
            {submitted ? (
              <div style={{ border: '1px solid var(--success-color)', background: '#dcfce7', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
                <CheckSquare size={32} style={{ color: 'var(--success-color)', marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#166534', marginBottom: '0.5rem' }}>Exam Submitted!</h3>
                {isCoding ? (
                  <p style={{ color: '#166534' }}>Your code has been sent for evaluation.</p>
                ) : (
                  <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>Your immediate score: <br/><span style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--primary-color)' }}>{score} / {exam.questions.length}</span></p>
                )}
                <button className="btn btn-outline" style={{ marginTop: '1.5rem', width: '100%' }} onClick={() => navigate('/student')}>Go to Dashboard</button>
              </div>
            ) : (
              <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '1rem' }}>Progress Summary</h4>
                <p style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Questions answered: <strong style={{ color: 'var(--text-primary)' }}>{Object.keys(answers).length} / {exam.questions.length}</strong></p>
                
                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginTop: '1rem', marginBottom: '2rem' }}>
                  <div style={{ width: `${(Object.keys(answers).length / exam.questions.length) * 100}%`, background: 'var(--primary-color)', height: '100%', transition: 'width 0.3s' }}></div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontWeight: '600', color: '#1a365d', marginBottom: '0.75rem', fontSize: '1rem' }}>Quiz Navigation</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', background: '#f1f5f9', borderRadius: '6px' }}>
                     {exam.questions.map((q, idx) => {
                       const isAttempted = !!answers[q._id];
                       return (
                         <div key={idx} style={{ 
                           height: '35px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', 
                           border: '1px solid #cbd5e1', background: 'var(--surface-color)', position: 'relative', borderRadius: '2px'
                         }}>
                           <div style={{ fontSize: '0.75rem', fontWeight: 'bold', flex: 1, display: 'flex', alignItems: 'center' }}>{idx + 1}</div>
                           <div style={{ width: '100%', height: '10px', background: isAttempted ? '#16a34a' : '#dc2626', opacity: 0.8 }}></div>
                         </div>
                       );
                     })}
                  </div>
                </div>

                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '1rem', fontSize: '1.125rem', opacity: (submitted ? 0.5 : 1), cursor: (submitted ? 'not-allowed' : 'pointer') }} 
                  onClick={handleSubmit}
                  disabled={submitted}
                >
                  {submitted ? 'Submitting...' : 'Submit Exam'}
                </button>
              </div>
            )}
            
          </div>

        </div>

      </div>
    </div>
  );
};

export default StudentQuizMode;
