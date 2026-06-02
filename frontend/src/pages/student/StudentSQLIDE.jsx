import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config';
import { Play, Check, X, Server, Database, Save, Clock } from 'lucide-react';
import alasql from 'alasql';

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

const StudentSQLIDE = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
    const [query, setQuery] = useState('SELECT * FROM test;');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [isPassed, setIsPassed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [latestScore, setLatestScore] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [activeAttemptId, setActiveAttemptId] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isFullscreenEnforced, setIsFullscreenEnforced] = useState(true);
    const [flags, setFlags] = useState(0);
    const flagsRef = useRef(0);
    const isUnloadingRef = useRef(false);

    useEffect(() => {
        flagsRef.current = flags;
    }, [flags]);

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

    const [dbId] = useState(`db_${Date.now()}`); // Unique DB per instance
    const timerRef = useRef(null);

    useEffect(() => {
        const fetchExam = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/exams`);
                if (!res.ok) throw new Error('Network response was not ok');
                const exams = await res.json();
                const found = exams.find(e => e._id === id);
                
                if (!found) {
                    console.error('Exam not found');
                    setLoading(false);
                    return;
                }
                
                if (found.status !== 'running') {
                    alert('This task is currently not active.');
                    navigate(`/student/summary/${found._id}`);
                    return;
                }
                
                setExam(found);
                window.dispatchEvent(new CustomEvent('active_exam_config', { detail: { fullWindow: found.fullWindow } }));

                // Fetch/Start Attempt immediately
                let startData;
                try {
                    const startRes = await fetch(`${API_BASE_URL}/api/attempts/start`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ student: user.id, exam: found._id, dayId: found.dayId })
                    });
                    if (startRes.ok) {
                        startData = await startRes.json();
                        setActiveAttemptId(startData._id);
                        if (startData.answers && startData.answers.length > 0) {
                            setQuery(startData.answers[0].answer || 'SELECT * FROM test;');
                        }
                    }
                } catch (e) {
                    console.error('Start attempt failed', e);
                }

                // Check past attempts for limit and scores
                try {
                    const attemptRes = await fetch(`${API_BASE_URL}/api/attempts/exam/${found._id}/student/${user.id}`);
                    if (attemptRes.ok) {
                        const pastAttempts = await attemptRes.json();
                        const completedAttempts = pastAttempts.filter(a => a.status === 'completed');
                        if (completedAttempts.length >= (found.attempt_limit || 1)) {
                            navigate(`/student/summary/${found._id}`);
                            return;
                        }
                        if (pastAttempts.length > 0) {
                            pastAttempts.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
                            setLatestScore(pastAttempts[0].score || 0);
                        }
                    }
                } catch (e) {
                    console.error('Failed to fetch past attempts', e);
                }

                // Set remaining time
                const savedTime = localStorage.getItem(`timeLeft_${found._id}`);
                if (savedTime) {
                    setTimeLeft(parseInt(savedTime, 10));
                } else if (startData) {
                    const startTime = new Date(startData.start_time || startData.createdAt).getTime();
                    const timeLimitMs = (found.time_limit || 30) * 60 * 1000;
                    const elapsedMs = Date.now() - startTime;
                    const remainingSeconds = Math.max(0, Math.floor((timeLimitMs - elapsedMs) / 1000));
                    setTimeLeft(remainingSeconds);
                } else {
                    setTimeLeft((found.time_limit || 30) * 60);
                }
                
                // Initialize ALASQL Database in memory
                if (found.questions && found.questions[0]) {
                    const q = found.questions[0];
                    alasql(`CREATE DATABASE ${dbId}`);
                    alasql(`USE ${dbId}`);
                    // Run Admin's Hidden initialization scripts
                    if (q.sql_init) {
                       try {
                           alasql(q.sql_init);
                       } catch(e) { console.error('SQL Init DB Error:', e); }
                    }
                }
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchExam();

        const goOnline = () => setIsOnline(true);
        const goOffline = () => setIsOnline(false);
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);
        
        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
            try { alasql(`DROP DATABASE IF EXISTS ${dbId}`); } catch(e) {}
            clearInterval(timerRef.current);
            window.dispatchEvent(new CustomEvent('active_exam_config', { detail: { fullWindow: false } }));
        };
    }, [id, dbId]);

    useEffect(() => {
        if (exam && exam.fullWindow && !submitted) {
            setIsFullscreenEnforced(!!document.fullscreenElement);
        }
    }, [exam, submitted]);

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
        if (!exam || !exam.fullWindow || submitted) return;
        const limit = exam.flagLimit !== undefined ? exam.flagLimit : 10;
        if (flags >= limit) {
            handleSubmitAttempt({ forceSpam: true });
        }
    }, [flags, exam, submitted]);

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
            handleSubmitAttempt();
        }
    }, [timeLeft, exam, submitted]);

    useEffect(() => {
        if (exam && timeLeft > 0 && !submitted) {
            localStorage.setItem(`timeLeft_${id}`, timeLeft.toString());
        }
    }, [timeLeft, exam, id, submitted]);

    const [isPublicMode, setIsPublicMode] = useState(false);

    const handleRunPatternMatch = (isPublicRun = false) => {
        if (!exam || !query.trim()) return;
        setError('');
        setIsPublicMode(isPublicRun);
        
        let targetCases = [];
        if (exam.questions[0].test_cases && exam.questions[0].test_cases.length > 0) {
            targetCases = isPublicRun ? [exam.questions[0].test_cases[0]] : exam.questions[0].test_cases;
        } else {
            // Legacy fall back
            targetCases = [{ input: exam.questions[0].sql_init, output: exam.questions[0].correct_answer }];
        }

        let passed = 0;
        let localResults = [];

        for (let i = 0; i < targetCases.length; i++) {
            const tc = targetCases[i];
            const tempDb = `db_exec_${Date.now()}_${i}`;
            
            try {
                // Init fresh DB
                alasql(`CREATE DATABASE ${tempDb}`);
                alasql(`USE ${tempDb}`);
                if (tc.input) alasql(tc.input);

                // Run User Query
                const userOutput = alasql(query);
                
                // Parse Admin Truth
                let truthOutput;
                const adminAns = (tc.output || '').trim();
                if (adminAns.startsWith('[')) {
                    truthOutput = JSON.parse(adminAns);
                } else {
                    truthOutput = alasql(adminAns);
                }

                const userStr = userOutput !== undefined ? JSON.stringify(userOutput) : 'null';
                const truthStr = truthOutput !== undefined ? JSON.stringify(truthOutput) : 'null';
                
                // Don't pass if both are just empty or null due to bad query
                const isMatch = (userStr === truthStr) && userStr !== 'null' && userStr !== '[]';
                if (isMatch) passed++;
                
                localResults.push({ id: i + 1, passed: isMatch, output: userOutput, expected: truthOutput, error: null });

            } catch (err) {
                localResults.push({ id: i + 1, passed: false, output: null, expected: null, error: err.message });
            } finally {
                try { alasql(`DROP DATABASE IF EXISTS ${tempDb}`); } catch(e){}
            }
        }

        setResult(localResults);
        const totalTests = exam.questions[0].test_cases?.length || 1;
        const finalScore = Math.round((passed / totalTests) * 100);
        
        // Preview score (SERVER score shown in Reports after submit)
        setIsPassed(finalScore);
    };

    const handleSubmitAttempt = async (options = {}) => {
        if (!exam || submitted || submitting) return;
        setSubmitting(true);
        try {
            let targetAttemptId = activeAttemptId;
            if (!targetAttemptId) {
                const startRes = await fetch(`${API_BASE_URL}/api/attempts/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ student: user.id, exam: exam._id })
                });
                const attemptData = await startRes.json();
                targetAttemptId = attemptData._id;
            }

            // Step 2: Submit Completion
            const res = await fetch(`${API_BASE_URL}/api/attempts/${targetAttemptId}/submit`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    score: isPassed, 
                    status: 'completed',
                    answers: [{ question_id: exam.questions[0]._id, answer: query }],
                    flags: flagsRef.current,
                    spam: !!options?.forceSpam
                })
            });

            if (res.ok) {
                const finalAttempt = await res.json();
                localStorage.removeItem(`timeLeft_${exam._id}`);
                alert(`Successfully saved to database! Server Validated Score: ${finalAttempt.score}/100`);
                setLatestScore(finalAttempt.score);
                setSubmitted(true);
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(err => console.error("Exit fullscreen error", err));
                }
                navigate('/student');
            } else {
                alert('An error occurred updating the database submission record.');
            }
        } catch (err) {
            alert(`Fatal Network Error submitting: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{ padding: '5rem', textAlign: 'center' }}>Initializing SQL Environment...</div>;
    if (!exam) return <div style={{ padding: '5rem', textAlign: 'center', color: 'red' }}>Environment Failed to Load</div>;

    const currentQ = exam.questions[0];

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #ddd', paddingBottom: '1rem' }}>
                <div>
                   <h1 style={{ fontWeight: '900', color: 'var(--text-primary)', margin: 0, fontSize: '2rem' }}>{exam.title}</h1>
                   <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      <Database size={14} /> Local ALASQL Runtime Engine Active
                   </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <NetworkIndicator isOnline={isOnline} />
                   {timeLeft !== null && timeLeft >= 0 && (
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: timeLeft < 60 ? '#fee2e2' : '#fef3c7', border: `1px solid ${timeLeft < 60 ? '#fca5a5' : '#fde68a'}`, padding: '0.4rem 0.9rem', borderRadius: '4px' }}>
                           <Clock size={16} color={timeLeft < 60 ? '#ef4444' : '#d97706'} />
                           <span style={{ fontWeight: 'bold', color: timeLeft < 60 ? '#ef4444' : '#d97706' }}>
                               {Math.floor(timeLeft / 60)}:{(timeLeft % 60 < 10 ? '0' : '')}{timeLeft % 60}
                           </span>
                       </div>
                   )}
                  {latestScore !== null && (
                      <div style={{ background: '#f8fafc', padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '4px', fontWeight: 'bold', color: '#0f172a' }}>
                         Latest Score: <span style={{ color: latestScore >= 50 ? '#16a34a' : '#ef4444' }}>{latestScore} / 100</span>
                      </div>
                  )}
                  <button 
                    onClick={async () => {
                      if (!exam?._id || !user?.id) return alert('Session error');
                      const res = await fetch(`${API_BASE_URL}/api/attempts/start`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ student: user.id, exam: exam._id })
                      });
                      const attemptData = await res.json();
                      await fetch(`${API_BASE_URL}/api/attempts/${attemptData._id}/save-query`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query })
                      });
                      alert('Query saved!');
                    }}
                    style={{ background: '#3b82f6', color: 'white', padding: '0.75rem 1.5rem', fontWeight: '900', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
                  >
                     <Save size={16} /> SAVE CODE
                  </button>
                  <button 
                    onClick={handleSubmitAttempt}
                    disabled={!result}
                    style={{ background: result ? '#16a34a' : '#cbd5e1', color: 'white', padding: '0.75rem 2rem', fontWeight: '900', border: 'none', borderRadius: '4px', cursor: result ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                     <Save size={16} /> SUBMIT FOR SCORING
                  </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '2.5rem', minHeight: '600px' }}>
                {/* Information Panel */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: 'var(--surface-color)', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', maxHeight: '50%', overflowY: 'auto' }}>
                       <h3 style={{ margin: 0, marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: '900', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Scenario Brief</h3>
                       <p style={{ color: '#334155', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{currentQ.text}</p>
                       
                       {currentQ.sample_input && (
                          <div style={{ marginTop: '1.5rem' }}>
                            <h4 style={{ margin: 0, marginBottom: '0.5rem', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Sample Table Data</h4>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', color: '#0f172a' }}>
                              {currentQ.sample_input}
                            </div>
                          </div>
                       )}

                       {currentQ.sample_output && (
                          <div style={{ marginTop: '1.5rem' }}>
                            <h4 style={{ margin: 0, marginBottom: '0.5rem', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Expected Output Format</h4>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '4px', border: '1px solid #e2e8f0', fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', color: '#0f172a' }}>
                              {currentQ.sample_output}
                            </div>
                          </div>
                       )}
                    </div>

                    <div style={{ background: '#071125', borderRadius: '8px', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
                       <div style={{ background: '#1e293b', padding: '0.75rem 1rem', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span>SQL TERMINAL</span>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                             {query && !submitted && (
                                  <button 
                                    onClick={() => setQuery('')} 
                                    style={{ background: '#ef4444', color: 'white', border: 'none', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.3rem 0.75rem', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem' }}
                                  >
                                    CLEAR TERMINAL
                                  </button>
                               )}<button onClick={() => handleRunPatternMatch(true)} style={{ background: '#3b82f6', color: 'white', border: 'none', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.3rem 1rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Play size={10}/> RUN CODE (DEBUG)</button>
                              <button onClick={() => handleRunPatternMatch(false)} style={{ background: '#22c55e', color: 'white', border: 'none', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.3rem 1rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Server size={10}/> EVALUATE HIDDEN</button>
                          </div>
                       </div>
                       <textarea
                         value={query}
                         onChange={e => setQuery(e.target.value)}
                         style={{ background: 'transparent', color: '#38bdf8', border: 'none', padding: '1rem', width: '100%', flex: 1, outline: 'none', fontFamily: 'monospace', fontSize: '1rem', resize: 'none' }}
                         spellCheck={false}
                       />
                    </div>
                </div>

                {/* Validation Render Panel */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: 'var(--surface-color)', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ margin: 0, marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: '900', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Simulation Results</h3>
                        
                        {error && (
                            <div style={{ padding: '1rem', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '4px', fontFamily: 'monospace' }}>
                                Fatal Database Error: {error}
                            </div>
                        )}

                        {!error && result && (
                            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                               {!isPublicMode && (
                                   <div style={{ padding: '1rem', background: isPassed === 100 ? '#f0fdf4' : '#fffbeb', color: isPassed === 100 ? '#16a34a' : '#b45309', border: `1px solid ${isPassed === 100 ? '#bbf7d0' : '#fde68a'}`, borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                                      {isPassed === 100 ? <Check size={18}/> : <X size={18}/>} 
                                      Overall Score: {isPassed} / 100
                                   </div>
                               )}
                               
                               {result.map(res => (
                                  <div key={res.id} style={{ border: '1px solid #e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                                     <div style={{ background: res.passed ? '#f0fdf4' : '#fef2f2', padding: '0.75rem', fontWeight: 'bold', color: res.passed ? '#15803d' : '#b91c1c', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Test Case {res.id} {isPublicMode && '(Public Sample)'}</span>
                                        <span>{res.passed ? 'PASSED' : 'FAILED'}</span>
                                     </div>
                                     
                                     {isPublicMode && res.output && (
                                         <div style={{ padding: '0.5rem', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                                            <div style={{ flex: 1 }}>
                                                <h5 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>Your Output:</h5>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                                                  <thead><tr style={{ background: '#f8fafc' }}>
                                                     {res.output.length > 0 ? Object.keys(res.output[0]).map(k => <th key={k} style={{ padding: '0.5rem', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>{k}</th>) : <th>(Empty Output)</th>}
                                                  </tr></thead>
                                                  <tbody>
                                                     {res.output.map((row, i) => <tr key={i}>{Object.values(row).map((v, j) => <td key={j} style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9', color: !res.passed ? '#ef4444' : 'inherit' }}>{String(v)}</td>)}</tr>)}
                                                  </tbody>
                                                </table>
                                            </div>
                                            {!res.passed && res.expected && (
                                              <div style={{ flex: 1, marginTop: '0.5rem', padding: '1rem', background: '#f0fdf4', border: '1px dashed #bbf7d0', borderRadius: '4px' }}>
                                                  <h5 style={{ margin: '0 0 0.5rem 0', color: '#16a34a' }}>Expected Target Output:</h5>
                                                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                                                    <thead><tr style={{ background: 'var(--surface-color)' }}>
                                                       {res.expected.length > 0 ? Object.keys(res.expected[0]).map(k => <th key={k} style={{ padding: '0.5rem', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>{k}</th>) : <th>(Empty Output)</th>}
                                                    </tr></thead>
                                                    <tbody>
                                                       {res.expected.map((row, i) => <tr key={i}>{Object.values(row).map((v, j) => <td key={j} style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9', color: '#16a34a', fontWeight: 'bold' }}>{String(v)}</td>)}</tr>)}
                                                    </tbody>
                                                  </table>
                                              </div>
                                            )}
                                         </div>
                                     )}
                                     {isPublicMode && res.error && (
                                         <div style={{ padding: '0.5rem', color: '#ef4444', fontFamily: 'monospace' }}>Error executing public sample: {res.error}</div>
                                     )}
                                  </div>
                               ))}
                            </div>
                        )}
                        {!error && !result && <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', paddingTop: '4rem' }}>Awaiting valid syntactical input sequence...</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentSQLIDE;
