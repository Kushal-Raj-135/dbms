const mysql = require('mysql2');
const bcrypt = require('bcrypt');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function createTestUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('test123', 10);

    // Insert test user
    const query = 'INSERT INTO Customer (Name, Email_ID, Password, Phone, Address) VALUES (?, ?, ?, ?, ?)';
    const values = ['Test User', 'test@example.com', hashedPassword, '1234567890', '123 Test St'];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error creating test user:', err);
        process.exit(1);
      }
      console.log('Test user created successfully!');
      console.log('Email: test@example.com');
      console.log('Password: test123');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestUser(); 