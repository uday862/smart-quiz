import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config';
import { Award, Download, Calendar, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

const StudentReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const activeUser = JSON.parse(localStorage.getItem('user'));
    if (!activeUser) {
      navigate('/');
      return;
    }
    setUser(activeUser);

    const fetchReports = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/attempts/student/${activeUser.id}`);
        const data = await res.json();
        setReports(data);
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [navigate]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`${user?.name || 'Student'} - Performance Report`, 20, 30);
    doc.setFontSize(12);
    doc.text(`Roll No: ${user?.roll_no || 'N/A'} | Generated: ${new Date().toLocaleDateString()}`, 20, 45);

    let yPos = 70;
    reports.forEach((report, idx) => {
      doc.text(`${idx + 1}. ${report.exam?.title || 'Task'}`, 20, yPos);
      doc.text(`Score: ${report.score}/${report.exam?.questions?.length || '?'} | Status: ${report.status || 'Completed'} | Date: ${new Date(report.createdAt).toLocaleDateString()}`, 20, yPos + 8);
      yPos += 25;
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });

    doc.save(`${user?.roll_no || 'student'}_report.pdf`);
  };

  if (loading) return <div className="page-container" style={{ textAlign: 'center', padding: '4rem' }}>Loading reports...</div>;

  return (
    <div className="page-container">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>
            <Award /> My Reports
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Performance analytics and certificates</p>
        </div>
        <button className="btn btn-primary" onClick={exportPDF} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Download /> Export PDF
        </button>
      </header>

      {reports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          <Award size={64} style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No reports yet</h3>
          <p>Complete some tasks to generate performance reports.</p>
        </div>
      ) : (
        <div className="card">
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Task</th>
                <th>Day</th>
                <th>Score</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(report => (
                <tr key={report._id}>
                  <td>{report.exam?.title}</td>
                  <td>{report.dayId?.dayNumber || 'N/A'}</td>
                  <td style={{ fontWeight: 'bold' }}>{report.score}</td>
                  <td>{report.status}</td>
                  <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-outline" onClick={() => window.print()}>Print</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentReports;

