import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../config';
import { User, Lock, Mail, Phone, BookOpen, Save, CheckCircle, AlertCircle } from 'lucide-react';

const StudentProfile = () => {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [toast, setToast] = useState(null);
  const [groups, setGroups] = useState([]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user'));
    if (stored) {
      setUser(stored);
      setForm({ name: stored.name || '', email: stored.email || '', phone: stored.phone || '' });

      // Load groups
      fetch(`${API_BASE_URL}/api/groups`)
        .then(r => r.json())
        .then(data => {
          const myGroups = (data || []).filter(g =>
            (g.members || []).some(m => (m._id || m) === stored.id)
          );
          setGroups(myGroups);
        }).catch(() => {});
    }
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: form.email, phone: form.phone, name: form.name })
      });
      const data = await res.json();
      if (res.ok) {
        const updated = { ...user, email: form.email, phone: form.phone, name: form.name };
        localStorage.setItem('user', JSON.stringify(updated));
        setUser(updated);
        showToast('Profile updated successfully!');
      } else {
        showToast(data.message || 'Update failed', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) { showToast('Passwords do not match', 'error'); return; }
    if (pwForm.newPw.length < 4) { showToast('Password must be at least 4 characters', 'error'); return; }
    setSavingPw(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/update-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, newPassword: pwForm.newPw })
      });
      const data = await res.json();
      if (res.ok) {
        setPwForm({ current: '', newPw: '', confirm: '' });
        showToast('Password changed successfully!');
      } else {
        showToast(data.message || 'Failed', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setSavingPw(false);
    }
  };

  if (!user) return <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>Loading...</div>;

  const initials = user.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '??';
  const avatarColor = user.avatar_color || '#3b82f6';

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '2rem 1rem' }}>

      {/* ── Profile Hero ── */}
      <div style={{ background: 'linear-gradient(135deg, #071125, #1e3a5f)', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.5rem', color: 'white', flexShrink: 0, border: '3px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
          {initials}
        </div>
        <div>
          <h2 style={{ fontWeight: '900', fontSize: '1.4rem', margin: 0 }}>{user.name}</h2>
          <div style={{ opacity: 0.7, fontSize: '0.85rem', marginTop: '0.25rem' }}>Roll No: {user.roll_no || '—'}</div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
            {user.section && <span style={{ background: 'rgba(255,255,255,0.15)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700' }}>Section {user.section}</span>}
            {user.course && <span style={{ background: 'rgba(255,255,255,0.15)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700' }}>{user.course}</span>}
            {user.batch && <span style={{ background: 'rgba(255,255,255,0.15)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700' }}>Batch {user.batch}</span>}
            {groups.map(g => (
              <span key={g._id} style={{ background: g.color + '40', border: `1px solid ${g.color}80`, padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', color: 'white' }}>{g.name}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* ── Edit Profile ── */}
        <div style={{ background: 'var(--surface-color)', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={18} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontWeight: '900', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Edit Profile</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Update your contact details</div>
            </div>
          </div>

          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={labelStyle}>DISPLAY NAME</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="Your name" />
            </div>
            <div>
              <label style={labelStyle}>EMAIL ADDRESS</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ ...inputStyle, paddingLeft: '2.25rem' }} placeholder="your@email.com" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>PHONE NUMBER</label>
              <div style={{ position: 'relative' }}>
                <Phone size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ ...inputStyle, paddingLeft: '2.25rem' }} placeholder="10-digit number" />
              </div>
            </div>
            <button type="submit" disabled={saving} style={btnStyle}>
              <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* ── Change Password ── */}
        <div style={{ background: 'var(--surface-color)', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: '8px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={18} color="#f36d44" />
            </div>
            <div>
              <div style={{ fontWeight: '900', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Change Password</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Keep your account secure</div>
            </div>
          </div>

          <form onSubmit={handlePasswordSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={labelStyle}>NEW PASSWORD</label>
              <input type="password" value={pwForm.newPw} onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })} style={inputStyle} placeholder="Min 4 characters" required />
            </div>
            <div>
              <label style={labelStyle}>CONFIRM NEW PASSWORD</label>
              <input type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} style={inputStyle} placeholder="Re-enter new password" required />
            </div>
            {pwForm.newPw && pwForm.confirm && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: '700', color: pwForm.newPw === pwForm.confirm ? '#16a34a' : '#ef4444' }}>
                {pwForm.newPw === pwForm.confirm ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                {pwForm.newPw === pwForm.confirm ? 'Passwords match' : 'Passwords do not match'}
              </div>
            )}
            <div style={{ flex: 1 }} />
            <button type="submit" disabled={savingPw} style={{ ...btnStyle, background: 'linear-gradient(135deg, #f36d44, #e85d2f)', marginTop: '0.5rem' }}>
              <Lock size={15} /> {savingPw ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* ── Account Info (read-only) ── */}
        <div style={{ background: 'var(--surface-color)', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #e2e8f0', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={18} color="#16a34a" />
            </div>
            <div style={{ fontWeight: '900', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Account Information</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[
              { label: 'Roll Number', value: user.roll_no || '—' },
              { label: 'Section', value: user.section || '—' },
              { label: 'Course', value: user.course || '—' },
              { label: 'Batch', value: user.batch || '—' },
              { label: 'Status', value: user.status || 'Active' },
              { label: 'Groups', value: groups.length > 0 ? groups.map(g => g.name).join(', ') : 'None' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>{label}</div>
                <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', padding: '1rem 2rem', background: toast.type === 'success' ? '#16a34a' : '#ef4444', color: 'white', borderRadius: '10px', fontWeight: '700', zIndex: 9999, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
};

const labelStyle = { fontSize: '0.67rem', fontWeight: '900', color: '#94a3b8', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.5px' };
const inputStyle = { width: '100%', padding: '0.6rem 0.85rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s' };
const btnStyle = { background: 'linear-gradient(135deg, #071125, #1e3a5f)', color: 'white', border: 'none', padding: '0.65rem 1rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' };

export default StudentProfile;
