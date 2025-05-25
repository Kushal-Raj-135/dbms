// Admin Dashboard Functionality
const API_BASE_URL = 'http://localhost:3002/api';

let charts = {
    revenue: {},
    rentals: {},
    employees: {}
};

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the dashboard
    loadDashboardStats();
    loadRecentRentals();

    // Navigation handling
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('href').substring(1);
            handleNavigation(section);
        });
    });

    // Add New Car button handling
    document.querySelector('.btn-primary').addEventListener('click', showAddCarModal);
});

// Load Dashboard Statistics
async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/stats`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        const stats = await response.json();
        
        // Update statistics cards
        document.querySelector('[data-stat="total-cars"] .stat-value').textContent = stats.totalCars || '0';
        document.querySelector('[data-stat="active-rentals"] .stat-value').textContent = stats.activeRentals || '0';
        document.querySelector('[data-stat="total-customers"] .stat-value').textContent = stats.totalCustomers || '0';
        document.querySelector('[data-stat="monthly-revenue"] .stat-value').textContent = `$${(stats.monthlyRevenue || 0).toLocaleString()}`;
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showError('Failed to load dashboard statistics');
    }
}

// Load Recent Rentals
async function loadRecentRentals() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/rentals/recent`);
        if (!response.ok) throw new Error('Failed to fetch rentals');
        const rentals = await response.json();
        
        const tbody = document.querySelector('.data-table tbody');
        if (!Array.isArray(rentals)) {
            throw new Error('Invalid rentals data received');
        }
        
        tbody.innerHTML = rentals.map(rental => `
            <tr>
                <td>#${rental.Rental_ID}</td>
                <td>${rental.customer_name}</td>
                <td>${rental.car_model}</td>
                <td>${new Date(rental.start_date).toLocaleDateString()}</td>
                <td>${new Date(rental.end_date).toLocaleDateString()}</td>
                <td><span class="status-badge status-${rental.Status.toLowerCase()}">${rental.Status}</span></td>
                <td>
                    <button class="btn btn-primary" onclick="viewRentalDetails(${rental.Rental_ID})">View Details</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading recent rentals:', error);
        showError('Failed to load recent rentals');
    }
}

// Handle Navigation
async function handleNavigation(section) {
    // Update active state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${section}`) {
            link.classList.add('active');
        }
    });

    // Clear main content
    const mainContent = document.querySelector('.main-content');
    mainContent.innerHTML = '<div class="header"><h2>Loading...</h2></div>';

    try {
        switch (section) {
            case 'dashboard':
                // Reload dashboard data
                mainContent.innerHTML = `
                    <div class="header">
                        <h2>Dashboard Overview</h2>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-card" data-stat="total-cars">
                            <h3>Total Cars</h3>
                            <div class="stat-value">--</div>
                        </div>
                        <div class="stat-card" data-stat="active-rentals">
                            <h3>Active Rentals</h3>
                            <div class="stat-value">--</div>
                        </div>
                        <div class="stat-card" data-stat="total-customers">
                            <h3>Total Customers</h3>
                            <div class="stat-value">--</div>
                        </div>
                        <div class="stat-card" data-stat="monthly-revenue">
                            <h3>Monthly Revenue</h3>
                            <div class="stat-value">--</div>
                        </div>
                    </div>
                    <div class="table-container">
                        <div class="table-header">
                            <h3 class="table-title">Recent Rentals</h3>
                        </div>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Rental ID</th>
                                    <th>Customer</th>
                                    <th>Car</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colspan="7">Loading...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `;
                await loadDashboardStats();
                await loadRecentRentals();
                break;
            case 'cars':
                await loadCarsManagement();
                break;
            case 'rentals':
                await loadRentalsManagement();
                break;
            case 'customers':
                await loadCustomersManagement();
                break;
            case 'employees':
                await loadEmployeesManagement();
                break;
            case 'reports':
                await loadReportsManagement();
                break;
            default:
                mainContent.innerHTML = '<div class="header"><h2>Section not implemented yet</h2></div>';
        }
    } catch (error) {
        console.error('Error handling navigation:', error);
        showError('Failed to load section');
    }
}

