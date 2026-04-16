import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config';
import { io } from 'socket.io-client';
import { ShieldAlert, Star, Monitor, UserCheck, Clock } from 'lucide-react';
import { useParams } from 'react-router-dom';

const socket = io(`${API_BASE_URL}`);

const LiveMonitoring = () => {
  const { taskId } = useParams();
  const [liveData, setLiveData] = useState([]);

  useEffect(() => {
    const fetchAttempts = async () => {
      if (!taskId) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/attempts/task/${taskId}`);
        const data = await res.json();
        
        const uniqueMap = new Map();
        data.forEach(att => {
           const studentId = att.student?._id || att.student;
           if (!uniqueMap.has(studentId)) {
             uniqueMap.set(studentId, {
               id: studentId,
               roll: att.student?.roll_no || 'N/A',
               name: att.student?.name || 'Unknown',
               marks: att.score || 0,
               ip: att.ipAddress || 'unknown',
               status: att.status,
               updatedAt: att.updatedAt
             });
           }
        });
        setLiveData(Array.from(uniqueMap.values()));
      } catch (e) { console.error(e); }
    };
    fetchAttempts();

    socket.on('admin_dashboard_update', (update) => {
      if (update.refresh) { fetchAttempts(); return; }
      setLiveData(prev => {
        // Find existing student record
        const exists = prev.find(s => s.id === update.id);
        if (exists) {
           // If update is 'completed', it overrides 'attempting'
           return prev.map(s => s.id === update.id ? { 
             ...s, 
             ...update, 
             status: update.status || s.status,
             // Ensure marks update correctly
             marks: update.marks !== undefined ? update.marks : s.marks
           } : s);
        }
        return [...prev, { ...update, status: update.status || 'attempting' }];
      });
    });
    return () => socket.off('admin_dashboard_update');
  }, [taskId]);

  return (
    <div className="page-container">
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#071125', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Monitor size={32} /> Attempt Audit Log
          </h1>
          <p style={{ color: '#64748b' }}>Secure tracking of student task submissions</p>
        </div>
        <div style={{ padding: '0.5rem 1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '0.85rem' }}>
          SESSION SECURE
        </div>
      </header>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#071125', color: 'white' }}>
              <th style={{ padding: '1rem 1.5rem' }}>Student Detail</th>
              <th>Current Status</th>
              <th style={{ textAlign: 'center' }}>Official Score</th>
              <th>IP Audit</th>
              <th>Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {liveData.map(student => (
              <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1.25rem 1.5rem' }}>
                   <div style={{ fontWeight: '900', color: '#071125' }}>{student.name}</div>
                   <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Roll: {student.roll}</div>
                </td>
                <td>
                  <span style={{ 
                    padding: '0.3rem 0.8rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '900', textTransform: 'uppercase',
                    background: student.status === 'completed' ? '#f0fdf4' : '#eff6ff',
                    color: student.status === 'completed' ? '#16a34a' : '#3b82f6',
                    border: `1px solid ${student.status === 'completed' ? '#bcf0da' : '#bfdbfe'}`
                  }}>
                    {student.status === 'completed' ? 'Finalized' : 'In Progress'}
                  </span>
                </td>
                <td style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: '900', color: '#f36d44' }}>
                  {student.status === 'completed' ? student.marks : '—'}
                </td>
                <td style={{ fontFamily: 'monospace', color: '#94a3b8', fontSize: '0.85rem' }}>{student.ip}</td>
                <td style={{ color: '#64748b', fontSize: '0.85rem' }}>
                  {new Date(student.updatedAt).toLocaleTimeString()}
                </td>
              </tr>
            ))}
            {liveData.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
                  No active session data found for this task.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LiveMonitoring;
