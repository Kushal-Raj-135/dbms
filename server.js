const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { dbConfig, testConnection, ensureCarTableExists } = require('./config/database');
const adminRoutes = require('./routes/admin');
const aiSuggestionRouter = require('./routes/ai-suggestion');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://car-rental-frontend-98j4.onrender.com'] 
    : 'http://localhost:3002',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Create database pool
const pool = mysql.createPool(dbConfig);

// Database middleware - MUST be before route handlers
app.use((req, res, next) => {
    req.db = pool;
    next();
});

// Mount routes AFTER database middleware
app.use('/api/ai-suggestion', aiSuggestionRouter);
app.use('/api/admin', adminRoutes);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// API Routes
// Customer Routes
app.post('/api/customers/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Email and password are required' 
      });
    }

    // Find user by email
    const query = 'SELECT * FROM Customer WHERE Email_ID = ?';
    const [users] = await pool.query(query, [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Invalid email or password' 
      });
    }

    const user = users[0];

    // Compare password
    const validPassword = await bcrypt.compare(password, user.Password);
    if (!validPassword) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.Customer_ID, email: user.Email_ID },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      status: 'success',
      message: 'Login successful',
      token: token,
      customer: {
        id: user.Customer_ID,
        name: user.Name,
        email: user.Email_ID
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'An unexpected error occurred. Please try again.' 
    });
  }
});

app.post('/api/customers/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Input validation
    if (!name || !email || !password || !phone || !address) {
      return res.status(400).json({ 
        status: 'error',
        message: 'All fields are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Invalid email format' 
      });
    }

    // Validate phone format (assuming 10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Phone number must be 10 digits' 
      });
    }

    // Check if user already exists
    const checkUserQuery = 'SELECT * FROM Customer WHERE Email_ID = ?';
    const [existingUsers] = await pool.query(checkUserQuery, [email]);
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Email already registered' 
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Trim inputs to prevent excessive length
    const trimmedName = name.substring(0, 50);
    const trimmedEmail = email.substring(0, 50);
    const trimmedPhone = phone.substring(0, 15);
    const trimmedAddress = address.substring(0, 100);

    // Insert new customer with hashed password
    const insertQuery = 'INSERT INTO Customer (Name, Email_ID, Password, Phone, Address) VALUES (?, ?, ?, ?, ?)';
    const [result] = await pool.query(
      insertQuery, 
      [trimmedName, trimmedEmail, hashedPassword, trimmedPhone, trimmedAddress]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: result.insertId, email: trimmedEmail },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      status: 'success',
      message: 'Customer registered successfully',
      token: token,
      customer: { 
        id: result.insertId, 
        name: trimmedName, 
        email: trimmedEmail 
      }
    });
  } catch (error) {
    console.error('Registration error details:', {
      error: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState
    });
    
    // Send appropriate error message based on the error type
    if (error.code === 'ER_DATA_TOO_LONG') {
      res.status(400).json({ 
        status: 'error',
        message: 'One or more fields exceed maximum length' 
      });
    } else {
      res.status(500).json({ 
        status: 'error',
        message: 'Registration failed. Please try again.' 
      });
    }
  }
});

