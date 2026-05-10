const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Exam = require('./models/Exam');
const ResourceFolder = require('./models/ResourceFolder');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const fixSeed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        // 1. Create or find 'SQL' folder
        let folder = await ResourceFolder.findOne({ name: 'SQL' });
        if (!folder) {
            folder = new ResourceFolder({ name: 'SQL' });
            await folder.save();
            console.log('Created SQL Resource Folder.');
        } else {
            console.log('SQL Resource Folder already exists.');
        }

        // 2. Find the seeded SQL questions (they have no dayId and isResource is false/undefined, and title starts with 'SQL Question')
        const exams = await Exam.find({ title: { $regex: '^SQL Question' } });
        console.log(`Found ${exams.length} SQL questions to move.`);

        for (const exam of exams) {
            exam.isResource = true;
            exam.resourceFolderId = folder._id;
            exam.dayId = undefined; // Ensure it's not bound to a module
            await exam.save();
            console.log(`Moved '${exam.title}' to SQL folder in Resource Hub.`);
        }

        console.log('Done!');
        process.exit(0);
    } catch (err) {
        console.error('Failed:', err);
        process.exit(1);
    }
};

fixSeed();