// Cars Management
async function loadCarsManagement() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/cars`);
        if (!response.ok) throw new Error('Failed to fetch cars');
        const cars = await response.json();
        
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <div class="header">
                <h2>Cars Management</h2>
                <div class="header-actions">
                    <button class="btn btn-danger" onclick="clearCarsData()">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                        Clear Data
                    </button>
                    <button class="btn btn-primary" onclick="showAddCarModal()">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                        Add New Car
                    </button>
                </div>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Car ID</th>
                            <th>Model Year</th>
                            <th>Company</th>
                            <th>Number Plate</th>
                            <th>Status</th>
                            <th>Rent/Day</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cars.map(car => `
                            <tr>
                                <td>#${car.car_id}</td>
                                <td>${car.model}</td>
                                <td>${car.company}</td>
                                <td>${car.number_plate}</td>
                                <td><span class="status-badge status-${(car.status || '').toLowerCase()}">${car.status || 'N/A'}</span></td>
                                <td>$${car.rent_per_day}</td>
                                <td>
                                    <button class="btn btn-primary" onclick="editCar(${car.car_id})">Edit</button>
                                    <button class="btn btn-danger" onclick="deleteCar(${car.car_id})">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Error loading cars management:', error);
        showError('Failed to load cars management');
    }
}

// Rentals Management
async function loadRentalsManagement() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/rentals`);
        if (!response.ok) throw new Error('Failed to fetch rentals');
        const rentals = await response.json();
        
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <div class="header">
                <h2>Rentals Management</h2>
                <div class="header-actions">
                    <button class="btn btn-danger" onclick="clearRentalsData()">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                        Clear Data
                    </button>
                </div>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Rental ID</th>
                            <th>Customer</th>
                            <th>Car</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Status</th>
                            <th>Payment ID</th>
                            <th>Amount</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rentals.map(rental => `
                            <tr>
                                <td>#${rental.Rental_ID}</td>
                                <td>${rental.customer_name}</td>
                                <td>${rental.car_model}</td>
                                <td>${new Date(rental.start_date).toLocaleDateString()}</td>
                                <td>${new Date(rental.end_date).toLocaleDateString()}</td>
                                <td><span class="status-badge status-${rental.Status.toLowerCase()}">${rental.Status}</span></td>
                                <td>${rental.Payment_ID ? `#${rental.Payment_ID}` : 'N/A'}</td>
                                <td>${rental.total_amount ? `₹${rental.total_amount.toLocaleString('en-IN')}` : 'N/A'}</td>
                                <td>
                                    <button class="btn btn-primary" onclick="viewRentalDetails(${rental.Rental_ID})">View</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Error loading rentals management:', error);
        showError('Failed to load rentals management');
    }
}

// Customers Management
async function loadCustomersManagement() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/customers`);
        if (!response.ok) throw new Error('Failed to fetch customers');
        const customers = await response.json();
        
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <div class="header">
                <h2>Customers Management</h2>
                <div class="header-actions">
                    <button class="btn btn-danger" onclick="clearCustomersData()">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                        Clear Data
                    </button>
                    <button class="btn btn-primary" onclick="showAddCustomerModal()">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                        Add New Customer
                    </button>
                </div>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Address</th>
                            <th>Total Rentals</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${customers.map(customer => `
                            <tr>
                                <td>#${customer.customer_id}</td>
                                <td>${customer.name}</td>
                                <td>${customer.email}</td>
                                <td>${customer.phone}</td>
                                <td>${customer.address}</td>
                                <td>${customer.total_rentals}</td>
                                <td>
                                    <button class="btn btn-primary" onclick="editCustomer(${customer.customer_id})">Edit</button>
                                    <button class="btn btn-danger" onclick="deleteCustomer(${customer.customer_id})">Delete</button>
                                    <button class="btn btn-success" onclick="viewCustomerDetails(${customer.customer_id})">View</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Error loading customers management:', error);
        showError('Failed to load customers management');
    }
}

