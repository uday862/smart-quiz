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


  const getActiveTasks = () => {
    if (!user) return [];
    return days.flatMap(d => d.tasks.filter(t => {
      const isRunning = t.status === 'running';
      const isAllowed = !t.allowedUsers || t.allowedUsers.length === 0 || t.allowedUsers.includes(user.id);
      return isRunning && isAllowed;
    }));
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
                          <div style={{ color: '#ccc', fontSize: '0.75rem', fontWeight: 'bold' }}>FS-Elite-2027</div>
                          <div style={{ background: '#222', width: '100%', padding: '0.5rem', position: 'absolute', bottom: 0, left: 0, textAlign: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.8rem', borderTop: '1px solid #444' }}>
                            {task.questions && task.questions[0]?.type === 'Coding' ? 'LAB' : 'QUIZ'}
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
                               {isCompleted ? `Completed (Score: ${att.score}/${task.questions?.length})` : 'Started'}
                            </span>
                            <span style={{ color: '#999', fontSize: '0.8rem' }}>on {new Date(task.createdAt).toLocaleDateString()}</span>
                         </div>
                         
                         <div style={{ display: 'flex', gap: '0.75rem' }}>
                           {isCompleted ? (
                              <button 
                                style={{ background: '#f36d44', color: 'white', border: 'none', padding: '0.6rem 2.5rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}
                                onClick={() => navigate(`/student/summary/${task._id}`)}
                              >
                                VIEW RESULT
                              </button>
                            ) : (
                               <button 
                                 style={{ background: '#f36d44', color: 'white', border: 'none', padding: '0.6rem 2.5rem', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}
                                 onClick={() => navigate(`/student/quiz/${task._id}`)}
                               >
                                 ATTEMPT
                               </button>
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
             <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {days.map(day => (
                   <div key={day._id}>
                      <h3 style={{ fontSize: '1.25rem', color: '#1a365d', fontWeight: 'bold', marginBottom: '1.25rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>Day {day.dayNumber}: {day.title}</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                         {day.tasks.map(task => (
                           <div key={task._id} style={{ background: 'white', padding: '1rem 1.5rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #eee' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                 <BookOpen size={18} color="#777" />
                                 <div style={{ fontWeight: '500', color: '#333' }}>{task.title}</div>
                              </div>
                              <span style={{ fontSize: '0.7rem', color: '#666', fontWeight: 'bold', textTransform: 'uppercase', border: '1px solid #ddd', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{task.status}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                ))}
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
                      <td style={{ textAlign: 'center', color: '#f36d44', fontWeight: 'bold' }}>{att.score} / {att.exam?.questions?.length}</td>
                      <td style={{ textAlign: 'center', color: '#777' }}>{new Date(att.updatedAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                         <button onClick={() => navigate(`/student/summary/${att.exam?._id}`)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontWeight: 'bold', cursor: 'pointer' }}>View Report</button>
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
                    <button style={{ background: '#f1f5f9', border: '1px solid #ddd', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer' }} onClick={() => navigate(`/student/summary/${att.exam?._id}`)}>Review Effort</button>
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
