import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config';
import { Play, Check, X, Server, Database, Save } from 'lucide-react';
import alasql from 'alasql';

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

    const [dbId] = useState(`db_${Date.now()}`); // Unique DB per instance

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
                
                setExam(found);

                // Fetch past attempts
                try {
                    const attemptRes = await fetch(`${API_BASE_URL}/api/attempts/exam/${found._id}/student/${user.id}`);
                    if (attemptRes.ok) {
                        const pastAttempts = await attemptRes.json();
                        if (pastAttempts.length > 0) {
                            pastAttempts.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
                            setLatestScore(pastAttempts[0].score || 0);
                            
                            if (pastAttempts[0].answers && pastAttempts[0].answers.length > 0) {
                                setQuery(pastAttempts[0].answers[0].answer || 'SELECT * FROM test;');
                            }
                        }
                    }
                } catch (e) {
                    console.error('Failed to fetch past attempts', e);
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
        
        return () => {
            try { alasql(`DROP DATABASE IF EXISTS ${dbId}`); } catch(e) {}
        };
    }, [id, dbId]);

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

                const userStr = JSON.stringify(userOutput);
                const truthStr = JSON.stringify(truthOutput);
                
                const isMatch = (userStr === truthStr);
                if (isMatch) passed++;
                
                localResults.push({ id: i + 1, passed: isMatch, output: userOutput, expected: truthOutput, error: null });

            } catch (err) {
                localResults.push({ id: i + 1, passed: false, output: null, expected: null, error: err.message });
            } finally {
                try { alasql(`DROP DATABASE IF EXISTS ${tempDb}`); } catch(e){}
            }
        }

        setResult(localResults);
        const finalScore = Math.round((passed / exam.questions[0].test_cases.length || 1) * 100);
        
        // Overwrite isPassed to contain the actual integer score 1-100 instead of true/false
        setIsPassed(isPublicRun ? isPassed : finalScore);
    };

    const handleSubmitAttempt = async () => {
        try {
            // Step 1: Start Attempt
            const startRes = await fetch(`${API_BASE_URL}/api/attempts/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student: user.id, exam: exam._id })
            });
            const attemptData = await startRes.json();

            // Step 2: Submit Completion
            const res = await fetch(`${API_BASE_URL}/api/attempts/${attemptData._id}/submit`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    score: isPassed, 
                    status: 'completed',
                    answers: [{ question_id: exam.questions[0]._id, answer: query }],
                    flags: 0
                })
            });

            if (res.ok) {
                alert(`Successfully saved to database with score: ${isPassed}/100`);
                setLatestScore(isPassed);
            } else {
                alert('An error occurred updating the database submission record.');
            }
        } catch (err) {
            alert(`Fatal Network Error submitting: ${err.message}`);
        }
    };

    if (loading) return <div style={{ padding: '5rem', textAlign: 'center' }}>Initializing SQL Environment...</div>;
    if (!exam) return <div style={{ padding: '5rem', textAlign: 'center', color: 'red' }}>Environment Failed to Load</div>;

    const currentQ = exam.questions[0];

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #ddd', paddingBottom: '1rem' }}>
                <div>
                   <h1 style={{ fontWeight: '900', color: 'var(--text-primary)', margin: 0, fontSize: '2rem' }}>{exam.title}</h1>
                   <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      <Database size={14} /> Local ALASQL Runtime Engine Active
                   </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  {latestScore !== null && (
                      <div style={{ background: '#f8fafc', padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '4px', fontWeight: 'bold', color: '#0f172a' }}>
                         Latest Score: <span style={{ color: latestScore >= 50 ? '#16a34a' : '#ef4444' }}>{latestScore} / 100</span>
                      </div>
                  )}
                  <button 
                    onClick={handleSubmitAttempt}
                    disabled={!result}
                    style={{ background: result ? '#16a34a' : '#cbd5e1', color: 'white', padding: '0.75rem 2rem', fontWeight: '900', border: 'none', borderRadius: '4px', cursor: result ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                     <Save size={16} /> SUBMIT TO DB
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
                              <button onClick={() => handleRunPatternMatch(true)} style={{ background: '#3b82f6', color: 'white', border: 'none', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.3rem 1rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Play size={10}/> RUN CODE (DEBUG)</button>
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