// Employees Management
async function loadEmployeesManagement() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/employees`);
        if (!response.ok) throw new Error('Failed to fetch employees');
        const employees = await response.json();
        
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <div class="header">
                <h2>Employees Management</h2>
                <div class="header-actions">
                    <button class="btn btn-danger" onclick="clearEmployeesData()">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                        Clear Data
                    </button>
                    <button class="btn btn-primary" onclick="showAddEmployeeModal()">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                        </svg>
                        Add New Employee
                    </button>
                </div>
            </div>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Position</th>
                            <th>Branch</th>
                            <th>Salary</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${employees.map(employee => `
                            <tr>
                                <td>#${employee.Employee_ID}</td>
                                <td>${employee.Name}</td>
                                <td>${employee.Position}</td>
                                <td>${employee.branch_location || 'N/A'}</td>
                                <td>$${employee.Salary.toLocaleString()}</td>
                                <td>
                                    <button class="btn btn-primary" onclick="editEmployee(${employee.Employee_ID})">Edit</button>
                                    <button class="btn btn-danger" onclick="deleteEmployee(${employee.Employee_ID})">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) {
        console.error('Error loading employees management:', error);
        showError('Failed to load employees management');
    }
}

// Add Employee Modal
async function showAddEmployeeModal() {
    try {
        const branchResponse = await fetch(`${API_BASE_URL}/admin/branches`);
        if (!branchResponse.ok) throw new Error('Failed to fetch branches');
        const branches = await branchResponse.json();

        const content = {
            title: 'Add New Employee',
            body: `
                <form id="add-employee-form" onsubmit="handleAddEmployee(event)">
                    <div class="form-group">
                        <label class="form-label">Name</label>
                        <input type="text" class="form-input" name="name" required maxlength="20">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Position</label>
                        <input type="text" class="form-input" name="position" required maxlength="20">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Branch</label>
                        <select class="form-input" name="branch_id" required>
                            <option value="">Select Branch</option>
                            ${branches.map(branch => `
                                <option value="${branch.Branch_ID}">${branch.Location}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Salary</label>
                        <input type="number" class="form-input" name="salary" required min="0">
                    </div>
                    <button type="submit" class="btn btn-primary">Add Employee</button>
                </form>
            `
        };
        showModal(content);
    } catch (error) {
        console.error('Error showing add employee modal:', error);
        showError('Failed to load branch data');
    }
}

async function handleAddEmployee(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const employeeData = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_BASE_URL}/admin/employees`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(employeeData)
        });

        if (!response.ok) throw new Error('Failed to add employee');

        showSuccess('Employee added successfully');
        closeModal(form);
        loadEmployeesManagement();
    } catch (error) {
        console.error('Error adding employee:', error);
        showError('Failed to add employee');
    }
}

