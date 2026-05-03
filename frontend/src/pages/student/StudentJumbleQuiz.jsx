import React, { useState, useEffect, useRef } from 'react';
import API_BASE_URL from '../../config';
import { ArrowLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';

const socket = io(`${API_BASE_URL}`);

// ─── Keyword Jumble Question ──────────────────────────────────────────────────
const KeywordJumble = ({ question, qIndex, onAnswer, submitted }) => {
  const correctOrder = (() => { try { return JSON.parse(question.correct_answer); } catch { return []; } })();
  const [pool, setPool] = useState([...question.words]);
  const [slots, setSlots] = useState(new Array(question.words.length).fill(null));

  const placeKeyword = (kw, poolIdx) => {
    if (submitted) return;
    const firstEmpty = slots.findIndex(s => s === null);
    if (firstEmpty === -1) return;
    const ns = [...slots]; ns[firstEmpty] = kw;
    const np = pool.filter((_, i) => i !== poolIdx);
    setSlots(ns); setPool(np);
    onAnswer(qIndex, ns);
  };

  const removeKeyword = (slotIdx) => {
    if (submitted || slots[slotIdx] === null) return;
    const kw = slots[slotIdx];
    const ns = [...slots]; ns[slotIdx] = null;
    setPool([...pool, kw]); setSlots(ns);
    onAnswer(qIndex, ns);
  };

  const isCorrect = submitted && JSON.stringify(slots) === JSON.stringify(correctOrder);

  const CHIP_COLORS = [
    ['#6d28d9','#7c3aed'], ['#0369a1','#0284c7'], ['#065f46','#047857'],
    ['#92400e','#b45309'], ['#831843','#9d174d'], ['#1e3a5f','#1d4ed8'],
  ];

  return (
    <div style={{
      marginBottom: '1.5rem', borderRadius: '16px', overflow: 'hidden',
      border: '1px solid', borderColor: submitted ? (isCorrect ? '#86efac' : '#fca5a5') : '#e2e8f0',
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    }}>
      {/* Question Header */}
      <div style={{ padding: '1rem 1.25rem', background: '#0f172a', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <span style={{ background: '#7c3aed', color: 'white', fontWeight: '900', fontSize: '0.7rem', padding: '0.2rem 0.55rem', borderRadius: '6px', marginTop: '2px', flexShrink: 0 }}>
          🔤 Q{qIndex + 1}
        </span>
        <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#f1f5f9', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{question.text}</span>
      </div>

      <div style={{ padding: '1.25rem', background: 'var(--surface-color)' }}>
        {/* Answer Slots */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.6rem' }}>
            Your Answer — click a chip below to place it
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', minHeight: '52px', padding: '0.75rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '2px dashed #c4b5fd', alignItems: 'center' }}>
            {slots.map((kw, i) => {
              const isRight = submitted && kw === correctOrder[i];
              const isWrong = submitted && kw && kw !== correctOrder[i];
              return (
                <div key={i} onClick={() => removeKeyword(i)} style={{
                  minWidth: '52px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '4px', paddingInline: '0.7rem', borderRadius: '8px', fontWeight: '800', fontSize: '0.82rem',
                  cursor: kw && !submitted ? 'pointer' : 'default', transition: 'all 0.15s',
                  background: kw ? (isRight ? '#dcfce7' : isWrong ? '#fee2e2' : 'linear-gradient(135deg,#7c3aed,#9333ea)') : 'transparent',
                  border: kw ? (isRight ? '2px solid #86efac' : isWrong ? '2px solid #fca5a5' : 'none') : '2px dashed #c4b5fd',
                  color: kw ? (isRight ? '#15803d' : isWrong ? '#b91c1c' : 'white') : '#c4b5fd',
                  boxShadow: kw && !submitted ? '0 3px 8px rgba(124,58,237,0.25)' : 'none',
                }}>
                  <span style={{ fontSize: '0.6rem', opacity: 0.6, marginRight: '2px' }}>{i + 1}.</span>
                  {kw || <span style={{ opacity: 0.4 }}>?</span>}
                  {submitted && isRight && <CheckCircle size={13} />}
                  {submitted && isWrong && <XCircle size={13} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Keyword Pool */}
        {!submitted && pool.length > 0 && (
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '0.6rem' }}>Keyword Pool</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {pool.map((kw, i) => {
                const [from, to] = CHIP_COLORS[i % CHIP_COLORS.length];
                return (
                  <button key={i} type="button" onClick={() => placeKeyword(kw, i)} style={{
                    background: `linear-gradient(135deg,${from},${to})`, color: 'white', border: 'none',
                    padding: '0.45rem 1rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.88rem',
                    cursor: 'pointer', boxShadow: `0 3px 8px ${from}55`, transition: 'transform 0.1s, box-shadow 0.1s',
                  }}
                    onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = `0 6px 14px ${from}66`; }}
                    onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = `0 3px 8px ${from}55`; }}
                  >{kw}</button>
                );
              })}
            </div>
          </div>
        )}

        {/* Result feedback */}
        {submitted && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: '8px', background: isCorrect ? '#f0fdf4' : '#fff7ed', border: `1px solid ${isCorrect ? '#86efac' : '#fcd34d'}` }}>
            {isCorrect
              ? <div style={{ color: '#15803d', fontWeight: '700', fontSize: '0.88rem' }}>✅ Perfect! Correct order.</div>
              : <div style={{ color: '#92400e', fontWeight: '700', fontSize: '0.85rem' }}>
                  ❌ Correct: {correctOrder.join(' → ')}
                </div>
            }
          </div>
        )}
      </div>
    </div>
  );
};