// Car Routes
app.get('/api/cars', async (req, res) => {
  try {
    const query = 'SELECT * FROM Car WHERE Status IN ("Free", "Available")';
    const [results] = await pool.query(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cars/available', async (req, res) => {
  try {
    const query = 'SELECT * FROM Car WHERE Status IN ("Free", "Available")';
    const [results] = await pool.query(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rental Routes
app.post('/api/rentals', authenticateToken, async (req, res) => {
  try {
    const { car_id, rental_date, return_date, payment_mode = 'Cash' } = req.body;
    const customer_id = req.user.id;

    console.log('Creating rental with:', { car_id, rental_date, return_date, payment_mode, customer_id });

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check if car exists and is available
      const carCheckQuery = 'SELECT * FROM Car WHERE Car_ID = ? AND Status IN ("Free", "Available")';
      const [cars] = await connection.query(carCheckQuery, [car_id]);
      console.log('Car check result:', cars);

      if (cars.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'Car not available for rental'
        });
      }

      // Get car rent per day
      const car = cars[0];
      const rentDays = Math.ceil((new Date(return_date) - new Date(rental_date)) / (1000 * 60 * 60 * 24));
      const totalAmount = car.Rent_Per_Day * rentDays;
      console.log('Calculated rental details:', { rentDays, totalAmount });

      // Insert rental record
      const insertRentalQuery = 'INSERT INTO Rentals (Customer_ID, CAR_ID, Rental_Date, Return_Date) VALUES (?, ?, ?, ?)';
      const [rentalResult] = await connection.query(
        insertRentalQuery,
        [customer_id, car_id, rental_date, return_date]
      );
      console.log('Rental creation result:', rentalResult);

      if (!rentalResult.insertId) {
        throw new Error('Failed to create rental record - no rental ID returned');
      }

      try {
        // Insert payment record with current date
        const insertPaymentQuery = `
          INSERT INTO Payment 
            (Rental_ID, Amount, Payment_Date, Payment_Mode) 
          VALUES 
            (?, ?, CURDATE(), ?)`;
        
        // Log the exact values being inserted
        console.log('Attempting to insert payment with values:', {
          rental_id: rentalResult.insertId,
          amount: totalAmount,
          payment_mode: payment_mode
        });

        // Execute the payment insertion
        let paymentResult;
        try {
          [paymentResult] = await connection.query(
            insertPaymentQuery,
            [rentalResult.insertId, totalAmount, payment_mode]
          );
          
          console.log('Payment creation successful:', {
            insertId: paymentResult.insertId,
            affectedRows: paymentResult.affectedRows
          });
        } catch (insertError) {
          console.error('Error inserting payment:', insertError);
          throw new Error(`Failed to insert payment: ${insertError.message}`);
        }

        // Verify the payment was created
        const verifyQuery = `
          SELECT * FROM Payment 
          WHERE Payment_ID = ?`;
        
        let paymentVerification;
        try {
          [paymentVerification] = await connection.query(
            verifyQuery,
            [paymentResult.insertId]
          );
          
          console.log('Payment verification result:', {
            found: paymentVerification.length > 0,
            payment: paymentVerification[0]
          });
          
          if (paymentVerification.length === 0) {
            throw new Error('Payment verification failed - record not found after creation');
          }
        } catch (verifyError) {
          console.error('Error verifying payment:', verifyError);
          throw new Error(`Failed to verify payment: ${verifyError.message}`);
        }

        // Update car status to Rented
        const updateCarQuery = 'UPDATE Car SET Status = "Rented" WHERE Car_ID = ?';
        await connection.query(updateCarQuery, [car_id]);

        // Commit transaction
        await connection.commit();
        console.log('Transaction committed successfully');

        // Send response with payment details
        res.status(201).json({
          status: 'success',
          message: 'Rental created successfully',
          rental_id: rentalResult.insertId,
          payment: {
            payment_id: paymentVerification[0].Payment_ID,
            amount: paymentVerification[0].Amount,
            payment_date: paymentVerification[0].Payment_Date,
            payment_mode: paymentVerification[0].Payment_Mode
          }
        });
      } catch (paymentError) {
        console.error('Payment creation error:', paymentError);
        throw paymentError;
      }
    } catch (error) {
      console.error('Error during transaction:', error);
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating rental:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create rental'
    });
  }
});

// Customer Rentals Route
app.get('/api/rentals/customer', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.id;
    const query = `
      SELECT r.*, c.Company, c.Model, c.Number_Plate, c.Rent_Per_Day
      FROM Rentals r
      JOIN Car c ON r.CAR_ID = c.Car_ID
      WHERE r.Customer_ID = ?
      ORDER BY r.Rental_Date DESC`;
    
    const [rentals] = await pool.query(query, [customerId]);
    res.json(rentals);
  } catch (error) {
    console.error('Error fetching customer rentals:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch rentals'
    });
  }
});