// Edit Employee Modal
async function editEmployee(employeeId) {
    try {
        const [employeeResponse, branchResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/admin/employees/${employeeId}`),
            fetch(`${API_BASE_URL}/admin/branches`)
        ]);

        if (!employeeResponse.ok || !branchResponse.ok) {
            throw new Error('Failed to fetch data');
        }

        const employee = await employeeResponse.json();
        const branches = await branchResponse.json();

        const content = {
            title: 'Edit Employee',
            body: `
                <form id="edit-employee-form" onsubmit="handleEditEmployee(event, ${employeeId})">
                    <div class="form-group">
                        <label class="form-label">Name</label>
                        <input type="text" class="form-input" name="name" value="${employee.Name}" required maxlength="20">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Position</label>
                        <input type="text" class="form-input" name="position" value="${employee.Position}" required maxlength="20">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Branch</label>
                        <select class="form-input" name="branch_id" required>
                            <option value="">Select Branch</option>
                            ${branches.map(branch => `
                                <option value="${branch.Branch_ID}" ${branch.Branch_ID === employee.BRANCH_ID ? 'selected' : ''}>
                                    ${branch.Location}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Salary</label>
                        <input type="number" class="form-input" name="salary" value="${employee.Salary}" required min="0">
                    </div>
                    <button type="submit" class="btn btn-primary">Update Employee</button>
                </form>
            `
        };
        showModal(content);
    } catch (error) {
        console.error('Error loading employee details:', error);
        showError('Failed to load employee details');
    }
}

async function handleEditEmployee(event, employeeId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const employeeData = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_BASE_URL}/admin/employees/${employeeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(employeeData)
        });

        if (!response.ok) throw new Error('Failed to update employee');

        showSuccess('Employee updated successfully');
        closeModal(form);
        loadEmployeesManagement();
    } catch (error) {
        console.error('Error updating employee:', error);
        showError('Failed to update employee');
    }
}

// Delete Employee
async function deleteEmployee(employeeId) {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/employees/${employeeId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete employee');

        showSuccess('Employee deleted successfully');
        loadEmployeesManagement();
    } catch (error) {
        console.error('Error deleting employee:', error);
        showError('Failed to delete employee');
    }
}

// Error Handling
function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger';
    alert.textContent = message;
    document.querySelector('.main-content').prepend(alert);
    setTimeout(() => alert.remove(), 5000);
}

// Modal Functions
function showModal(content) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${content.title}</h3>
                <button class="close-modal" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                ${content.body}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
    });
}

function closeModal(element) {
    const modal = element.closest('.modal');
    modal.remove();
}

// Add Car Modal
function showAddCarModal() {
    const content = {
        title: 'Add New Car',
        body: `
            <form id="add-car-form" onsubmit="handleAddCar(event)">
                <div class="form-group">
                    <label class="form-label">Model Year</label>
                    <input type="number" class="form-input" name="model" required min="2000" max="2024">
                </div>
                <div class="form-group">
                    <label class="form-label">Company</label>
                    <input type="text" class="form-input" name="company" required maxlength="20">
                </div>
                <div class="form-group">
                    <label class="form-label">Number Plate</label>
                    <input type="text" class="form-input" name="number_plate" required maxlength="20">
                </div>
                <div class="form-group">
                    <label class="form-label">Rent per Day ($)</label>
                    <input type="number" class="form-input" name="rent_per_day" required min="0">
                </div>
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select class="form-input" name="status" required>
                        <option value="Free">Free</option>
                        <option value="Rented">Rented</option>
                        <option value="Maintenance">Maintenance</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary">Add Car</button>
            </form>
        `
    };
    showModal(content);
}

async function handleAddCar(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const carData = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_BASE_URL}/admin/cars`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(carData)
        });

        if (!response.ok) throw new Error('Failed to add car');

        showSuccess('Car added successfully');
        closeModal(form);
        loadCarsManagement();
    } catch (error) {
        console.error('Error adding car:', error);
        showError('Failed to add car');
    }
}

// Edit Car Modal
async function editCar(carId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/cars/${carId}`);
        if (!response.ok) throw new Error('Failed to fetch car details');
        const car = await response.json();

        const content = {
            title: 'Edit Car',
            body: `
                <form id="edit-car-form" onsubmit="handleEditCar(event, ${carId})">
                    <div class="form-group">
                        <label class="form-label">Model Year</label>
                        <input type="number" class="form-input" name="model" value="${car.model}" required min="2000" max="2024">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Company</label>
                        <input type="text" class="form-input" name="company" value="${car.company}" required maxlength="20">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Number Plate</label>
                        <input type="text" class="form-input" name="number_plate" value="${car.number_plate}" required maxlength="20">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Rent per Day ($)</label>
                        <input type="number" class="form-input" name="rent_per_day" value="${car.rent_per_day}" required min="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select class="form-input" name="status" required>
                            <option value="Free" ${car.status === 'Free' ? 'selected' : ''}>Free</option>
                            <option value="Rented" ${car.status === 'Rented' ? 'selected' : ''}>Rented</option>
                            <option value="Maintenance" ${car.status === 'Maintenance' ? 'selected' : ''}>Maintenance</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Update Car</button>
                </form>
            `
        };
        showModal(content);
    } catch (error) {
        console.error('Error loading car details:', error);
        showError('Failed to load car details');
    }
}

