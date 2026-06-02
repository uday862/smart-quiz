import React, { useState, useEffect, useRef } from 'react';
import API_BASE_URL from '../../config';
import { ArrowLeft, Play, CheckSquare, Clock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io(`${API_BASE_URL}`);

// ─── Network Indicator ────────────────────────────────────────────────────────
const NetworkIndicator = ({ isOnline }) => {
  const [netSpeed, setNetSpeed] = useState('High');

  useEffect(() => {
    const updateConnection = () => {
      if (!navigator.onLine) {
        setNetSpeed('Offline');
        return;
      }
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn) {
        const type = conn.effectiveType; // 'slow-2g', '2g', '3g', '4g'
        if (type === '4g') setNetSpeed('High');
        else if (type === '3g') setNetSpeed('Medium');
        else setNetSpeed('Low');
      } else {
        setNetSpeed('High');
      }
    };

    updateConnection();
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      conn.addEventListener('change', updateConnection);
    }
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);

    return () => {
      if (conn) conn.removeEventListener('change', updateConnection);
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
    };
  }, []);

  const getStatusColor = () => {
    if (!isOnline || netSpeed === 'Offline') return '#ef4444';
    if (netSpeed === 'High') return '#22c55e';
    if (netSpeed === 'Medium') return '#eab308';
    return '#f97316';
  };

  const getStatusIcon = () => {
    if (!isOnline || netSpeed === 'Offline') return '❌';
    if (netSpeed === 'High') return '📶 High';
    if (netSpeed === 'Medium') return '📶 Medium';
    return '⚠️ Low';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', color: getStatusColor() }}>
      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor() }} />
      Network: {getStatusIcon()}
    </div>
  );
};

