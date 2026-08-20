const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

// Database connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartquiz';
if (mongoose.connection.readyState === 0) {
  mongoose.connect(MONGO_URI)
    .then(async () => {
      console.log('MongoDB Connected');
      try {
          await mongoose.connection.collection('users').dropIndex('email_1');
          console.log('Dropped email_1 index to fix dup key errors');
      } catch(e) { /* might not exist or already dropped, ignore */ }
      // Drop old unique index on dayNumber if it still exists
      try {
          await mongoose.connection.collection('days').dropIndex('dayNumber_1');
          console.log('Dropped dayNumber_1 unique index to fix Add Module');
      } catch(e) { /* already dropped or never existed */ }
      // Seed admin if not exists
      const User = require('./models/User');
      const bcrypt = require('bcryptjs');
      const adminExists = await User.findOne({ role: 'admin' });
      if (!adminExists) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash('admin', salt);
          await User.create({ name: 'admin', password: hashedPassword, role: 'admin' });
          console.log('Default admin seeded (admin/admin)');
      }
    })
    .catch(err => console.log(err));
}


// Inject io into req for routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Socket.io for Real-time Monitoring
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    socket.on('student_update', (data) => {
        // Broadcast student live status to admins
        io.emit('admin_dashboard_update', data);
    });

});

// Background interval for Scheduled Auto-Launch Tasks (checks every 20 seconds)
setInterval(async () => {
    try {
        const Exam = require('./models/Exam');
        const now = new Date();
        const scheduledExams = await Exam.find({
            status: { $ne: 'running' },
            isDeleted: { $ne: true },
            scheduledLaunchAt: { $lte: now }
        });
        if (scheduledExams.length > 0) {
            console.log(`Auto-launching ${scheduledExams.length} scheduled task(s)...`);
            for (const exam of scheduledExams) {
                exam.status = 'running';
                exam.start_time = now;
                exam.end_time = new Date(now.getTime() + 86400000);
                await exam.save();
            }
        }
    } catch (err) {
        console.error('Scheduled launch check error:', err.message);
    }
}, 20000);

// Routes Placeholder
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/attempts', require('./routes/attemptRoutes'));
app.use('/api/days', require('./routes/dayRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/resource-folders', require('./routes/resourceFolderRoutes'));

const PORT = process.env.PORT || 5001;

// Serve static assets in production (when not on VERCEL platform)
const path = require('path');
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*path', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
  });
}

if (require.main === module) {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;

