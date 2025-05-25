# Car Rental Service

A modern web application for managing a car rental service with separate interfaces for customers, employees, and administrators.

## Features

- **Customer Interface**
  - Browse available cars
  - Make reservations
  - View rental history
  
- **Employee Interface**
  - Manage rentals
  - Update car status
  - View customer information
  
- **Admin Interface**
  - Manage employees
  - View branch information
  - Generate reports
  - Overall system management

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- Modern web browser

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd car-rental-service
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
- Make sure MySQL is running
- Create the database and tables using the provided SQL schema
- Update the database connection settings in `server.js`

4. Create a `.env` file in the root directory:
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=c1
JWT_SECRET=your_secret_key
```

5. Start the server:
```bash
npm start
```

6. Access the application:
Open your web browser and navigate to `http://localhost:3000`

## Database Schema

The application uses the following database schema:

- **Customer**: Stores customer information
- **Car**: Manages car inventory
- **Rentals**: Tracks rental transactions
- **Payment**: Records payment information
- **Branch**: Stores branch location details
- **Employee**: Manages employee information

## API Endpoints

### Customer Routes
- POST `/api/customers/register`: Register a new customer
- GET `/api/customers/:id`: Get customer details

### Car Routes
- GET `/api/cars`: Get all available cars
- PUT `/api/cars/:id`: Update car status

### Rental Routes
- POST `/api/rentals`: Create a new rental
- GET `/api/rentals`: Get all rentals
- GET `/api/rentals/:id`: Get specific rental details

### Employee Routes
- GET `/api/employees`: Get all employees
- POST `/api/employees`: Add new employee
- PUT `/api/employees/:id`: Update employee information

### Branch Routes
- GET `/api/branches`: Get all branches
- GET `/api/branches/:id`: Get specific branch details

## Security

- JWT-based authentication for employee and admin interfaces
- Password hashing using bcrypt
- Input validation and sanitization
- CORS enabled
- Environment variables for sensitive data

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 