// Employee Routes
app.post('/api/employees/login', async (req, res) => {
  try {
    const { employee_id, name } = req.body;

    // Validate input
    if (!employee_id || !name) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Employee ID and name are required' 
      });
    }

    // Find employee by ID and name
    const query = 'SELECT * FROM Employee WHERE Employee_ID = ? AND Name = ?';
    const [employees] = await pool.query(query, [employee_id, name]);
    
    if (employees.length === 0) {
      return res.status(401).json({ 
        status: 'error',
        message: 'Invalid employee credentials' 
      });
    }

    const employee = employees[0];

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: employee.Employee_ID,
        name: employee.Name,
        position: employee.Position,
        branch_id: employee.BRANCH_ID
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      status: 'success',
      message: 'Login successful',
      token: token,
      employee: {
        id: employee.Employee_ID,
        name: employee.Name,
        position: employee.Position,
        branch_id: employee.BRANCH_ID
      }
    });
  } catch (error) {
    console.error('Employee login error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'An unexpected error occurred. Please try again.' 
    });
  }
});

app.get('/api/employees', authenticateToken, async (req, res) => {
  try {
    const query = 'SELECT * FROM EMPLOYEE';
    const [results] = await pool.query(query);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all rentals (for employees)
app.get('/api/rentals/all', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT r.*, c.Name as Customer_Name, car.Model as Car_Model, car.Company
      FROM Rentals r
      JOIN Customer c ON r.Customer_ID = c.Customer_ID
      JOIN Car car ON r.CAR_ID = car.Car_ID
      ORDER BY r.Rental_Date DESC`;
    
    const [rentals] = await pool.query(query);
    res.json(rentals);
  } catch (error) {
    console.error('Error fetching rentals:', error);
    res.status(500).json({ error: 'Failed to fetch rentals' });
  }
});

// Update rental status
app.put('/api/rentals/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Get the rental to find the associated car
    const getRentalQuery = 'SELECT CAR_ID FROM Rentals WHERE Rental_ID = ?';
    const [rentals] = await pool.query(getRentalQuery, [id]);
    
    if (rentals.length === 0) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Rental not found' 
      });
    }

    const carId = rentals[0].CAR_ID;

    // If marking as completed, update the car status to Free
    if (status === 'Completed') {
      const updateCarQuery = 'UPDATE Car SET Status = "Free" WHERE Car_ID = ?';
      await pool.query(updateCarQuery, [carId]);
    }
    
    // Update the rental's return date to current date if completing early
    const updateRentalQuery = 'UPDATE Rentals SET Return_Date = CURRENT_DATE WHERE Rental_ID = ? AND Return_Date > CURRENT_DATE';
    await pool.query(updateRentalQuery, [id]);
    
    res.json({ 
      status: 'success',
      message: 'Rental status updated successfully' 
    });
  } catch (error) {
    console.error('Error updating rental status:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to update rental status' 
    });
  }
});

// Get all cars with status
app.get('/api/cars/status', authenticateToken, async (req, res) => {
  try {
    const query = 'SELECT * FROM Car ORDER BY Status, Company, Model';
    const [cars] = await pool.query(query);
    res.json(cars);
  } catch (error) {
    console.error('Error fetching car status:', error);
    res.status(500).json({ error: 'Failed to fetch car status' });
  }
});

// Update car status
app.put('/api/cars/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const query = 'UPDATE Car SET Status = ? WHERE Car_ID = ?';
    await pool.query(query, [status, id]);
    
    res.json({ message: 'Car status updated successfully' });
  } catch (error) {
    console.error('Error updating car status:', error);
    res.status(500).json({ error: 'Failed to update car status' });
  }
});

// Car Management Routes
app.post('/api/cars', authenticateToken, async (req, res) => {
  try {
    const { model, company, number_plate, rent_per_day, status, image_url } = req.body;
    
    // Input validation
    if (!model || !company || !number_plate || !rent_per_day || !status || !image_url) {
      return res.status(400).json({ 
        status: 'error',
        message: 'All fields are required' 
      });
    }

    // Validate status value
    const validStatuses = ['Free', 'Rented', 'Service'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status value. Must be one of: Free, Rented, or Service'
      });
    }

    // Validate number plate format (alphanumeric)
    if (!/^[A-Za-z0-9]+$/.test(number_plate)) {
      return res.status(400).json({
        status: 'error',
        message: 'Number plate should only contain letters and numbers'
      });
    }

    // Check if car with same number plate exists
    const checkQuery = 'SELECT * FROM Car WHERE Number_Plate = ?';
    const [existingCars] = await pool.query(checkQuery, [number_plate]);
    
    if (existingCars.length > 0) {
      return res.status(400).json({ 
        status: 'error',
        message: 'A car with this number plate already exists' 
      });
    }

    // Convert model to string if it's a number
    const modelValue = typeof model === 'number' ? model.toString() : model;

    // Insert new car with validated status
    const insertQuery = 'INSERT INTO Car (Model, Company, Number_Plate, Image_URL, Rent_Per_Day, Status) VALUES (?, ?, ?, ?, ?, ?)';
    const [result] = await pool.query(
      insertQuery, 
      [modelValue, company.substring(0, 50), number_plate.toUpperCase().substring(0, 20), image_url, rent_per_day, status]
    );
    
    res.status(201).json({
      status: 'success',
      message: 'Car added successfully',
      car_id: result.insertId
    });
  } catch (error) {
    console.error('Error adding car:', error);
    
    // Handle specific database errors
    if (error.code === 'ER_DATA_TOO_LONG') {
      res.status(400).json({
        status: 'error',
        message: 'One or more fields exceed maximum length'
      });
    } else {
      res.status(500).json({ 
        status: 'error',
        message: error.sqlMessage || 'Failed to add car' 
      });
    }
  }
});

app.put('/api/cars/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { model, company, number_plate, rent_per_day, status, image_url } = req.body;
    
    // Check if car exists
    const checkQuery = 'SELECT * FROM Car WHERE Car_ID = ?';
    const [existingCars] = await pool.query(checkQuery, [id]);
    
    if (existingCars.length === 0) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Car not found' 
      });
    }

    // Check if number plate is unique (excluding current car)
    const plateCheckQuery = 'SELECT * FROM Car WHERE Number_Plate = ? AND Car_ID != ?';
    const [existingPlates] = await pool.query(plateCheckQuery, [number_plate, id]);
    
    if (existingPlates.length > 0) {
      return res.status(400).json({ 
        status: 'error',
        message: 'A car with this number plate already exists' 
      });
    }

    // Update car details
    const updateQuery = `
      UPDATE Car 
      SET Model = ?, Company = ?, Number_Plate = ?, Image_URL = ?, Rent_Per_Day = ?, Status = ?
      WHERE Car_ID = ?
    `;
    await pool.query(updateQuery, [model, company, number_plate, image_url, rent_per_day, status, id]);
    
    res.json({
      status: 'success',
      message: 'Car updated successfully'
    });
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to update car' 
    });
  }
});

app.delete('/api/cars/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if car is currently rented
    const rentalCheckQuery = 'SELECT * FROM Rentals WHERE CAR_ID = ? AND Return_Date > CURRENT_DATE';
    const [activeRentals] = await pool.query(rentalCheckQuery, [id]);
    
    if (activeRentals.length > 0) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Cannot delete car while it is being rented' 
      });
    }

    // Delete the car
    const deleteQuery = 'DELETE FROM Car WHERE Car_ID = ?';
    const [result] = await pool.query(deleteQuery, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Car not found' 
      });
    }
    
    res.json({
      status: 'success',
      message: 'Car deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to delete car' 
    });
  }
});

// Get customer's bookings
app.get('/api/customers/bookings', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.id; // Get customer ID from the JWT token

    const query = `
      SELECT r.*, c.Model as Car_Model, c.Company
      FROM Rentals r
      JOIN Car c ON r.CAR_ID = c.Car_ID
      WHERE r.Customer_ID = ?
      ORDER BY r.Rental_Date DESC`;
    
    const [bookings] = await pool.query(query, [customerId]);
    
    // Format dates and add status if not present
    const formattedBookings = bookings.map(booking => ({
      ...booking,
      Rental_Date: new Date(booking.Rental_Date).toISOString().split('T')[0],
      Return_Date: new Date(booking.Return_Date).toISOString().split('T')[0],
      Status: booking.Status || (new Date(booking.Return_Date) < new Date() ? 'Completed' : 'Active')
    }));

    res.json(formattedBookings);
  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to fetch bookings' 
    });
  }
});

// Routes
app.use('/api/admin', adminRoutes);

// Test database connection and get schema
app.get('/api/test-connection', async (req, res) => {
    try {
        const tables = await testConnection();
        res.json({ success: true, tables });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Serve index.html for all routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 