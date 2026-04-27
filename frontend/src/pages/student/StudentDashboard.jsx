import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, CheckCircle, RefreshCcw, Users, X } from 'lucide-react';

const StudentDashboard = ({ tab }) => {
  const navigate = useNavigate();
  const [days, setDays] = useState([]);
  const [allAttempts, setAllAttempts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myGroupIds, setMyGroupIds] = useState([]);
  const [expandedDays, setExpandedDays] = useState({});


  const fetchData = async () => {
    setLoading(true);
    const activeUser = JSON.parse(localStorage.getItem('user'));
    if (!activeUser) { navigate('/'); return; }
    setUser(activeUser);

    try {
      const now = Date.now();
      const dayRes = await fetch(`${API_BASE_URL}/api/days?t=${now}`);
      const dayRaw = await dayRes.json();
      
      const uniqueDaysMap = new Map();
      dayRaw.forEach(d => {
        if (!d.isDeleted && !uniqueDaysMap.has(d._id)) {
           const uniqueTasksMap = new Map();
           (d.tasks || []).forEach(t => { if (!t.isDeleted && !uniqueTasksMap.has(t._id)) uniqueTasksMap.set(t._id, t); });
           uniqueDaysMap.set(d._id, { ...d, tasks: Array.from(uniqueTasksMap.values()) });
        }
      });
      setDays(Array.from(uniqueDaysMap.values()));

      const attRes = await fetch(`${API_BASE_URL}/api/attempts/student/${activeUser.id}?t=${now}`);
      const attRaw = await attRes.json();
      setAllAttempts(attRaw);

      // Fetch groups to know which groups this student belongs to
      try {
        const grpRes = await fetch(`${API_BASE_URL}/api/groups`);
        const grpData = await grpRes.json();
        const myGrpIds = (grpData || []).filter(g => (g.members || []).some(m => (m._id || m) === activeUser.id)).map(g => g._id);
        setMyGroupIds(myGrpIds);
      } catch (e) { setMyGroupIds([]); }

    } catch (err) { console.error('Sync failed', err); } finally { setLoading(false); }
  };

  const handleShowPeople = async (taskId, taskTitle) => {
    setSelectedTaskName(taskTitle);
    setShowPeopleModal(true);
    setFetchingPeople(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/attempts/task/${taskId}`);
      const data = await res.json();
      setPeopleResults(data.filter(a => a.status === 'completed'));
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingPeople(false);
    }
  };

  useEffect(() => { fetchData(); }, []);


  const isTaskAccessible = (task) => {
    if (!user) return false;
    const hasUserRestriction = (task.allowedUsers || []).length > 0;
    const hasGroupRestriction = (task.allowedGroups || []).length > 0;
    // No restriction = visible to all
    if (!hasUserRestriction && !hasGroupRestriction) return true;
    // Check by individual student ID (use String() to avoid ObjectId vs string mismatch)
    if (hasUserRestriction && (task.allowedUsers || []).some(id => String(id) === String(user.id))) return true;
    // Check by group membership
    if (hasGroupRestriction && (task.allowedGroups || []).some(g => myGroupIds.some(mgId => String(mgId) === String(g._id || g)))) return true;
    return false;
  };

  const getActiveTasks = () => {
    if (!user) return [];
    return days.flatMap(d => d.tasks.filter(t => t.status === 'running' && isTaskAccessible(t)));
  };
  const getCompletedTasks = () => {
    const bestMap = new Map();
    allAttempts.filter(a => a.status === 'completed').forEach(a => {
      const examId = a.exam?._id || a.exam;
      const existing = bestMap.get(examId);
      if (!existing || a.score > existing.score) {
        bestMap.set(examId, a);
      }
    });
    return Array.from(bestMap.values());
  };

  const getAttempt = (taskId) => allAttempts.find(a => a.exam?._id === taskId || a.exam === taskId);

  if (loading) return <div style={{ padding: '5rem', textAlign: 'center', color: '#64748b', background: '#f5f5f5' }}>Loading...</div>;

  return (
    <div style={{ background: '#f5f5f5', minHeight: '90vh', paddingBottom: '3rem' }}>
      
      {/* Action Row */}
      <div style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'flex-end', maxWidth: '1240px', margin: '0 auto' }}>
        <button onClick={fetchData} style={{ background: '#f36d44', color: 'white', border: 'none', padding: '0.4rem 1.25rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}>
          Refresh
        </button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {tab === 'Dashboard' && (
            <>
              {getActiveTasks().length > 0 ? getActiveTasks().map(task => {
                const att = getAttempt(task._id);
                const isCompleted = att?.status === 'completed';

                return (
                  <div key={task._id} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '4px', padding: '1.25rem', display: 'flex', gap: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                    {/* Left Frame Box */}
                    <div style={{ width: '200px', flexShrink: 0, padding: '4px', background: '#ddd', borderRadius: '4px' }}>
                       <div style={{ background: '#1a1a1a', height: '120px', borderRadius: '2px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid #000' }}>
                          <div style={{ color: '#ccc', fontSize: '0.75rem', fontWeight: 'bold' }}>QUIZ</div>
                          <div style={{ background: '#222', width: '100%', padding: '0.5rem', position: 'absolute', bottom: 0, left: 0, textAlign: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', borderTop: '1px solid #444' }}>
                            {task.questions && (task.questions[0]?.type === 'SQL' ? 'SQL' : task.questions.some(q => q.type === 'Jumble') && task.questions.some(q => q.type === 'MCQ') ? 'MIXED' : task.questions[0]?.type === 'Coding' ? 'LAB' : task.questions[0]?.type === 'Jumble' ? 'JUMBLE' : 'QUIZ')}
                          </div>
                          <div style={{ color: 'white' }}><BookOpen size={40} /></div>
                       </div>
                    </div>

                    {/* Right Content */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                       <div>
                         <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#333', marginBottom: '0.5rem' }}>{task.title}</h2>
                         <div style={{ borderBottom: '1px solid #eee', marginBottom: '1rem' }}></div>
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ color: isCompleted ? '#16a34a' : '#f36d44' }}><CheckCircle size={16} /></div>
                             <span style={{ color: isCompleted ? '#16a34a' : '#f36d44', fontWeight: 'bold' }}>
                                {isCompleted
                                  ? (() => {
                                      const qType = task.questions?.[0]?.type;
                                      const isMixed = task.questions?.some(q => q.type === 'MCQ') && task.questions?.some(q => q.type === 'Jumble');
                                      const total = isMixed || qType === 'MCQ' || qType === 'Jumble'
                                        ? task.questions?.reduce((s, q) => s + (q.marks || 1), 0)
                                        : qType === 'SQL' ? 100 : task.questions?.length || 1;
                                      return `Completed (Score: ${att.score}/${total})`;
                                    })()
                                  : 'Started'}
                             </span>
                            <span style={{ color: '#999', fontSize: '0.8rem' }}>on {new Date(task.createdAt).toLocaleDateString()}</span>
                         </div>
                         <div style={{ display: 'flex', gap: '0.75rem' }}>
                           {task.questions && task.questions[0]?.type === 'SQL' ? (
                               <button style={{ background: '#0e7490', color: 'white', border: 'none', padding: '0.6rem 2.5rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }} onClick={() => navigate(`/student/sql/${task._id}`)}>OPEN EDITOR</button>
                            ) : (task.questions && (task.questions[0]?.type === 'Jumble' || (task.questions.some(q => q.type === 'Jumble') && task.questions.some(q => q.type === 'MCQ')))) ? (
                                <button style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '0.6rem 2.5rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }} onClick={() => navigate(`/student/jumble/${task._id}`)}>
                                  {isCompleted ? 'VIEW RESULT' : task.questions.some(q => q.type === 'MCQ') ? 'START MIXED ▶' : 'ARRANGE ↕'}
                                </button>
                           ) : isCompleted ? (
                              <button style={{ background: '#f36d44', color: 'white', border: 'none', padding: '0.6rem 2.5rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }} onClick={() => navigate(`/student/summary/${task._id}`)}>VIEW RESULT</button>
                            ) : (
                               <button style={{ background: '#f36d44', color: 'white', border: 'none', padding: '0.6rem 2.5rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }} onClick={() => navigate(`/student/quiz/${task._id}`)}>ATTEMPT</button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                <div style={{ padding: '6rem', textAlign: 'center', background: 'white', borderRadius: '4px', color: '#bbb', border: '1px dashed #ddd' }}>No active for now</div>
              )}
            </>
          )}

          {tab === 'Assignments' && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {days.map(day => {
                   const visibleTasks = day.tasks.filter(t => isTaskAccessible(t));
                   if (visibleTasks.length === 0) return null;
                   const isOpen = !!expandedDays[day._id];
                   return (
                   <div key={day._id} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden' }}>
                      {/* Day Header — click to toggle */}
                      <div
                        onClick={() => setExpandedDays(prev => ({ ...prev, [day._id]: !prev[day._id] }))}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.25rem', cursor: 'pointer', background: isOpen ? '#f8fafc' : 'white', borderBottom: isOpen ? '1px solid #eee' : 'none', userSelect: 'none' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontWeight: '700', color: '#1a365d', fontSize: '0.95rem' }}>Day {day.dayNumber}: {day.title}</span>
                          <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#64748b', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: '700' }}>{visibleTasks.length} task{visibleTasks.length !== 1 ? 's' : ''}</span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{isOpen ? '▲' : '▼'}</span>
                      </div>
                      {/* Tasks — only shown when expanded */}
                      {isOpen && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {visibleTasks.map((task, idx) => (
                            <div key={task._id} style={{ padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx < visibleTasks.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                 <BookOpen size={16} color="#94a3b8" />
                                 <div style={{ fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>{task.title}</div>
                               </div>
                               <span style={{ fontSize: '0.68rem', color: task.status === 'running' ? '#16a34a' : '#94a3b8', fontWeight: '800', textTransform: 'uppercase', border: `1px solid ${task.status === 'running' ? '#bbf7d0' : '#e2e8f0'}`, padding: '0.2rem 0.5rem', borderRadius: '4px', background: task.status === 'running' ? '#f0fdf4' : '#f8fafc' }}>{task.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
                   );
                })}
             </div>
          )}

          {tab === 'Reports' && (
            <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f36d44', color: 'white' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>S No</th>
                    <th style={{ textAlign: 'left' }}>Task Name</th>
                    <th style={{ textAlign: 'center' }}>Score</th>
                    <th style={{ textAlign: 'center' }}>Date</th>
                    <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {getCompletedTasks().map((att, idx) => (
                    <tr key={att._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ textAlign: 'center', padding: '1rem' }}>{idx + 1}</td>
                      <td style={{ fontWeight: 'bold', color: '#333' }}>{att.exam?.title}</td>
                      <td style={{ textAlign: 'center', color: '#f36d44', fontWeight: 'bold' }}>
                          {att.exam?.questions && att.exam.questions[0]?.type === 'SQL' ? `${att.score} / 100` : `${att.score} / ${att.exam?.questions?.length || 1}`}
                      </td>
                      <td style={{ textAlign: 'center', color: '#777' }}>{new Date(att.updatedAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                          <button 
                              onClick={() => navigate(
                                att.exam?.questions?.[0]?.type === 'SQL' ? `/student/sql/${att.exam?._id}` :
                                (att.exam?.questions?.some(q => q.type === 'Jumble')) ? `/student/jumble/${att.exam?._id}` :
                                `/student/summary/${att.exam?._id}`
                              )} 
                              style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                              {att.exam?.questions?.[0]?.type === 'SQL' ? 'Open Editor' : att.exam?.questions?.some(q => q.type === 'Jumble') ? 'Open Quiz' : 'View Report'}
                          </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'Completed Tasks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               {getCompletedTasks().map(att => (
                 <div key={att._id} style={{ background: 'white', padding: '1rem 1.5rem', borderRadius: '4px', border: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                       <div style={{ color: '#16a34a' }}><CheckCircle size={20} /></div>
                       <div style={{ fontWeight: 'bold', color: '#333' }}>{att.exam?.title} (Completed)</div>
                    </div>
                    <button 
                        style={{ background: '#f1f5f9', border: '1px solid #ddd', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: att.exam?.questions && att.exam.questions[0]?.type === 'SQL' ? '#0e7490' : '#333' }} 
                        onClick={() => navigate(att.exam?.questions && att.exam.questions[0]?.type === 'SQL' ? `/student/sql/${att.exam?._id}` : `/student/summary/${att.exam?._id}`)}
                    >
                        {att.exam?.questions && att.exam.questions[0]?.type === 'SQL' ? 'Open Editor' : att.exam?.questions && att.exam.questions[0]?.type === 'Jumble' ? 'Open Jumble' : 'Review Effort'}
                    </button>
                 </div>
               ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

// Helper: button style factory
function actionBtnStyle(bg) {
  return {
    background: bg,
    color: 'white',
    border: 'none',
    padding: '0.55rem 1.75rem',
    borderRadius: '7px',
    fontWeight: '800',
    cursor: 'pointer',
    fontSize: '0.875rem',
    letterSpacing: '0.3px'
  };
}
