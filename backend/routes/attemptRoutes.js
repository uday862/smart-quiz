const express = require('express');
const router = express.Router();
const Attempt = require('../models/Attempt');


// Save query draft (no score, no complete)
router.post('/:id/save-query', async (req, res) => {
    try {
        const { query } = req.body;
        const attempt = await Attempt.findById(req.params.id);
        
        if (attempt.answers && attempt.answers.length > 0) {
            attempt.answers[0].answer = query;
        } else {
            attempt.answers = [{ question_id: attempt.exam.questions[0]._id, answer: query }];
        }
        
        await attempt.save();
        res.json({ message: 'Query saved', attempt });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get generic attempt by ID
router.get('/:id', async (req, res) => {
    try {
        const attempt = await Attempt.findById(req.params.id).populate('exam');
        res.json(attempt);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get active attempts for live monitoring
router.get('/task/:taskId', async (req, res) => {
    try {
        const attempts = await Attempt.find({ exam: req.params.taskId }).populate('student');
        // Ensure ipAddress populated
        attempts.forEach(att => {
          if (!att.ipAddress) {
            att.ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
          }
        });
        res.json(attempts);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Start an attempt immediately (Resume if exists)
router.post('/start', async (req, res) => {
    try {
        const { student, exam } = req.body;
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
router.put('/:id/submit', async (req, res) => {
    try {
        const { score: clientScore, status, answers, flags } = req.body;
        const attempt = await Attempt.findById(req.params.id).populate('exam', 'title questions');
        
        let finalScore = clientScore;
        
        // Server-side SQL validation for SQL questions (FIXED ASYNC)
        if (attempt.exam?.questions?.[0]?.type === 'SQL' && answers?.[0]?.answer) {
            const sqlite3 = require('sqlite3').verbose();
            const fs = require('fs');
            const path = require('path');
            const util = require('util');
            const tmpDir = path.join(__dirname, '..', 'tmp');
            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
            const dbPath = path.join(tmpDir, `sql_test_${Date.now()}.db`);
            
            try {
                const q = attempt.exam.questions[0];
                const testCases = q.test_cases || [];
                const userQuery = answers[0].answer.trim();
                let passed = 0;
                
                const db = new sqlite3.Database(dbPath);
                const execAsync = util.promisify(db.exec.bind(db));
                const allAsync = util.promisify(db.all.bind(db));
                
                for (const tc of testCases) {
                    if (!tc.input || !tc.output) continue;
                    
                    try {
                        await execAsync('BEGIN TRANSACTION');
                        
                        // Load test data
                        await execAsync(tc.input);
                        
                        // Execute user query
                        const rows = await allAsync(userQuery);
                        
                        const userOutputStr = JSON.stringify(rows.sort((a,b) => {
                            const sa = JSON.stringify(a), sb = JSON.stringify(b);
                            return sa > sb ? 1 : sa < sb ? -1 : 0;
                        }));
                        const expectedStr = tc.output.trim();
                        
                        if (userOutputStr === expectedStr) passed++;
                        
                        await execAsync('ROLLBACK');
                    } catch (tcErr) {
                        console.error(`Test case failed:`, tcErr.message);
                    }
                }
                
                db.close();
                
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
            } finally {
                if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
            }
        }
        
        attempt.score = finalScore;
        attempt.status = status;
        attempt.answers = answers;
        attempt.flags = flags;
        attempt.submissions += 1;
        
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
router.get('/exam/:examId/student/:studentId', async (req, res) => {
    try {
        const attempts = await Attempt.find({ exam: req.params.examId, student: req.params.studentId });
        res.json(attempts);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all past attempts for a single student (Reports)
router.get('/student/:studentId', async (req, res) => {
    try {
        const attempts = await Attempt.find({ student: req.params.studentId })
            .populate('exam', 'title questions time_limit')
            .populate('dayId', 'dayNumber title')
            .sort({ createdAt: -1 });
        res.json(attempts);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Global Stats for Admin
router.get('/stats', async (req, res) => {
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
router.get('/summary/detailed', async (req, res) => {
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