// ─── MCQ Question ─────────────────────────────────────────────────────────────
const MCQQuestion = ({ question, qIndex, onAnswer, submitted }) => {
  const [selected, setSelected] = useState(null);

  const pick = (opt) => {
    if (submitted) return;
    setSelected(opt);
    onAnswer(qIndex, opt);
  };

  const isCorrect = submitted && selected === question.correct_answer;

  return (
    <div style={{
      marginBottom: '1.5rem', borderRadius: '16px', overflow: 'hidden',
      border: '1px solid', borderColor: submitted ? (isCorrect ? '#86efac' : '#fca5a5') : '#e2e8f0',
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    }}>
      <div style={{ padding: '1rem 1.25rem', background: '#0f172a', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <span style={{ background: '#f59e0b', color: '#1c1917', fontWeight: '900', fontSize: '0.7rem', padding: '0.2rem 0.55rem', borderRadius: '6px', marginTop: '2px', flexShrink: 0 }}>
          📝 Q{qIndex + 1}
        </span>
        <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#f1f5f9', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{question.text}</span>
      </div>

      <div style={{ padding: '1.25rem', background: 'var(--surface-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {(question.options || []).map((opt, i) => {
          const isSelected = selected === opt;
          const isRight = submitted && opt === question.correct_answer;
          const isWrong = submitted && isSelected && opt !== question.correct_answer;
          const letters = ['A', 'B', 'C', 'D', 'E'];
          return (
            <button key={i} type="button" onClick={() => pick(opt)} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
              border: '2px solid', borderColor: isRight ? '#86efac' : isWrong ? '#fca5a5' : isSelected ? '#f59e0b' : '#e2e8f0',
              borderRadius: '10px', background: isRight ? '#f0fdf4' : isWrong ? '#fff1f2' : isSelected ? '#fffbeb' : '#fafafa',
              cursor: submitted ? 'default' : 'pointer', textAlign: 'left', transition: 'all 0.15s',
            }}>
              <span style={{
                width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '900', fontSize: '0.75rem', flexShrink: 0,
                background: isRight ? '#dcfce7' : isWrong ? '#fee2e2' : isSelected ? '#fde68a' : '#f1f5f9',
                color: isRight ? '#15803d' : isWrong ? '#b91c1c' : isSelected ? '#92400e' : '#64748b',
              }}>{letters[i]}</span>
              <span style={{ fontWeight: isSelected || isRight ? '700' : '500', fontSize: '0.9rem', color: 'var(--text-primary)', flex: 1 }}>{opt}</span>
              {isRight && <CheckCircle size={16} color="#16a34a" />}
              {isWrong && <XCircle size={16} color="#ef4444" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Quiz Page ───────────────────────────────────────────────────────────
const StudentJumbleQuiz = () => {
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
    if (!activeUser) { navigate('/'); return; }
    setUser(activeUser);

    const init = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/exams`);
        const exams = await res.json();
        const found = exams.find(e => e._id === id);
        if (!found) { alert('Quiz not found.'); navigate('/student'); return; }

        if (found.status !== 'running') {
          alert('This task is currently not active.');
          navigate(`/student/summary/${found._id}`);
          return;
        }

        const attRes = await fetch(`${API_BASE_URL}/api/attempts/exam/${found._id}/student/${activeUser.id}`);
        const past = await attRes.json();
        if (past.length >= (found.attempt_limit || 1)) {
          navigate(`/student/summary/${found._id}`); return;
        }

        setExam(found);
        setTimeLeft(found.time_limit * 60);

        const initAns = {};
        found.questions.forEach((q, idx) => {
          if (q.type === 'Jumble') initAns[idx] = [...q.words];
          else initAns[idx] = null;
        });
        setAnswers(initAns);

        try {
          const sr = await fetch(`${API_BASE_URL}/api/attempts/start`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student: activeUser.id, exam: found._id, ipAddress: '0.0.0.0' })
          });
          const sd = await sr.json();
          setActiveAttemptId(sd._id);
        } catch (e) { console.error('Start attempt failed', e); }

        socket.emit('student_update', {
          id: activeUser.id, roll: activeUser.roll_no, name: activeUser.name,
          marks: 0, subs: past.length, flags: 0, status: 'attempting'
        });
      } catch (err) { console.error(err); }
    };
    init();
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
      handleSubmit();
    }
  }, [timeLeft, exam, submitted]);

  // Cheating detection removed as requested

  const fmt = (s) => `${Math.floor(s / 60)}:${(s % 60 < 10 ? '0' : '')}${s % 60}`;

  const handleAnswer = (qIndex, val) => setAnswers(prev => ({ ...prev, [qIndex]: val }));

  const handleSubmit = async () => {
    if (!exam || submitted) return;
    const currentAnswers = answersRef.current;
    let cal = 0;
    exam.questions.forEach((q, idx) => {
      if (q.type === 'Jumble') {
        try {
          const correct = JSON.parse(q.correct_answer);
          const student = currentAnswers[idx] || q.words;
          if (JSON.stringify(student.filter(Boolean)) === JSON.stringify(correct)) cal += (q.marks || 1);
        } catch {}
      } else if (q.type === 'MCQ') {
        if (currentAnswers[idx] === q.correct_answer) cal += (q.marks || 1);
      }
    });
    setScore(cal);
    setSubmitted(true);
    clearInterval(timerRef.current);

    try {
      const currentAttemptId = activeAttemptIdRef.current;
      if (currentAttemptId) {
        await fetch(`${API_BASE_URL}/api/attempts/${currentAttemptId}/submit`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            score: cal, flags: flagsRef.current, status: 'completed',
            answers: exam.questions.map((q, idx) => ({
              question_id: q._id,
              answer: q.type === 'Jumble' ? JSON.stringify(currentAnswers[idx] || q.words) : (currentAnswers[idx] || '')
            }))
          })
        });
      }
      socket.emit('student_update', { id: user?.id, status: 'completed', marks: cal });
      setTimeout(() => navigate(`/student/summary/${exam._id}`), 5000);
    } catch (err) { console.error('Submit failed', err); }
  };

  if (!exam) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: '48px', height: '48px', border: '4px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ color: '#7c3aed', fontWeight: '700' }}>Loading quiz…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const totalQ = exam.questions.length;
  const isMixed = exam.questions.some(q => q.type === 'MCQ') && exam.questions.some(q => q.type === 'Jumble');
  const totalMarks = exam.questions.reduce((s, q) => s + (q.marks || 1), 0);
  const urgentTime = timeLeft < 60;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0f172a 0%,#1e1b4b 100%)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Sticky Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100, background: 'rgba(15,23,42,0.95)',
        backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0.85rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button onClick={() => navigate('/student')} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.4rem 0.75rem', borderRadius: '8px', fontWeight: '600' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: '900', color: 'white', letterSpacing: '-0.3px' }}>{exam.title}</div>
            <div style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: '600', marginTop: '1px' }}>
              {isMixed ? '🎯 Mixed Quiz — MCQ + Keyword Jumble' : '🔤 Keyword Jumble — click chips to arrange'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.55rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Questions</div>
            <div style={{ fontWeight: '900', fontSize: '1.1rem', color: '#e2e8f0' }}>{totalQ}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: urgentTime ? 'rgba(239,68,68,0.15)' : 'rgba(251,191,36,0.1)', border: `1px solid ${urgentTime ? 'rgba(239,68,68,0.3)' : 'rgba(251,191,36,0.2)'}`, padding: '0.4rem 0.9rem', borderRadius: '10px' }}>
            <Clock size={16} color={urgentTime ? '#ef4444' : '#fbbf24'} />
            <span style={{ fontWeight: '900', fontSize: '1.2rem', color: urgentTime ? '#ef4444' : '#fbbf24', fontVariantNumeric: 'tabular-nums' }}>{fmt(timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <div style={{ flex: 1, maxWidth: '780px', margin: '0 auto', width: '100%', padding: '2rem 1.25rem' }}>

        {submitted ? (
          /* Result Screen */
          <div style={{ textAlign: 'center', padding: '3.5rem 2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>
              {score === totalMarks ? '🏆' : score > totalMarks / 2 ? '🎉' : '💪'}
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: '900', color: 'white', marginBottom: '0.5rem' }}>Quiz Submitted!</h2>
            <p style={{ color: '#a78bfa', fontWeight: '600', marginBottom: '1.75rem' }}>
              {score === totalMarks ? 'Perfect Score!' : score > totalMarks / 2 ? 'Great work! Keep it up.' : 'Keep practicing!'}
            </p>
            <div style={{ display: 'inline-block', background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', borderRadius: '16px', padding: '1.5rem 3rem', marginBottom: '1.5rem', boxShadow: '0 8px 30px rgba(124,58,237,0.4)' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: '900', color: 'white', lineHeight: 1 }}>{score}</div>
              <div style={{ fontSize: '1rem', color: '#c4b5fd', fontWeight: '600' }}>out of {totalMarks}</div>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '2rem' }}>Redirecting to results in a moment…</p>
            <button onClick={() => navigate('/student')} style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: 'white', border: 'none', padding: '0.85rem 2.5rem', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 14px rgba(124,58,237,0.4)' }}>
              Go to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Instructions banner */}
            <div style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '12px', padding: '0.75rem 1.25rem', marginBottom: '1.75rem', fontSize: '0.82rem', color: '#c4b5fd', fontWeight: '600', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ fontSize: '1.2rem' }}>💡</span>
              {isMixed
                ? 'Answer the MCQ questions and arrange the keyword chips in the correct order.'
                : 'Click keyword chips from the pool to place them in order. Click a placed chip to remove it.'}
            </div>

            {/* Questions */}
            {exam.questions.map((q, idx) =>
              q.type === 'Jumble'
                ? <KeywordJumble key={q._id || idx} question={q} qIndex={idx} onAnswer={handleAnswer} submitted={submitted} />
                : <MCQQuestion key={q._id || idx} question={q} qIndex={idx} onAnswer={handleAnswer} submitted={submitted} />
            )}

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem', marginBottom: '3rem' }}>
              <button onClick={handleSubmit} style={{
                background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: 'white', border: 'none',
                padding: '1rem 4rem', borderRadius: '12px', fontWeight: '900', fontSize: '1.05rem',
                cursor: 'pointer', boxShadow: '0 6px 24px rgba(124,58,237,0.4)', letterSpacing: '0.3px',
                transition: 'transform 0.15s',
              }}
                onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
              >
                ✅ Submit Quiz
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentJumbleQuiz;
