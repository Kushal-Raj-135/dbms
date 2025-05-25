# Car Rental System API Documentation

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Base URL
All endpoints are prefixed with `/api`

## Customer Endpoints

### 1. Register Customer
- **Endpoint**: `POST /api/customers/register`
- **Authentication**: None
- **Request Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string",
    "phone": "string (10 digits)",
    "address": "string"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "message": "Customer registered successfully",
    "token": "jwt_token",
    "customer": {
      "id": "number",
      "name": "string",
      "email": "string"
    }
  }
  ```

### 2. Customer Login
- **Endpoint**: `POST /api/customers/login`
- **Authentication**: None
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "message": "Login successful",
    "token": "jwt_token",
    "customer": {
      "id": "number",
      "name": "string",
      "email": "string"
    }
  }
  ```

## Car Endpoints

### 1. Get All Available Cars
- **Endpoint**: `GET /api/cars`
- **Authentication**: None
- **Response**: Array of available cars
  ```json
  [
    {
      "Car_ID": "number",
      "Model": "string",
      "Company": "string",
      "Number_Plate": "string",
      "Status": "string",
      "Rent_Per_Day": "number"
    }
  ]
  ```

### 2. Get Available Cars
- **Endpoint**: `GET /api/cars/available`
- **Authentication**: None
- **Response**: Same as Get All Cars

## Rental Endpoints

### 1. Create New Rental
- **Endpoint**: `POST /api/rentals`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "car_id": "number",
    "rental_date": "date",
    "return_date": "date",
    "payment_mode": "string (optional, defaults to 'Cash')"
  }
  ```

## Admin Endpoints

### Dashboard

#### 1. Get Dashboard Statistics
- **Endpoint**: `GET /admin/stats`
- **Authentication**: Required (Admin)
- **Response**:
  ```json
  {
    "totalCars": "number",
    "activeRentals": "number",
    "totalCustomers": "number",
    "monthlyRevenue": "number"
  }
  ```

#### 2. Get Recent Rentals
- **Endpoint**: `GET /admin/rentals/recent`
- **Authentication**: Required (Admin)
- **Response**: Array of recent rentals (limited to 5)

### Car Management

#### 1. Get All Cars
- **Endpoint**: `GET /admin/cars`
- **Authentication**: Required (Admin)
- **Response**: Array of all cars

#### 2. Add New Car
- **Endpoint**: `POST /admin/cars`
- **Authentication**: Required (Admin)
- **Request Body**:
  ```json
  {
    "model": "string",
    "company": "string",
    "number_plate": "string",
    "rent_per_day": "number",
    "status": "string (optional)"
  }
  ```

#### 3. Get Car by ID
- **Endpoint**: `GET /admin/cars/:id`
- **Authentication**: Required (Admin)

#### 4. Update Car
- **Endpoint**: `PUT /admin/cars/:id`
- **Authentication**: Required (Admin)
- **Request Body**: Same as Add New Car

#### 5. Delete Car
- **Endpoint**: `DELETE /admin/cars/:id`
- **Authentication**: Required (Admin)

### Rental Management

#### 1. Get All Rentals
- **Endpoint**: `GET /admin/rentals`
- **Authentication**: Required (Admin)
- **Response**: Array of all rentals with customer and car details

#### 2. Get Rental Details
- **Endpoint**: `GET /admin/rentals/:id`
- **Authentication**: Required (Admin)
- **Response**: Detailed rental information including customer and payment details

### Customer Management

#### 1. Get All Customers
- **Endpoint**: `GET /admin/customers`
- **Authentication**: Required (Admin)
- **Response**: Array of all customers with rental statistics

#### 2. Get Customer Details
- **Endpoint**: `GET /admin/customers/:id`
- **Authentication**: Required (Admin)
- **Response**: Detailed customer information with rental history

## Error Responses
All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "status": "error",
  "message": "Description of the error"
}
```

### 401 Unauthorized
```json
{
  "status": "error",
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "status": "error",
  "message": "Access denied"
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "An unexpected error occurred"
}
``` 