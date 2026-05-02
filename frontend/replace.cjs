const fs = require('fs');
const files = [
  'src/pages/AdminDashboard.jsx',
  'src/pages/student/StudentDashboard.jsx',
  'src/pages/student/StudentAttemptSummary.jsx',
  'src/pages/student/StudentCodeIDE.jsx',
  'src/pages/student/StudentJumbleQuiz.jsx',
  'src/pages/student/StudentReview.jsx',
  'src/pages/student/StudentProfile.jsx',
  'src/pages/student/StudentSQLIDE.jsx'
];

files.forEach(f => {
  if(!fs.existsSync(f)) return;
  let t = fs.readFileSync(f, 'utf8');
  t = t.replace(/background:\s*'white'/g, "background: 'var(--surface-color)'")
       .replace(/background:\s*'#fff'/g, "background: 'var(--surface-color)'")
       .replace(/color:\s*'#071125'/g, "color: 'var(--text-primary)'")
       .replace(/color:\s*'#1e293b'/g, "color: 'var(--text-primary)'");
  fs.writeFileSync(f, t);
});
