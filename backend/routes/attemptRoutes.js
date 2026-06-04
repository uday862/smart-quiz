const express = require('express');
const router = express.Router();
const Attempt = require('../models/Attempt');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Save query draft (no score, no complete)
router.post('/:id/save-query', requireAuth, async (req, res) => {
    try {
        const { query } = req.body;
        const attempt = await Attempt.findById(req.params.id).populate('exam');
        if (!attempt) return res.status(404).json({ message: 'Attempt not found' });

        if (req.user.role !== 'admin' && String(attempt.student) !== String(req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        const questionId = attempt.exam?.questions?.[0]?._id;
        
        if (attempt.answers && attempt.answers.length > 0) {
            attempt.answers[0].answer = query;
        } else if (questionId) {
            attempt.answers = [{ question_id: questionId, answer: query }];
        } else {
            return res.status(400).json({ message: 'Exam questions not found' });
        }
        
        await attempt.save();
        res.json({ message: 'Query saved', attempt });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get generic attempt by ID
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const attempt = await Attempt.findById(req.params.id).populate('exam').lean();
        if (!attempt) return res.status(404).json({ message: 'Attempt not found' });

        if (req.user.role !== 'admin' && String(attempt.student) !== String(req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // If the user is a student, and the attempt is NOT completed, strip correct answers!
        if (req.user.role !== 'admin' && attempt.status !== 'completed') {
            if (attempt.exam && attempt.exam.questions) {
                attempt.exam.questions.forEach(q => {
                    delete q.correct_answer;
                    if (q.test_cases && q.test_cases.length > 1) {
                        q.test_cases = [q.test_cases[0]];
                    }
                });
            }
        }
        res.json(attempt);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get active attempts for live monitoring (admin) / leaderboard (student)
router.get('/task/:taskId', requireAuth, async (req, res) => {
    try {
        const attempts = await Attempt.find({ exam: req.params.taskId })
            .populate('student', 'name roll_no avatar_color')
            .populate('exam', 'title questions flagLimit')
            .lean();
        // Ensure ipAddress populated
        attempts.forEach(att => {
          if (!att.ipAddress) {
            att.ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
          }
        });

        if (req.user.role !== 'admin') {
            // For students: strip sensitive data and only return completed attempts for the leaderboard
            const leaderboardAttempts = attempts
                .filter(att => att.status === 'completed')
                .map(att => ({
                    _id: att._id,
                    student: att.student,
                    score: att.score,
                    status: att.status,
                    start_time: att.start_time,
                    createdAt: att.createdAt,
                    updatedAt: att.updatedAt
                }));
            return res.json(leaderboardAttempts);
        }

        res.json(attempts);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Start an attempt immediately (Resume if exists)
router.post('/start', requireAuth, async (req, res) => {
    try {
        const { student, exam } = req.body;

        if (req.user.role !== 'admin' && String(student) !== String(req.user.id)) {
            return res.status(403).json({ message: 'Access denied: Cannot start attempt for another student' });
        }

        // Check for active attempt first to prevent duplicates
        const existing = await Attempt.findOne({ student, exam, status: 'attempting' });
        if (existing) {
            return res.json(existing);
        }

        const Exam = require('../models/Exam');
        const examData = await Exam.findById(exam);
        const maxScore = examData?.questions?.length || 0;

        const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
        const attempt = new Attempt({ ...req.body, status: 'attempting', ipAddress: ip, maxScore });
        await attempt.save();
        res.status(201).json(attempt);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Submit/Update an attempt
router.put('/:id/submit', requireAuth, async (req, res) => {
    try {
        const { score: clientScore, status, answers, flags, spam } = req.body;
        const attempt = await Attempt.findById(req.params.id).populate('exam', 'title questions flagLimit fullWindow');
        
        if (!attempt) return res.status(404).json({ message: 'Attempt not found' });

        if (req.user.role !== 'admin' && String(attempt.student) !== String(req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (attempt.status === 'completed') {
            return res.status(400).json({ message: 'Attempt is already completed and cannot be modified.' });
        }
        
        let serverScore = 0;
        
        if (attempt.exam?.questions) {
            attempt.exam.questions.forEach((q, idx) => {
                if (q.type === 'MCQ') {
                    const studentAns = answers.find(a => String(a.question_id) === String(q._id))?.answer;
                    if (studentAns === q.correct_answer) {
                        serverScore += (q.marks || 1);
                    }
                } else if (q.type === 'Jumble') {
                    try {
                        const studentAnsRaw = answers.find(a => String(a.question_id) === String(q._id))?.answer;
                        let student = [];
                        if (studentAnsRaw) {
                             student = typeof studentAnsRaw === 'string' ? JSON.parse(studentAnsRaw) : studentAnsRaw;
                        }
                        const correct = JSON.parse(q.correct_answer);
                        if (Array.isArray(student) && Array.isArray(correct) && JSON.stringify(student.filter(Boolean)) === JSON.stringify(correct)) {
                            serverScore += (q.marks || 1);
                        }
                    } catch (e) {
                        console.error('Jumble eval err', e.message);
                    }
                }
            });
        }
        
        let finalScore = serverScore;
        
        // Server-side SQL validation for SQL questions using ALASQL (bypasses sqlite3 native binary issues)
        if (attempt.exam?.questions?.[0]?.type === 'SQL' && answers?.[0]?.answer) {
            try {
                const alasql = require('alasql');
                const q = attempt.exam.questions[0];
                const testCases = q.test_cases || [];
                const userQuery = answers[0].answer.trim();
                let passed = 0;
                
                for (let i = 0; i < testCases.length; i++) {
                    const tc = testCases[i];
                    if (!tc.input || !tc.output) continue;
                    
                    const tempDb = `db_exec_${Date.now()}_${i}`;
                    try {
                        alasql(`CREATE DATABASE ${tempDb}`);
                        alasql(`USE ${tempDb}`);
                        
                        // Load test data
                        alasql(tc.input);
                        
                        // Execute user query
                        const userOutput = alasql(userQuery);
                        
                        // Parse expected output
                        let truthOutput;
                        const adminAns = (tc.output || '').trim();
                        if (adminAns.startsWith('[')) {
                            truthOutput = JSON.parse(adminAns);
                        } else {
                            truthOutput = alasql(adminAns);
                        }
                        
                        const userStr = userOutput !== undefined ? JSON.stringify(userOutput) : 'null';
                        const truthStr = truthOutput !== undefined ? JSON.stringify(truthOutput) : 'null';
                        
                        if (userStr === truthStr && userStr !== 'null') {
                            passed++;
                        }
                    } catch (tcErr) {
                        console.error(`Test case failed:`, tcErr.message);
                    } finally {
                        try {
                            alasql(`DROP DATABASE IF EXISTS ${tempDb}`);
                        } catch (dropErr) {}
                    }
                }
                
                const questionMarks = q.marks || 100;
                finalScore = testCases.length > 0 ? Math.round((passed / testCases.length) * questionMarks) : 0;
                
                // Store validation info
                answers[0].server_validation = {
                    passed,
                    total: testCases.length,
                    score: finalScore,
                    client_claimed: clientScore
                };
                
                if (clientScore !== finalScore) {
                    console.log(`Score override: client ${clientScore} → server ${finalScore} for attempt ${attempt._id}`);
                }
            } catch (sqlErr) {
                console.error('SQL validation error:', sqlErr);
                finalScore = 0;
            }
        }
        
        attempt.score = finalScore;
        attempt.status = status;
        attempt.answers = answers;
        attempt.flags = flags;
        
        const maxFlagsAllowed = (attempt.exam && typeof attempt.exam.flagLimit === 'number') ? attempt.exam.flagLimit : 10;
        if (spam || flags >= maxFlagsAllowed) {
            attempt.spam = true;
        }
        
        attempt.submissions += 1;
        if (status === 'completed' && !attempt.end_time) {
            attempt.end_time = new Date();
        }
        
        await attempt.save();

        // Send score notification if completed
        if (status === 'completed') {
            try {
                const Notification = require('../models/Notification');
                const total = (attempt.exam?.questions || []).reduce((s, q) => s + (q.marks || 1), 0) || 1;
                await Notification.create({
                    student: attempt.student,
                    type: 'score_updated',
                    title: '🏆 Score Updated!',
                    message: `You scored ${finalScore}/${total} in "${attempt.exam?.title || 'Task'}". Check your Reports for details.`,
                    examId: attempt.exam?._id,
                    score: finalScore,
                    isRead: false
                });
            } catch (notifErr) { console.error('Score notif error:', notifErr.message); }
        }

        res.json(attempt);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get attempting status logic
router.get('/exam/:examId/student/:studentId', requireAuth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && String(req.params.studentId) !== String(req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const attempts = await Attempt.find({ exam: req.params.examId, student: req.params.studentId });
        res.json(attempts);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all past attempts for a single student (Reports)
router.get('/student/:studentId', requireAuth, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && String(req.params.studentId) !== String(req.user.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const attempts = await Attempt.find({ student: req.params.studentId })
            .populate('exam', 'title questions time_limit')
            .populate('dayId', 'dayNumber title')
            .sort({ createdAt: -1 })
            .lean();

        if (req.user.role !== 'admin') {
            attempts.forEach(att => {
                if (att.exam && att.exam.questions) {
                    att.exam.questions.forEach(q => {
                        delete q.correct_answer;
                        if (q.test_cases && q.test_cases.length > 1) {
                            q.test_cases = [q.test_cases[0]];
                        }
                    });
                }
            });
        }
        res.json(attempts);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Global Stats for Admin
router.get('/stats', requireAdmin, async (req, res) => {
    try {
        const attempts = await Attempt.find();
        const totalAttempts = attempts.length;
        const totalFlags = attempts.reduce((acc, curr) => acc + (curr.flags || 0), 0);
        const topScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0;
        const avgScore = totalAttempts > 0 ? (attempts.reduce((acc, curr) => acc + curr.score, 0) / totalAttempts).toFixed(1) : 0;
        
        res.json({ totalAttempts, totalFlags, topScore, avgScore });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Detailed summary for all students and all tasks
router.get('/summary/detailed', requireAdmin, async (req, res) => {
    try {
        const attempts = await Attempt.find({ status: 'completed' })
            .populate('student', 'roll_no name section')
            .populate('exam', 'title questions isDeleted');
        
        // Filter out attempts for deleted exams
        const filtered = attempts.filter(att => att.exam && att.exam.isDeleted !== true);
        res.json(filtered);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
