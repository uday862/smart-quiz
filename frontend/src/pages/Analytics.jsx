import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, TrendingUp, Trophy, AlertTriangle } from 'lucide-react';

const Analytics = () => {
  const [stats, setStats] = useState({ totalAttempts: 0, totalFlags: 0, topScore: 0, avgScore: 0 });
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentDetails, setStudentDetails] = useState({ attempts: [], permittedTasks: [] });
  const [loadingStudent, setLoadingStudent] = useState(false);

  const [chartData, setChartData] = useState({ marksData: [], attemptsData: [] });

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [statsRes, studentsRes, attRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/attempts/stats`),
          fetch(`${API_BASE_URL}/api/students`),
          fetch(`${API_BASE_URL}/api/attempts/summary/detailed`)
        ]);
        setStats(await statsRes.json());
        setStudents(await studentsRes.json());
        
        const allAttempts = await attRes.json();
        
        // Calculate Marks Data
        const marksCount = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
        allAttempts.forEach(a => {
          const score = a.score || 0;
          let maxMarks = 100;
          if (a.exam?.questions) {
            maxMarks = a.exam.questions[0]?.type === 'SQL' ? 100 : a.exam.questions.length;
          }
          const percentage = (score / maxMarks) * 100;
          
          if (percentage <= 20) marksCount['0-20']++;
          else if (percentage <= 40) marksCount['21-40']++;
          else if (percentage <= 60) marksCount['41-60']++;
          else if (percentage <= 80) marksCount['61-80']++;
          else marksCount['81-100']++;
        });
        
        const mData = Object.keys(marksCount).map(k => ({ range: k, students: marksCount[k] }));
        
        // Calculate Attempts Over Time
        const timeCount = {};
        allAttempts.forEach(a => {
           const d = new Date(a.createdAt);
           const hour = d.getHours();
           const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
           timeCount[timeLabel] = (timeCount[timeLabel] || 0) + 1;
        });
        const aData = Object.keys(timeCount).sort().map(k => ({ time: k, attempts: timeCount[k] }));
        if (aData.length === 0) aData.push({ time: 'N/A', attempts: 0 }); // Fallback
        
        setChartData({ marksData: mData, attemptsData: aData });

      } catch (e) {
        console.error(e);
      }
    };
    fetchInit();
  }, []);

  useEffect(() => {
    if (!selectedStudentId) {
      setStudentDetails({ attempts: [], permittedTasks: [] });
      return;
    }
    const fetchStudentData = async () => {
      setLoadingStudent(true);
      try {
        const [attRes, dayRes, grpRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/attempts/student/${selectedStudentId}`),
          fetch(`${API_BASE_URL}/api/days`),
          fetch(`${API_BASE_URL}/api/groups`)
        ]);
        const attempts = await attRes.json();
        const days = await dayRes.json();
        const groups = await grpRes.json();

        // Find groups the student is in
        const myGroupIds = groups.filter(g => (g.members || []).some(m => (m._id || m) === selectedStudentId)).map(g => g._id);

        // Find all active permitted tasks
        const pTasks = [];
        days.filter(d => !d.isDeleted).forEach(d => {
          (d.tasks || []).filter(t => !t.isDeleted).forEach(t => {
            const hasUserRes = (t.allowedUsers || []).length > 0;
            const hasGrpRes = (t.allowedGroups || []).length > 0;
            let hasAccess = false;
            if (!hasUserRes && !hasGrpRes) hasAccess = true;
            if (hasUserRes && t.allowedUsers.some(id => String(id) === String(selectedStudentId))) hasAccess = true;
            if (hasGrpRes && t.allowedGroups.some(g => myGroupIds.some(mg => String(mg) === String(g._id || g)))) hasAccess = true;
            if (hasAccess) pTasks.push(t);
          });
        });

        setStudentDetails({ attempts, permittedTasks: pTasks });
      } catch (e) { console.error(e); }
      setLoadingStudent(false);
    };
    fetchStudentData();
  }, [selectedStudentId]);

  const { marksData, attemptsData } = chartData;

  return (
    <div className="page-container">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>Day-wise Analytics</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Performance insights and reports</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select className="input-field" style={{ width: 'auto' }}>
            <option>Today</option>
            <option>Yesterday</option>
            <option>Last 7 Days</option>
          </select>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <DashboardCard icon={<Calendar size={24} />} title="Total Attempts" value={stats.totalAttempts} />
        <DashboardCard icon={<TrendingUp size={24} />} title="Average Score" value={stats.avgScore} />
        <DashboardCard icon={<Trophy size={24} />} title="Highest Score" value={stats.topScore} color="var(--success-color)" />
        <DashboardCard icon={<AlertTriangle size={24} />} title="Total Flags" value={stats.totalFlags} color="var(--danger-color)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ height: '350px' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: '600' }}>Marks Distribution</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={marksData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="range" stroke="var(--text-secondary)" tick={{fontSize: 12}} />
              <YAxis stroke="var(--text-secondary)" tick={{fontSize: 12}} />
              <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="students" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ height: '350px' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: '600' }}>Attempts Over Time</h3>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={attemptsData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="var(--text-secondary)" tick={{fontSize: 12}} />
              <YAxis stroke="var(--text-secondary)" tick={{fontSize: 12}} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Line type="monotone" dataKey="attempts" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Student Breakdown Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: '600', margin: 0 }}>Detailed Student Breakdown</h3>
          <select 
             value={selectedStudentId} 
             onChange={(e) => setSelectedStudentId(e.target.value)}
             className="input-field" 
             style={{ width: '300px' }}
          >
            <option value="">-- Select a Student --</option>
            {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.roll_no})</option>)}
          </select>
        </div>
        
        {selectedStudentId && !loadingStudent && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '1rem', color: '#64748b', fontWeight: 'bold' }}>Task Name</th>
                  <th style={{ padding: '1rem', color: '#64748b', fontWeight: 'bold' }}>Status</th>
                  <th style={{ padding: '1rem', color: '#64748b', fontWeight: 'bold' }}>Score</th>
                  <th style={{ padding: '1rem', color: '#64748b', fontWeight: 'bold' }}>Attempts Count</th>
                </tr>
              </thead>
              <tbody>
                {studentDetails.permittedTasks.map(task => {
                  // Find attempt for this task
                  const attemptsForTask = studentDetails.attempts.filter(a => (a.exam?._id || a.exam) === task._id);
                  const isAttempted = attemptsForTask.length > 0;
                  const isCompleted = attemptsForTask.some(a => a.status === 'completed');
                  const bestAttempt = attemptsForTask.sort((a,b) => b.score - a.score)[0];
                  
                  return (
                    <tr key={task._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{task.title}</td>
                      <td style={{ padding: '1rem' }}>
                        {isCompleted ? <span style={{ color: '#16a34a', fontWeight: 'bold' }}>Completed</span> :
                         isAttempted ? <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Attempting</span> :
                         <span style={{ color: '#94a3b8' }}>Not Attempted</span>}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 'bold', color: isCompleted ? '#f36d44' : '#94a3b8' }}>
                        {isCompleted ? `${bestAttempt.score} / ${task.questions?.[0]?.type === 'SQL' ? 100 : task.questions?.length || 1}` : '-'}
                      </td>
                      <td style={{ padding: '1rem', color: '#64748b' }}>
                        {attemptsForTask.length > 0 ? attemptsForTask.length : '-'}
                      </td>
                    </tr>
                  );
                })}
                {studentDetails.permittedTasks.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No tasks assigned to this student.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {selectedStudentId && loadingStudent && (
           <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading student data...</div>
        )}
        {!selectedStudentId && (
           <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>Select a student from the dropdown to view their detailed performance breakdown.</div>
        )}
      </div>

    </div>
  );
};

const DashboardCard = ({ icon, title, value, color = 'var(--primary-color)' }) => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ color: color, marginBottom: '0.75rem', background: '#f1f5f9', padding: '0.75rem', borderRadius: '50%' }}>
      {icon}
    </div>
    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{value}</div>
    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>{title}</div>
  </div>
);

export default Analytics;
