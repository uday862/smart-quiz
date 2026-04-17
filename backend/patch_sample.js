const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const Exam = require('./models/Exam');

const updates = {
    "SQL Question 1: Basic Filtering": {
        input: "INSERT INTO users VALUES (1, 'Kim', 17), (2, 'Dan', 18), (3, 'Sam', 25);",
        output: '[{"id":2,"name":"Dan","age":18},{"id":3,"name":"Sam","age":25}]'
    },
    "SQL Question 2: Group By & Sum": {
        input: "INSERT INTO employees VALUES (1, 'A', 'IT', 50), (2, 'B', 'IT', 100), (3, 'C', 'HR', 80);",
        output: '[{"department":"IT","total_salary":150},{"department":"HR","total_salary":80}]'
    },
    "SQL Question 3: Inner Join": {
        input: "INSERT INTO students VALUES (1, 'Alpha'), (2, 'Beta'); INSERT INTO fees VALUES (1, 5000);",
        output: '[{"name":"Alpha","amount":5000}]'
    },
    "SQL Question 4: Having Clause": {
        input: "INSERT INTO sales VALUES (1, 'Jake', 300), (2, 'Jake', 300), (3, 'Amy', 200);",
        output: '[{"sales_rep":"Jake","total":600}]'
    },
    "SQL Question 5: Pattern Matching (LIKE)": {
        input: "INSERT INTO products VALUES (1, 'Pro-Laptop', 1000), (2, 'Mouse', 20), (3, 'Pro-Tablet', 500);",
        output: '[{"id":1,"product_name":"Pro-Laptop","price":1000},{"id":3,"product_name":"Pro-Tablet","price":500}]'
    }
};

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const exams = await Exam.find({ title: /SQL Question/ });
    for (const exam of exams) {
        const title = exam.title;
        if (updates[title] && exam.questions[0]) {
            // Update only test case 0
            const schema = exam.questions[0].test_cases[0].input.split(';')[0] + '; ';
            exam.questions[0].test_cases[0].input = schema + updates[title].input;
            exam.questions[0].test_cases[0].output = updates[title].output;
            await exam.save();
            console.log(`Updated Test Case 1 for ${title}`);
        }
    }
    console.log('Fixed Test Case 1 mapping!');
    process.exit(0);
});
