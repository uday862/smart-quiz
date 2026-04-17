const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Exam = require('./models/Exam');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const seedData = [
  {
      title: "SQL Question 1: Basic Filtering",
      text: "Given a table 'users' with columns: (id INT, name STRING, age INT). Select all columns for users whose age is greater than or equal to 18.",
      sample_input: "id | name | age\n1  | Kim  | 17\n2  | Dan  | 18\n3  | Sam  | 25",
      sample_output: "id | name | age\n2  | Dan  | 18\n3  | Sam  | 25",
      schema: "CREATE TABLE users(id INT, name STRING, age INT);",
      test_cases: [
          { input: "INSERT INTO users VALUES (1, 'A', 15);", output: "[]" },
          { input: "INSERT INTO users VALUES (1, 'B', 18);", output: '[{"id":1,"name":"B","age":18}]' },
          { input: "INSERT INTO users VALUES (1, 'C', 99);", output: '[{"id":1,"name":"C","age":99}]' },
          { input: "INSERT INTO users VALUES (1, 'D', 15), (2, 'E', 25);", output: '[{"id":2,"name":"E","age":25}]' },
          { input: "INSERT INTO users VALUES (1, 'F', 20), (2, 'G', 30);", output: '[{"id":1,"name":"F","age":20},{"id":2,"name":"G","age":30}]' }
      ]
  },
  {
      title: "SQL Question 2: Group By & Sum",
      text: "Given a table 'employees' with columns: (id INT, emp_name STRING, department STRING, salary INT). Find the total salary sum for each department. Return 'department' and 'total_salary'.",
      sample_input: "id|emp_name|department|salary\n1|A|IT|50\n2|B|IT|100\n3|C|HR|80",
      sample_output: "department|total_salary\nIT|150\nHR|80",
      schema: "CREATE TABLE employees(id INT, emp_name STRING, department STRING, salary INT);",
      test_cases: [
          { input: "INSERT INTO employees VALUES (1, 'A', 'IT', 10), (2, 'B', 'HR', 20);", output: '[{"department":"IT","total_salary":10},{"department":"HR","total_salary":20}]' },
          { input: "INSERT INTO employees VALUES (1, 'A', 'IT', 10), (2, 'B', 'IT', 50);", output: '[{"department":"IT","total_salary":60}]' },
          { input: "INSERT INTO employees VALUES (1, 'A', 'Sales', 100);", output: '[{"department":"Sales","total_salary":100}]' },
          { input: "INSERT INTO employees VALUES (1, 'A', 'HR', 0), (2, 'B', 'HR', 0);", output: '[{"department":"HR","total_salary":0}]' },
          { input: "INSERT INTO employees VALUES (1, 'A', 'IT', 5), (2, 'B', 'IT', 5), (3, 'C', 'HR', 10);", output: '[{"department":"IT","total_salary":10},{"department":"HR","total_salary":10}]' }
      ]
  },
  {
      title: "SQL Question 3: Inner Join",
      text: "Given two tables: 'students' (id INT, name STRING) and 'fees' (student_id INT, amount INT). Return 'name' and 'amount' for all students who have paid fees.",
      sample_input: "students:\n1|Alpha\n2|Beta\nfees:\n1|5000",
      sample_output: "name|amount\nAlpha|5000",
      schema: "CREATE TABLE students(id INT, name STRING); CREATE TABLE fees(student_id INT, amount INT);",
      test_cases: [
          { input: "INSERT INTO students VALUES (1, 'John'); INSERT INTO fees VALUES (1, 500);", output: '[{"name":"John","amount":500}]' },
          { input: "INSERT INTO students VALUES (1, 'John'), (2, 'Jane'); INSERT INTO fees VALUES (1, 500);", output: '[{"name":"John","amount":500}]' },
          { input: "INSERT INTO students VALUES (1, 'John'), (2, 'Jane'); INSERT INTO fees VALUES (2, 100);", output: '[{"name":"Jane","amount":100}]' },
          { input: "INSERT INTO students VALUES (1, 'John');", output: '[]' },
          { input: "INSERT INTO students VALUES (1, 'John'), (2, 'Jane'); INSERT INTO fees VALUES (1, 50), (2, 50);", output: '[{"name":"John","amount":50},{"name":"Jane","amount":50}]' }
      ]
  },
  {
      title: "SQL Question 4: Having Clause",
      text: "Given 'sales' table (id INT, sales_rep STRING, amount INT). Find all sales_reps whose total combined sales strictly exceed 500. Return 'sales_rep' and 'total'.",
      sample_input: "sales:\n1|Jake|300\n2|Jake|300\n3|Amy|200",
      sample_output: "sales_rep|total\nJake|600",
      schema: "CREATE TABLE sales(id INT, sales_rep STRING, amount INT);",
      test_cases: [
          { input: "INSERT INTO sales VALUES (1, 'A', 600);", output: '[{"sales_rep":"A","total":600}]' },
          { input: "INSERT INTO sales VALUES (1, 'A', 100), (2, 'A', 200);", output: '[]' },
          { input: "INSERT INTO sales VALUES (1, 'A', 300), (2, 'A', 300);", output: '[{"sales_rep":"A","total":600}]' },
          { input: "INSERT INTO sales VALUES (1, 'A', 600), (2, 'B', 600);", output: '[{"sales_rep":"A","total":600},{"sales_rep":"B","total":600}]' },
          { input: "INSERT INTO sales VALUES (1, 'A', 100), (2, 'B', 800);", output: '[{"sales_rep":"B","total":800}]' }
      ]
  },
  {
      title: "SQL Question 5: Pattern Matching (LIKE)",
      text: "Given 'products' table (id INT, product_name STRING, price INT). Select all columns for products where the product_name starts with the string 'Pro'.",
      sample_input: "products:\n1|Pro-Laptop|1000\n2|Mouse|20\n3|Pro-Tablet|500",
      sample_output: "id|product_name|price\n1|Pro-Laptop|1000\n3|Pro-Tablet|500",
      schema: "CREATE TABLE products(id INT, product_name STRING, price INT);",
      test_cases: [
          { input: "INSERT INTO products VALUES (1, 'Pro Gear', 10);", output: '[{"id":1,"product_name":"Pro Gear","price":10}]' },
          { input: "INSERT INTO products VALUES (1, 'Amateur Gear', 10);", output: '[]' },
          { input: "INSERT INTO products VALUES (1, 'ProItem', 10), (2, 'Basic', 5);", output: '[{"id":1,"product_name":"ProItem","price":10}]' },
          { input: "INSERT INTO products VALUES (1, 'Basic Pro', 50);", output: '[]' },
          { input: "INSERT INTO products VALUES (1, 'Pro1', 1), (2, 'Pro2', 2);", output: '[{"id":1,"product_name":"Pro1","price":1},{"id":2,"product_name":"Pro2","price":2}]' }
      ]
  }
];

const seedExams = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB. Starting database seed...');

        for (const data of seedData) {
            const finalTestCases = data.test_cases.map(tc => {
                return {
                    input: data.schema + " " + tc.input,
                    output: tc.output
                };
            });

            const exam = new Exam({
                title: data.title,
                status: 'running',
                time_limit: 120,
                attempt_limit: 1000,
                questions: [{
                    type: 'SQL',
                    text: data.text,
                    sample_input: data.sample_input,
                    sample_output: data.sample_output,
                    test_cases: finalTestCases,
                    marks: 100
                }],
                allowedUsers: []
            });
            
            await exam.save();
            console.log(`-> Successfully seeded ${data.title} with 5 test cases!`);
        }

        console.log('Seed Complete! You can exit (Ctrl+C).');
        process.exit(0);
    } catch (err) {
        console.error('Seed Failed:', err);
        process.exit(1);
    }
};

seedExams();