async function handleEditCar(event, carId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const carData = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_BASE_URL}/admin/cars/${carId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(carData)
        });

        if (!response.ok) throw new Error('Failed to update car');

        showSuccess('Car updated successfully');
        closeModal(form);
        loadCarsManagement();
    } catch (error) {
        console.error('Error updating car:', error);
        showError('Failed to update car');
    }
}

// Delete Car
async function deleteCar(carId) {
    if (!confirm('Are you sure you want to delete this car?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/cars/${carId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete car');

        showSuccess('Car deleted successfully');
        loadCarsManagement();
    } catch (error) {
        console.error('Error deleting car:', error);
        showError('Failed to delete car');
    }
}

// View Rental Details
async function viewRentalDetails(rentalId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/rentals/${rentalId}`);
        if (!response.ok) throw new Error('Failed to fetch rental details');
        const rental = await response.json();

        const content = {
            title: 'Rental Details',
            body: `
                <div class="rental-details">
                    <div class="detail-group">
                        <h4>Customer Information</h4>
                        <p>Name: ${rental.customer_name}</p>
                        <p>Email: ${rental.customer_email}</p>
                        <p>Phone: ${rental.customer_phone}</p>
                        <p>Address: ${rental.customer_address}</p>
                    </div>
                    <div class="detail-group">
                        <h4>Car Information</h4>
                        <p>Model: ${rental.car_model}</p>
                        <p>Company: ${rental.car_company}</p>
                        <p>Number Plate: ${rental.number_plate}</p>
                    </div>
                    <div class="detail-group">
                        <h4>Rental Information</h4>
                        <p>Start Date: ${new Date(rental.start_date).toLocaleDateString()}</p>
                        <p>End Date: ${new Date(rental.end_date).toLocaleDateString()}</p>
                        <p>Status: <span class="status-badge status-${rental.Status.toLowerCase()}">${rental.Status}</span></p>
                    </div>
                    <div class="detail-group">
                        <h4>Payment Information</h4>
                        <p>Payment ID: #${rental.payment?.Payment_ID || 'N/A'}</p>
                        <p>Amount: ₹${rental.payment?.Amount?.toLocaleString('en-IN') || 'N/A'}</p>
                        <p>Payment Mode: ${rental.payment?.Payment_Mode || 'Cash'}</p>
                        <p>Payment Date: ${rental.payment?.Payment_Date ? new Date(rental.payment.Payment_Date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                </div>
            `
        };
        showModal(content);
    } catch (error) {
        console.error('Error loading rental details:', error);
        showError('Failed to load rental details');
    }
}

// Cancel Rental
async function cancelRental(rentalId) {
    if (!confirm('Are you sure you want to cancel this rental?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/rentals/${rentalId}/cancel`, {
            method: 'POST'
        });

        if (!response.ok) throw new Error('Failed to cancel rental');

        showSuccess('Rental cancelled successfully');
        closeModal(document.querySelector('.modal'));
        loadRentalsManagement(); // Refresh the rentals list
    } catch (error) {
        console.error('Error cancelling rental:', error);
        showError('Failed to cancel rental');
    }
}

