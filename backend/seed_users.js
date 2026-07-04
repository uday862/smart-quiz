const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

const seedUsers = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        // 1. Seed Admin
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin', salt);
            await User.create({
                name: 'admin',
                role: 'admin',
                password: hashedPassword
            });
            console.log('✓ Default admin seeded (username: admin, password: admin)');
        } else {
            console.log('✓ Admin already exists');
        }

        // 2. Seed Default Students
        const defaultStudents = [
            {
                name: 'John Doe',
                roll_no: '101',
                email: 'john.doe@student.com',
                section: 'A',
                course: 'Computer Science',
                batch: '2024-28',
                phone: '9876543210'
            },
            {
                name: 'Jane Smith',
                roll_no: '102',
                email: 'jane.smith@student.com',
                section: 'B',
                course: 'Information Technology',
                batch: '2024-28',
                phone: '9876543211'
            },
            {
                name: 'Alice Johnson',
                roll_no: '103',
                email: 'alice.johnson@student.com',
                section: 'A',
                course: 'Computer Science',
                batch: '2024-28',
                phone: '9876543212'
            }
        ];

        const salt = await bcrypt.genSalt(10);
        const defaultPasswordHash = await bcrypt.hash('student123', salt);

        for (const studentData of defaultStudents) {
            const studentExists = await User.findOne({ roll_no: studentData.roll_no });
            if (!studentExists) {
                const student = await User.create({
                    role: 'student',
                    password: defaultPasswordHash,
                    ...studentData
                });
                
                // Add welcome notification for each student
                try {
                    const Notification = require('./models/Notification');
                    await Notification.create({
                        student: student._id,
                        type: 'welcome',
                        title: '👋 Welcome to Smart Quiz!',
                        message: `Hello ${student.name}! Your account has been created. Login with Roll No: ${student.roll_no} to get started.`,
                        isRead: false
                    });
                } catch (ne) {
                    // Ignore notification model errors if they don't apply or exist
                }

                console.log(`✓ Seeded student: ${student.name} (Roll No: ${student.roll_no}, Password: student123)`);
            } else {
                console.log(`✓ Student with roll_no ${studentData.roll_no} already exists`);
            }
        }

        console.log('Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error.message);
        process.exit(1);
    }
};

seedUsers();
