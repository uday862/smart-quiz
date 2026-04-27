import React, { useState, useEffect, useRef } from 'react';
import API_BASE_URL from '../config';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Users, BookOpen, Clock, AlertTriangle, X, Trash2, Play, Square,
  AreaChart, Download, FileText, UserCheck, CheckCircle, RefreshCcw,
  Filter, Send, HelpCircle, Edit3, Upload, User, Layers, ChevronDown,
  ChevronRight, Eye, Settings, LogOut, Search
} from 'lucide-react';

/* ─────────── Stat Card ─────────── */
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

/* ─────────── Badge ─────────── */
const Badge = ({ children, color = '#3b82f6' }) => (
  <span style={{ background: color + '20', color, border: `1px solid ${color}50`, padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.68rem', fontWeight: '800' }}>
    {children}
  </span>
);

/* ─────────── Avatar ─────────── */
const Avatar = ({ name, color = '#3b82f6', size = 36 }) => {
  const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: size * 0.35, flexShrink: 0 }}>
      {initials}
    </div>
  );
};

const GROUP_COLORS = ['#3b82f6','#f36d44','#16a34a','#7c3aed','#dc2626','#d97706','#0891b2','#be185d'];

/* ══════════════════════════════════════════════════════════════════════ */
const AdminDashboard = () => {
  const navigate = useNavigate();

  /* ─── Core State ─── */
  const [students, setStudents] = useState([]);
  const [days, setDays] = useState([]);
  const [reports, setReports] = useState([]);
  const [groups, setGroups] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminTab, setAdminTab] = useState('Days');

  /* ─── Toast ─── */
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (msg, type = 'success') => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  /* ─── Confirm Modal ─── */
  const [showConfirmModal, setShowConfirmModal] = useState({ show: false, title: '', onConfirm: null });
  const confirmAction = (title, onConfirm) => setShowConfirmModal({ show: true, title, onConfirm });

  /* ─── Search ─── */
  const [studentSearch, setStudentSearch] = useState('');

  /* ─── Module (Day) states ─── */
  const [expandedDays, setExpandedDays] = useState(new Set());
  const [showDayModal, setShowDayModal] = useState(false);
  const [showEditDayModal, setShowEditDayModal] = useState(false);
  const [editingDay, setEditingDay] = useState(null);
  const [dNum, setDNum] = useState('');
  const [dTitle, setDTitle] = useState('');
  const [dEditNum, setDEditNum] = useState('');
  const [dEditTitle, setDEditTitle] = useState('');

  /* ─── Task states ─── */
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskType, setTaskType] = useState('Quiz (Multiple Choice)');
  const [tTitle, setTTitle] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tJson, setTJson] = useState('');
  const [tTime, setTTime] = useState(30);
  const [tAttempts, setTAttempts] = useState(1);
  const [tDayId, setTDayId] = useState('');
  const [tAllowedUsers, setTAllowedUsers] = useState([]);
  const [tAllowedGroups, setTAllowedGroups] = useState([]);
  const [tAssignMode, setTAssignMode] = useState('all'); // 'all' | 'students' | 'groups'
  const [tTestCases, setTTestCases] = useState([{ input: '', output: '' }]);
  const [tSampleIn, setTSampleIn] = useState('');
  const [tSampleOut, setTSampleOut] = useState('');

  /* ─── Student / Profile states ─── */
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileStudent, setProfileStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [sRoll, setSRoll] = useState('');
  const [sName, setSName] = useState('');
  const [sSection, setSSection] = useState('A');
  const [sCourse, setSCourse] = useState('');
  const [sBatch, setSBatch] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sPassword, setSPassword] = useState('');

  /* ─── Excel Upload ─── */
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  /* ─── Group states ─── */
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [gName, setGName] = useState('');
  const [gDesc, setGDesc] = useState('');
  const [gColor, setGColor] = useState('#3b82f6');
  const [gMembers, setGMembers] = useState([]);
  const [showGroupTab, setShowGroupTab] = useState('info'); // 'info' | 'members'

  /* ─── Reports ─── */
  const [reportFilter, setReportFilter] = useState('All');

  /* ─── People / Results modal ─── */
  const [showPeopleModal, setShowPeopleModal] = useState(false);
  const [peopleResults, setPeopleResults] = useState([]);
  const [selectedTaskName, setSelectedTaskName] = useState('');
  const [fetchingPeople, setFetchingPeople] = useState(false);

  /* ─── Settings ─── */
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState('');

  /* ─── Create Admin Modal ─── */
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');

  /* ══════════ Data Fetch ══════════ */
  const fetchStudents = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/students`);
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const fetchDays = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/days`);
      const data = await res.json();
      const uniqueMap = new Map();
      data.forEach(d => {
        if (!uniqueMap.has(d._id)) {
          const taskMap = new Map();
          (d.tasks || []).forEach(t => { if (!taskMap.has(t._id)) taskMap.set(t._id, t); });
          uniqueMap.set(d._id, { ...d, tasks: Array.from(taskMap.values()) });
        }
      });
      const cleaned = Array.from(uniqueMap.values());
      setDays(cleaned);
      if (cleaned.length > 0 && !tDayId) setTDayId(cleaned[0]._id);
    } catch (err) { console.error(err); }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/attempts/summary/detailed`);
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/groups`);
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/admins`);
      const data = await res.json();
      setAdminUsers(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const handleGlobalRefresh = () => {
    fetchStudents(); fetchDays(); fetchReports(); fetchGroups(); fetchAdmins();
  };

  useEffect(() => { handleGlobalRefresh(); }, []);

  /* ══════════ Module (Day) Handlers ══════════ */
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
      setShowDayModal(false); setDNum(''); setDTitle('');
      showToast('Module Created Successfully!');
    } catch (err) { showToast('Network error: ' + err.message, 'error'); }
  };

  const handleUpdateDay = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/days/${editingDay._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayNumber: String(dEditNum), title: dEditTitle })
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || data.message || 'Update failed', 'error'); return; }
      fetchDays(); setShowEditDayModal(false); setEditingDay(null);
      showToast('Module Updated!');
    } catch (err) { showToast('Update failed: ' + err.message, 'error'); }
  };

  const handleDeleteDay = (dayId) => {
    confirmAction('Delete this entire module and ALL its tasks permanently?', async () => {
      try {
        await fetch(`${API_BASE_URL}/api/days/${dayId}`, { method: 'DELETE' });
        setDays(prev => prev.filter(d => d._id !== dayId));
        showToast('Module Deleted');
        setShowConfirmModal({ show: false });
      } catch (err) { showToast('Delete failed', 'error'); }
    });
  };

  const handleRestartDay = (dayId) => {
    confirmAction('Restart all tasks for this day?', async () => {
      try {
        await fetch(`${API_BASE_URL}/api/days/${dayId}/restart`, { method: 'PUT' });
        fetchDays(); showToast('Day Restarted');
        setShowConfirmModal({ show: false });
      } catch (err) { showToast('Restart failed', 'error'); }
    });
  };

  const toggleDayCollapse = (dayId) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId); else next.add(dayId);
      return next;
    });
  };

  /* ══════════ Task Handlers ══════════ */
  const handleOpenTaskForDay = (dayId) => {
    setEditingTask(null);
    setTDayId(dayId); setTTitle(''); setTDesc(''); setTJson('');
    setTTime(30); setTAttempts(1); setTAllowedUsers([]); setTAllowedGroups([]);
    setTAssignMode('all'); setTaskType('Quiz (Multiple Choice)');
    setTTestCases([{ input: '', output: '' }]); setTSampleIn(''); setTSampleOut('');
    setShowTaskModal(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setTDayId(task.dayId);
    setTTitle(task.title);
    setTTime(task.time_limit);
    setTAttempts(task.attempt_limit || 1);
    const au = task.allowedUsers || [];
    const ag = task.allowedGroups || [];
    setTAllowedUsers(au);
    setTAllowedGroups(ag);
    if (ag.length > 0) setTAssignMode('groups');
    else if (au.length > 0) setTAssignMode('students');
    else setTAssignMode('all');

    if (task.questions?.[0]?.type === 'Coding') {
      setTaskType('Lab (Coding Problem)'); setTDesc(task.questions[0].text);
    } else if (task.questions?.[0]?.type === 'SQL') {
      setTaskType('SQL (Practice Environment)'); setTDesc(task.questions[0].text);
      setTTestCases(task.questions[0].test_cases?.length > 0 ? task.questions[0].test_cases : [{ input: task.questions[0].sql_init || '', output: task.questions[0].correct_answer || '' }]);
      setTSampleIn(task.questions[0].sample_input || ''); setTSampleOut(task.questions[0].sample_output || '');
    } else if (task.questions?.some(q => q.type === 'Jumble')) {
      const hasJumble = task.questions.some(q => q.type === 'Jumble');
      const hasMCQ = task.questions.some(q => q.type === 'MCQ');
      if (hasJumble && hasMCQ) {
        setTaskType('Mixed (Quiz + Jumble)');
        const mcqQs = task.questions.filter(q => q.type === 'MCQ').map(q => ({ q: q.text, options: q.options, ans: q.correct_answer }));
        const jumbleQs = task.questions.filter(q => q.type === 'Jumble').map(q => {
          let answer = q.correct_answer; try { answer = JSON.parse(q.correct_answer); } catch (e) {}
          return { hint: q.text, keywords: q.words || [], answer: Array.isArray(answer) ? answer : [] };
        });
        setTJson(JSON.stringify({ mcq: mcqQs, jumble: jumbleQs }, null, 2));
      } else {
        setTaskType('Jumble (Keywords)');
        const jqs = task.questions.map(q => {
          let answer = q.correct_answer; try { answer = JSON.parse(q.correct_answer); } catch (e) {}
          return { hint: q.text, keywords: q.words || [], answer: Array.isArray(answer) ? answer : [] };
        });
        setTJson(JSON.stringify(jqs, null, 2));
      }
    } else {
      setTaskType('Quiz (Multiple Choice)');
      setTJson(JSON.stringify((task.questions || []).map(q => ({ q: q.text, options: q.options, ans: q.correct_answer })), null, 2));
    }
    setShowTaskModal(true);
  };

  const handleTaskSave = async (e) => {
    e.preventDefault();
    try {
      let questions = [];
      if (taskType.includes('Lab')) {
        questions = [{ type: 'Coding', text: tDesc, marks: 1 }];
      } else if (taskType.includes('SQL')) {
        questions = [{ type: 'SQL', text: tDesc, test_cases: tTestCases, sample_input: tSampleIn, sample_output: tSampleOut, marks: 100 }];
      } else if (taskType.includes('Jumble') && !taskType.includes('Mixed')) {
        let jParsed;
        try { jParsed = JSON.parse(tJson); } catch (e) { showToast('Invalid JSON', 'error'); return; }
        if (!Array.isArray(jParsed) || jParsed.length === 0) { showToast('Jumble JSON must be a non-empty array', 'error'); return; }
        questions = jParsed.map(q => ({ type: 'Jumble', text: q.hint || 'Arrange:', words: q.keywords, correct_answer: JSON.stringify(q.answer), marks: q.marks || 1 }));
      } else if (taskType.includes('Mixed')) {
        let m; try { m = JSON.parse(tJson); } catch (e) { showToast('Invalid JSON', 'error'); return; }
        const mcqQs = (m.mcq || []).map(q => ({ type: 'MCQ', text: q.q || q.text, options: q.options, correct_answer: q.ans || q.correct_answer, marks: 1 }));
        const jumbleQs = (m.jumble || []).map(q => ({ type: 'Jumble', text: q.hint || 'Arrange:', words: q.keywords || [], correct_answer: JSON.stringify(q.answer || []), marks: q.marks || 1 }));
        questions = [...mcqQs, ...jumbleQs];
      } else {
        const parsed = JSON.parse(tJson);
        const qArray = Array.isArray(parsed) ? parsed : [parsed];
        questions = qArray.map(q => ({ type: 'MCQ', text: q.q || q.text, options: q.options, correct_answer: q.ans || q.correct_answer, marks: 1 }));
      }

      const allowedUsers = tAssignMode === 'students' ? tAllowedUsers : [];
      const allowedGroups = tAssignMode === 'groups' ? tAllowedGroups : [];

      const method = editingTask ? 'PUT' : 'POST';
      const url = editingTask ? `${API_BASE_URL}/api/exams/${editingTask._id}` : `${API_BASE_URL}/api/exams`;
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayId: tDayId, title: tTitle, time_limit: tTime, attempt_limit: tAttempts, questions, allowedUsers, allowedGroups })
      });
      if (res.ok) {
        fetchDays(); closeTaskModal();
        showToast(editingTask ? 'Task Updated' : 'Task Created');
      } else {
        const err = await res.json();
        showToast(err.error || err.message || 'Failed', 'error');
      }
    } catch (err) { showToast('JSON Error: ' + err.message, 'error'); }
  };

  const handleDeleteTask = (id) => {
    confirmAction('Delete this task permanently?', async () => {
      try {
        await fetch(`${API_BASE_URL}/api/exams/${id}`, { method: 'DELETE' });
        fetchDays(); showToast('Task Deleted');
        setShowConfirmModal({ show: false });
      } catch (err) { showToast('Delete failed', 'error'); }
    });
  };

  const handleStartTask = async (taskId) => {
    try { await fetch(`${API_BASE_URL}/api/exams/${taskId}/start`, { method: 'POST' }); fetchDays(); showToast('Task is LIVE'); }
    catch (err) { showToast('Start failed', 'error'); }
  };

  const handleStopTask = async (taskId) => {
    try { await fetch(`${API_BASE_URL}/api/exams/${taskId}/stop`, { method: 'POST' }); fetchDays(); showToast('Task Stopped'); }
    catch (err) { showToast('Stop failed', 'error'); }
  };

  const closeTaskModal = () => {
    setShowTaskModal(false); setEditingTask(null);
    setTTitle(''); setTDesc(''); setTJson(''); setTTime(30); setTAttempts(1);
    setTAllowedUsers([]); setTAllowedGroups([]); setTAssignMode('all');
    setTTestCases([{ input: '', output: '' }]); setTSampleIn(''); setTSampleOut('');
  };

  /* ══════════ Student Handlers ══════════ */
  const handleStudentSave = async (e) => {
    e.preventDefault();
    try {
      const method = editingStudent ? 'PUT' : 'POST';
      const url = editingStudent ? `${API_BASE_URL}/api/students/${editingStudent._id}` : `${API_BASE_URL}/api/students`;
      const payload = { roll_no: sRoll, name: sName, section: sSection, course: sCourse, batch: sBatch, phone: sPhone, email: sEmail };
      if (sPassword) payload.password = sPassword;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || data.message || 'Save Failed', 'error'); return; }
      await fetchStudents();
      closeStudentModal();
      showToast(editingStudent ? 'Student Updated' : 'Student Registered');
    } catch (err) { showToast('Network Error: ' + err.message, 'error'); }
  };

  const handleDeleteStudent = (id) => {
    confirmAction('Permanently delete this student account?', async () => {
      try {
        await fetch(`${API_BASE_URL}/api/students/${id}`, { method: 'DELETE' });
        fetchStudents(); showToast('Student Deleted');
        setShowConfirmModal({ show: false });
        if (showProfileModal) setShowProfileModal(false);
      } catch (err) { showToast('Delete failed', 'error'); }
    });
  };

  const openEditStudent = (s) => {
    setEditingStudent(s);
    setSRoll(s.roll_no || ''); setSName(s.name || ''); setSSection(s.section || '');
    setSCourse(s.course || ''); setSBatch(s.batch || ''); setSPhone(s.phone || '');
    setSEmail(s.email || ''); setSPassword('');
    setShowStudentModal(true);
  };

  const closeStudentModal = () => {
    setShowStudentModal(false); setEditingStudent(null);
    setSRoll(''); setSName(''); setSSection('A'); setSCourse(''); setSBatch('');
    setSPhone(''); setSEmail(''); setSPassword('');
  };

  const openStudentProfile = (s) => { setProfileStudent(s); setShowProfileModal(true); };

  /* ─── Excel Upload ─── */
  const handleExcelUpload = async (file) => {
    if (!file) return;
    setUploading(true); setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE_URL}/api/students/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      setUploadResult(data);
      if (res.ok) { fetchStudents(); showToast(data.message); }
      else showToast(data.message || 'Upload failed', 'error');
    } catch (err) { showToast('Upload error: ' + err.message, 'error'); }
    finally { setUploading(false); }
  };

  const downloadTemplate = () => {
    const csv = 'roll_no,name,section,course,batch,phone,email,password\n22CS001,Alice Johnson,A,B.Tech CSE,2022-26,9876543210,alice@example.com,alice123\n22CS002,Bob Smith,B,B.Tech CSE,2022-26,9876543211,bob@example.com,bob123';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'student_upload_template.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  /* ══════════ Group Handlers ══════════ */
  const openCreateGroup = () => {
    setEditingGroup(null); setGName(''); setGDesc('');
    setGColor(GROUP_COLORS[groups.length % GROUP_COLORS.length]);
    setGMembers([]); setShowGroupTab('info'); setShowGroupModal(true);
  };

  const openEditGroup = (g) => {
    setEditingGroup(g); setGName(g.name); setGDesc(g.description || '');
    setGColor(g.color || '#3b82f6');
    setGMembers((g.members || []).map(m => m._id || m));
    setShowGroupTab('info'); setShowGroupModal(true);
  };

  const handleGroupSave = async (e) => {
    e.preventDefault();
    try {
      const method = editingGroup ? 'PUT' : 'POST';
      const url = editingGroup ? `${API_BASE_URL}/api/groups/${editingGroup._id}` : `${API_BASE_URL}/api/groups`;
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: gName, description: gDesc, color: gColor, members: gMembers })
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || 'Failed', 'error'); return; }
      fetchGroups(); setShowGroupModal(false);
      showToast(editingGroup ? 'Group Updated' : 'Group Created');
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  };

  const handleDeleteGroup = (id) => {
    confirmAction('Delete this group? Students will NOT be deleted.', async () => {
      try {
        await fetch(`${API_BASE_URL}/api/groups/${id}`, { method: 'DELETE' });
        fetchGroups(); showToast('Group Deleted');
        setShowConfirmModal({ show: false });
      } catch (err) { showToast('Delete failed', 'error'); }
    });
  };

  /* ══════════ Reports ══════════ */
  const handleShowPeople = async (taskId, taskTitle) => {
    setSelectedTaskName(taskTitle); setShowPeopleModal(true); setFetchingPeople(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/attempts/task/${taskId}`);
      const data = await res.json();
      const bestMap = new Map();
      data.filter(a => a.status === 'completed').forEach(a => {
        const sId = a.student?._id || a.student;
        const existing = bestMap.get(sId);
        if (!existing || a.score > existing.score) bestMap.set(sId, a);
      });
      setPeopleResults(Array.from(bestMap.values()));
    } catch (err) { console.error(err); }
    finally { setFetchingPeople(false); }
  };

  const getFilteredReports = () => {
    const bestMap = new Map();
    reports.forEach(r => {
      const key = `${r.student?._id}_${r.exam?._id}`;
      const existing = bestMap.get(key);
      if (!existing || r.score > existing.score) bestMap.set(key, r);
    });
    const best = Array.from(bestMap.values());
    if (reportFilter === 'All') return best;
    return best.filter(r => r.exam?.title === reportFilter);
  };

  const getTaskStats = () => {
    const statsMap = new Map();
    reports.forEach(r => {
      const title = r.exam?.title || 'Unknown';
      if (!statsMap.has(title)) statsMap.set(title, { count: 0, total: 0 });
      const c = statsMap.get(title); c.count++; c.total += r.score;
    });
    return Array.from(statsMap.entries()).map(([name, data]) => ({ name, count: data.count, avg: (data.total / data.count).toFixed(1) }));
  };

  const handleDownloadReport = () => {
    const data = getFilteredReports();
    if (data.length === 0) return showToast('No data to download', 'error');
    const headers = ['Student Name', 'Roll No', 'Task Name', 'Score', 'Status', 'Date'];
    const rows = data.map(r => [r.student?.name, r.student?.roll_no, r.exam?.title, r.score, 'Completed', new Date(r.createdAt).toLocaleDateString()]);
    const csv = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `report_${new Date().toLocaleDateString()}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    if (!newAdminPassword) return;
    try {
      const activeUser = JSON.parse(localStorage.getItem('user'));
      const res = await fetch(`${API_BASE_URL}/api/auth/update-password`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: activeUser.id, newPassword: newAdminPassword })
      });
      if (res.ok) { showToast('Password Updated'); setShowSettingsModal(false); setNewAdminPassword(''); }
    } catch (err) { showToast('Update failed', 'error'); }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register-admin`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAdminUser, password: newAdminPass })
      });
      const data = await res.json();
      if(res.ok) { showToast('Admin created!'); fetchAdmins(); setShowAdminModal(false); setNewAdminUser(''); setNewAdminPass(''); }
      else { showToast(data.message, 'error'); }
    } catch(err) { showToast('Error', 'error'); }
  };

  const handleDeleteAdmin = (id) => {
    confirmAction('Delete this Admin?', async () => {
      try {
        await fetch(`${API_BASE_URL}/api/auth/admins/${id}`, { method: 'DELETE' });
        fetchAdmins(); showToast('Admin Deleted'); setShowConfirmModal({ show:false });
      } catch(err) { showToast('Delete failed', 'error'); }
    });
  };

  /* ─── Sample filler ─── */
  const handleFillSample = () => {
    if (taskType.includes('Mixed')) {
      setTJson(JSON.stringify({ mcq: [{ q: 'Which keyword creates an object in Java?', options: ['class', 'new', 'this', 'super'], ans: 'new' }], jumble: [{ hint: 'Form a Java print statement:', keywords: ['"Hello"', 'println', 'System.out.', ';', '(', ')'], answer: ['System.out.', 'println', '(', '"Hello"', ')', ';'] }] }, null, 2));
      setTTitle('Java Mixed Challenge');
    } else if (taskType.includes('Jumble')) {
      setTJson(JSON.stringify([{ hint: 'Form a valid Java class declaration:', keywords: ['Main', 'class', '{', '}', 'public'], answer: ['public', 'class', 'Main', '{', '}'] }], null, 2));
      setTTitle('Java Syntax Keywords');
    } else {
      setTJson(JSON.stringify([{ q: 'Which Java keyword is used to create an object?', options: ['class', 'new', 'this', 'super'], ans: 'new' }], null, 2));
      setTTitle('Basic Java Fundamentals');
    }
    showToast('Sample data loaded!');
  };

  /* ══════════ Filtered students ══════════ */
  const filteredStudents = students.filter(s =>
    !studentSearch || s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.roll_no?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.section?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  /* ══════════ Render ══════════ */
  return (
    <div className="page-container">
      {/* ─── Header ─── */}
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '900', letterSpacing: '-1.5px', color: '#071125', margin: 0 }}>
            SMART QUIZ <span style={{ color: '#f36d44' }}>PRO</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Enterprise Knowledge Assessment System</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => setShowSettingsModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Settings size={16} /> Settings
          </button>
          <button className="btn btn-outline" onClick={handleGlobalRefresh} title="Refresh All">
            <RefreshCcw size={16} />
          </button>
          <button className="btn btn-outline" onClick={() => setShowDayModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> New Module
          </button>
          <button className="btn btn-outline" onClick={() => { setEditingStudent(null); setShowStudentModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} /> Add Student
          </button>
          <button className="btn btn-outline" onClick={() => setShowUploadModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: '#16a34a', color: '#16a34a' }}>
            <Upload size={16} /> Import Excel
          </button>
        </div>
      </header>

      {/* ─── Stat Cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <StatCard icon={<Users />} title="Total Students" value={students.length} />
        <StatCard icon={<Layers />} title="Groups" value={groups.length} color="#7c3aed" />
        <StatCard icon={<AreaChart />} title="Assessments" value={reports.length} color="#3b82f6" />
        <StatCard icon={<CheckCircle size={24} />} title="System" value="Healthy" color="#16a34a" />
      </div>

      {/* ─── Tab Nav ─── */}
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '2rem' }}>
        {['Days', 'Students', 'Groups', 'Reports', 'Admins'].map(tab => (
          <button key={tab} onClick={() => setAdminTab(tab)}
            style={{ background: 'transparent', border: 'none', borderBottom: adminTab === tab ? '3px solid #f36d44' : 'none', padding: '0.75rem 0', fontWeight: 'bold', cursor: 'pointer', color: adminTab === tab ? '#f36d44' : '#64748b', fontSize: '1rem', transition: 'color 0.2s' }}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ══════════ DAYS TAB ══════════ */}
      {adminTab === 'Days' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {days.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
              <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <div style={{ fontWeight: '700' }}>No modules yet — click "New Module" to get started</div>
            </div>
          )}
          {days.map(day => {
            const isCollapsed = !expandedDays.has(day._id);
            return (
              <div key={day._id} style={{ borderRadius: '12px', border: '1px solid #e2e8f0', borderLeft: '5px solid #071125', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', background: 'white' }}>
                {/* Module Header */}
                <div onClick={() => toggleDayCollapse(day._id)}
                  style={{ padding: '0.85rem 1.25rem', background: isCollapsed ? '#f8fafc' : 'linear-gradient(135deg,#071125,#1e3a5f)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background 0.25s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <span style={{ fontSize: '0.8rem', color: isCollapsed ? '#071125' : 'white', transition: 'transform 0.25s', display: 'inline-block', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', fontWeight: '900' }}>▼</span>
                    <div style={{ padding: '0.35rem 0.7rem', background: isCollapsed ? '#071125' : 'rgba(255,255,255,0.15)', color: 'white', borderRadius: '6px', fontWeight: '900', fontSize: '0.85rem' }}>{day.dayNumber}</div>
                    <h3 style={{ fontWeight: '900', color: isCollapsed ? '#071125' : 'white', margin: 0, fontSize: '0.95rem' }}>{day.title}</h3>
                    <span style={{ fontSize: '0.65rem', fontWeight: '700', color: isCollapsed ? '#64748b' : 'rgba(255,255,255,0.6)', background: isCollapsed ? '#f1f5f9' : 'rgba(255,255,255,0.1)', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>{(day.tasks || []).length} tasks</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleOpenTaskForDay(day._id)} style={{ background: 'linear-gradient(135deg,#f36d44,#e85d2f)', color: 'white', border: 'none', borderRadius: '7px', padding: '0.4rem 0.85rem', fontSize: '0.72rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Plus size={13} /> Add Task</button>
                    <button onClick={() => { setEditingDay(day); setDEditNum(day.dayNumber); setDEditTitle(day.title); setShowEditDayModal(true); }} style={{ background: isCollapsed ? 'white' : 'rgba(255,255,255,0.15)', color: isCollapsed ? '#064e8c' : 'white', border: isCollapsed ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.2)', borderRadius: '7px', padding: '0.4rem 0.75rem', fontSize: '0.72rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Edit3 size={13} /> Edit</button>
                    <button onClick={() => handleDeleteDay(day._id)} style={{ background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '7px', padding: '0.4rem 0.75rem', fontSize: '0.72rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Trash2 size={13} /> Delete</button>
                    <button onClick={() => handleRestartDay(day._id)} style={{ background: 'rgba(255,255,255,0.1)', color: isCollapsed ? '#64748b' : 'rgba(255,255,255,0.8)', border: isCollapsed ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.2)', borderRadius: '7px', padding: '0.4rem 0.75rem', fontSize: '0.72rem', cursor: 'pointer' }}>↺ Reset</button>
                  </div>
                </div>

                {/* Tasks */}
                <div style={{ maxHeight: isCollapsed ? '0px' : '2000px', overflow: 'hidden', transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)' }}>
                  {(day.tasks || []).length === 0 ? (
                    <div style={{ padding: '1.5rem', color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', borderTop: '1px solid #f1f5f9' }}>No tasks yet — click "Add Task"</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ background: '#f8fafc' }}>
                        <tr>
                          <th style={{ padding: '0.6rem 1.5rem', fontSize: '0.72rem', color: '#64748b', fontWeight: '900', textAlign: 'left' }}>TASK</th>
                          <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '900' }}>TYPE</th>
                          <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '900' }}>STATUS</th>
                          <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '900' }}>ACCESS</th>
                          <th style={{ textAlign: 'right', paddingRight: '1.5rem', fontSize: '0.72rem', color: '#64748b', fontWeight: '900' }}>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(day.tasks || []).map(t => {
                          const qType = t.questions?.[0]?.type;
                          const typeLabel = qType === 'SQL' ? '🗄️ SQL' : t.questions?.some(q => q.type === 'Jumble') && t.questions?.some(q => q.type === 'MCQ') ? '🎯 Mixed' : qType === 'Coding' ? '💻 Lab' : qType === 'Jumble' ? '🔤 Jumble' : '📝 Quiz';
                          const hasGroupAccess = (t.allowedGroups || []).length > 0;
                          const hasUserAccess = (t.allowedUsers || []).length > 0;
                          const accessLabel = hasGroupAccess ? `${t.allowedGroups.length} Group(s)` : hasUserAccess ? `${t.allowedUsers.length} Student(s)` : 'All';
                          const accessColor = hasGroupAccess ? '#7c3aed' : hasUserAccess ? '#f36d44' : '#16a34a';
                          return (
                            <tr key={t._id} style={{ borderTop: '1px solid #f8fafc' }}>
                              <td style={{ paddingLeft: '1.5rem', paddingTop: '0.75rem', paddingBottom: '0.75rem', fontWeight: '700', color: '#1e293b' }}>{t.title}</td>
                              <td><span style={{ fontSize: '0.68rem', fontWeight: '800', color: '#5b21b6', background: '#f5f3ff', padding: '0.2rem 0.5rem', borderRadius: '5px' }}>{typeLabel}</span></td>
                              <td><span style={{ fontSize: '0.68rem', fontWeight: '900', color: t.status === 'running' ? '#16a34a' : '#ef4444', background: t.status === 'running' ? '#f0fdf4' : '#fff1f2', padding: '0.2rem 0.6rem', borderRadius: '5px', textTransform: 'uppercase' }}>{t.status}</span></td>
                              <td><span style={{ fontSize: '0.65rem', fontWeight: '800', color: accessColor, background: accessColor + '15', padding: '0.2rem 0.5rem', borderRadius: '5px' }}>👥 {accessLabel}</span></td>
                              <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                                <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                  <button onClick={() => handleShowPeople(t._id, t.title)} className="btn-icon" title="View Results"><Users size={18} color="#f36d44" /></button>
                                  <button onClick={() => handleEditTask(t)} className="btn-icon" title="Edit Task"><Edit3 size={18} color="#64748b" /></button>
                                  {t.status === 'running' ? (
                                    <button onClick={() => handleStopTask(t._id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '0.4rem 0.7rem', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Square size={14} /> STOP</button>
                                  ) : (
                                    <button onClick={() => handleStartTask(t._id)} style={{ background: 'linear-gradient(135deg,#7c3aed,#9333ea)', color: 'white', border: 'none', borderRadius: '7px', padding: '0.4rem 0.8rem', fontWeight: 'bold', fontSize: '0.75rem', cursor: 'pointer', boxShadow: '0 2px 6px rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Play size={14} /> LAUNCH</button>
                                  )}
                                  <button onClick={() => handleDeleteTask(t._id)} style={{ color: '#ef4444', background: 'none', border: 'none', padding: '0.35rem', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════ STUDENTS TAB ══════════ */}
      {adminTab === 'Students' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder="Search by name, roll no, section..." style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.25rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', boxSizing: 'border-box' }} />
            </div>
            <button onClick={() => setShowUploadModal(true)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: '#16a34a', color: '#16a34a', whiteSpace: 'nowrap' }}>
              <Upload size={16} /> Import Excel
            </button>
            <button onClick={() => { setEditingStudent(null); setShowStudentModal(true); }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
              <Plus size={16} /> Add Student
            </button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'left', fontSize: '0.72rem', color: '#64748b', fontWeight: '900' }}>STUDENT</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '900' }}>ROLL NO</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '900' }}>SECTION</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '900' }}>COURSE</th>
                  <th style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '900' }}>GROUPS</th>
                  <th style={{ textAlign: 'right', paddingRight: '1.5rem', fontSize: '0.72rem', color: '#64748b', fontWeight: '900' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(s => {
                  const studentGroups = groups.filter(g => (g.members || []).some(m => (m._id || m) === s._id));
                  return (
                    <tr key={s._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Avatar name={s.name} color={s.avatar_color || '#3b82f6'} size={36} />
                          <div>
                            <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.9rem' }}>{s.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{s.email || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: '700', fontSize: '0.85rem' }}>{s.roll_no}</td>
                      <td><Badge color="#3b82f6">{s.section || '-'}</Badge></td>
                      <td style={{ fontSize: '0.82rem', color: '#64748b' }}>{s.course || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {studentGroups.length === 0 ? <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>No group</span> :
                            studentGroups.map(g => <Badge key={g._id} color={g.color}>{g.name}</Badge>)}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => openStudentProfile(s)} className="btn-icon" title="View Profile"><Eye size={18} color="#3b82f6" /></button>
                          <button onClick={() => openEditStudent(s)} className="btn-icon" title="Edit"><Edit3 size={18} color="#64748b" /></button>
                          <button onClick={() => handleDeleteStudent(s._id)} className="btn-icon" title="Delete" style={{ color: '#ef4444' }}><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No students found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════ GROUPS TAB ══════════ */}
      {adminTab === 'Groups' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={openCreateGroup} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> Create Group
            </button>
          </div>

          {groups.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
              <Layers size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <div style={{ fontWeight: '700' }}>No groups yet — create one to organize students</div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {groups.map(g => (
              <div key={g._id} className="card" style={{ borderTop: `4px solid ${g.color || '#3b82f6'}`, padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: '900', fontSize: '1rem', color: '#071125' }}>{g.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>{g.description || 'No description'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => openEditGroup(g)} className="btn-icon" title="Edit Group"><Edit3 size={16} color="#64748b" /></button>
                    <button onClick={() => handleDeleteGroup(g._id)} className="btn-icon" title="Delete Group" style={{ color: '#ef4444' }}><Trash2 size={16} /></button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Badge color={g.color || '#3b82f6'}>{(g.members || []).length} Members</Badge>
                </div>

                <div style={{ display: 'flex', gap: '-0.5rem' }}>
                  {(g.members || []).slice(0, 5).map((m, i) => (
                    <div key={i} style={{ marginLeft: i > 0 ? '-8px' : '0', zIndex: 5 - i, position: 'relative' }}>
                      <Avatar name={m.name || '?'} color={g.color || '#3b82f6'} size={32} />
                    </div>
                  ))}
                  {(g.members || []).length > 5 && (
                    <div style={{ marginLeft: '-8px', width: 32, height: 32, borderRadius: '50%', background: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '900', position: 'relative', zIndex: 0 }}>+{(g.members || []).length - 5}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════ REPORTS TAB ══════════ */}
      {adminTab === 'Reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {getTaskStats().map((s, i) => (
              <div key={i} className="card" style={{ borderLeft: 'none' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>{s.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#071125' }}>{s.count} Attempts</div>
                  <div style={{ padding: '0.3rem 0.6rem', background: '#f36d44', color: 'white', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>AVG {s.avg}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: '900', color: '#071125', margin: 0 }}>Attempt History</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={handleDownloadReport} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: '#16a34a', color: '#16a34a' }}>
                  <Download size={16} /> CSV
                </button>
                <select value={reportFilter} onChange={e => setReportFilter(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.85rem' }}>
                  <option value="All">All Tasks</option>
                  {getTaskStats().map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#f8fafc' }}><th style={{ padding: '1rem' }}>Student</th><th>Task</th><th>Score</th><th>Date</th></tr></thead>
              <tbody>
                {getFilteredReports().map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '700' }}>{r.student?.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{r.student?.roll_no}</div>
                    </td>
                    <td style={{ fontWeight: 'bold' }}>{r.exam?.title}</td>
                    <td style={{ fontWeight: '900', color: '#f36d44' }}>{r.score} pts</td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(r.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════ ADMINS TAB ══════════ */}
      {adminTab === 'Admins' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: '#071125', fontWeight: '900' }}>Platform Administrators</h3>
            <button onClick={() => setShowAdminModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plus size={16}/> Add Admin</button>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr><th style={{ padding: '1rem 1.25rem', textAlign: 'left', color: '#64748b' }}>NAME</th><th style={{ textAlign: 'center', color: '#64748b' }}>ROLE</th><th style={{ textAlign: 'right', paddingRight: '1.25rem', color: '#64748b' }}>ACTION</th></tr>
              </thead>
              <tbody>
                {adminUsers.map(a => (
                   <tr key={a._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                     <td style={{ padding: '1rem 1.25rem', fontWeight: 'bold' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Avatar name={a.name} color="#16a34a" size={32}/> {a.name}</div>
                     </td>
                     <td style={{ textAlign: 'center' }}><Badge color="#16a34a">Admin</Badge></td>
                     <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                        <button onClick={() => handleDeleteAdmin(a._id)} className="btn-icon" style={{ color: '#ef4444' }}><Trash2 size={16}/></button>
                     </td>
                   </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════ MODALS ══════════ */}

      {/* ─── Confirm Modal ─── */}
      {showConfirmModal.show && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center', border: '2px solid #ef4444' }}>
            <AlertTriangle size={56} color="#ef4444" style={{ marginBottom: '1rem' }} />
            <h2 style={{ fontWeight: '900', color: '#071125', marginBottom: '0.5rem' }}>Confirm Action</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{showConfirmModal.title}</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={showConfirmModal.onConfirm} className="btn btn-primary" style={{ flex: 1, background: '#ef4444' }}>Confirm</button>
              <button onClick={() => setShowConfirmModal({ show: false })} className="btn" style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Module Modal ─── */}
      {showDayModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: '1.5rem', fontWeight: '900', color: '#071125' }}>Create New Module</h2>
            <form onSubmit={handeDayCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input placeholder="Module ID (e.g. 1, 2A, Day 5)" value={dNum} onChange={e => setDNum(e.target.value)} className="input-field" required />
              <input placeholder="Module Title" value={dTitle} onChange={e => setDTitle(e.target.value)} className="input-field" required />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Module</button>
                <button type="button" onClick={() => setShowDayModal(false)} className="btn" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Edit Module Modal ─── */}
      {showEditDayModal && editingDay && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <h2 style={{ marginBottom: '1.5rem', fontWeight: '900', color: '#071125' }}>Edit Module</h2>
            <form onSubmit={handleUpdateDay} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>MODULE ID</label>
                <input value={dEditNum} onChange={e => setDEditNum(e.target.value)} className="input-field" required />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>MODULE TITLE</label>
                <input value={dEditTitle} onChange={e => setDEditTitle(e.target.value)} className="input-field" required />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                <button type="button" onClick={() => { setShowEditDayModal(false); setEditingDay(null); }} className="btn" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Student Modal (Add/Edit) ─── */}
      {showStudentModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <h2 style={{ marginBottom: '1.5rem', fontWeight: '900', color: '#071125' }}>
              {editingStudent ? 'Edit Student Profile' : 'Register New Student'}
            </h2>
            <form onSubmit={handleStudentSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>ROLL NUMBER *</label>
                  <input value={sRoll} onChange={e => setSRoll(e.target.value)} placeholder="e.g. 22CS001" className="input-field" required />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>FULL NAME *</label>
                  <input value={sName} onChange={e => setSName(e.target.value)} placeholder="Full Name" className="input-field" required />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>SECTION *</label>
                  <input value={sSection} onChange={e => setSSection(e.target.value)} placeholder="e.g. A" className="input-field" required />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>COURSE</label>
                  <input value={sCourse} onChange={e => setSCourse(e.target.value)} placeholder="e.g. B.Tech CSE" className="input-field" />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>BATCH</label>
                  <input value={sBatch} onChange={e => setSBatch(e.target.value)} placeholder="e.g. 2022-26" className="input-field" />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>PHONE</label>
                  <input value={sPhone} onChange={e => setSPhone(e.target.value)} placeholder="Phone number" className="input-field" />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>EMAIL</label>
                  <input value={sEmail} onChange={e => setSEmail(e.target.value)} placeholder="Email address" className="input-field" type="email" />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>{editingStudent ? 'NEW PASSWORD (optional)' : 'PASSWORD *'}</label>
                  <input value={sPassword} onChange={e => setSPassword(e.target.value)} type="password" placeholder={editingStudent ? 'Leave blank to keep' : 'Set password'} className="input-field" required={!editingStudent} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingStudent ? 'Save Changes' : 'Register Student'}</button>
                <button type="button" onClick={closeStudentModal} className="btn" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Student Profile Modal ─── */}
      {showProfileModal && profileStudent && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px', padding: 0, overflow: 'hidden' }}>
            {/* Profile Header */}
            <div style={{ background: 'linear-gradient(135deg,#071125,#1e3a5f)', padding: '2rem', textAlign: 'center', position: 'relative' }}>
              <button onClick={() => setShowProfileModal(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
              <Avatar name={profileStudent.name} color={profileStudent.avatar_color || '#f36d44'} size={72} />
              <h2 style={{ color: 'white', fontWeight: '900', marginTop: '0.75rem', marginBottom: '0.25rem' }}>{profileStudent.name}</h2>
              <Badge color="#f36d44">{profileStudent.roll_no}</Badge>
            </div>

            {/* Profile Details */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Section', value: profileStudent.section || '-' },
                { label: 'Course', value: profileStudent.course || '-' },
                { label: 'Batch', value: profileStudent.batch || '-' },
                { label: 'Email', value: profileStudent.email || '-' },
                { label: 'Phone', value: profileStudent.phone || '-' },
                { label: 'Status', value: profileStudent.status || 'Active' },
                { label: 'Joined', value: new Date(profileStudent.createdAt).toLocaleDateString() },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>{label}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' }}>{value}</span>
                </div>
              ))}

              {/* Groups this student belongs to */}
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Groups</div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {groups.filter(g => (g.members || []).some(m => (m._id || m) === profileStudent._id)).map(g => (
                    <Badge key={g._id} color={g.color}>{g.name}</Badge>
                  ))}
                  {groups.filter(g => (g.members || []).some(m => (m._id || m) === profileStudent._id)).length === 0 && (
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Not in any group</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', padding: '1rem 1.5rem', borderTop: '1px solid #f1f5f9' }}>
              <button onClick={() => { setShowProfileModal(false); openEditStudent(profileStudent); }} className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <Edit3 size={16} /> Edit Profile
              </button>
              <button onClick={() => handleDeleteStudent(profileStudent._id)} className="btn" style={{ flex: 1, color: '#ef4444', borderColor: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Excel Upload Modal ─── */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: '900', color: '#071125', margin: 0 }}>Import Students via Excel</h2>
              <button onClick={() => { setShowUploadModal(false); setUploadResult(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Template Download */}
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '700', color: '#15803d', fontSize: '0.85rem' }}>📄 Download Template</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Required columns: roll_no, name, section, course, batch, phone, email, password</div>
              </div>
              <button onClick={downloadTemplate} className="btn btn-outline" style={{ borderColor: '#16a34a', color: '#16a34a', fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>
                <Download size={14} /> Template
              </button>
            </div>

            {/* Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleExcelUpload(f); }}
              style={{ border: '2px dashed #cbd5e1', borderRadius: '10px', padding: '2.5rem', textAlign: 'center', cursor: 'pointer', background: '#f8fafc', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#f36d44'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}
            >
              <Upload size={36} color="#94a3b8" style={{ marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: '700', color: '#475569' }}>Click or drag & drop your Excel/CSV file</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' }}>Supports .xlsx, .xls, .csv — Max 5MB</div>
              {uploading && <div style={{ marginTop: '1rem', color: '#f36d44', fontWeight: '700' }}>⏳ Uploading & processing...</div>}
            </div>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f) handleExcelUpload(f); }} />

            {/* Upload Result */}
            {uploadResult && (
              <div style={{ marginTop: '1.25rem', background: uploadResult.created > 0 ? '#f0fdf4' : '#fff1f2', border: `1px solid ${uploadResult.created > 0 ? '#86efac' : '#fca5a5'}`, borderRadius: '10px', padding: '1rem' }}>
                <div style={{ fontWeight: '900', color: uploadResult.created > 0 ? '#15803d' : '#dc2626', marginBottom: '0.5rem' }}>{uploadResult.message}</div>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                  <span style={{ color: '#15803d' }}>✅ Created: {uploadResult.created}</span>
                  <span style={{ color: '#f59e0b' }}>⚠️ Skipped: {uploadResult.skipped}</span>
                </div>
                {uploadResult.errors?.length > 0 && (
                  <div style={{ marginTop: '0.75rem', maxHeight: '100px', overflowY: 'auto' }}>
                    {uploadResult.errors.map((e, i) => <div key={i} style={{ fontSize: '0.72rem', color: '#dc2626' }}>• {e}</div>)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Group Create/Edit Modal ─── */}
      {showGroupModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontWeight: '900', color: '#071125', margin: 0 }}>{editingGroup ? 'Edit Group' : 'Create Group'}</h2>
              <button onClick={() => setShowGroupModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              {['info', 'members'].map(t => (
                <button key={t} onClick={() => setShowGroupTab(t)} style={{ background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem', color: showGroupTab === t ? '#f36d44' : '#64748b', borderBottom: showGroupTab === t ? '2px solid #f36d44' : 'none', paddingBottom: '0.3rem', textTransform: 'uppercase' }}>
                  {t === 'info' ? 'Group Info' : `Members (${gMembers.length})`}
                </button>
              ))}
            </div>

            <form onSubmit={handleGroupSave}>
              {showGroupTab === 'info' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>GROUP NAME *</label>
                    <input value={gName} onChange={e => setGName(e.target.value)} placeholder="e.g. Section A Batch 1" className="input-field" required />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>DESCRIPTION</label>
                    <input value={gDesc} onChange={e => setGDesc(e.target.value)} placeholder="Optional description" className="input-field" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>GROUP COLOR</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {GROUP_COLORS.map(c => (
                        <button key={c} type="button" onClick={() => setGColor(c)} style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: gColor === c ? '3px solid #071125' : '2px solid transparent', cursor: 'pointer', transition: 'transform 0.15s' }} title={c} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {showGroupTab === 'members' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    {/* Select All */}
                    <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc' }}>
                      <input type="checkbox"
                        checked={gMembers.length === students.length && students.length > 0}
                        onChange={() => setGMembers(gMembers.length === students.length ? [] : students.map(s => s._id))}
                        id="selectAll"
                      />
                      <label htmlFor="selectAll" style={{ fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}>Select All ({students.length} students)</label>
                    </div>
                    {students.map(s => (
                      <label key={s._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: '1px solid #fafafa' }}>
                        <input type="checkbox"
                          checked={gMembers.includes(s._id)}
                          onChange={e => {
                            if (e.target.checked) setGMembers([...gMembers, s._id]);
                            else setGMembers(gMembers.filter(id => id !== s._id));
                          }}
                        />
                        <Avatar name={s.name} color={gColor} size={28} />
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{s.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{s.roll_no} · {s.section}</div>
                        </div>
                      </label>
                    ))}
                    {students.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No students registered yet</div>}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingGroup ? 'Save Changes' : 'Create Group'}</button>
                <button type="button" onClick={() => setShowGroupModal(false)} className="btn" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Task Modal ─── */}
      {showTaskModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '870px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
              <h2 style={{ fontWeight: '900', color: '#071125', margin: 0 }}>{editingTask ? 'Edit Task' : 'Create Task'}</h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleFillSample} className="btn btn-outline" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><HelpCircle size={14} /> Sample</button>
                <button onClick={closeTaskModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
              </div>
            </div>

            <form onSubmit={handleTaskSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>MODULE</label>
                    <select value={tDayId} onChange={e => setTDayId(e.target.value)} className="input-field" required>
                      {days.map(d => <option key={d._id} value={d._id}>Day {d.dayNumber}: {d.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>TASK TYPE</label>
                    <select value={taskType} onChange={e => setTaskType(e.target.value)} className="input-field">
                      <option>Quiz (Multiple Choice)</option>
                      <option>Lab (Coding Problem)</option>
                      <option>SQL (Practice Environment)</option>
                      <option>Jumble (Keywords)</option>
                      <option>Mixed (Quiz + Jumble)</option>
                    </select>
                  </div>
                </div>

                <input value={tTitle} onChange={e => setTTitle(e.target.value)} placeholder="Task Title" className="input-field" required />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>TIME LIMIT (MINS)</label>
                    <input type="number" value={tTime} onChange={e => setTTime(e.target.value)} className="input-field" required />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>MAX ATTEMPTS</label>
                    <input type="number" value={tAttempts} onChange={e => setTAttempts(e.target.value)} className="input-field" required />
                  </div>
                </div>

                {/* ─── ACCESS CONTROL ─── */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Task Access Control</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {[{ key: 'all', label: '🌍 All Students' }, { key: 'groups', label: '👥 By Group' }, { key: 'students', label: '👤 By Student' }].map(({ key, label }) => (
                        <button key={key} type="button" onClick={() => setTAssignMode(key)}
                          style={{ padding: '0.4rem 0.85rem', borderRadius: '6px', border: '1px solid', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer', background: tAssignMode === key ? '#071125' : 'white', color: tAssignMode === key ? 'white' : '#64748b', borderColor: tAssignMode === key ? '#071125' : '#e2e8f0', transition: 'all 0.15s' }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {tAssignMode === 'groups' && (
                    <div style={{ padding: '0.75rem 1rem', maxHeight: '160px', overflowY: 'auto' }}>
                      {groups.length === 0 ? (
                        <div style={{ color: '#94a3b8', fontSize: '0.82rem', padding: '1rem', textAlign: 'center' }}>No groups created yet. Go to the Groups tab to create one.</div>
                      ) : (
                        groups.map(g => (
                          <label key={g._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', cursor: 'pointer', borderBottom: '1px solid #fafafa' }}>
                            <input type="checkbox"
                              checked={tAllowedGroups.includes(g._id)}
                              onChange={e => {
                                if (e.target.checked) setTAllowedGroups([...tAllowedGroups, g._id]);
                                else setTAllowedGroups(tAllowedGroups.filter(id => id !== g._id));
                              }}
                            />
                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: g.color, flexShrink: 0 }} />
                            <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{g.name}</span>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>({(g.members || []).length} members)</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}

                  {tAssignMode === 'students' && (
                    <div style={{ padding: '0.75rem 1rem', maxHeight: '160px', overflowY: 'auto' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={tAllowedUsers.length === 0} onChange={() => setTAllowedUsers([])} />
                        <span style={{ fontWeight: 'bold' }}>All Students</span>
                      </label>
                      {students.map(s => (
                        <label key={s._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0', cursor: 'pointer' }}>
                          <input type="checkbox"
                            checked={tAllowedUsers.includes(s._id)}
                            onChange={e => {
                              if (e.target.checked) setTAllowedUsers([...tAllowedUsers, s._id]);
                              else setTAllowedUsers(tAllowedUsers.filter(id => id !== s._id));
                            }}
                          />
                          <span style={{ fontSize: '0.85rem' }}>{s.roll_no} — {s.name}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {tAssignMode === 'all' && (
                    <div style={{ padding: '0.75rem 1rem', color: '#16a34a', fontSize: '0.82rem', fontWeight: '600' }}>
                      ✅ Task visible to all registered students
                    </div>
                  )}
                </div>

                {/* ─── Question Content ─── */}
                {taskType.includes('SQL') ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <textarea placeholder="SQL Problem Statement" value={tDesc} onChange={e => setTDesc(e.target.value)} className="input-field" style={{ height: '80px' }} required />
                    <textarea placeholder="Sample Input Table (visible to student)" value={tSampleIn} onChange={e => setTSampleIn(e.target.value)} className="input-field" style={{ height: '70px', fontFamily: 'monospace' }} />
                    <textarea placeholder="Sample Expected Output (visible to student)" value={tSampleOut} onChange={e => setTSampleOut(e.target.value)} className="input-field" style={{ height: '70px', fontFamily: 'monospace' }} />
                    {tTestCases.map((tc, index) => (
                      <div key={index} style={{ border: '1px solid #cbd5e1', padding: '1rem', borderRadius: '8px', background: '#f8fafc' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <h4 style={{ margin: 0, color: '#334155' }}>Hidden Test Case {index + 1}</h4>
                          {tTestCases.length > 1 && <button type="button" onClick={() => setTTestCases(tTestCases.filter((_, i) => i !== index))} style={{ color: 'red', cursor: 'pointer', background: 'none', border: 'none', fontWeight: 'bold' }}>Remove</button>}
                        </div>
                        <textarea placeholder="CREATE TABLE..." value={tc.input} onChange={e => { const newTc = [...tTestCases]; newTc[index].input = e.target.value; setTTestCases(newTc); }} className="input-field" style={{ height: '70px', fontFamily: 'monospace', borderLeft: '4px solid #ef4444' }} required />
                        <textarea placeholder='Expected SQL or JSON array e.g. [{"name":"John"}]' value={tc.output} onChange={e => { const newTc = [...tTestCases]; newTc[index].output = e.target.value; setTTestCases(newTc); }} className="input-field" style={{ height: '55px', fontFamily: 'monospace', borderLeft: '4px solid #ef4444', marginTop: '0.5rem' }} required />
                      </div>
                    ))}
                    <button type="button" onClick={() => setTTestCases([...tTestCases, { input: '', output: '' }])} style={{ background: '#3b82f6', color: 'white', padding: '0.5rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+ Add Test Case</button>
                  </div>
                ) : taskType.includes('Jumble') && !taskType.includes('Mixed') ? (
                  <textarea placeholder={`[\n  {\n    "hint": "Arrange the keywords:",\n    "keywords": ["B", "A", "C"],\n    "answer": ["A", "B", "C"]\n  }\n]`} value={tJson} onChange={e => setTJson(e.target.value)} className="input-field" style={{ height: '220px', fontFamily: 'monospace', fontSize: '0.8rem', borderLeft: '3px solid #7c3aed' }} required />
                ) : taskType.includes('Mixed') ? (
                  <textarea placeholder={`{ "mcq": [...], "jumble": [...] }`} value={tJson} onChange={e => setTJson(e.target.value)} className="input-field" style={{ height: '240px', fontFamily: 'monospace', fontSize: '0.8rem', borderLeft: '3px solid #f59e0b' }} required />
                ) : (
                  <textarea placeholder={taskType.includes('Lab') ? 'Problem statement...' : `[\n  {\n    "q": "Question?",\n    "options": ["A","B","C","D"],\n    "ans": "A"\n  }\n]`} value={taskType.includes('Lab') ? tDesc : tJson} onChange={e => taskType.includes('Lab') ? setTDesc(e.target.value) : setTJson(e.target.value)} className="input-field" style={{ height: '180px', fontFamily: 'monospace' }} required />
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', background: '#fff', flexShrink: 0 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingTask ? 'Update Task' : 'Create Task'}</button>
                <button type="button" onClick={closeTaskModal} className="btn" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── People / Results Modal ─── */}
      {showPeopleModal && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ maxWidth: '850px', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 2rem', background: '#071125', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Results: {selectedTaskName}</h3>
              <X onClick={() => setShowPeopleModal(false)} style={{ cursor: 'pointer' }} size={24} />
            </div>
            <div style={{ padding: '1.5rem', maxHeight: '65vh', overflowY: 'auto' }}>
              {fetchingPeople ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>
              ) : peopleResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No completed attempts yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Roll No</th>
                      <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Score</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Duration</th>
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
            <div style={{ padding: '1rem 2rem', borderTop: '1px solid #eee', textAlign: 'right' }}>
              <button onClick={() => setShowPeopleModal(false)} className="btn btn-primary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Settings Modal ─── */}
      {showSettingsModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '1.5rem', fontWeight: '900', color: '#071125' }}>Account Settings</h2>
            <form onSubmit={handleUpdateSettings}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: '900', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>NEW ADMIN PASSWORD</label>
                <input type="password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} className="input-field" placeholder="Enter new password" required />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Update Password</button>
                <button type="button" onClick={() => setShowSettingsModal(false)} className="btn" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Admin Creation Modal ─── */}
      {showAdminModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <button className="modal-close" onClick={() => setShowAdminModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            <h2 style={{ marginBottom: '1.5rem', fontWeight: '900' }}>Create Admin</h2>
            <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>ADMIN USERNAME</label>
                  <input className="input-field" value={newAdminUser} onChange={e => setNewAdminUser(e.target.value)} required />
               </div>
               <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b' }}>PASSWORD</label>
                  <input type="password" className="input-field" value={newAdminPass} onChange={e => setNewAdminPass(e.target.value)} required />
               </div>
               <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Create Admin User</button>
            </form>
          </div>
        </div>
      )}

      {/* ─── Toast ─── */}
      {toast.show && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', padding: '1rem 2rem', background: toast.type === 'success' ? '#16a34a' : '#ef4444', color: 'white', borderRadius: '10px', fontWeight: '900', zIndex: 99999, boxShadow: '0 10px 25px rgba(0,0,0,0.25)', animation: 'slideIn 0.3s ease' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