// View Customer Details
async function viewCustomerDetails(customerId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/customers/${customerId}`);
        if (!response.ok) throw new Error('Failed to fetch customer details');
        const customer = await response.json();

        const content = {
            title: 'Customer Details',
            body: `
                <div class="customer-details">
                    <div class="detail-group">
                        <h4>Personal Information</h4>
                        <p>Name: ${customer.name}</p>
                        <p>Email: ${customer.email}</p>
                        <p>Phone: ${customer.phone}</p>
                        <p>Address: ${customer.address}</p>
                    </div>
                    <div class="detail-group">
                        <h4>Rental History</h4>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Rental ID</th>
                                    <th>Car</th>
                                    <th>Dates</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${customer.rentals.map(rental => `
                                    <tr>
                                        <td>#${rental.Rental_ID}</td>
                                        <td>${rental.car_model}</td>
                                        <td>${new Date(rental.start_date).toLocaleDateString()} - ${new Date(rental.end_date).toLocaleDateString()}</td>
                                        <td>${rental.total_amount ? `$${rental.total_amount}` : 'N/A'}</td>
                                        <td><span class="status-badge status-${rental.Status.toLowerCase()}">${rental.Status}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `
        };
        showModal(content);
    } catch (error) {
        console.error('Error loading customer details:', error);
        showError('Failed to load customer details');
    }
}

// Notifications
function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.textContent = message;
    document.querySelector('.main-content').prepend(alert);
    setTimeout(() => alert.remove(), 3000);
}

// Add Customer Modal
function showAddCustomerModal() {
    const content = {
        title: 'Add New Customer',
        body: `
            <form id="add-customer-form" onsubmit="handleAddCustomer(event)">
                <div class="form-group">
                    <label class="form-label">Name</label>
                    <input type="text" class="form-input" name="name" required maxlength="20">
                </div>
                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-input" name="email" required maxlength="20">
                </div>
                <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input type="tel" class="form-input" name="phone" required pattern="[0-9]{10}" title="Please enter a valid 10-digit phone number">
                </div>
                <div class="form-group">
                    <label class="form-label">Address</label>
                    <input type="text" class="form-input" name="address" required maxlength="20">
                </div>
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-input" name="password" required maxlength="30" minlength="6">
                </div>
                <button type="submit" class="btn btn-primary">Add Customer</button>
            </form>
        `
    };
    showModal(content);
}

async function handleAddCustomer(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const customerData = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`${API_BASE_URL}/admin/customers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customerData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add customer');
        }

        showSuccess('Customer added successfully');
        closeModal(form);
        loadCustomersManagement();
    } catch (error) {
        console.error('Error adding customer:', error);
        showError(error.message);
    }
}

// Edit Customer Modal
async function editCustomer(customerId) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/customers/${customerId}`);
        if (!response.ok) throw new Error('Failed to fetch customer details');
        const customer = await response.json();

        const content = {
            title: 'Edit Customer',
            body: `
                <form id="edit-customer-form" onsubmit="handleEditCustomer(event, ${customerId})">
                    <div class="form-group">
                        <label class="form-label">Name</label>
                        <input type="text" class="form-input" name="name" value="${customer.name}" required maxlength="20">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" name="email" value="${customer.email}" required maxlength="20">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Phone</label>
                        <input type="tel" class="form-input" name="phone" value="${customer.phone}" required pattern="[0-9]{10}" title="Please enter a valid 10-digit phone number">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Address</label>
                        <input type="text" class="form-input" name="address" value="${customer.address}" required maxlength="20">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password (leave blank to keep unchanged)</label>
                        <input type="password" class="form-input" name="password" maxlength="30" minlength="6">
                    </div>
                    <button type="submit" class="btn btn-primary">Update Customer</button>
                </form>
            `
        };
        showModal(content);
    } catch (error) {
        console.error('Error loading customer details:', error);
        showError('Failed to load customer details');
    }
}

async function handleEditCustomer(event, customerId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const customerData = Object.fromEntries(formData.entries());

    // Remove password if empty
    if (!customerData.password) {
        delete customerData.password;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/admin/customers/${customerId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(customerData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update customer');
        }

        showSuccess('Customer updated successfully');
        closeModal(form);
        loadCustomersManagement();
    } catch (error) {
        console.error('Error updating customer:', error);
        showError(error.message);
    }
}

// Delete Customer
async function deleteCustomer(customerId) {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/customers/${customerId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete customer');
        }

        showSuccess('Customer deleted successfully');
        loadCustomersManagement();
    } catch (error) {
        console.error('Error deleting customer:', error);
        showError(error.message);
    }
}

