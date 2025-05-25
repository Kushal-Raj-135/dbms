const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Get Dashboard Statistics
router.get('/stats', async (req, res) => {
    try {
        const [totalCars] = await pool.query('SELECT COUNT(*) as count FROM Car');
        const [activeRentals] = await pool.query('SELECT COUNT(*) as count FROM Rentals WHERE Return_Date >= CURRENT_DATE()');
        const [totalCustomers] = await pool.query('SELECT COUNT(*) as count FROM Customer');
        const [monthlyRevenue] = await pool.query(`
            SELECT COALESCE(SUM(Amount), 0) as revenue 
            FROM Payment p
            JOIN Rentals r ON p.Rental_ID = r.Rental_ID
            WHERE MONTH(p.Payment_Date) = MONTH(CURRENT_DATE()) 
            AND YEAR(p.Payment_Date) = YEAR(CURRENT_DATE())
        `);

        res.json({
            totalCars: totalCars[0].count,
            activeRentals: activeRentals[0].count,
            totalCustomers: totalCustomers[0].count,
            monthlyRevenue: monthlyRevenue[0].revenue
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Recent Rentals
router.get('/rentals/recent', async (req, res) => {
    try {
        const [rentals] = await pool.query(`
            SELECT 
                r.Rental_ID,
                c.Name as customer_name,
                CONCAT(ca.Company, ' ', ca.Model) as car_model,
                r.Rental_Date as start_date,
                r.Return_Date as end_date,
                CASE 
                    WHEN r.Return_Date < CURRENT_DATE() THEN 'Completed'
                    ELSE 'Active'
                END as Status,
                p.Amount as total_amount
            FROM Rentals r
            JOIN Customer c ON r.Customer_ID = c.Customer_ID
            JOIN Car ca ON r.CAR_ID = ca.Car_ID
            LEFT JOIN Payment p ON r.Rental_ID = p.Rental_ID
            ORDER BY r.Rental_Date DESC
            LIMIT 5
        `);
        res.json(rentals);
    } catch (error) {
        console.error('Error fetching recent rentals:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get All Cars
router.get('/cars', async (req, res) => {
    try {
        const [cars] = await pool.query(`
            SELECT 
                Car_ID as car_id,
                Model as model,
                Company as company,
                Number_Plate as number_plate,
                Status as status,
                Rent_Per_Day as rent_per_day
            FROM Car
        `);
        res.json(cars);
    } catch (error) {
        console.error('Error fetching cars:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add New Car
router.post('/cars', async (req, res) => {
    try {
        const { model, company, number_plate, rent_per_day, status } = req.body;
        const [result] = await pool.query(
            'INSERT INTO Car (Model, Company, Number_Plate, Rent_Per_Day, Status) VALUES (?, ?, ?, ?, ?)',
            [model, company, number_plate, rent_per_day, status || 'Free']
        );
        res.status(201).json({ id: result.insertId, message: 'Car added successfully' });
    } catch (error) {
        console.error('Error adding car:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Car by ID
router.get('/cars/:id', async (req, res) => {
    try {
        const [car] = await pool.query(`
            SELECT 
                Car_ID as car_id,
                Model as model,
                Company as company,
                Number_Plate as number_plate,
                Status as status,
                Rent_Per_Day as rent_per_day
            FROM Car 
            WHERE Car_ID = ?
        `, [req.params.id]);
        
        if (car.length === 0) {
            return res.status(404).json({ error: 'Car not found' });
        }
        res.json(car[0]);
    } catch (error) {
        console.error('Error fetching car:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update Car
router.put('/cars/:id', async (req, res) => {
    try {
        const { model, company, number_plate, rent_per_day, status } = req.body;
        await pool.query(
            'UPDATE Car SET Model = ?, Company = ?, Number_Plate = ?, Rent_Per_Day = ?, Status = ? WHERE Car_ID = ?',
            [model, company, number_plate, rent_per_day, status || 'Free', req.params.id]
        );
        res.json({ message: 'Car updated successfully' });
    } catch (error) {
        console.error('Error updating car:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete Car
router.delete('/cars/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM Car WHERE Car_ID = ?', [req.params.id]);
        res.json({ message: 'Car deleted successfully' });
    } catch (error) {
        console.error('Error deleting car:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get All Rentals
router.get('/rentals', async (req, res) => {
    try {
        const [rentals] = await pool.query(`
            SELECT 
                r.Rental_ID,
                c.Name as customer_name,
                CONCAT(ca.Company, ' ', ca.Model) as car_model,
                r.Rental_Date as start_date,
                r.Return_Date as end_date,
                CASE 
                    WHEN r.Return_Date < CURRENT_DATE() THEN 'Completed'
                    ELSE 'Active'
                END as Status,
                p.Payment_ID,
                p.Amount as total_amount
            FROM Rentals r
            JOIN Customer c ON r.Customer_ID = c.Customer_ID
            JOIN Car ca ON r.CAR_ID = ca.Car_ID
            LEFT JOIN Payment p ON r.Rental_ID = p.Rental_ID
            ORDER BY r.Rental_Date DESC
        `);
        res.json(rentals);
    } catch (error) {
        console.error('Error fetching rentals:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Rental Details
router.get('/rentals/:id', async (req, res) => {
    try {
        const [rental] = await pool.query(`
            SELECT 
                r.Rental_ID,
                c.Name as customer_name,
                c.Email_ID as customer_email,
                c.Phone as customer_phone,
                c.Address as customer_address,
                ca.Company as car_company,
                ca.Model as car_model,
                ca.Number_Plate as number_plate,
                r.Rental_Date as start_date,
                r.Return_Date as end_date,
                CASE 
                    WHEN r.Return_Date < CURRENT_DATE() THEN 'Completed'
                    ELSE 'Active'
                END as Status,
                p.Amount as total_amount,
                p.Payment_Mode as payment_mode,
                p.Payment_Date as payment_date
            FROM Rentals r
            JOIN Customer c ON r.Customer_ID = c.Customer_ID
            JOIN Car ca ON r.CAR_ID = ca.Car_ID
            LEFT JOIN Payment p ON r.Rental_ID = p.Rental_ID
            WHERE r.Rental_ID = ?
        `, [req.params.id]);

        if (rental.length === 0) {
            return res.status(404).json({ error: 'Rental not found' });
        }
        res.json(rental[0]);
    } catch (error) {
        console.error('Error fetching rental details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get All Customers
router.get('/customers', async (req, res) => {
    try {
        const [customers] = await pool.query(`
            SELECT 
                c.Customer_ID as customer_id,
                c.Name as name,
                c.Email_ID as email,
                c.Phone as phone,
                c.Address as address,
                COUNT(r.Rental_ID) as total_rentals
            FROM Customer c
            LEFT JOIN Rentals r ON c.Customer_ID = r.Customer_ID
            GROUP BY c.Customer_ID
            ORDER BY c.Customer_ID DESC
        `);
        // Remove password field from response for security
        res.json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get Customer Details with Rental History
router.get('/customers/:id', async (req, res) => {
    try {
        const [customer] = await pool.query(`
            SELECT 
                c.Customer_ID,
                c.Name as name,
                c.Email_ID as email,
                c.Phone as phone,
                c.Address as address
            FROM Customer c
            WHERE c.Customer_ID = ?
        `, [req.params.id]);

        if (customer.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const [rentals] = await pool.query(`
            SELECT 
                r.Rental_ID,
                CONCAT(ca.Company, ' ', ca.Model) as car_model,
                r.Rental_Date as start_date,
                r.Return_Date as end_date,
                CASE 
                    WHEN r.Return_Date < CURRENT_DATE() THEN 'Completed'
                    ELSE 'Active'
                END as Status,
                p.Amount as total_amount,
                p.Payment_Mode as payment_mode
            FROM Rentals r
            JOIN Car ca ON r.CAR_ID = ca.Car_ID
            LEFT JOIN Payment p ON r.Rental_ID = p.Rental_ID
            WHERE r.Customer_ID = ?
            ORDER BY r.Rental_Date DESC
        `, [req.params.id]);

        const customerData = customer[0];
        customerData.rentals = rentals;
        res.json(customerData);
    } catch (error) {
        console.error('Error fetching customer details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add New Customer
router.post('/customers', async (req, res) => {
    const { name, email, phone, address, password } = req.body;
    try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Validate phone number (assuming 10 digits)
        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        // Check if email already exists
        const [existingCustomer] = await pool.query('SELECT Customer_ID FROM Customer WHERE Email_ID = ?', [email]);
        if (existingCustomer.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        const [result] = await pool.query(
            'INSERT INTO Customer (Name, Email_ID, Phone, Address, Password) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, address, password]
        );

        const [newCustomer] = await pool.query(`
            SELECT Customer_ID, Name, Email_ID, Phone, Address 
            FROM Customer 
            WHERE Customer_ID = ?
        `, [result.insertId]);

        res.status(201).json(newCustomer[0]);
    } catch (error) {
        console.error('Error adding customer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update Customer
router.put('/customers/:id', async (req, res) => {
    const { name, email, phone, address, password } = req.body;
    try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Validate phone number (assuming 10 digits)
        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        // Check if email already exists for other customers
        const [existingCustomer] = await pool.query(
            'SELECT Customer_ID FROM Customer WHERE Email_ID = ? AND Customer_ID != ?', 
            [email, req.params.id]
        );
        if (existingCustomer.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        let query = 'UPDATE Customer SET Name = ?, Email_ID = ?, Phone = ?, Address = ?';
        let params = [name, email, phone, address];

        // Only update password if provided
        if (password) {
            query += ', Password = ?';
            params.push(password);
        }

        query += ' WHERE Customer_ID = ?';
        params.push(req.params.id);

        await pool.query(query, params);

        const [updatedCustomer] = await pool.query(`
            SELECT Customer_ID, Name, Email_ID, Phone, Address 
            FROM Customer 
            WHERE Customer_ID = ?
        `, [req.params.id]);

        if (updatedCustomer.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(updatedCustomer[0]);
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete Customer
router.delete('/customers/:id', async (req, res) => {
    try {
        // Check if customer has any active rentals
        const [activeRentals] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM Rentals 
            WHERE Customer_ID = ? AND Return_Date >= CURRENT_DATE()
        `, [req.params.id]);

        if (activeRentals[0].count > 0) {
            return res.status(400).json({ error: 'Cannot delete customer with active rentals' });
        }

        const [result] = await pool.query('DELETE FROM Customer WHERE Customer_ID = ?', [req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Employee Management Routes
router.get('/employees', async (req, res) => {
    try {
        const [employees] = await pool.query(`
            SELECT e.*, b.Location as branch_location 
            FROM EMPLOYEE e 
            LEFT JOIN BRANCH b ON e.BRANCH_ID = b.Branch_ID
            ORDER BY e.Employee_ID DESC
        `);
        res.json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/employees/:id', async (req, res) => {
    try {
        const [employees] = await pool.query(`
            SELECT e.*, b.Location as branch_location, b.Contact_Number as branch_contact
            FROM EMPLOYEE e 
            LEFT JOIN BRANCH b ON e.BRANCH_ID = b.Branch_ID
            WHERE e.Employee_ID = ?
        `, [req.params.id]);

        if (employees.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json(employees[0]);
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/employees', async (req, res) => {
    const { name, branch_id, position, salary } = req.body;
    try {
        const [result] = await pool.query(`
            INSERT INTO EMPLOYEE (Name, BRANCH_ID, Position, Salary)
            VALUES (?, ?, ?, ?)
        `, [name, branch_id, position, salary]);

        const [newEmployee] = await pool.query(`
            SELECT e.*, b.Location as branch_location
            FROM EMPLOYEE e 
            LEFT JOIN BRANCH b ON e.BRANCH_ID = b.Branch_ID
            WHERE e.Employee_ID = ?
        `, [result.insertId]);

        res.status(201).json(newEmployee[0]);
    } catch (error) {
        console.error('Error adding employee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/employees/:id', async (req, res) => {
    const { name, branch_id, position, salary } = req.body;
    try {
        await pool.query(`
            UPDATE EMPLOYEE 
            SET Name = ?, BRANCH_ID = ?, Position = ?, Salary = ?
            WHERE Employee_ID = ?
        `, [name, branch_id, position, salary, req.params.id]);

        const [updatedEmployee] = await pool.query(`
            SELECT e.*, b.Location as branch_location
            FROM EMPLOYEE e 
            LEFT JOIN BRANCH b ON e.BRANCH_ID = b.Branch_ID
            WHERE e.Employee_ID = ?
        `, [req.params.id]);

        if (updatedEmployee.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json(updatedEmployee[0]);
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/employees/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM EMPLOYEE WHERE Employee_ID = ?', [req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all branches for employee form
router.get('/branches', async (req, res) => {
    try {
        const [branches] = await pool.query('SELECT * FROM BRANCH ORDER BY Location');
        res.json(branches);
    } catch (error) {
        console.error('Error fetching branches:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reports Routes
router.get('/reports/revenue', async (req, res) => {
    try {
        // Check if required tables exist
        const [tables] = await pool.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME IN ('Payment', 'Car', 'Rentals', 'BRANCH', 'EMPLOYEE')
        `);

        const existingTables = tables.map(t => t.TABLE_NAME);
        
        // Monthly revenue for the current year
        let monthlyRevenue = [];
        if (existingTables.includes('Payment') && existingTables.includes('Rentals')) {
            [monthlyRevenue] = await pool.query(`
                SELECT 
                    MONTH(p.Payment_Date) as month,
                    YEAR(p.Payment_Date) as year,
                    COALESCE(SUM(p.Amount), 0) as total_revenue
                FROM Payment p
                WHERE YEAR(p.Payment_Date) = YEAR(CURRENT_DATE())
                GROUP BY MONTH(p.Payment_Date), YEAR(p.Payment_Date)
                ORDER BY year, month
            `);
        }

        // Revenue by car category
        let carRevenue = [];
        if (existingTables.includes('Car') && existingTables.includes('Rentals') && existingTables.includes('Payment')) {
            [carRevenue] = await pool.query(`
                SELECT 
                    c.Company,
                    COUNT(r.Rental_ID) as total_rentals,
                    COALESCE(SUM(p.Amount), 0) as total_revenue
                FROM Car c
                LEFT JOIN Rentals r ON c.Car_ID = r.CAR_ID
                LEFT JOIN Payment p ON r.Rental_ID = p.Rental_ID
                GROUP BY c.Company
                ORDER BY total_revenue DESC
            `);
        }

        // Branch performance
        let branchPerformance = [];
        if (existingTables.includes('BRANCH') && existingTables.includes('EMPLOYEE')) {
            [branchPerformance] = await pool.query(`
                SELECT 
                    b.Location,
                    COUNT(DISTINCT e.Employee_ID) as total_employees,
                    COUNT(DISTINCT r.Rental_ID) as total_rentals,
                    COALESCE(SUM(p.Amount), 0) as total_revenue
                FROM BRANCH b
                LEFT JOIN EMPLOYEE e ON b.Branch_ID = e.BRANCH_ID
                LEFT JOIN Rentals r ON b.Branch_ID = r.Branch_ID
                LEFT JOIN Payment p ON r.Rental_ID = p.Rental_ID
                GROUP BY b.Branch_ID, b.Location
                ORDER BY total_revenue DESC
            `);
        }

        // If no data is available, provide default empty structures
        if (monthlyRevenue.length === 0) {
            const currentMonth = new Date().getMonth() + 1;
            const currentYear = new Date().getFullYear();
            monthlyRevenue = [{
                month: currentMonth,
                year: currentYear,
                total_revenue: 0
            }];
        }

        if (carRevenue.length === 0) {
            carRevenue = [{
                Company: 'No Data',
                total_rentals: 0,
                total_revenue: 0
            }];
        }

        if (branchPerformance.length === 0) {
            branchPerformance = [{
                Location: 'No Data',
                total_employees: 0,
                total_rentals: 0,
                total_revenue: 0
            }];
        }

        res.json({
            monthlyRevenue,
            carRevenue,
            branchPerformance
        });
    } catch (error) {
        console.error('Error fetching report data:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

router.get('/reports/rentals', async (req, res) => {
    try {
        // Rental trends
        const [rentalTrends] = await pool.query(`
            SELECT 
                DATE_FORMAT(r.Rental_Date, '%Y-%m') as period,
                COUNT(*) as total_rentals,
                COUNT(DISTINCT r.Customer_ID) as unique_customers
            FROM Rentals r
            WHERE r.Rental_Date >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
            GROUP BY period
            ORDER BY period
        `);

        // Popular cars
        const [popularCars] = await pool.query(`
            SELECT 
                CONCAT(c.Company, ' ', c.Model) as car_name,
                COUNT(r.Rental_ID) as rental_count,
                AVG(DATEDIFF(r.Return_Date, r.Rental_Date)) as avg_rental_duration
            FROM Car c
            LEFT JOIN Rentals r ON c.Car_ID = r.CAR_ID
            GROUP BY c.Car_ID, car_name
            ORDER BY rental_count DESC
            LIMIT 10
        `);

        // Customer segments
        const [customerSegments] = await pool.query(`
            SELECT 
                CASE 
                    WHEN rental_count >= 5 THEN 'Premium'
                    WHEN rental_count >= 3 THEN 'Regular'
                    ELSE 'Occasional'
                END as customer_segment,
                COUNT(*) as customer_count
            FROM (
                SELECT 
                    Customer_ID,
                    COUNT(*) as rental_count
                FROM Rentals
                GROUP BY Customer_ID
            ) as customer_rentals
            GROUP BY customer_segment
            ORDER BY customer_count DESC
        `);

        res.json({
            rentalTrends,
            popularCars,
            customerSegments
        });
    } catch (error) {
        console.error('Error fetching rental reports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/reports/employees', async (req, res) => {
    try {
        // Employee performance
        const [employeePerformance] = await pool.query(`
            SELECT 
                e.Employee_ID,
                e.Name,
                e.Position,
                b.Location as branch,
                COUNT(r.Rental_ID) as rentals_handled,
                SUM(p.Amount) as revenue_generated
            FROM EMPLOYEE e
            LEFT JOIN BRANCH b ON e.BRANCH_ID = b.Branch_ID
            LEFT JOIN Rentals r ON e.Employee_ID = r.Employee_ID
            LEFT JOIN Payment p ON r.Rental_ID = p.Rental_ID
            GROUP BY e.Employee_ID, e.Name, e.Position, b.Location
            ORDER BY revenue_generated DESC
        `);

        // Department distribution
        const [departmentStats] = await pool.query(`
            SELECT 
                Position,
                COUNT(*) as employee_count,
                AVG(Salary) as avg_salary
            FROM EMPLOYEE
            GROUP BY Position
            ORDER BY employee_count DESC
        `);

        res.json({
            employeePerformance,
            departmentStats
        });
    } catch (error) {
        console.error('Error fetching employee reports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Payment Report
router.post('/payment-report', async (req, res) => {
    try {
        const { start_date, end_date } = req.body;

        // Get payment summary
        const [summary] = await pool.query(`
            SELECT 
                COUNT(*) as total_payments,
                COALESCE(SUM(Amount), 0) as total_amount
            FROM Payment
            WHERE Payment_Date BETWEEN ? AND ?
        `, [start_date, end_date]);

        // Get payment mode distribution
        const [paymentModes] = await pool.query(`
            SELECT 
                Payment_Mode,
                COUNT(*) as count,
                SUM(Amount) as total_amount
            FROM Payment
            WHERE Payment_Date BETWEEN ? AND ?
            GROUP BY Payment_Mode
        `, [start_date, end_date]);

        // Get detailed payment data
        const [payments] = await pool.query(`
            SELECT 
                p.Payment_ID,
                p.Payment_Date,
                c.Name as Customer_Name,
                CONCAT(ca.Company, ' ', ca.Model) as Model,
                p.Amount,
                p.Payment_Mode
            FROM Payment p
            JOIN Rentals r ON p.Rental_ID = r.Rental_ID
            JOIN Customer c ON r.Customer_ID = c.Customer_ID
            JOIN Car ca ON r.CAR_ID = ca.Car_ID
            WHERE p.Payment_Date BETWEEN ? AND ?
            ORDER BY p.Payment_Date DESC
        `, [start_date, end_date]);

        // Format payment modes for the response
        const payment_modes = {};
        paymentModes.forEach(mode => {
            payment_modes[mode.Payment_Mode] = {
                count: mode.count,
                total_amount: mode.total_amount
            };
        });

        res.json({
            summary: {
                total_payments: summary[0].total_payments,
                total_amount: summary[0].total_amount,
                payment_modes
            },
            payments
        });
    } catch (error) {
        console.error('Error fetching payment report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Clear Data Endpoints
router.delete('/clear/dashboard', async (req, res) => {
    try {
        // Clear dashboard-related data (stats and recent rentals)
        await pool.query('TRUNCATE TABLE Stats');
        await pool.query('DELETE FROM Rentals WHERE DATEDIFF(CURRENT_DATE, start_date) <= 30');
        res.json({ message: 'Dashboard data cleared successfully' });
    } catch (error) {
        console.error('Error clearing dashboard data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/clear/rentals', async (req, res) => {
    try {
        // Delete all rental records
        await pool.query('TRUNCATE TABLE Rentals');
        res.json({ message: 'Rentals data cleared successfully' });
    } catch (error) {
        console.error('Error clearing rentals data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/clear/reports', async (req, res) => {
    try {
        // Clear reports and payments data
        await pool.query('TRUNCATE TABLE Payment');
        await pool.query('TRUNCATE TABLE Reports');
        res.json({ message: 'Reports data cleared successfully' });
    } catch (error) {
        console.error('Error clearing reports data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/clear/payments', async (req, res) => {
    try {
        // Clear all payment records
        await pool.query('TRUNCATE TABLE Payment');
        res.json({ message: 'Payments data cleared successfully' });
    } catch (error) {
        console.error('Error clearing payments data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/clear/cars', async (req, res) => {
    try {
        // Check if any cars are currently rented
        const [rentedCars] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM Car c 
            JOIN Rentals r ON c.Car_ID = r.Car_ID 
            WHERE r.Return_Date >= CURRENT_DATE
        `);

        if (rentedCars[0].count > 0) {
            return res.status(400).json({ error: 'Cannot clear cars data while there are active rentals' });
        }

        // Clear all car records
        await pool.query('TRUNCATE TABLE Car');
        res.json({ message: 'Cars data cleared successfully' });
    } catch (error) {
        console.error('Error clearing cars data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/clear/customers', async (req, res) => {
    try {
        // Check if any customers have active rentals
        const [activeRentals] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM Customer c 
            JOIN Rentals r ON c.Customer_ID = r.Customer_ID 
            WHERE r.Return_Date >= CURRENT_DATE
        `);

        if (activeRentals[0].count > 0) {
            return res.status(400).json({ error: 'Cannot clear customers data while there are active rentals' });
        }

        // Clear all customer records
        await pool.query('TRUNCATE TABLE Customer');
        res.json({ message: 'Customers data cleared successfully' });
    } catch (error) {
        console.error('Error clearing customers data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/clear/employees', async (req, res) => {
    try {
        // Clear all employee records
        await pool.query('TRUNCATE TABLE Employee');
        res.json({ message: 'Employees data cleared successfully' });
    } catch (error) {
        console.error('Error clearing employees data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 