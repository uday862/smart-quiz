const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Day = require('./models/Day');
const Exam = require('./models/Exam');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('DB Connected');
    
    const students = await User.find({role: 'student'}).countDocuments();
    console.log(`Students count: ${students}`);
    
    const days = await Day.find({}).countDocuments();
    console.log(`Days count: ${days}`);
    
    const exams = await Exam.find({}).countDocuments();
    console.log(`Exams/Tasks count: ${exams}`);
    
    console.log('Diagnostic complete.');
    process.exit(0);
  })
  .catch(err => {
    console.error('DB Error:', err.message);
    process.exit(1);
  });