// Reports Management
async function loadReportsManagement() {
    const mainContent = document.querySelector('.main-content');
    
    // First, update the main content with the reports section HTML
    mainContent.innerHTML = `
        <div id="reports-section">
            <div class="header">
                <h2>Payment Analytics</h2>
                <div class="date-filters">
                    <input type="date" id="start-date" class="form-input">
                    <input type="date" id="end-date" class="form-input">
                    <button class="btn btn-primary" onclick="updateReports()">Apply Filter</button>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Total Revenue</h3>
                    <div class="stat-value" id="total-revenue">₹0</div>
                </div>
                <div class="stat-card">
                    <h3>Total Transactions</h3>
                    <div class="stat-value" id="total-transactions">0</div>
                </div>
                <div class="stat-card">
                    <h3>Average Transaction</h3>
                    <div class="stat-value" id="avg-transaction">₹0</div>
                </div>
                <div class="stat-card">
                    <h3>Most Used Payment Mode</h3>
                    <div class="stat-value" id="popular-payment">--</div>
                </div>
            </div>

            <div class="charts-grid">
                <div class="chart-container">
                    <h3>Monthly Revenue Trend</h3>
                    <canvas id="revenue-trend-chart"></canvas>
                </div>
                <div class="chart-container">
                    <h3>Payment Mode Distribution</h3>
                    <canvas id="payment-mode-chart"></canvas>
                </div>
                <div class="chart-container">
                    <h3>Daily Transaction Volume</h3>
                    <canvas id="transaction-volume-chart"></canvas>
                </div>
                <div class="chart-container">
                    <h3>Revenue by Car Model</h3>
                    <canvas id="car-revenue-chart"></canvas>
                </div>
            </div>

            <div class="table-container">
                <div class="table-header">
                    <h3 class="table-title">Recent Payments</h3>
                    <button class="btn btn-primary" onclick="exportPaymentReport()">Export Report</button>
                </div>
                <table class="data-table" id="payments-table">
                    <thead>
                        <tr>
                            <th>Payment ID</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Car Model</th>
                            <th>Amount</th>
                            <th>Payment Mode</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Payment data will be populated here -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    try {
        // Initialize reports after the HTML is loaded
        if (typeof initializeReports === 'function') {
            await initializeReports();
        } else {
            console.error('initializeReports function not found. Make sure reports.js is loaded.');
        }
    } catch (error) {
        console.error('Error initializing reports:', error);
        showError('Failed to initialize reports');
    }
}

async function initializeReports() {
    // Implementation of initializeReports function
}

// Add event listener for reports tab
document.addEventListener('DOMContentLoaded', function() {
    const reportsTab = document.querySelector('[data-tab="reports"]');
    if (reportsTab) {
        reportsTab.addEventListener('click', () => {
            handleNavigation('reports');
        });
    }
});

// Clear Data Functions
async function clearDashboardData() {
    if (!confirm('Are you sure you want to clear all dashboard data? This will permanently delete all statistics and recent rentals.')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/clear/dashboard`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to clear dashboard data');

        // Clear stats
        document.querySelectorAll('.stat-card .stat-value').forEach(stat => {
            stat.textContent = '--';
        });

        // Clear recent rentals table
        const tbody = document.querySelector('.data-table tbody');
        tbody.innerHTML = '<tr><td colspan="7">No data available</td></tr>';

        showSuccess('Dashboard data cleared successfully');
    } catch (error) {
        console.error('Error clearing dashboard data:', error);
        showError('Failed to clear dashboard data');
    }
}

