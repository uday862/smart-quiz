import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Users, BookOpen, Clock, AlertTriangle, X, Trash2, Play, Square, AreaChart, Download, FileText, UserMinus, UserCheck, CheckCircle, RefreshCcw, Filter, ChevronRight, Send, HelpCircle, Edit3 } from 'lucide-react';

const StatCard = ({ icon, title, value, color }) => (
  <div className="card stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <div className="stat-icon" style={{ background: color || 'var(--primary-light)', color: color ? 'white' : 'var(--primary-color)', padding: '0.75rem', borderRadius: '12px' }}>
      {React.cloneElement(icon, { size: 24 })}
    </div>
    <div>
      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{title}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{value}</div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState({ show: false, title: '', onConfirm: null });
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [taskType, setTaskType] = useState('Quiz (Multiple Choice)');
  const [tJumbleQuestions, setTJumbleQuestions] = useState([{ sentence: '', hint: '' }]);
  const [adminTab, setAdminTab] = useState('Days');
  const [days, setDays] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportFilter, setReportFilter] = useState('All');
  const [showPeopleModal, setShowPeopleModal] = useState(false);
  const [peopleResults, setPeopleResults] = useState([]);
  const [selectedTaskName, setSelectedTaskName] = useState('');
  const [fetchingPeople, setFetchingPeople] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState('');

  
  // Day Form states
  const [dNum, setDNum] = useState('');
  const [dTitle, setDTitle] = useState('');
  
  // Form states
  const [sRoll, setSRoll] = useState('');
  const [sName, setSName] = useState('');
  const [sSection, setSSection] = useState('A');
  const [sPassword, setSPassword] = useState('');

  const [tTitle, setTTitle] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tJson, setTJson] = useState('');
  const [tSqlInit, setTSqlInit] = useState('');
  const [tSqlAns, setTSqlAns] = useState('');
  const [tTestCases, setTTestCases] = useState([{ input: '', output: '' }]);
  const [tSampleIn, setTSampleIn] = useState('');
  const [tSampleOut, setTSampleOut] = useState('');
  const [tTime, setTTime] = useState(30);
  const [tAttempts, setTAttempts] = useState(1);
  const [tDayId, setTDayId] = useState('');
  const [tAllowedUsers, setTAllowedUsers] = useState([]); // Empty means all

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const confirmAction = (title, onConfirm) => {
    setShowConfirmModal({ show: true, title, onConfirm });
  };

  const handleGlobalRefresh = () => {
    fetchStudents();
    fetchDays();
    fetchReports();
  };

  useEffect(() => {
    handleGlobalRefresh();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/students`);
      const data = await res.json();
      setStudents(data);
    } catch (err) { console.error(err); } 
  };

  const fetchDays = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/days`);
      const data = await res.json();
      const uniqueDaysMap = new Map();
      data.forEach(d => {
        if (!uniqueDaysMap.has(d._id)) {
           const uniqueTasksMap = new Map();
           (d.tasks || []).forEach(t => { if (!uniqueTasksMap.has(t._id)) uniqueTasksMap.set(t._id, t); });
           uniqueDaysMap.set(d._id, { ...d, tasks: Array.from(uniqueTasksMap.values()) });
        }
      });
      const cleanedDays = Array.from(uniqueDaysMap.values());
      setDays(cleanedDays);
      if (cleanedDays.length > 0 && !tDayId) setTDayId(cleanedDays[0]._id);
    } catch (err) { console.error(err); }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/attempts/summary/detailed`);
      const data = await res.json();
      setReports(data);
    } catch (err) { console.error(err); }
  };

  const handleShowPeople = async (taskId, taskTitle) => {
    setSelectedTaskName(taskTitle);
    setShowPeopleModal(true);
    setFetchingPeople(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/attempts/task/${taskId}`);
      const data = await res.json();
      
      const bestMap = new Map();
      data.filter(a => a.status === 'completed').forEach(a => {
         const sId = a.student?._id || a.student;
         const existing = bestMap.get(sId);
         if (!existing || a.score > existing.score) {
           bestMap.set(sId, a);
         }
      });
      setPeopleResults(Array.from(bestMap.values()));
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingPeople(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    if (!newAdminPassword) return;
    try {
      const activeUser = JSON.parse(localStorage.getItem('user'));
      const res = await fetch(`${API_BASE_URL}/api/auth/update-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUser.id, newPassword: newAdminPassword })
      });
      if (res.ok) {
        showToast('Password Updated Successfully');
        setShowSettingsModal(false);
        setNewAdminPassword('');
      }
    } catch (err) { showToast('Update failed', 'error'); }
  };



  const handeDayCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/days`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayNumber: String(dNum), title: dTitle })
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || data.message || 'Module creation failed', 'error'); return; }
      await fetchDays();
      setShowDayModal(false);
      setDNum(''); setDTitle('');
      showToast('Module Created Successfully!');
    } catch (err) { showToast('Network error: ' + err.message, 'error'); }
  };

  const handleOpenTaskForDay = (dayId) => {
    setEditingTask(null);
    setTDayId(dayId);
    setTTitle(''); setTDesc(''); setTJson(''); setTTime(30); setTAttempts(1);
    setShowTaskModal(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setTDayId(task.dayId);
    setTTitle(task.title);
    setTTime(task.time_limit);
    setTAttempts(task.attempt_limit || 1);
    setTAllowedUsers(task.allowedUsers || []);
    
    if (task.questions && task.questions[0]?.type === 'Coding') {
      setTaskType('Lab (Coding Problem)');
      setTDesc(task.questions[0].text);
    } else if (task.questions && task.questions[0]?.type === 'SQL') {
      setTaskType('SQL (Practice Environment)');
      setTDesc(task.questions[0].text);
      if (task.questions[0].test_cases && task.questions[0].test_cases.length > 0) {
          setTTestCases(task.questions[0].test_cases);
      } else {
          setTTestCases([{ input: task.questions[0].sql_init || '', output: task.questions[0].correct_answer || '' }]);
      }
      setTSampleIn(task.questions[0].sample_input || '');
      setTSampleOut(task.questions[0].sample_output || '');
    } else if (task.questions && task.questions.some(q => q.type === 'Jumble')) {
      const hasJumble = task.questions.some(q => q.type === 'Jumble');
      const hasMCQ = task.questions.some(q => q.type === 'MCQ');
      if (hasJumble && hasMCQ) {
        // Mixed task
        setTaskType('Mixed (Quiz + Jumble)');
        const mcqQs = task.questions.filter(q => q.type === 'MCQ').map(q => ({ q: q.text, options: q.options, ans: q.correct_answer }));
        const jumbleQs = task.questions.filter(q => q.type === 'Jumble').map(q => {
          let answer = q.correct_answer;
          try { answer = JSON.parse(q.correct_answer); } catch(e) {}
          return { hint: q.text, keywords: q.words || [], answer: Array.isArray(answer) ? answer : [] };
        });
        setTJson(JSON.stringify({ mcq: mcqQs, jumble: jumbleQs }, null, 2));
      } else {
        // Pure Jumble (Keywords)
        setTaskType('Jumble (Keywords)');
        const jqs = task.questions.map(q => {
          let answer = q.correct_answer;
          try { answer = JSON.parse(q.correct_answer); } catch(e) {}
          return { hint: q.text, keywords: q.words || [], answer: Array.isArray(answer) ? answer : [] };
        });
        setTJson(JSON.stringify(jqs, null, 2));
      }
    } else {
      setTaskType('Quiz (Multiple Choice)');
      const formattedQuestions = (task.questions || []).map(q => ({
        q: q.text, options: q.options, ans: q.correct_answer
      }));
      setTJson(JSON.stringify(formattedQuestions, null, 2));
    }
    setShowTaskModal(true);
  };

  const handleFillSample = () => {
    if (taskType.includes('Mixed')) {
      const sample = {
        mcq: [
          { q: "Which keyword creates an object in Java?", options: ["class", "new", "this", "super"], ans: "new" },
          { q: "What does OOP stand for?", options: ["Object Oriented Programming", "Open Object Process", "Ordered Output Protocol", "None"], ans: "Object Oriented Programming" },
          { q: "Which data type stores true/false?", options: ["int", "char", "boolean", "String"], ans: "boolean" }
        ],
        jumble: [
          { hint: "Form a valid Java class declaration:", keywords: ["Main", "class", "{", "}", "public"], answer: ["public", "class", "Main", "{", "}"] },
          { hint: "Form a Java print statement:", keywords: ["\"Hello\"", "println", "System.out.", ";", "(", ")"], answer: ["System.out.", "println", "(", "\"Hello\"", ")", ";"] },
          { hint: "Form a for-loop header:", keywords: ["int i=0", "i++", "i<10", "for", "(", ";", ";", ")"], answer: ["for", "(", "int i=0", ";", "i<10", ";", "i++", ")"] }
        ]
      };
      setTJson(JSON.stringify(sample, null, 2));
      setTTitle("Java Mixed Challenge");
    } else if (taskType.includes('Jumble')) {
      const sample = [
        { hint: "Form a valid Java class declaration:", keywords: ["Main", "class", "{", "}", "public"], answer: ["public", "class", "Main", "{", "}"] },
        { hint: "Form a correct if-statement:", keywords: ["condition", "if", "(", ")", "{", "}"], answer: ["if", "(", "condition", ")", "{", "}"] },
        { hint: "Form a Java print statement:", keywords: ["\"Hello\"", "println", "System.out.", ";", "(", ")"], answer: ["System.out.", "println", "(", "\"Hello\"", ")", ";"] }
      ];
      setTJson(JSON.stringify(sample, null, 2));
      setTTitle("Java Syntax Keywords");
    } else if (taskType.includes('Quiz')) {
      const sample = [
        { q: "Which Java keyword is used to create an object?", options: ["class", "new", "this", "super"], ans: "new" },
        { q: "What is the default value of a boolean in Java?", options: ["true", "false", "null", "0"], ans: "false" },
        { q: "Which method is the entry point of a Java program?", options: ["start()", "main()", "run()", "init()"], ans: "main()" }
      ];
      setTJson(JSON.stringify(sample, null, 2));
      setTTitle("Basic Java Fundamentals");
    } else {
      setTDesc("Write a Java program to reverse a string without using external libraries.");
      setTTitle("String Reversal Lab");
    }
    showToast("Sample Data Loaded!");
  };

  const handleRestartDay = async (dayId) => {
    confirmAction('Restart all smart tasks for this day?', async () => {
       try {
         await fetch(`${API_BASE_URL}/api/days/${dayId}/restart`, { method: 'PUT' });
         fetchDays();
         showToast('Curriculum Day Restarted');
         setShowConfirmModal({ show: false });
       } catch(err) { showToast('Restart failed', 'error'); }
    });
  };

  const handleStopTask = async (taskId) => {
    try {
      await fetch(`${API_BASE_URL}/api/exams/${taskId}/stop`, { method: 'POST' });
      fetchDays();
      showToast('Task Locked');
    } catch(err) { showToast('Stop failed', 'error'); }
  };

  const handleStartTask = async (taskId) => {
    try {
       await fetch(`${API_BASE_URL}/api/exams/${taskId}/start`, { method: 'POST' });
       fetchDays();
       showToast('Task Promoted to Live');
    } catch(err) { showToast('Start failed', 'error'); }
  };

  const handleStudentSave = async (e) => {
    e.preventDefault();
    try {
      const method = editingStudent ? 'PUT' : 'POST';
      const url = editingStudent ? `${API_BASE_URL}/api/students/${editingStudent._id}` : `${API_BASE_URL}/api/students`;
      const payload = { roll_no: sRoll, name: sName, section: sSection };
      if (sPassword) payload.password = sPassword;

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || data.message || 'Save Failed', 'error');
        return;
      }
      await fetchStudents();
      closeModals();
      showToast(editingStudent ? 'Metadata Updated' : 'Entity Registered');
    } catch (err) { showToast('Network Error: ' + err.message, 'error'); }
  };

  const handleDeleteStudent = async (id) => {
    confirmAction('Permanently purge this student account?', async () => {
      try {
        await fetch(`${API_BASE_URL}/api/students/${id}`, { method: 'DELETE' });
        fetchStudents();
        showToast('Record Purged');
        setShowConfirmModal({ show: false });
      } catch (err) { showToast('Delete failed', 'error'); }
    });
  };

  const handleDeleteTask = async (id) => {
     confirmAction('Purge this task from curriculum?', async () => {
        try {
          await fetch(`${API_BASE_URL}/api/exams/${id}`, { method: 'DELETE' });
          fetchDays();
          showToast('Task Purged Permanently');
          setShowConfirmModal({ show: false });
        } catch (err) { showToast('Delete failed', 'error'); }
     });
  };

  const handleTaskSave = async (e) => {
    e.preventDefault();
    try {
      let questions = [];
      if (taskType.includes('Lab')) {
        questions = [{ type: 'Coding', text: tDesc, marks: 1 }];
      } else if (taskType.includes('SQL')) {
        questions = [{ type: 'SQL', text: tDesc, test_cases: tTestCases, sample_input: tSampleIn, sample_output: tSampleOut, marks: 100 }];
      } else if (taskType.includes('Jumble')) {
        let jParsed;
        try { jParsed = JSON.parse(tJson); } catch(e) { showToast('Invalid JSON — check Jumble format', 'error'); return; }
        if (!Array.isArray(jParsed) || jParsed.length === 0) { showToast('Jumble JSON must be a non-empty array', 'error'); return; }
        const invalid = jParsed.find(q => !Array.isArray(q.keywords) || !Array.isArray(q.answer) || q.keywords.length < 2 || q.answer.length < 2);
        if (invalid) { showToast('Each Jumble needs "keywords" and "answer" arrays with 2+ items', 'error'); return; }
        questions = jParsed.map(q => ({
          type: 'Jumble',
          text: q.hint || 'Arrange the keywords in the correct order:',
          words: q.keywords,
          correct_answer: JSON.stringify(q.answer),
          marks: q.marks || 1
        }));
      } else if (taskType.includes('Mixed')) {
        let mixedParsed;
        try { mixedParsed = JSON.parse(tJson); } catch(e) { showToast('Invalid JSON — check Mixed format', 'error'); return; }
        if (!mixedParsed.mcq && !mixedParsed.jumble) { showToast('Mixed JSON must have "mcq" and/or "jumble" keys', 'error'); return; }
        const mcqQs = (mixedParsed.mcq || []).map(q => ({ type: 'MCQ', text: q.q || q.text, options: q.options, correct_answer: q.ans || q.correct_answer, marks: 1 }));
        const jumbleQs = (mixedParsed.jumble || []).map(q => ({
          type: 'Jumble',
          text: q.hint || 'Arrange the keywords:',
          words: q.keywords || [],
          correct_answer: JSON.stringify(q.answer || []),
          marks: q.marks || 1
        }));
        questions = [...mcqQs, ...jumbleQs];
      } else {
        const parsed = JSON.parse(tJson);
        const qArray = Array.isArray(parsed) ? parsed : [parsed];
        questions = qArray.map(q => ({
          type: 'MCQ', text: q.q || q.text, options: q.options, correct_answer: q.ans || q.correct_answer, marks: 1
        }));
      }

      const method = editingTask ? 'PUT' : 'POST';
      const url = editingTask ? `${API_BASE_URL}/api/exams/${editingTask._id}` : `${API_BASE_URL}/api/exams`;

      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ dayId: tDayId, title: tTitle, time_limit: tTime, attempt_limit: tAttempts, questions, allowedUsers: tAllowedUsers })
      });
      if (res.ok) {
        fetchDays(); closeModals();
        showToast(editingTask ? 'Task Configuration Updated' : 'Topic Dispatched Successfully');
      } else {
        const errData = await res.json();
        showToast(errData.error || errData.message || 'Operation Rejected', 'error');
      }
    } catch (err) { showToast('JSON Format Breach - Please check syntax: ' + err.message, 'error'); }
  };

  const getFilteredReports = () => {
    // 1. Group by student + exam and find the best attempt
    const bestAttemptsMap = new Map();
    
    reports.forEach(r => {
      const studentId = r.student?._id || r.student;
      const examId = r.exam?._id || r.exam;
      const key = `${studentId}_${examId}`;
      
      const existing = bestAttemptsMap.get(key);
      if (!existing || r.score > existing.score) {
        bestAttemptsMap.set(key, r);
      }
    });

    const bestReports = Array.from(bestAttemptsMap.values());

    // 2. Apply title filter
    if (reportFilter === 'All') return bestReports;
    return bestReports.filter(r => r.exam?.title === reportFilter);
  };


  const getTaskStats = () => {
    const statsMap = new Map();
    reports.forEach(r => {
      const title = r.exam?.title || 'Unknown';
      if (!statsMap.has(title)) statsMap.set(title, { count: 0, total: 0 });
      const current = statsMap.get(title);
      current.count += 1;
      current.total += r.score;
    });
    return Array.from(statsMap.entries()).map(([name, data]) => ({
      name, count: data.count, avg: (data.total / data.count).toFixed(1)
    }));
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setSRoll(student.roll_no); setSName(student.name); setSSection(student.section);
    setShowStudentModal(true);
  };

  const closeModals = () => {
    setShowStudentModal(false); setShowTaskModal(false); setShowDayModal(false);
    setEditingStudent(null); setEditingTask(null);
    setSRoll(''); setSName(''); setSPassword(''); setTTitle(''); setTDesc(''); setTJson(''); setTTestCases([{ input: '', output: '' }]); setTSqlInit(''); setTSqlAns(''); setTSampleIn(''); setTSampleOut(''); setTAttempts(1); setTTime(30);
    setTAllowedUsers([]);
    setTJumbleQuestions([{ sentence: '', hint: '' }]);
  };

  const handleDownloadReport = () => {
    const data = getFilteredReports();
    if (data.length === 0) return showToast('No data to download', 'error');

    const headers = ['Student Name', 'Roll No', 'Task Name', 'Score', 'Status', 'Date'];
    const rows = data.map(r => [
      r.student?.name,
      r.student?.roll_no,
      r.exam?.title,
      r.score,
      'Completed',
      new Date(r.createdAt).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `report_${reportFilter}_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container">
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '900', letterSpacing: '-1.5px', color: '#071125' }}>SMART QUIZ <span style={{ color: '#f36d44' }}>PRO</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Enterprise Knowledge Assessment System</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" title="Account Settings" onClick={() => setShowSettingsModal(true)}><RefreshCcw size={16} /><span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', fontWeight: 'bold' }}>Settings</span></button>
          <button className="btn btn-outline" title="Sync All Nodes" onClick={handleGlobalRefresh}><RefreshCcw size={16}/></button>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setShowDayModal(true)}><Plus size={16}/> New Module</button>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => { setEditingStudent(null); setShowStudentModal(true); }}><Users size={16}/> Add Student</button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <StatCard icon={<Users />} title="Live Students" value={students.length} />
        <StatCard icon={<AreaChart />} title="Assessments" value={reports.length} color="#3b82f6" />
        <StatCard icon={<CheckCircle size={24} />} title="System Engine" value="Healthy" color="#16a34a" />
        <StatCard icon={<AlertTriangle />} title="Network Latency" value="Stable" />
      </div>

      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '2rem' }}>
        {['Days', 'Students', 'Reports'].map(tab => (
           <button 
             key={tab} onClick={() => setAdminTab(tab)} 
             style={{ background: 'transparent', border: 'none', borderBottom: adminTab === tab ? '3px solid #f36d44' : 'none', padding: '0.75rem 0', fontWeight: 'bold', cursor: 'pointer', color: adminTab === tab ? '#f36d44' : '#64748b', fontSize: '1rem' }}
           >
             {tab.toUpperCase()} SECTOR
           </button>
        ))}
      </div>

      {adminTab === 'Students' && (
        <div className="card" style={{ padding: '0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr><th style={{ padding: '1rem' }}>Roll / Unique ID</th><th>Full Name</th><th>Sec</th><th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Command</th></tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{s.roll_no}</td>
                  <td>{s.name}</td>
                  <td>{s.section}</td>
                  <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                      <button onClick={() => handleEditStudent(s)} className="btn-icon" title="Edit Profile"><Clock size={18} /></button>
                      <button onClick={() => handleDeleteStudent(s._id)} style={{ color: '#ef4444' }} className="btn-icon" title="Purge Record"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adminTab === 'Days' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {days.map(day => (
            <div key={day._id} className="card" style={{ padding: '0', borderLeft: '5px solid #071125' }}>
              <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <div style={{ padding: '0.5rem', background: '#071125', color: 'white', borderRadius: '6px', fontWeight: 'bold' }}>{day.dayNumber}</div>
                   <h3 style={{ fontWeight: '900', color: '#071125' }}>{day.title}</h3>
                 </div>
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleOpenTaskForDay(day._id)} className="btn btn-primary" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Plus size={14}/> Add Task</button>
                    <button onClick={() => handleRestartDay(day._id)} className="btn btn-outline" style={{ fontSize: '0.75rem' }}>Reset State</button>
                 </div>
              </div>
              <table style={{ width: '100%' }}>
                <thead style={{ background: '#fff' }}><tr><th style={{ paddingLeft: '1.5rem', fontSize: '0.8rem', color: '#64748b' }}>TASK FILENAME</th><th style={{ fontSize: '0.8rem', color: '#64748b' }}>ENGAGEMENT</th><th style={{ textAlign: 'right', paddingRight: '1.5rem', fontSize: '0.8rem', color: '#64748b' }}>PROTOCOL</th></tr></thead>
                <tbody>
                  {(day.tasks || []).map(t => (
                    <tr key={t._id} style={{ borderTop: '1px solid #f8fafc' }}>
                      <td style={{ paddingLeft: '1.5rem', fontWeight: 'bold' }}>{t.title}</td>
                      <td><span style={{ fontSize: '0.7rem', fontWeight: '900', color: t.status === 'running' ? '#16a34a' : '#ef4444', textTransform: 'uppercase' }}>{t.status}</span></td>
                          <td style={{ position: 'sticky', right: 0, background: 'white', zIndex: 10, textAlign: 'right', paddingRight: '2rem', minWidth: '280px' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'center', overflowX: 'auto', whiteSpace: 'nowrap', padding: '0.25rem 0' }}>
                          <button onClick={() => handleShowPeople(t._id, t.title)} className="btn-icon" title="View Results" style={{padding: '0.4rem'}}><Users size={20} color="#f36d44" /></button>
                          <button onClick={() => handleEditTask(t)} className="btn-icon" title="Edit Config" style={{padding: '0.4rem'}}><Edit3 size={20} color="#64748b" /></button>
                          {t.status === 'running' ? (
                            <button onClick={() => handleStopTask(t._id)} title="Stop Task" style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '0.5rem 0.75rem', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: '⏹️ STOP', gap: '0.25rem' }}>
                              <Square size={16} /> STOP
                            </button>
                          ) : (
                            <button onClick={() => handleStartTask(t._id)} title="Launch for Students" style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)', color: 'white', border: 'none', borderRadius: '8px', padding: '0.6rem 1rem', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Play size={16} /> LAUNCH
                            </button>
                          )}
                          <button onClick={() => handleDeleteTask(t._id)} title="Delete" style={{ color: '#ef4444', background: 'none', border: 'none', padding: '0.5rem', cursor: 'pointer' }}><Trash2 size={20} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {adminTab === 'Reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {getTaskStats().map((s, i) => (
                <div key={i} className="card" style={{ borderLeft: '4px solid #f36d44', background: '#fff' }}>
                   <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>{s.name}</div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#071125' }}>{s.count} Subjects</div>
                      <div style={{ padding: '0.3rem 0.6rem', background: '#f36d44', color: 'white', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>AVG {s.avg}</div>
                   </div>
                </div>
              ))}
           </div>
           <div className="card" style={{ padding: '0' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ fontWeight: '900', color: '#071125' }}>Attempt Audit History</h3>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button onClick={handleDownloadReport} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #16a34a', color: '#16a34a' }}>
                    <Download size={16} /> Download CSV
                  </button>
                  <Filter size={18} color="#f36d44" />
                  <select value={reportFilter} onChange={e => setReportFilter(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                     <option value="All">All Operations</option>
                     {getTaskStats().map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
               </div>
            </div>
            <table style={{ width: '100%', textAlign: 'left' }}>
              <thead><tr style={{ background: '#f8fafc' }}><th style={{ padding: '1rem' }}>Principal Subject</th><th>Target Task</th><th>Performance</th><th>Status</th><th>Timestamp</th></tr></thead>
              <tbody>
                {getFilteredReports().map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '900', color: '#071125' }}>{r.student?.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>REG: {r.student?.roll_no}</div>
                    </td>
                    <td style={{ fontWeight: 'bold' }}>{r.exam?.title}</td>
                    <td style={{ fontWeight: '900', color: '#f36d44' }}>{r.score} PTS</td>
                    <td><span style={{ color: '#16a34a', fontSize: '0.65rem', fontWeight: '900', background: '#f0fdf4', padding: '0.2rem 0.6rem', borderRadius: '10px' }}>INTACT</span></td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showConfirmModal.show && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', border: '2px solid #ef4444' }}>
             <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: '1rem' }} />
             <h2 style={{ marginBottom: '0.5rem', fontWeight: '900', color: '#071125' }}>Critical Protocol</h2>
             <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{showConfirmModal.title}</p>
             <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={showConfirmModal.onConfirm} className="btn btn-primary" style={{ flex: 1, background: '#ef4444' }}>Confirm Execution</button>
                <button onClick={() => setShowConfirmModal({ show: false })} className="btn" style={{ flex: 1 }}>Abort</button>
             </div>
          </div>
        </div>
      )}

      {showStudentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: '1.5rem', fontWeight: '900', color: '#071125' }}>{editingStudent ? 'Update Metadata' : 'Student Onboarding'}</h2>
            <form onSubmit={handleStudentSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input value={sRoll} onChange={e => setSRoll(e.target.value)} placeholder="Registration Number" className="input-field" required />
              <input value={sName} onChange={e => setSName(e.target.value)} placeholder="Full Subject Name" className="input-field" required />
              <input value={sSection} onChange={e => setSSection(e.target.value)} placeholder="Sector Assignment" className="input-field" required />
              <input value={sPassword} onChange={e => setSPassword(e.target.value)} type="password" placeholder={editingStudent ? "Change Auth Token" : "Initial Pin"} className="input-field" required={!editingStudent} />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                 <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingStudent ? 'Save delta' : 'Onboard Now'}</button>
                 <button type="button" onClick={closeModals} className="btn" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>

            {/* Fixed Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
               <h2 style={{ fontWeight: '900', color: '#071125', margin: 0 }}>{editingTask ? 'Edit Task Configuration' : 'Dispatch Smart Task'}</h2>
               <button onClick={handleFillSample} className="btn btn-outline" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><HelpCircle size={14}/> Java Sample</button>
            </div>

            <form onSubmit={handleTaskSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

              {/* Scrollable Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b' }}>MODULE SECTOR</label>
                    <select value={tDayId} onChange={e => setTDayId(e.target.value)} className="input-field" required>
                      {days.map(d => <option key={d._id} value={d._id}>Day {d.dayNumber}: {d.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b' }}>TASK CATEGORY</label>
                    <select value={taskType} onChange={e => setTaskType(e.target.value)} className="input-field">
                      <option>Quiz (Multiple Choice)</option>
                      <option>Lab (Coding Problem)</option>
                      <option>SQL (Practice Environment)</option>
                      <option>Jumble (Keywords)</option>
                      <option>Mixed (Quiz + Jumble)</option>
                    </select>
                  </div>
                </div>

                <input value={tTitle} onChange={e => setTTitle(e.target.value)} placeholder="Operation Headline (e.g. Java Arrays)" className="input-field" required />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b' }}>TIME LIMIT (MINS)</label>
                    <input type="number" value={tTime} onChange={e => setTTime(e.target.value)} className="input-field" required />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b' }}>MAX ATTEMPTS</label>
                    <input type="number" value={tAttempts} onChange={e => setTAttempts(e.target.value)} className="input-field" required />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>TARGET AUDIENCE (Empty = All Students)</label>
                  <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.5rem' }}>
                     <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={tAllowedUsers.length === 0} onChange={() => setTAllowedUsers([])} />
                        <span style={{ fontWeight: 'bold' }}>All Students</span>
                     </label>
                     {students.map(s => (
                       <label key={s._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={tAllowedUsers.includes(s._id)}
                            onChange={(e) => {
                              if (e.target.checked) setTAllowedUsers([...tAllowedUsers, s._id]);
                              else setTAllowedUsers(tAllowedUsers.filter(id => id !== s._id));
                            }}
                          />
                          <span style={{ fontSize: '0.85rem' }}>{s.roll_no} - {s.name}</span>
                       </label>
                     ))}
                  </div>
                </div>

                {taskType.includes('SQL') ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <textarea placeholder="SQL Problem Statement (e.g. Find all users...)" value={tDesc} onChange={e => setTDesc(e.target.value)} className="input-field" style={{ height: '80px', fontFamily: 'sans-serif' }} required />
                    <textarea placeholder="Sample Input Table (Visible to Student)&#10;e.g. users table:&#10;id | name&#10;1  | John" value={tSampleIn} onChange={e => setTSampleIn(e.target.value)} className="input-field" style={{ height: '80px', fontFamily: 'monospace' }} />
                    <textarea placeholder="Sample Expected Output (Visible to Student)&#10;e.g. &#10;name&#10;John" value={tSampleOut} onChange={e => setTSampleOut(e.target.value)} className="input-field" style={{ height: '80px', fontFamily: 'monospace' }} />
                    {tTestCases.map((tc, index) => (
                        <div key={index} style={{ border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '4px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                               <h4 style={{ margin: 0, color: '#334155' }}>Hidden Test Case {index + 1}</h4>
                               {tTestCases.length > 1 && (
                                 <button type="button" onClick={() => setTTestCases(tTestCases.filter((_, i) => i !== index))} style={{ color: 'red', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 'bold' }}>Remove</button>
                               )}
                            </div>
                            <textarea placeholder="Database Architecture / Inserts (HIDDEN)&#10;e.g. CREATE TABLE users...;" value={tc.input} onChange={e => {
                                const newTc = [...tTestCases]; newTc[index].input = e.target.value; setTTestCases(newTc);
                            }} className="input-field" style={{ height: '80px', fontFamily: 'monospace', borderLeft: '4px solid #ef4444' }} required />
                            <textarea placeholder="Expected target: Valid SQL OR Literal JSON Array&#10;e.g. [{&quot;name&quot;: &quot;John&quot;}]" value={tc.output} onChange={e => {
                                const newTc = [...tTestCases]; newTc[index].output = e.target.value; setTTestCases(newTc);
                            }} className="input-field" style={{ height: '60px', fontFamily: 'monospace', borderLeft: '4px solid #ef4444' }} required />
                        </div>
                    ))}
                    <button type="button" onClick={() => setTTestCases([...tTestCases, { input: '', output: '' }])} style={{ background: '#3b82f6', color: 'white', padding: '0.5rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+ Add Another Test Case</button>
                  </div>
                ) : taskType.includes('Jumble') ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Info Banner */}
                    <div style={{ padding: '0.85rem 1rem', background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '1px solid #c4b5fd', borderRadius: '10px', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.5rem' }}>🔤</span>
                      <div style={{ fontSize: '0.8rem', color: '#5b21b6' }}>
                        <div style={{ fontWeight: '900', marginBottom: '0.35rem' }}>Jumble (Keywords) — Word Tile Quiz</div>
                        <div style={{ opacity: 0.85, lineHeight: 1.5 }}>Students see scrambled keyword chips and click to arrange them in the correct order. Great for code syntax, sequences and vocabulary.</div>
                      </div>
                    </div>

                    {/* Sample JSON format */}
                    <div style={{ background: '#1e1b4b', borderRadius: '8px', padding: '0.85rem 1rem', fontSize: '0.72rem', fontFamily: 'monospace', color: '#c4b5fd', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{`[
  {
    "hint": "Form a valid Java class declaration:",
    "keywords": ["Main", "class", "{", "}", "public"],
    "answer": ["public", "class", "Main", "{", "}"]
  }
]`}</div>

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => {
                        const sample = JSON.stringify([
                          { hint: "Form a valid Java class declaration:", keywords: ["Main", "class", "{", "}", "public"], answer: ["public", "class", "Main", "{", "}"] },
                          { hint: "Form the correct if-statement keyword order:", keywords: ["condition", "if", "(", ")", "{"], answer: ["if", "(", "condition", ")", "{"] }
                        ], null, 2);
                        setTJson(sample);
                        setTTitle('Java Syntax Keywords');
                        showToast('Sample Keywords JSON loaded!');
                      }} style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)', color: 'white', border: 'none', padding: '0.45rem 1.1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', boxShadow: '0 2px 8px rgba(124,58,237,0.35)' }}>
                        📋 Load Sample
                      </button>
                    </div>

                    <textarea
                      placeholder={`Paste your JSON here...\n[\n  {\n    "hint": "Arrange these keywords:",\n    "keywords": ["B", "A", "C"],\n    "answer": ["A", "B", "C"]\n  }\n]`}
                      value={tJson}
                      onChange={e => setTJson(e.target.value)}
                      className="input-field"
                      style={{ height: '240px', fontFamily: 'monospace', fontSize: '0.8rem', borderLeft: '3px solid #7c3aed' }}
                      required
                    />

                    {/* Live Preview */}
                    {(() => {
                      try {
                        const parsed = JSON.parse(tJson);
                        if (!Array.isArray(parsed) || parsed.length === 0) return null;
                        return (
                          <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', maxHeight: '260px', overflowY: 'auto' }}>
                            <div style={{ padding: '0.5rem 1rem', background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: 'white', fontSize: '0.72rem', fontWeight: '900', letterSpacing: '0.5px' }}>🔤 KEYWORD PREVIEW — {parsed.length} question(s)</div>
                            {parsed.map((q, qi) => (
                              <div key={qi} style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: '900', color: '#5b21b6', marginBottom: '0.5rem' }}>Q{qi+1}: {q.hint}</div>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '0.3rem', textTransform: 'uppercase', fontWeight: '700' }}>Keyword Pool (scrambled):</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.6rem' }}>
                                  {(q.keywords||[]).map((kw, ki) => <span key={ki} style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)', color: 'white', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', boxShadow: '0 2px 5px rgba(124,58,237,0.25)' }}>{kw}</span>)}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: '#16a34a', marginBottom: '0.3rem', textTransform: 'uppercase', fontWeight: '700' }}>✅ Correct Answer:</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                  {(q.answer||[]).map((kw, ki) => <span key={ki} style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>{ki+1}. {kw}</span>)}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      } catch(e) { return null; }
                    })()}
                  </div>

                ) : taskType.includes('Mixed') ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Info Banner */}
                    <div style={{ padding: '0.85rem 1rem', background: 'linear-gradient(135deg, #fff7ed, #fef3c7)', border: '1px solid #fcd34d', borderRadius: '10px', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.5rem' }}>🎯</span>
                      <div style={{ fontSize: '0.8rem', color: '#92400e' }}>
                        <div style={{ fontWeight: '900', marginBottom: '0.35rem' }}>Mixed (Quiz + Jumble) — Combined Question Task</div>
                        <div style={{ opacity: 0.85, lineHeight: 1.5 }}>Combines MCQ quiz questions and keyword jumble questions in one task. Use a single JSON with <code style={{ background: '#fde68a', padding: '0 4px', borderRadius: '3px' }}>"mcq"</code> and <code style={{ background: '#fde68a', padding: '0 4px', borderRadius: '3px' }}>"jumble"</code> keys.</div>
                      </div>
                    </div>

                    {/* Format reference */}
                    <div style={{ background: '#1e1b4b', borderRadius: '8px', padding: '0.85rem 1rem', fontSize: '0.72rem', fontFamily: 'monospace', color: '#c4b5fd', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{`{
  "mcq": [
    { "q": "What does OOP stand for?", "options": ["A", "B", "C", "D"], "ans": "A" }
  ],
  "jumble": [
    { "hint": "Form a Java print statement:", "keywords": ["\"Hello\"", "println", "System.out.", ";"], "answer": ["System.out.", "println", "\"Hello\"", ";"] }
  ]
}`}</div>

                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button type="button" onClick={() => {
                        const sample = JSON.stringify({
                          mcq: [
                            { q: 'Which keyword creates an object in Java?', options: ['class', 'new', 'this', 'super'], ans: 'new' },
                            { q: 'What is the output of: System.out.println(2+3)?', options: ['23', '5', 'error', 'null'], ans: '5' }
                          ],
                          jumble: [
                            { hint: 'Form a valid Java print statement:', keywords: ['"Hello"', 'println', 'System.out.', ';', '(', ')'], answer: ['System.out.', 'println', '(', '"Hello"', ')', ';'] },
                            { hint: 'Form the for-loop header:', keywords: ['int i=0', 'i++', 'i<10', 'for', '(', ')'], answer: ['for', '(', 'int i=0', 'i<10', 'i++', ')'] }
                          ]
                        }, null, 2);
                        setTJson(sample);
                        setTTitle('Java Mixed Challenge');
                        showToast('Sample Mixed JSON loaded!');
                      }} style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: 'white', border: 'none', padding: '0.45rem 1.1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', boxShadow: '0 2px 8px rgba(245,158,11,0.35)' }}>
                        📋 Load Sample
                      </button>
                    </div>

                    <textarea
                      placeholder={`{ "mcq": [...], "jumble": [...] }`}
                      value={tJson}
                      onChange={e => setTJson(e.target.value)}
                      className="input-field"
                      style={{ height: '280px', fontFamily: 'monospace', fontSize: '0.8rem', borderLeft: '3px solid #f59e0b' }}
                      required
                    />

                    {/* Live Preview for Mixed */}
                    {(() => {
                      try {
                        const parsed = JSON.parse(tJson);
                        const mcqList = parsed.mcq || [];
                        const jumbleList = parsed.jumble || [];
                        if (mcqList.length === 0 && jumbleList.length === 0) return null;
                        return (
                          <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', maxHeight: '280px', overflowY: 'auto' }}>
                            <div style={{ padding: '0.5rem 1rem', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: 'white', fontSize: '0.72rem', fontWeight: '900' }}>🎯 MIXED PREVIEW — {mcqList.length} MCQ + {jumbleList.length} Jumble</div>
                            {mcqList.map((q, qi) => (
                              <div key={`mcq-${qi}`} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', background: '#fffbeb' }}>
                                <span style={{ background: '#f59e0b', color: 'white', fontSize: '0.65rem', fontWeight: '900', padding: '0.1rem 0.4rem', borderRadius: '3px', marginRight: '0.5rem' }}>MCQ</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1e293b' }}>{q.q}</span>
                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                                  {(q.options||[]).map((opt, oi) => <span key={oi} style={{ background: opt === q.ans ? '#d1fae5' : '#f1f5f9', border: '1px solid', borderColor: opt === q.ans ? '#86efac' : '#e2e8f0', color: opt === q.ans ? '#15803d' : '#64748b', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: opt === q.ans ? '700' : '500' }}>{opt === q.ans ? '✓ ' : ''}{opt}</span>)}
                                </div>
                              </div>
                            ))}
                            {jumbleList.map((q, qi) => (
                              <div key={`jmb-${qi}`} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', background: '#faf5ff' }}>
                                <span style={{ background: '#7c3aed', color: 'white', fontSize: '0.65rem', fontWeight: '900', padding: '0.1rem 0.4rem', borderRadius: '3px', marginRight: '0.5rem' }}>JUMBLE</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1e293b' }}>{q.hint}</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.4rem' }}>
                                  {(q.keywords||[]).map((kw, ki) => <span key={ki} style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)', color: 'white', padding: '0.2rem 0.55rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700' }}>{kw}</span>)}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      } catch(e) { return null; }
                    })()}
                  </div>

                ) : (
                  <textarea placeholder={taskType.includes('Lab') ? "Assessment requirements..." : "JSON Questions format..."} value={taskType.includes('Lab') ? tDesc : tJson} onChange={e => taskType.includes('Lab') ? setTDesc(e.target.value) : setTJson(e.target.value)} className="input-field" style={{ height: '150px', fontFamily: 'monospace' }} required />
                )}

              </div>{/* end scrollable body */}

              {/* Fixed Footer Buttons — always visible */}
              <div style={{ display: 'flex', gap: '1rem', padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#fff', flexShrink: 0 }}>
                 <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingTask ? 'Update Assessment' : 'Launch Task'}</button>
                 <button type="button" onClick={closeModals} className="btn" style={{ flex: 1 }}>Abort</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {showDayModal && (
        <div className="modal-overlay">
          <div className="modal-content">
             <h2 style={{ marginBottom: '1.5rem', fontWeight: '900', color: '#071125' }}>Insert Curriculum Node</h2>
             <form onSubmit={handeDayCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input placeholder="Sector ID" value={dNum} onChange={e => setDNum(e.target.value)} className="input-field" required />
                <input placeholder="Sector Subject" value={dTitle} onChange={e => setDTitle(e.target.value)} className="input-field" required />
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                   <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Insert Node</button>
                   <button type="button" onClick={() => setShowDayModal(false)} className="btn" style={{ flex: 1 }}>Cancel</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {toast.show && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', padding: '1.25rem 2.5rem', background: toast.type === 'success' ? '#16a34a' : '#ef4444', color: 'white', borderRadius: '8px', fontWeight: '900', zIndex: 9999, boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
          {toast.message}
        </div>
      )}

      {showPeopleModal && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ maxWidth: '850px', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 2rem', background: '#071125', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Enrollment Audit: {selectedTaskName}</h3>
              <X onClick={() => setShowPeopleModal(false)} style={{ cursor: 'pointer' }} size={24}/>
            </div>
            
            <div style={{ padding: '2rem', maxHeight: '70vh', overflowY: 'auto' }}>
              {fetchingPeople ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Polling Data Source...</div>
              ) : peopleResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No successful attempts detected in logs.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>REG ID</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>PRINCIPAL</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>SCORE</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>DURATION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {peopleResults.map((p, i) => {
                      const dur = Math.round((new Date(p.updatedAt) - new Date(p.start_time)) / 1000 / 60);
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.student?.roll_no || 'N/A'}</td>
                          <td style={{ padding: '1rem' }}>{p.student?.name || 'Unknown'}</td>
                          <td style={{ padding: '1rem', textAlign: 'center', color: '#f36d44', fontWeight: '900' }}>{p.score}</td>
                          <td style={{ padding: '1rem', textAlign: 'right', color: '#64748b' }}>{dur}m</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ padding: '1.5rem 2rem', background: '#f8fafc', textAlign: 'right', borderTop: '1px solid #eee' }}>
              <button onClick={() => setShowPeopleModal(false)} className="btn btn-primary">Dismiss</button>
            </div>
          </div>
        </div>
      )}
      {showSettingsModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '1.5rem', fontWeight: '900', color: '#071125' }}>Account Settings</h2>
            <form onSubmit={handleUpdateSettings}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>NEW ADMIN PASSWORD</label>
                <input 
                  type="password" 
                  value={newAdminPassword} 
                  onChange={e => setNewAdminPassword(e.target.value)} 
                  className="input-field" 
                  placeholder="Enter new password"
                  required 
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Update Credentials</button>
                <button type="button" onClick={() => setShowSettingsModal(false)} className="btn" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
