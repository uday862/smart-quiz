import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../config';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, TrendingUp, Trophy, AlertTriangle } from 'lucide-react';

const Analytics = () => {
  const [stats, setStats] = useState({ totalAttempts: 0, totalFlags: 0, topScore: 0, avgScore: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/attempts/stats`);
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
  }, []);

  const marksData = [
    { range: '0-20', students: 5 },
    { range: '21-40', students: 15 },
    { range: '41-60', students: 45 },
    { range: '61-80', students: 85 },
    { range: '81-100', students: 30 },
  ];

  const attemptsData = [
    { time: '09:00', attempts: 10 },
    { time: '10:00', attempts: 45 },
    { time: '11:00', attempts: 120 },
    { time: '12:00', attempts: 60 },
  ];

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
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