const StudentQuizMode = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [user, setUser] = useState(null);
  const [flags, setFlags] = useState(0);
  const [activeAttemptId, setActiveAttemptId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isFullscreenEnforced, setIsFullscreenEnforced] = useState(true);
  const timerRef = useRef(null);
  const answersRef = useRef({});
  const flagsRef = useRef(0);

  const activeAttemptIdRef = useRef(null);
  const isUnloadingRef = useRef(false);

  useEffect(() => {
    const handleBeforeUnload = () => {
      isUnloadingRef.current = true;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (exam && exam.title) {
      document.title = exam.title;
    }
    return () => {
      document.title = 'Smart Quiz';
    };
  }, [exam]);

  useEffect(() => {
    answersRef.current = answers;
    flagsRef.current = flags;
    activeAttemptIdRef.current = activeAttemptId;
  }, [answers, flags, activeAttemptId]);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    if (exam && exam.fullWindow && !submitted) {
      setIsFullscreenEnforced(!!document.fullscreenElement);
    }
  }, [exam, submitted]);

  useEffect(() => {
    if (!exam || !exam.fullWindow || submitted) return;
    const limit = exam.flagLimit !== undefined ? exam.flagLimit : 10;
    if (flags >= limit) {
      handleSubmit(null, { forceSpam: true });
    }
  }, [flags, exam, submitted]);

  useEffect(() => {
    if (!exam || !exam.fullWindow || submitted) return;

    const handleFullscreenChange = () => {
      if (isUnloadingRef.current) return;
      setIsFullscreenEnforced(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        setFlags(prev => prev + 1);
      }
    };

    const handleVisibilityOrBlur = () => {
      if (isUnloadingRef.current) return;
      if (document.hidden || document.visibilityState === 'hidden') {
        setFlags(prev => prev + 1);
        alert("Warning: Tab switching/leaving the page is not allowed during this exam!");
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityOrBlur);
    window.addEventListener('blur', handleVisibilityOrBlur);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityOrBlur);
      window.removeEventListener('blur', handleVisibilityOrBlur);
    };
  }, [exam, submitted]);

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
          window.dispatchEvent(new CustomEvent('active_exam_config', { detail: { fullWindow: found.fullWindow } }));

          // FIRE START ATTEMPT
          let startData;
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
            startData = await startRes.json();
            setActiveAttemptId(startData._id);
          } catch(e) { console.error('Start attmpt failed', e); }

          // Set remaining time
          const savedTime = localStorage.getItem(`timeLeft_${found._id}`);
          if (savedTime) {
            setTimeLeft(parseInt(savedTime, 10));
          } else if (startData) {
            const startTime = new Date(startData.start_time || startData.createdAt).getTime();
            const timeLimitMs = found.time_limit * 60 * 1000;
            const elapsedMs = Date.now() - startTime;
            const remainingSeconds = Math.max(0, Math.floor((timeLimitMs - elapsedMs) / 1000));
            setTimeLeft(remainingSeconds);
          } else {
            setTimeLeft(found.time_limit * 60);
          }

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
    
    return () => {
      clearInterval(timerRef.current);
      window.dispatchEvent(new CustomEvent('active_exam_config', { detail: { fullWindow: false } }));
    };
  }, [id, navigate]);

  useEffect(() => {
    if (exam && !submitted && timeLeft > 0 && isOnline) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [exam, submitted, timeLeft, isOnline]);

  useEffect(() => {
    if (exam && !submitted && timeLeft !== null && timeLeft <= 0) {
      handleSubmit(new Event('submit'));
    }
  }, [timeLeft, exam, submitted]);

  useEffect(() => {
    if (exam && timeLeft > 0 && !submitted) {
      localStorage.setItem(`timeLeft_${id}`, timeLeft.toString());
    }
  }, [timeLeft, exam, id, submitted]);

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
    if (seconds === null || seconds === undefined) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleOptionSelect = (qId, option) => {
    setAnswers({ ...answers, [qId]: option });
  };

  const handleClearAnswer = (qId) => {
    if (submitted) return;
    const newAnswers = { ...answers };
    delete newAnswers[qId];
    setAnswers(newAnswers);
  };

  const handleSubmit = async (e, options = {}) => {
    if (e?.preventDefault) e.preventDefault();
    if (!exam || submitted || submitting) return;
    
    setSubmitting(true);
    const currentAnswers = answersRef.current;
    
    // Server will evaluate
    setScore(0);
    clearInterval(timerRef.current);

    // Save to DB via PUT
    try {
      const currentAttemptId = activeAttemptIdRef.current;
      let finalScore = 0;
      let passStatus = false;
      if (currentAttemptId) {
        const res = await fetch(`${API_BASE_URL}/api/attempts/${currentAttemptId}/submit`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            score: 0,
            flags: flagsRef.current,
            status: 'completed',
            spam: !!options?.forceSpam,
            answers: Object.keys(currentAnswers).map(key => ({ question_id: key, answer: currentAnswers[key] }))
          })
        });
        const updatedAttempt = await res.json();
        finalScore = updatedAttempt.score || 0;
        setScore(finalScore);
        if (updatedAttempt.exam) {
            setExam(updatedAttempt.exam);
            passStatus = finalScore > (updatedAttempt.exam.questions.length / 2);
        }
      }
      setSubmitted(true);
      localStorage.removeItem(`timeLeft_${exam._id}`);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.error("Exit fullscreen error", err));
      }
      
      socket.emit('student_update', {
        id: user?.id,
        status: 'completed',
        marks: finalScore,
        stars: passStatus ? 5 : 2,
        spam: !!options?.forceSpam
      });
      
      setTimeout(() => navigate(`/student/summary/${exam._id}`), 3000);
    } catch(err) {
      console.error('Attempt push failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!exam) return <div className="page-container" style={{ textAlign: 'center', marginTop: '4rem' }}>Loading Exam...</div>;

  const isCoding = exam.questions[0]?.type === 'Coding';

  return (
    <>
      
      {!isOnline && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(7, 17, 37, 0.96)',
          zIndex: 13000, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', color: 'white'
        }}>
          <div style={{ background: '#1e293b', padding: '2.5rem', borderRadius: '12px', textAlign: 'center', maxWidth: '450px', border: '2px solid #ef4444' }}>
            <span style={{ fontSize: '3rem', color: '#ef4444', display: 'block', marginBottom: '1rem' }}>⚠️</span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '950', marginBottom: '1rem' }}>Internet Connection Lost</h2>
            <p style={{ color: '#94a3b8', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Your timer has been paused. Please check your network cables or Wi-Fi connection. The exam will resume automatically once connection is restored.
            </p>
            <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid #ef4444', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        </div>
      )}

      {exam && exam.fullWindow && !isFullscreenEnforced && !submitted && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(7, 17, 37, 0.98)',
          zIndex: 11000, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', color: 'white'
        }}>
          <div style={{ background: '#1e293b', padding: '2.5rem', borderRadius: '12px', textAlign: 'center', maxWidth: '480px', border: '2px solid #ef4444' }}>
            <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1rem' }}>🔒</span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '900', marginBottom: '1rem', color: '#f36d44' }}>Fullscreen Mode Required</h2>
            <p style={{ color: '#94a3b8', lineHeight: '1.6', marginBottom: '1.75rem' }}>
              This exam has been secured by the administrator. To take it, you must remain in fullscreen mode. Switching tabs or exiting fullscreen is recorded.
            </p>
            <button
              onClick={() => {
                const el = document.documentElement;
                if (el.requestFullscreen) {
                  el.requestFullscreen().then(() => {
                    setIsFullscreenEnforced(true);
                  }).catch(e => console.error("Fullscreen error", e));
                }
              }}
              style={{
                background: '#16a34a', color: 'white', padding: '0.85rem 2.5rem',
                border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '900',
                cursor: 'pointer', boxShadow: '0 4px 14px rgba(22,163,74,0.4)'
              }}
            >
              Enter Fullscreen & Continue
            </button>
          </div>
        </div>
      )}

      {submitting && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(7, 17, 37, 0.95)',
          zIndex: 12000, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', color: 'white'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-block', width: '50px', height: '50px', border: '5px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1.5rem' }} />
            <h2 style={{ fontSize: '1.75rem', fontWeight: '900', color: 'white', marginBottom: '0.5rem' }}>Grading Your Answers</h2>
            <p style={{ color: '#c4b5fd', fontSize: '1rem' }}>Evaluating code and compiling scores, please do not close this window...</p>
          </div>
        </div>
      )}

      <div className="page-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
      
      <header style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '1rem 2rem', background: 'var(--header-bg)', color: 'white', borderBottom: '1px solid var(--border-color)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {(!exam || !exam.fullWindow) && (
            <button onClick={() => navigate('/student')} style={{ background: 'transparent', border: 'none', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowLeft size={18} /> Back
            </button>
          )}
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{exam.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <NetworkIndicator isOnline={isOnline} />
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
                    {answers[q._id] && !submitted && (
                      <button
                        type="button"
                        onClick={() => handleClearAnswer(q._id)}
                        style={{
                          alignSelf: 'flex-start',
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          marginTop: '0.5rem',
                          fontSize: '0.85rem'
                        }}
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>
                )}
                
                {q.type === 'Coding' && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <textarea 
                      placeholder="// Write your code here..."
                      value={answers[q._id] || ''}
                      onChange={(e) => setAnswers({ ...answers, [q._id]: e.target.value })}
                      disabled={submitted}
                      style={{ 
                        width: '100%', height: '200px', background: '#1e293b', border: '1px solid var(--border-color)', 
                        color: '#e2e8f0', fontFamily: 'monospace', padding: '1rem', resize: 'vertical', outline: 'none',
                        borderRadius: '8px', marginTop: '1rem'
                      }}
                    />
                    {answers[q._id] && !submitted && (
                      <button
                        type="button"
                        onClick={() => handleClearAnswer(q._id)}
                        style={{
                          alignSelf: 'flex-start',
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          marginTop: '0.5rem',
                          fontSize: '0.85rem'
                        }}
                      >
                        Clear Answer
                      </button>
                    )}
                  </div>
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
    </>
  );
};

export default StudentQuizMode;
