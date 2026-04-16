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
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');
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

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Routes Placeholder
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/attempts', require('./routes/attemptRoutes'));
app.use('/api/days', require('./routes/dayRoutes'));

const PORT = process.env.PORT || 5001;

// Serve static assets in production
const path = require('path');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
  });
}

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

