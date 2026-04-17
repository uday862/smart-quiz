const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const Exam = require('./models/Exam');
const Day = require('./models/Day');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const day = await Day.findOne(); // just grab the first available Day
    if (day) {
        await Exam.updateMany({ title: /SQL Question/ }, { $set: { dayId: day._id } });
        console.log('Fixed! Seeded exams mapped to Day: ' + day.title);
    } else {
        console.log('No days found to assign to!');
    }
    process.exit(0);
});
