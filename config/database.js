const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'c1',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

async function ensureCarTableExists() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        
        // Create cars table if it doesn't exist
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS cars (
                id INT PRIMARY KEY AUTO_INCREMENT,
                model VARCHAR(100) NOT NULL,
                seats INT,
                fuel_efficiency DECIMAL(5,2),
                features TEXT,
                rent_per_day DECIMAL(10,2),
                status ENUM('available', 'rented', 'maintenance') DEFAULT 'available',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Check if we need to add some sample cars
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM cars');
        if (rows[0].count === 0) {
            // Add sample cars
            await connection.execute(`
                INSERT INTO cars (model, seats, fuel_efficiency, features, rent_per_day, status) VALUES
                ('Toyota Camry', 5, 14.5, 'Automatic, Bluetooth, Backup Camera', 50.00, 'available'),
                ('Honda CR-V', 5, 12.8, 'SUV, AWD, Apple CarPlay', 65.00, 'available'),
                ('Mercedes C-Class', 5, 13.2, 'Luxury, Leather Seats, Navigation', 90.00, 'available'),
                ('Toyota Sienna', 8, 10.5, 'Minivan, Family Friendly, DVD Player', 75.00, 'available'),
                ('Tesla Model 3', 5, 0, 'Electric, Autopilot, Premium Sound', 100.00, 'available')
            `);
        }
    } catch (error) {
        console.error('Database setup error:', error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (err) {
                console.error('Error closing database connection:', err);
            }
        }
    }
}

async function testConnection() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        await ensureCarTableExists();
        console.log('Database connection successful and cars table ready');
        return true;
    } catch (error) {
        console.error('Database connection error:', error);
        return false;
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (err) {
                console.error('Error closing database connection:', err);
            }
        }
    }
}

module.exports = {
    dbConfig,
    testConnection,
    ensureCarTableExists
}; 