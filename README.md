# Smart Quiz Platform

A full-stack quiz and assessment platform designed for educational institutions to conduct online exams, monitor student progress, and analyze performance analytics in real-time.

**Live Demo:** [smart-quiz-platform-veby.onrender.com](https://smart-quiz-platform-veby.onrender.com/)

---

## 🎯 What This Is

Smart Quiz is an interactive online examination platform that enables instructors to create and manage quizzes with multiple question types (MCQ, Coding, SQL, Descriptive, Jumble), conduct live exams with real-time monitoring, and track detailed student performance analytics. The platform supports flexible exam configuration, resource management, student grouping, and comprehensive feedback mechanisms.

---

## 🛠️ Stack

- **Languages:** JavaScript (Node.js backend, React frontend)
- **Frontend Framework:** React 19 + Vite 5 with React Router v7
- **Backend Framework:** Express.js 5 + Socket.IO for real-time updates
- **Database:** MongoDB (persistence) with Mongoose ODM; SQLite for SQL question testing
- **Key Libraries:**
  - **Authentication:** JWT (jsonwebtoken) + bcryptjs for password hashing
  - **Real-time:** Socket.IO for live dashboard monitoring and student updates
  - **Data Processing:** alasql (in-memory SQL engine), xlsx (Excel export), jsPDF (PDF reports)
  - **UI Components:** Lucide React (icons), Recharts (analytics visualizations)
  - **File Handling:** Multer for file uploads

---

## 📁 How It's Organized

```
smart-quiz/
├── frontend/                       React SPA with Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx      Authentication entry
│   │   │   ├── AdminDashboard.jsx  Exam & student management
│   │   │   ├── LiveMonitoring.jsx  Real-time exam monitoring
│   │   │   ├── Analytics.jsx       Performance dashboards
│   │   │   └── student/
│   │   │       ├── StudentDashboard.jsx      Assignments & completed tasks
│   │   │       ├── StudentCodeIDE.jsx        Coding question editor
│   │   │       ├── StudentSQLIDE.jsx         SQL query editor
│   │   │       ├── StudentJumbleQuiz.jsx     Word arrangement quiz
│   │   │       ├── StudentReview.jsx         Answer review interface
│   │   │       └── StudentProfile.jsx        User profile management
│   │   ├── contexts/AuthContext.jsx          Global auth state + JWT token management
│   │   ├── components/ProtectedRoute.jsx     Role-based route guards
│   │   ├── App.jsx                 Main routing and layout component
│   │   └── index.css               Styling
│   ├── package.json
│   └── vite.config.js
│
├── backend/                        Express API server
│   ├── server.js                   App setup, MongoDB connection, Socket.IO
│   ├── models/
│   │   ├── User.js                 Admin & student profiles (roles, credentials, metadata)
│   │   ├── Exam.js                 Exam definitions (questions, limits, permissions)
│   │   ├── Attempt.js              Student quiz attempts & responses
│   │   ├── Day.js                  Exam schedule/groups
│   │   ├── Group.js                Student grouping for access control
│   │   ├── Notification.js         User notifications
│   │   ├── Announcement.js         System-wide announcements
│   │   ├── Feedback.js             Student feedback submissions
│   │   └── ResourceFolder.js        Educational resource organization
│   ├── routes/
│   │   ├── authRoutes.js           Login, registration, password/profile updates
│   │   ├── studentRoutes.js         Student data and profile endpoints
│   │   ├── examRoutes.js            CRUD for exams and questions
│   │   ├── attemptRoutes.js         Quiz submission, scoring, SQL validation
│   │   ├── dayRoutes.js             Exam schedule management
│   │   ├── groupRoutes.js           Student group management
│   │   ├── notificationRoutes.js    Notification delivery & status
│   │   ├── announcementRoutes.js    Admin announcements
│   │   ├── feedbackRoutes.js        Feedback collection
│   │   └── resourceFolderRoutes.js  Resource library
│   ├── controllers/
│   │   └── authController.js        Login logic, JWT token generation
│   ├── middleware/
│   │   └── auth.js                  requireAuth, requireAdmin middleware
│   ├── package.json
│   └── seed_sql.js                  Database initialization scripts
│
├── package.json                    Root scripts (build, start)
└── render.yaml                     Render.com deployment config
```

### How It Fits Together

1. **User Authentication:** Students and admins login via `/` → JWT token stored in localStorage → Global fetch interceptor auto-attaches token to all API requests
2. **Admin Flow:** Create exams with questions → Assign to students/groups → Monitor live attempts via Socket.IO → View analytics dashboards
3. **Student Flow:** View available assignments → Attempt quiz (MCQ/Coding/SQL/Descriptive/Jumble) → Submit → Review feedback and scores → Track history
4. **Real-time Updates:** Socket.IO emits `student_update` events from frontend → `admin_dashboard_update` broadcasts to admins; server pushes notifications and announcements
5. **Backend Architecture:** Express routes handle RESTful operations on MongoDB; special SQL validation in `attemptRoutes.js` uses SQLite for SQL question grading

---

## 🚀 How to Run It

### Prerequisites
- Node.js 16+ and npm
- MongoDB URI (cloud or local)
- Optional: SQLite3 (for SQL question validation)

### Environment Setup

Create a `.env` file in the `backend/` directory:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/smart-quiz
JWT_SECRET=your-secret-key-here
NODE_ENV=production
PORT=5001
```

### Installation & Development

```bash
# Install dependencies for both frontend and backend
npm run build

# Start the backend server (runs on port 5001)
npm start

# In a separate terminal, start frontend dev server (from frontend/)
cd frontend
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

The backend serves the frontend build at `/` in production mode.

### Available Scripts

**Backend:**
```bash
cd backend
npm run dev      # Start with nodemon (auto-reload)
npm start        # Start server
```

**Frontend:**
```bash
cd frontend
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run lint     # Run ESLint
```

---

## ✨ Key Features

- **Multiple Question Types:** MCQ, Coding (with code editor), SQL (with query validation), Descriptive, Jumble (word arrangement)
- **Exam Configuration:** Time limits, attempt limits, full-window mode, question flagging
- **Student Grouping:** Organize students into groups for targeted exam assignments
- **Real-time Monitoring:** Live dashboard showing active student attempts and progress
- **Analytics:** Performance charts, score distributions, attempt history
- **Notifications:** Auto-generated alerts for exam status changes, score updates
- **Resource Library:** Store and organize educational materials by folders
- **Feedback System:** Student submissions tracked in database
- **Export Options:** PDF reports and Excel data downloads
- **Admin Management:** Multi-admin support with role-based access control

---

## 🔑 Default Login

The platform seeds a default admin account on first startup:
- **Username:** `admin`
- **Password:** `admin`

⚠️ **Change this password immediately in production!**

---

## 📚 Database Models

### User
- Roles: `admin`, `student`
- Fields: name, password (hashed), email, roll_no, phone, section, course, batch, status, avatar_color

### Exam
- Questions with types: MCQ, Coding, Descriptive, SQL, Jumble
- Fields: title, status (not_started/running/stopped), time_limit, attempt_limit, test_cases, marks
- Permissions: allowedUsers, allowedGroups, fullWindow mode

### Attempt
- Tracks student quiz submissions and responses
- Includes scoring logic and submission metadata

### Day / Group
- Organize exams into schedules (Days) and student cohorts (Groups)

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` — Student/admin login
- `POST /api/auth/register-admin` — Register new admin (admin only)
- `PUT /api/auth/update-password` — Change password
- `PUT /api/auth/update-profile` — Update profile

### Exams
- `GET /api/exams` — List exams
- `POST /api/exams` — Create exam
- `PUT /api/exams/:id` — Update exam
- `DELETE /api/exams/:id` — Delete exam

### Attempts
- `POST /api/attempts` — Submit attempt
- `GET /api/attempts/:studentId` — Get student history
- `GET /api/attempts/:attemptId/details` — Get full attempt details

### Students
- `GET /api/students` — List all students
- `PUT /api/students/:id` — Update student profile

### Notifications
- `GET /api/notifications/:userId` — Fetch user notifications
- `PUT /api/notifications/:id/read` — Mark as read
- `PUT /api/notifications/student/:userId/read-all` — Mark all read

### Announcements
- `GET /api/announcements` — Fetch active announcements
- `POST /api/announcements` — Post announcement (admin)

### Feedback
- `POST /api/feedback` — Submit feedback
- `GET /api/feedback` — List feedback (admin)

---

## 🛣️ Routing Architecture

### Admin Routes
- `/admin` — Main dashboard
- `/admin/live/:taskId` — Real-time exam monitoring
- `/admin/analytics` — Performance analytics

### Student Routes
- `/student` — Dashboard (assignments tab)
- `/student/assignments` — Available quizzes
- `/student/completed` — Completed tasks
- `/student/reports` — Performance reports
- `/student/profile` — Profile settings
- `/student/quiz/:id` — Coding question editor
- `/student/sql/:id` — SQL query IDE
- `/student/review/:id` — Answer review
- `/student/jumble/:id` — Word arrangement quiz

---

## 🔐 Security Features

- **JWT Authentication:** Secure token-based access with Bearer scheme
- **Password Hashing:** bcryptjs with salt rounds
- **Role-Based Access Control:** Admin vs. Student middleware guards
- **CORS Enabled:** Cross-origin requests configured for Socket.IO
- **Protected Routes:** React route guards prevent unauthorized navigation

---

## 🚢 Deployment

This project is configured for **Render.com** deployment via `render.yaml`.

The build process:
1. Installs frontend dependencies
2. Builds React app to `frontend/dist/`
3. Installs backend dependencies
4. Backend serves static frontend files in production

---

## 📝 Try Asking

- How do I add a new question type (e.g., Multiple Select)?
- How does the SQL validation work in the attemptRoutes?
- Can I customize the notification message templates?
- How do I generate and download a full exam report as PDF?

---

## 📞 Support & Issues

For bug reports or feature requests, please open an [issue](https://github.com/uday862/smart-quiz/issues).

---

## 📄 License

ISC License (see package.json)

---

## 🎓 Contributing

Contributions are welcome! Please fork this repository, create a feature branch, and submit a pull request.

```bash
git clone https://github.com/uday862/smart-quiz.git
cd smart-quiz
git checkout -b feature/your-feature
# Make your changes
git push origin feature/your-feature
```

---

**Happy Quizzing! 🎯**