async function clearRecentRentals() {
    if (!confirm('Are you sure you want to clear recent rentals data? This will permanently delete all rental records.')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/clear/rentals`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to clear rentals data');

        const tbody = document.querySelector('.data-table tbody');
        tbody.innerHTML = '<tr><td colspan="7">No data available</td></tr>';

        showSuccess('Recent rentals data cleared successfully');
    } catch (error) {
        console.error('Error clearing rentals data:', error);
        showError('Failed to clear rentals data');
    }
}

async function clearReportsData() {
    if (!confirm('Are you sure you want to clear all reports data? This will permanently delete all payment records and statistics.')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/clear/reports`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to clear reports data');

        // Clear statistics
        document.getElementById('total-revenue').textContent = '₹0';
        document.getElementById('total-transactions').textContent = '0';
        document.getElementById('avg-transaction').textContent = '₹0';
        document.getElementById('popular-payment').textContent = '--';

        // Clear charts
        if (charts.revenue.revenueTrendChart) {
            charts.revenue.revenueTrendChart.destroy();
        }
        if (charts.revenue.paymentModeChart) {
            charts.revenue.paymentModeChart.destroy();
        }
        if (charts.revenue.transactionChart) {
            charts.revenue.transactionChart.destroy();
        }
        if (charts.revenue.carRevenueChart) {
            charts.revenue.carRevenueChart.destroy();
        }

        // Initialize empty charts
        initializeCharts();

        showSuccess('Reports data cleared successfully');
    } catch (error) {
        console.error('Error clearing reports data:', error);
        showError('Failed to clear reports data');
    }
}

async function clearPaymentsData() {
    if (!confirm('Are you sure you want to clear payments data? This will permanently delete all payment records.')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/admin/clear/payments`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to clear payments data');

        const tbody = document.querySelector('#payments-table tbody');
        tbody.innerHTML = '<tr><td colspan="7">No payments data available</td></tr>';

        showSuccess('Payments data cleared successfully');
    } catch (error) {
        console.error('Error clearing payments data:', error);
        showError('Failed to clear payments data');
    }
}

async function clearCarsData() {
    if (!confirm('Are you sure you want to clear all cars data? This will permanently delete all car records.')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/clear/cars`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to clear cars data');

        const tbody = document.querySelector('.data-table tbody');
        tbody.innerHTML = '<tr><td colspan="7">No cars data available</td></tr>';
        
        showSuccess('Cars data cleared successfully');
    } catch (error) {
        console.error('Error clearing cars data:', error);
        showError('Failed to clear cars data');
    }
}

async function clearRentalsData() {
    if (!confirm('Are you sure you want to clear all rentals data? This will permanently delete all rental records.')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/clear/rentals`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to clear rentals data');

        const tbody = document.querySelector('.data-table tbody');
        tbody.innerHTML = '<tr><td colspan="9">No rentals data available</td></tr>';
        
        showSuccess('Rentals data cleared successfully');
    } catch (error) {
        console.error('Error clearing rentals data:', error);
        showError('Failed to clear rentals data');
    }
}

async function clearCustomersData() {
    if (!confirm('Are you sure you want to clear all customers data? This will permanently delete all customer records.')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/clear/customers`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to clear customers data');

        const tbody = document.querySelector('.data-table tbody');
        tbody.innerHTML = '<tr><td colspan="7">No customers data available</td></tr>';
        
        showSuccess('Customers data cleared successfully');
    } catch (error) {
        console.error('Error clearing customers data:', error);
        showError('Failed to clear customers data');
    }
}

async function clearEmployeesData() {
    if (!confirm('Are you sure you want to clear all employees data? This will permanently delete all employee records.')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/clear/employees`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to clear employees data');

        const tbody = document.querySelector('.data-table tbody');
        tbody.innerHTML = '<tr><td colspan="6">No employees data available</td></tr>';
        
        showSuccess('Employees data cleared successfully');
    } catch (error) {
        console.error('Error clearing employees data:', error);
        showError('Failed to clear employees data');
    }
} 