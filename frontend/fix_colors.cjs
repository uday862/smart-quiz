const fs = require('fs');
let t = fs.readFileSync('src/pages/student/StudentDashboard.jsx', 'utf8');
t = t.replace(/color:\s*'#333'/g, "color: 'var(--text-primary)'");
t = t.replace(/color:\s*'#1a365d'/g, "color: 'var(--text-primary)'");
fs.writeFileSync('src/pages/student/StudentDashboard.jsx', t);
