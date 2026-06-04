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

    const [activeLeftTab, setActiveLeftTab] = useState('description'); // 'description' or 'schema'
    const [activeConsoleTab, setActiveConsoleTab] = useState('testcase'); // 'testcase' or 'result'
    const [autoBrackets, setAutoBrackets] = useState(true);
    const [activeTestCaseIdx, setActiveTestCaseIdx] = useState(0);

    const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved'
    const isInitializedRef = useRef(false);

    useEffect(() => {
        if (!loading && exam) {
            const timer = setTimeout(() => {
                isInitializedRef.current = true;
                setSaveStatus('saved');
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [loading, exam]);

    useEffect(() => {
        if (isInitializedRef.current) {
            setSaveStatus('unsaved');
        }
    }, [query]);

    const lineNumbersRef = useRef(null);
    const textareaRef = useRef(null);

    const handleScroll = () => {
        if (lineNumbersRef.current && textareaRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const handleKeyDown = (e) => {
        const { key, target } = e;
        const { selectionStart, selectionEnd, value } = target;

        // Tab key indentation
        if (key === 'Tab') {
            e.preventDefault();
            const tabSpaces = '    ';
            const newValue = value.substring(0, selectionStart) + tabSpaces + value.substring(selectionEnd);
            setQuery(newValue);
            setTimeout(() => {
                target.selectionStart = target.selectionEnd = selectionStart + tabSpaces.length;
            }, 0);
            return;
        }

        if (!autoBrackets) return;

        const pairs = {
            '(': ')',
            '[': ']',
            '{': '}',
            "'": "'",
            '"': '"',
            '`': '`'
        };

        if (pairs[key]) {
            e.preventDefault();
            const closingChar = pairs[key];
            const selection = value.substring(selectionStart, selectionEnd);
            const newValue = value.substring(0, selectionStart) + key + selection + closingChar + value.substring(selectionEnd);
            setQuery(newValue);

            setTimeout(() => {
                if (selection) {
                    target.selectionStart = selectionStart + 1;
                    target.selectionEnd = selectionEnd + 1;
                } else {
                    target.selectionStart = target.selectionEnd = selectionStart + 1;
                }
            }, 0);
            return;
        }

        if (key === 'Backspace' && selectionStart === selectionEnd) {
            const charBefore = value[selectionStart - 1];
            const charAfter = value[selectionStart];
            const matchingPairs = {
                '(': ')',
                '[': ']',
                '{': '}',
                "'": "'",
                '"': '"',
                '`': '`'
            };
            if (matchingPairs[charBefore] === charAfter) {
                e.preventDefault();
                const newValue = value.substring(0, selectionStart - 1) + value.substring(selectionStart + 1);
                setQuery(newValue);
                setTimeout(() => {
                    target.selectionStart = target.selectionEnd = selectionStart - 1;
                }, 0);
            }
        }
    };

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
                let activeHasDraft = false;
                try {
                    const startRes = await fetch(`${API_BASE_URL}/api/attempts/start`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ student: user.id, exam: found._id, dayId: found.dayId })
                    });
                    if (startRes.ok) {
                        startData = await startRes.json();
                        setActiveAttemptId(startData._id);
                        if (startData.answers && startData.answers.length > 0 && startData.answers[0].answer) {
                            setQuery(startData.answers[0].answer);
                            activeHasDraft = true;
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
                        if (completedAttempts.length > 0) {
                            completedAttempts.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
                            setLatestScore(completedAttempts[0].score || 0);
                        } else {
                            setLatestScore(0);
                        }

                        // Load the most recently written query from any past attempts if there's no active draft
                        if (!activeHasDraft && pastAttempts.length > 0) {
                            const sortedAttempts = [...pastAttempts].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
                            const attemptWithAnswers = sortedAttempts.find(a => a.answers && a.answers.length > 0 && a.answers[0].answer);
                            if (attemptWithAnswers) {
                                setQuery(attemptWithAnswers.answers[0].answer);
                            }
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
                const isMatch = (userStr === truthStr) && userStr !== 'null';
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
                setLatestScore(finalAttempt.score);
                setSubmitted(true);
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(err => console.error("Exit fullscreen error", err));
                }
                navigate('/student');
            } else {
                console.error('An error occurred updating the database submission record.');
            }
        } catch (err) {
            console.error('Fatal Network Error submitting:', err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{ padding: '5rem', textAlign: 'center' }}>Initializing SQL Environment...</div>;
    if (!exam) return <div style={{ padding: '5rem', textAlign: 'center', color: 'red' }}>Environment Failed to Load</div>;

    const currentQ = exam.questions[0];

    return (
        <div style={{ 
            height: '100vh', 
            display: 'flex', 
            flexDirection: 'column', 
            background: '#121212', 
            color: '#e0e0e0', 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            overflow: 'hidden'
        }}>
            <style>{`
                .sql-ide-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .sql-ide-scrollbar::-webkit-scrollbar-track {
                    background: #181818;
                }
                .sql-ide-scrollbar::-webkit-scrollbar-thumb {
                    background: #333333;
                    border-radius: 3px;
                }
                .sql-ide-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #444444;
                }
                .code-textarea {
                    tab-size: 4;
                    caret-color: #38bdf8;
                }
                .code-textarea::selection {
                    background: rgba(56, 189, 248, 0.2);
                }
                .tab-button {
                    background: transparent;
                    color: #8c8c8c;
                    border: none;
                    padding: 0.6rem 1.2rem;
                    font-size: 0.85rem;
                    font-weight: 500;
                    cursor: pointer;
                    position: relative;
                    transition: color 0.2s;
                }
                .tab-button:hover {
                    color: #ffffff;
                }
                .tab-button.active {
                    color: #ffffff;
                }
                .tab-button.active::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: #3b82f6;
                }
                .badge {
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .badge-easy {
                    background: rgba(34, 197, 94, 0.15);
                    color: #22c55e;
                }
                .badge-medium {
                    background: rgba(234, 179, 8, 0.15);
                    color: #eab308;
                }
                .console-btn {
                    padding: 0.4rem 0.8rem;
                    background: #1e1e1e;
                    color: #d4d4d4;
                    border: 1px solid #333;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: background 0.15s, border-color 0.15s;
                }
                .console-btn:hover {
                    background: #2a2a2a;
                    border-color: #444444;
                    color: #ffffff;
                }
                .console-btn.active {
                    background: #333333;
                    border-color: #3b82f6;
                    color: #ffffff;
                }
                .action-btn {
                    padding: 0.5rem 1rem;
                    border: none;
                    border-radius: 4px;
                    font-size: 0.85rem;
                    font-weight: bold;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    transition: opacity 0.15s, transform 0.1s;
                }
                .action-btn:active {
                    transform: scale(0.97);
                }
                .action-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>

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

            {/* ─── Header Bar ─── */}
            <div style={{ 
                height: '55px', 
                background: '#1e1e1e', 
                borderBottom: '1px solid #2d2d2d', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '0 1.5rem',
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: '#3b82f6', color: 'white', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: '950', fontSize: '0.9rem', letterSpacing: '0.5px' }}>
                        SMART QUIZ
                    </div>
                    <span style={{ color: '#555' }}>|</span>
                    <h1 style={{ fontWeight: '700', color: '#ffffff', margin: 0, fontSize: '1.1rem' }}>{exam.title}</h1>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <NetworkIndicator isOnline={isOnline} />
                    
                    {timeLeft !== null && timeLeft >= 0 && (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.4rem', 
                            background: timeLeft < 60 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(251, 191, 36, 0.15)', 
                            border: `1px solid ${timeLeft < 60 ? '#ef4444' : '#d97706'}`, 
                            padding: '0.35rem 0.75rem', 
                            borderRadius: '6px',
                            fontSize: '0.85rem'
                        }}>
                            <Clock size={14} color={timeLeft < 60 ? '#ef4444' : '#f59e0b'} />
                            <span style={{ fontWeight: 'bold', color: timeLeft < 60 ? '#ef4444' : '#f59e0b', fontFamily: 'monospace' }}>
                                {Math.floor(timeLeft / 60)}:{(timeLeft % 60 < 10 ? '0' : '')}{timeLeft % 60}
                            </span>
                        </div>
                    )}

                    {latestScore !== null && (
                        <div style={{ 
                            background: '#2d2d2d', 
                            padding: '0.35rem 0.75rem', 
                            border: '1px solid #3d3d3d', 
                            borderRadius: '6px', 
                            fontSize: '0.85rem',
                            fontWeight: 'bold', 
                            color: '#ffffff' 
                        }}>
                           Score: <span style={{ color: latestScore >= 50 ? '#22c55e' : '#ef4444' }}>{latestScore} / 100</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Main Content Workspace ─── */}
            <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
                
                {/* ─── LEFT PANEL: Question Description ─── */}
                <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    background: '#1a1a1a', 
                    borderRight: '1px solid #2d2d2d', 
                    minWidth: 0 
                }}>
                    {/* Tab Navigation */}
                    <div style={{ display: 'flex', background: '#222222', borderBottom: '1px solid #2d2d2d' }}>
                        <button 
                            className={`tab-button ${activeLeftTab === 'description' ? 'active' : ''}`}
                            onClick={() => setActiveLeftTab('description')}
                        >
                            Description
                        </button>
                        <button 
                            className={`tab-button ${activeLeftTab === 'schema' ? 'active' : ''}`}
                            onClick={() => setActiveLeftTab('schema')}
                        >
                            Database Schema
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="sql-ide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                        {activeLeftTab === 'description' ? (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem' }}>
                                    <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: '#ffffff' }}>SQL Query Problem</h2>
                                    <span className="badge badge-easy">Easy</span>
                                    <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 'bold' }}>100 Marks</span>
                                </div>
                                
                                <p style={{ 
                                    color: '#d4d4d4', 
                                    fontSize: '0.95rem', 
                                    lineHeight: '1.7', 
                                    whiteSpace: 'pre-wrap', 
                                    background: '#222222',
                                    padding: '1.2rem',
                                    borderRadius: '8px',
                                    border: '1px solid #2d2d2d'
                                }}>
                                    {currentQ.text}
                                </p>
                                
                                {currentQ.sample_input && (
                                    <div style={{ marginTop: '2rem' }}>
                                        <h4 style={{ margin: '0 0 0.6rem 0', color: '#a0a0a0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Sample Table Data</h4>
                                        <pre style={{ 
                                            background: '#121212', 
                                            padding: '1.2rem', 
                                            borderRadius: '6px', 
                                            border: '1px solid #2d2d2d', 
                                            fontFamily: 'Fira Code, monospace', 
                                            fontSize: '0.85rem', 
                                            overflowX: 'auto', 
                                            color: '#e0e0e0',
                                            margin: 0
                                        }}>
                                            {currentQ.sample_input}
                                        </pre>
                                    </div>
                                )}

                                {currentQ.sample_output && (
                                    <div style={{ marginTop: '2rem' }}>
                                        <h4 style={{ margin: '0 0 0.6rem 0', color: '#a0a0a0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Expected Output Format</h4>
                                        <pre style={{ 
                                            background: '#121212', 
                                            padding: '1.2rem', 
                                            borderRadius: '6px', 
                                            border: '1px solid #2d2d2d', 
                                            fontFamily: 'Fira Code, monospace', 
                                            fontSize: '0.85rem', 
                                            overflowX: 'auto', 
                                            color: '#38bdf8',
                                            margin: 0
                                        }}>
                                            {currentQ.sample_output}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <h3 style={{ margin: '0 0 1rem 0', color: '#ffffff', fontSize: '1.2rem', fontWeight: '700' }}>Alasql / SQLite Database Seeding Schema</h3>
                                <p style={{ color: '#a0a0a0', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                                    The following table schema is loaded when executing query simulations. You can reference these tables and column layouts in your queries.
                                </p>
                                <pre style={{ 
                                    background: '#121212', 
                                    padding: '1.2rem', 
                                    borderRadius: '6px', 
                                    border: '1px solid #2d2d2d', 
                                    fontFamily: 'Fira Code, monospace', 
                                    fontSize: '0.85rem', 
                                    overflowX: 'auto', 
                                    color: '#22c55e',
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: '1.6',
                                    margin: 0
                                }}>
                                    {currentQ.sql_init || 'CREATE TABLE test(id INT);'}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── RIGHT PANEL: Editor (Top) & Results (Bottom) ─── */}
                <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    background: '#1e1e1e', 
                    minWidth: 0 
                }}>
                    
                    {/* TOP: Code Editor Pane */}
                    <div style={{ 
                        flex: 6, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        borderBottom: '4px solid #2d2d2d',
                        minHeight: 0
                    }}>
                        {/* Editor Header */}
                        <div style={{ 
                            height: '40px', 
                            background: '#222222', 
                            borderBottom: '1px solid #2d2d2d', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '0 1rem' 
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                <span>Code Editor (MySQL Syntax)</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#a0a0a0', fontSize: '0.8rem', cursor: 'pointer' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={autoBrackets} 
                                        onChange={(e) => setAutoBrackets(e.target.checked)} 
                                        style={{ cursor: 'pointer' }}
                                    />
                                    Auto Brackets
                                </label>
                                {query && !submitted && (
                                    <button 
                                        onClick={() => setQuery('')}
                                        style={{ 
                                            background: 'transparent', 
                                            color: '#ef4444', 
                                            border: 'none', 
                                            fontSize: '0.75rem', 
                                            fontWeight: 'bold', 
                                            cursor: 'pointer',
                                            padding: 0
                                        }}
                                    >
                                        Clear Code
                                    </button>
                                )}
                                <span style={{ color: '#444' }}>|</span>
                                <button 
                                    onClick={async () => {
                                        if (!exam?._id || !user?.id) return alert('Session error');
                                        setSaveStatus('saving');
                                        try {
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
                                            setSaveStatus('saved');
                                        } catch (e) {
                                            setSaveStatus('unsaved');
                                            console.error('Save query draft failed', e);
                                        }
                                    }}
                                    disabled={saveStatus === 'saved' || saveStatus === 'saving'}
                                    className="action-btn" 
                                    style={{ 
                                        background: saveStatus === 'saved' ? '#16a34a' : '#3b82f6', 
                                        color: 'white', 
                                        padding: '0.25rem 0.6rem', 
                                        fontSize: '0.75rem', 
                                        height: '26px',
                                        opacity: (saveStatus === 'saved' || saveStatus === 'saving') ? 0.75 : 1,
                                        cursor: (saveStatus === 'saved' || saveStatus === 'saving') ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {saveStatus === 'saving' ? (
                                        <>Saving...</>
                                    ) : saveStatus === 'saved' ? (
                                        <><Check size={12} /> Saved</>
                                    ) : (
                                        <><Save size={12} /> Save Draft</>
                                    )}
                                </button>
                                <button 
                                    onClick={() => {
                                        handleRunPatternMatch(true);
                                        setActiveConsoleTab('result');
                                    }}
                                    className="action-btn" 
                                    style={{ background: '#333333', color: '#ffffff', border: '1px solid #444', padding: '0.25rem 0.6rem', fontSize: '0.75rem', height: '26px' }}
                                >
                                    <Play size={10} /> Run Code
                                </button>
                                <button 
                                    onClick={() => {
                                        handleRunPatternMatch(false);
                                        setActiveConsoleTab('result');
                                    }}
                                    className="action-btn" 
                                    style={{ background: '#0e7490', color: '#ffffff', padding: '0.25rem 0.6rem', fontSize: '0.75rem', height: '26px' }}
                                >
                                    <Server size={10} /> Evaluate Hidden
                                </button>
                                <button 
                                    onClick={() => handleSubmitAttempt()}
                                    disabled={!result}
                                    className="action-btn" 
                                    style={{ background: result ? '#16a34a' : '#27272a', color: result ? 'white' : '#71717a', padding: '0.25rem 0.6rem', fontSize: '0.75rem', height: '26px' }}
                                >
                                    <Check size={12} /> Submit
                                </button>
                            </div>
                        </div>

                        {/* Editor Input with gutter */}
                        <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
                            {/* Gutter */}
                            <div 
                                ref={lineNumbersRef}
                                className="sql-ide-scrollbar"
                                style={{
                                    width: '3rem',
                                    padding: '1rem 0.5rem',
                                    background: '#1a1a1a',
                                    color: '#555555',
                                    fontFamily: 'Fira Code, monospace',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.5rem',
                                    textAlign: 'right',
                                    userSelect: 'none',
                                    overflowY: 'hidden',
                                    borderRight: '1px solid #2d2d2d'
                                }}
                            >
                                {Array.from({ length: query.split('\n').length || 1 }, (_, i) => (
                                    <div key={i} style={{ height: '1.5rem' }}>{i + 1}</div>
                                ))}
                            </div>

                            {/* Textarea */}
                            <textarea
                                ref={textareaRef}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onScroll={handleScroll}
                                className="code-textarea sql-ide-scrollbar"
                                style={{
                                    flex: 1,
                                    background: '#1e1e1e',
                                    color: '#9cdcfe',
                                    border: 'none',
                                    padding: '1rem',
                                    margin: 0,
                                    outline: 'none',
                                    fontFamily: 'Fira Code, monospace',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.5rem',
                                    resize: 'none',
                                    whiteSpace: 'pre',
                                    overflow: 'auto'
                                }}
                                placeholder="-- Type your SQL query here"
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    {/* BOTTOM: Results Console */}
                    <div style={{ 
                        flex: 4, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        background: '#151515',
                        minHeight: 0
                    }}>
                        {/* Console Tabs */}
                        <div style={{ display: 'flex', background: '#222222', borderBottom: '1px solid #2d2d2d' }}>
                            <button 
                                className={`tab-button ${activeConsoleTab === 'testcase' ? 'active' : ''}`}
                                onClick={() => setActiveConsoleTab('testcase')}
                            >
                                Testcase Details
                            </button>
                            <button 
                                className={`tab-button ${activeConsoleTab === 'result' ? 'active' : ''}`}
                                onClick={() => setActiveConsoleTab('result')}
                            >
                                Test Results
                            </button>
                        </div>

                        {/* Console Body */}
                        <div className="sql-ide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1.2rem' }}>
                            {activeConsoleTab === 'testcase' ? (
                                <div>
                                    {/* Testcase Buttons */}
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                        {currentQ.test_cases?.map((tc, idx) => (
                                            <button
                                                key={idx}
                                                className={`console-btn ${activeTestCaseIdx === idx ? 'active' : ''}`}
                                                onClick={() => setActiveTestCaseIdx(idx)}
                                            >
                                                Case {idx + 1}
                                            </button>
                                        )) || <span style={{ color: '#888' }}>No custom test cases configured</span>}
                                    </div>
                                    
                                    {currentQ.test_cases?.[activeTestCaseIdx] && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div>
                                                <div style={{ color: '#a8a8a8', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Seed Test Query:</div>
                                                <pre style={{ margin: 0, padding: '0.8rem', background: '#222222', borderRadius: '4px', border: '1px solid #2d2d2d', color: '#d4d4d4', fontFamily: 'monospace', fontSize: '0.8rem', overflowX: 'auto' }}>
                                                    {currentQ.test_cases[activeTestCaseIdx].input}
                                                </pre>
                                            </div>
                                            <div>
                                                <div style={{ color: '#a8a8a8', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Target Expected JSON Output:</div>
                                                <pre style={{ margin: 0, padding: '0.8rem', background: '#222222', borderRadius: '4px', border: '1px solid #2d2d2d', color: '#22c55e', fontFamily: 'monospace', fontSize: '0.8rem', overflowX: 'auto' }}>
                                                    {currentQ.test_cases[activeTestCaseIdx].output}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {error && (
                                        <div style={{ padding: '0.8rem 1.2rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                            Fatal Database Error: {error}
                                        </div>
                                    )}

                                    {!error && result && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {/* Summary Score */}
                                            {!isPublicMode && (
                                                <div style={{ 
                                                    padding: '0.8rem 1.2rem', 
                                                    background: isPassed === 100 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(251, 191, 36, 0.15)', 
                                                    color: isPassed === 100 ? '#22c55e' : '#fbbf24', 
                                                    border: `1px solid ${isPassed === 100 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`, 
                                                    borderRadius: '6px', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '0.5rem', 
                                                    fontWeight: 'bold',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    {isPassed === 100 ? <Check size={16}/> : <X size={16}/>} 
                                                    Evaluation Score: {isPassed} / 100 (Passed {result.filter(r => r.passed).length}/{result.length} test cases)
                                                </div>
                                            )}

                                            {/* Results details */}
                                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                {result.map((res, idx) => (
                                                    <button
                                                        key={idx}
                                                        className={`console-btn ${activeTestCaseIdx === idx ? 'active' : ''}`}
                                                        style={{
                                                            borderBottom: `2.5px solid ${res.passed ? '#22c55e' : '#ef4444'}`
                                                        }}
                                                        onClick={() => setActiveTestCaseIdx(idx)}
                                                    >
                                                        Case {idx + 1} {res.passed ? '✓' : '✗'}
                                                    </button>
                                                ))}
                                            </div>

                                            {result[activeTestCaseIdx] && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid #2d2d2d', borderRadius: '6px', background: '#1c1c1c', padding: '1rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid #2d2d2d' }}>
                                                        <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Test Case {activeTestCaseIdx + 1} Details</span>
                                                        <span style={{ 
                                                            fontWeight: 'bold', 
                                                            fontSize: '0.8rem',
                                                            color: result[activeTestCaseIdx].passed ? '#22c55e' : '#ef4444' 
                                                        }}>
                                                            {result[activeTestCaseIdx].passed ? 'PASSED' : 'FAILED'}
                                                        </span>
                                                    </div>

                                                    {isPublicMode && result[activeTestCaseIdx].output && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                            <div>
                                                                <h5 style={{ margin: '0 0 0.4rem 0', color: '#a0a0a0', fontSize: '0.8rem' }}>Your Query Output:</h5>
                                                                {result[activeTestCaseIdx].output.length > 0 ? (
                                                                    <div style={{ overflowX: 'auto' }}>
                                                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem', color: '#d4d4d4' }}>
                                                                            <thead>
                                                                                <tr style={{ background: '#252526', borderBottom: '1px solid #333' }}>
                                                                                    {Object.keys(result[activeTestCaseIdx].output[0]).map(k => (
                                                                                        <th key={k} style={{ padding: '0.4rem 0.6rem', fontWeight: 'bold' }}>{k}</th>
                                                                                    ))}
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {result[activeTestCaseIdx].output.map((row, rIdx) => (
                                                                                    <tr key={rIdx} style={{ borderBottom: '1px solid #2a2a2a' }}>
                                                                                        {Object.values(row).map((v, cIdx) => (
                                                                                            <td key={cIdx} style={{ padding: '0.4rem 0.6rem', color: !result[activeTestCaseIdx].passed ? '#f87171' : 'inherit' }}>{String(v)}</td>
                                                                                        ))}
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                ) : (
                                                                    <pre style={{ margin: 0, padding: '0.5rem', background: '#222', color: '#888', fontStyle: 'italic', fontSize: '0.8rem' }}>Empty Output (0 rows returned)</pre>
                                                                )}
                                                            </div>

                                                            {!result[activeTestCaseIdx].passed && result[activeTestCaseIdx].expected && (
                                                                <div>
                                                                    <h5 style={{ margin: '0 0 0.4rem 0', color: '#22c55e', fontSize: '0.8rem' }}>Expected Target Output:</h5>
                                                                    {result[activeTestCaseIdx].expected.length > 0 ? (
                                                                        <div style={{ overflowX: 'auto' }}>
                                                                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem', color: '#22c55e' }}>
                                                                                <thead>
                                                                                    <tr style={{ background: '#252526', borderBottom: '1px solid #333' }}>
                                                                                        {Object.keys(result[activeTestCaseIdx].expected[0]).map(k => (
                                                                                            <th key={k} style={{ padding: '0.4rem 0.6rem', fontWeight: 'bold' }}>{k}</th>
                                                                                        ))}
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {result[activeTestCaseIdx].expected.map((row, rIdx) => (
                                                                                        <tr key={rIdx} style={{ borderBottom: '1px solid #2a2a2a' }}>
                                                                                            {Object.values(row).map((v, cIdx) => (
                                                                                                <td key={cIdx} style={{ padding: '0.4rem 0.6rem' }}>{String(v)}</td>
                                                                                            ))}
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    ) : (
                                                                        <pre style={{ margin: 0, padding: '0.5rem', background: '#222', color: '#22c55e', fontStyle: 'italic', fontSize: '0.8rem' }}>Empty Target Output expected</pre>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {!isPublicMode && (
                                                        <div style={{ color: '#888', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                                            Evaluation run against hidden test case. Outputs are hidden to prevent script matching.
                                                        </div>
                                                    )}

                                                    {result[activeTestCaseIdx].error && (
                                                        <div style={{ color: '#f87171', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                                            Execution error: {result[activeTestCaseIdx].error}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!error && !result && (
                                        <div style={{ color: '#777777', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', paddingTop: '1.5rem' }}>
                                            Console ready. Click "Run Code" or "Evaluate Hidden" to view test outputs here.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>


                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentSQLIDE;
