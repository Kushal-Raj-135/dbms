// Global variables
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://car-rental-backend-98j4.onrender.com/api'
  : 'http://localhost:3001/api';
let currentUser = null;
let allCars = []; // Store all cars for filtering

// Function to load available cars
async function loadAvailableCars() {
    const carsGrid = document.getElementById('cars-grid');
    if (!carsGrid) {
        console.error('Cars grid element not found');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cars/available`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch cars');
        }

        const cars = await response.json();
        allCars = cars; // Store cars for filtering
        
        // Populate company filter
        const companyFilter = document.getElementById('company-filter');
        if (companyFilter) {
            const companies = [...new Set(cars.map(car => car.Company))];
            companyFilter.innerHTML = '<option value="">All Companies</option>' +
                companies.map(company => `<option value="${company}">${company}</option>`).join('');
        }

        // Initial display of all cars
        displayFilteredCars(cars);
    } catch (error) {
        console.error('Error loading cars:', error);
        if (carsGrid) {
            carsGrid.innerHTML = '<div class="alert alert-danger">Failed to load available cars. Please try again later.</div>';
        }
    }
}

// Function to display filtered cars
function displayFilteredCars(cars) {
    const carsGrid = document.getElementById('cars-grid');
    if (!carsGrid) {
        console.error('Cars grid element not found');
        return;
    }
    
    carsGrid.innerHTML = '';

    if (!Array.isArray(cars) || cars.length === 0) {
        carsGrid.innerHTML = '<div class="no-cars">No cars match your search criteria</div>';
        return;
    }

    cars.forEach(car => {
        const carCard = document.createElement('div');
        carCard.className = 'car-card';
        
        const carImage = car.image_url ? 
            `<img src="${car.image_url}" alt="${car.Company} ${car.Model}" class="car-image">` :
            `<svg class="car-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.8a1 1 0 0 0-.8.4L2.3 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm10 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
            </svg>`;

        carCard.innerHTML = `
            <div class="car-image-container">
                ${carImage}
                <div class="car-overlay">
                    <span class="car-model">${car.Model}</span>
                </div>
            </div>
            <div class="car-details">
                <h3 class="car-title">${car.Company} ${car.Model}</h3>
                <div class="car-info">
                    <span class="car-price">₹${car.Rent_Per_Day}/day</span>
                    <span class="status-${car.Status.toLowerCase()}">${car.Status}</span>
                </div>
                <p class="car-plate">Number Plate: ${car.Number_Plate}</p>
                <button onclick="showBookingModal(${JSON.stringify(car).replace(/"/g, '&quot;')})" 
                        class="btn-primary">Book Now</button>
            </div>
        `;
        carsGrid.appendChild(carCard);
    });
}

// Function to filter cars
function filterCars() {
    if (!allCars.length) return;

    const carSearch = document.getElementById('car-search');
    const companyFilter = document.getElementById('company-filter');
    const statusFilter = document.getElementById('status-filter');
    const priceFilter = document.getElementById('price-filter');

    const searchTerm = carSearch ? carSearch.value.toLowerCase() : '';
    const selectedCompany = companyFilter ? companyFilter.value : '';
    const selectedStatus = statusFilter ? statusFilter.value : '';
    const selectedPrice = priceFilter ? priceFilter.value : '';

    let filteredCars = allCars.filter(car => {
        // Search term filter
        const matchesSearch = car.Company.toLowerCase().includes(searchTerm) ||
                            car.Model.toLowerCase().includes(searchTerm) ||
                            car.Number_Plate.toLowerCase().includes(searchTerm);

        // Company filter
        const matchesCompany = !selectedCompany || car.Company === selectedCompany;

        // Status filter
        const matchesStatus = !selectedStatus || car.Status === selectedStatus;

        // Price filter
        let matchesPrice = true;
        if (selectedPrice) {
            const price = parseFloat(car.Rent_Per_Day);
            switch (selectedPrice) {
                case '0-50':
                    matchesPrice = price <= 50;
                    break;
                case '51-100':
                    matchesPrice = price > 50 && price <= 100;
                    break;
                case '101+':
                    matchesPrice = price > 100;
                    break;
            }
        }

        return matchesSearch && matchesCompany && matchesStatus && matchesPrice;
    });

    displayFilteredCars(filteredCars);
}

// Show login form based on user type
function showLoginForm(userType) {
    document.querySelectorAll('.login-form').forEach(form => form.classList.add('hidden'));
    document.getElementById(`${userType}-login-form`).classList.remove('hidden');
}

// Show registration form
function showRegistrationForm() {
    document.querySelectorAll('.login-form').forEach(form => form.classList.add('hidden'));
    document.getElementById('registration-form').classList.remove('hidden');
}

// Handle customer registration
document.getElementById('registration-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`${API_URL}/customers/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password'),
                phone: formData.get('phone'),
                address: formData.get('address')
            })
        });

        if (!response.ok) throw new Error('Registration failed');
        
        alert('Registration successful! Please login.');
        showLoginForm('customer');
    } catch (error) {
        console.error('Error during registration:', error);
        alert('Registration failed: ' + error.message);
    }
});

// Handle customer login
document.getElementById('customer-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`${API_URL}/customers/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: formData.get('email'),
                password: formData.get('password')
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        if (data.status === 'success') {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userType', 'customer');
            currentUser = data.customer;
            
            showInterface('customer');
            updateNavigation('customer');
        } else {
            throw new Error(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert(error.message || 'Login failed. Please try again.');
    }
});

// Handle employee login
document.getElementById('employee-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const employeeId = document.getElementById('employee-id').value;
    const employeeName = document.getElementById('employee-name').value;

    try {
        // Check for admin credentials
        if (employeeId === '99' && employeeName.toLowerCase() === 'chinmay') {
            showInterface('admin');
            initializeAdminInterface();
            return;
        }

        // Regular employee login logic
        const response = await fetch(`${API_URL}/employees/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                employee_id: parseInt(employeeId),
                name: employeeName
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        if (data.status === 'success') {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userType', 'employee');
            currentUser = data.employee;
            
            // Show employee interface with appropriate navigation
            const navButtons = document.querySelector('.nav-buttons');
            if (navButtons) {
                navButtons.innerHTML = `
                    <button class="modern-btn" onclick="showEmployeeSection('rentals')">
                        <span class="btn-content">Rental Management</span>
                    </button>
                    <button class="modern-btn" onclick="showEmployeeSection('cars')">
                        <span class="btn-content">Car Management</span>
                    </button>
                    <button class="modern-btn logout-btn" onclick="logout()">
                        <span class="btn-content">Logout</span>
                    </button>
                `;
            }
            
            showInterface('employee');
            showEmployeeSection('rentals'); // Show rentals section by default
        } else {
            throw new Error(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Error during login:', error);
        // Show error message in a more user-friendly way
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.style.marginBottom = '1rem';
        errorDiv.textContent = error.message || 'Invalid credentials. Please try again.';
        
        const form = document.getElementById('employee-login-form');
        form.insertBefore(errorDiv, form.firstChild);
        
        // Remove error message after 3 seconds
        setTimeout(() => errorDiv.remove(), 3000);
    }
});

// Update navigation based on user type
function updateNavigation(userType) {
    console.log('Updating navigation for user type:', userType);
    const navLinksContainer = document.querySelector('.nav-links');
    if (!navLinksContainer) {
        console.error('Navigation container not found');
        return;
    }
    
    // Clear existing navigation
    navLinksContainer.innerHTML = '';
    
    if (userType === 'customer') {
        // Add My Bookings button
        const bookingsBtn = document.createElement('button');
        bookingsBtn.textContent = 'My Bookings';
        bookingsBtn.className = 'nav-btn';
        bookingsBtn.onclick = showBookingsModal;
        navLinksContainer.appendChild(bookingsBtn);

        // Add Logout button
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout';
        logoutBtn.className = 'nav-btn logout-btn';
        logoutBtn.style.backgroundColor = '#dc3545';
        logoutBtn.style.color = 'white';
        logoutBtn.style.marginLeft = 'auto'; // Push to the right
        logoutBtn.onclick = logout;
        
        // Add hover effects
        logoutBtn.addEventListener('mouseover', () => {
            logoutBtn.style.backgroundColor = '#c82333';
        });
        logoutBtn.addEventListener('mouseout', () => {
            logoutBtn.style.backgroundColor = '#dc3545';
        });
        
        navLinksContainer.appendChild(logoutBtn);
    } else if (userType === 'employee') {
        const dashboardBtn = document.createElement('button');
        dashboardBtn.textContent = 'Dashboard';
        dashboardBtn.className = 'nav-btn';
        dashboardBtn.onclick = showEmployeeDashboard;
        navLinksContainer.appendChild(dashboardBtn);
        
        // Add Logout button for employee
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout';
        logoutBtn.className = 'nav-btn logout-btn';
        logoutBtn.style.backgroundColor = '#dc3545';
        logoutBtn.style.color = 'white';
        logoutBtn.style.marginLeft = 'auto';
        logoutBtn.onclick = logout;
        
        logoutBtn.addEventListener('mouseover', () => {
            logoutBtn.style.backgroundColor = '#c82333';
        });
        logoutBtn.addEventListener('mouseout', () => {
            logoutBtn.style.backgroundColor = '#dc3545';
        });
        
        navLinksContainer.appendChild(logoutBtn);
    }
    
    console.log('Navigation updated successfully');
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    currentUser = null;
    location.reload();
}

// Interface switching
function showInterface(interfaceType) {
    document.querySelectorAll('.interface').forEach(interface => {
        interface.classList.add('hidden');
    });

    if (interfaceType === 'customer') {
        document.getElementById('customer-interface').classList.remove('hidden');
        loadAvailableCars();
        loadCustomerBookings();
    } else if (interfaceType === 'employee') {
        const employeeInterface = document.getElementById('employee-interface');
        employeeInterface.classList.remove('hidden');
        loadRentals();
        loadCarStatus();
    } else if (interfaceType === 'admin') {
        document.getElementById('admin-interface').classList.remove('hidden');
        // Show dashboard by default
        showAdminSection('dashboard');
        // Initialize admin interface
        initializeAdminInterface();
    }
}

// Load customer's bookings
async function loadCustomerBookings() {
    try {
        const response = await fetch(`${API_URL}/rentals/customer`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch bookings');
        }

        const bookings = await response.json();
        const bookingsList = document.getElementById('bookings-list');
        bookingsList.innerHTML = '';

        if (bookings.length === 0) {
            bookingsList.innerHTML = '<p class="text-center">No bookings found</p>';
            return;
        }

        bookings.forEach(booking => {
            const card = document.createElement('div');
            card.className = 'card mb-3';
            card.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">${booking.Company} ${booking.Model} (${booking.Number_Plate})</h5>
                    <p class="card-text">
                        <strong>Rental Period:</strong> ${formatDate(booking.Rental_Date)} to ${formatDate(booking.Return_Date)}<br>
                        <strong>Daily Rate:</strong> ₹${booking.Rent_Per_Day}<br>
                        <strong>Status:</strong> ${booking.Status}
                    </p>
                </div>
            `;
            bookingsList.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading bookings:', error);
        document.getElementById('bookings-list').innerHTML = 
            '<div class="alert alert-danger">Error loading bookings. Please try again later.</div>';
    }
}

// Add this after the existing loadCustomerBookings function
function showBookingsModal() {
    // Create modal HTML
    const modal = document.createElement('div');
    modal.className = 'bookings-modal';
    modal.innerHTML = `
        <div class="bookings-modal-content">
            <div class="bookings-modal-header">
                <h3>My Bookings</h3>
                <button class="close-bookings-modal">&times;</button>
            </div>
            <div id="bookings-modal-list">
                <div class="loading-spinner">Loading...</div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Show modal with animation
    setTimeout(() => modal.classList.add('show'), 10);

    // Close modal functionality
    const closeBtn = modal.querySelector('.close-bookings-modal');
    closeBtn.onclick = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    };

    // Load bookings
    loadBookingsForModal();
}

async function loadBookingsForModal() {
    try {
        const response = await fetch(`${API_URL}/rentals/customer`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch bookings');
        }

        const bookings = await response.json();
        const bookingsContainer = document.getElementById('bookings-modal-list');

        if (bookings.length === 0) {
            bookingsContainer.innerHTML = `
                <div class="no-bookings-message">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z"/>
                        <path d="M12 8v8M8 12h8"/>
                    </svg>
                    <p>No bookings found</p>
                    <button class="btn-primary" onclick="hideBookingsModal()">Browse Cars</button>
                </div>
            `;
            return;
        }

        bookingsContainer.innerHTML = bookings.map(booking => {
            const status = getBookingStatus(booking.Rental_Date, booking.Return_Date);
            const totalDays = calculateDays(booking.Rental_Date, booking.Return_Date);
            const totalPrice = totalDays * booking.Rent_Per_Day;
            
            return `
                <div class="booking-card">
                    <div class="booking-car-info">
                        <img src="${booking.Image_URL || 'placeholder-image-url.jpg'}" 
                             alt="${booking.Company} ${booking.Model}"
                             class="booking-car-image"
                             onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'80\\' height=\\'80\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%23ccc\\' stroke-width=\\'2\\'><path d=\\'M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.8a1 1 0 0 0-.8.4L2.3 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm10 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z\\'/></svg>'">
                        <div class="booking-car-details">
                            <h4 class="booking-car-name">${booking.Company} ${booking.Model}</h4>
                            <p class="booking-car-plate">${booking.Number_Plate}</p>
                            <span class="booking-status ${status.toLowerCase()}">${status}</span>
                        </div>
                    </div>
                    <div class="booking-dates">
                        <div class="booking-date-group">
                            <div class="booking-date-label">Pickup Date</div>
                            <div class="booking-date-value">${formatDate(booking.Rental_Date)}</div>
                        </div>
                        <div class="booking-date-group">
                            <div class="booking-date-label">Return Date</div>
                            <div class="booking-date-value">${formatDate(booking.Return_Date)}</div>
                        </div>
                        <div class="booking-date-group">
                            <div class="booking-date-label">Duration</div>
                            <div class="booking-date-value">${totalDays} days</div>
                        </div>
                    </div>
                    <div class="booking-price">
                        Total: ₹${totalPrice}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading bookings:', error);
        document.getElementById('bookings-modal-list').innerHTML = `
            <div class="alert alert-danger">
                Failed to load bookings. Please try again later.
            </div>
        `;
    }
}

function getBookingStatus(rentalDate, returnDate) {
    const currentDate = new Date();
    const rental = new Date(rentalDate);
    const return_ = new Date(returnDate);
    
    if (currentDate < rental) {
        return 'Upcoming';
    } else if (currentDate > return_) {
        return 'Completed';
    } else {
        return 'Active';
    }
}

function calculateDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 0; // Return 0 if calculation results in NaN
}

// Add event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for search and filters
    const carSearch = document.getElementById('car-search');
    const companyFilter = document.getElementById('company-filter');
    const statusFilter = document.getElementById('status-filter');
    const priceFilter = document.getElementById('price-filter');

    if (carSearch) {
        carSearch.addEventListener('input', filterCars);
    }
    if (companyFilter) {
        companyFilter.addEventListener('change', filterCars);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', filterCars);
    }
    if (priceFilter) {
        priceFilter.addEventListener('change', filterCars);
    }

    // Load cars if cars grid exists
    if (document.getElementById('cars-grid')) {
        loadAvailableCars();
    }
});

// Function to show car details in modal
function showBookingModal(car) {
    const modal = document.getElementById('booking-modal');
    const carName = document.getElementById('car-preview-name');
    const carPrice = document.getElementById('car-preview-price');
    const carImage = document.getElementById('car-preview-image');

    if (carName && carPrice && carImage) {
        carName.textContent = `${car.Company} ${car.Model}`;
        carPrice.textContent = `₹${car.Rent_Per_Day}/day`;
        
        // Handle car image
        if (car.Image_URL && car.Image_URL.trim() !== '') {
            carImage.innerHTML = `
                <img src="${car.Image_URL}" 
                     alt="${car.Company} ${car.Model}" 
                     class="car-preview-img"
                     style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;"
                     onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\'car-preview-icon\'><svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'1.5\'><path d=\'M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.8a1 1 0 0 0-.8.4L2.3 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm10 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z\'/></svg><div class=\'car-preview-model\'>${car.Company} ${car.Model}</div></div>'">`;
        } else {
            // Fallback if no image URL is provided
            carImage.innerHTML = `
                <div class="car-preview-icon" style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8f9fa; border-radius: 8px;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 48px; height: 48px; margin-bottom: 8px;">
                        <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.8a1 1 0 0 0-.8.4L2.3 11l-5.16.86a1 1 0 0 0-.84.99V16h3m10 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm10 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
                    </svg>
                    <div style="font-size: 0.9rem; color: #666;">
                        ${car.Company} ${car.Model}
                    </div>
                </div>`;
        }
        
        // Store car ID for booking
        modal.dataset.carId = car.Car_ID;
        
        // Initialize dates
        setMinDates();
        
        // Reset form and summary
        const bookingForm = document.getElementById('booking-form');
        if (bookingForm) {
            bookingForm.reset();
        }
        
        const durationElement = document.getElementById('rental-duration');
        const totalElement = document.getElementById('total-amount');
        if (durationElement && totalElement) {
            durationElement.textContent = '0 days';
            totalElement.textContent = '₹0';
        }
        
        // Show the modal
        modal.classList.remove('hidden');
    }
}

// Add function to hide booking modal
function hideBookingModal() {
    const modal = document.getElementById('booking-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.getElementById('booking-form').reset();
    }
}

// Update the booking form submission handler
document.getElementById('booking-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const modal = document.getElementById('booking-modal');
    const carId = modal.dataset.carId;
    const rentalDate = document.getElementById('rental-date').value;
    const returnDate = document.getElementById('return-date').value;
    const paymentMode = document.getElementById('payment-mode').value;

    try {
        const response = await fetch(`${API_URL}/rentals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                car_id: carId,
                rental_date: rentalDate,
                return_date: returnDate,
                payment_mode: paymentMode
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to create booking');
        }

        // Show success message with payment details
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success';
        successDiv.innerHTML = `
            <h4>Booking created successfully!</h4>
            <div class="payment-details">
                <p><strong>Payment ID:</strong> #${data.payment?.Payment_ID || 'N/A'}</p>
                <p><strong>Amount:</strong> ₹${(data.payment?.Amount || 0).toLocaleString('en-IN')}</p>
                <p><strong>Payment Mode:</strong> ${data.payment?.Payment_Mode || 'N/A'}</p>
                <p><strong>Payment Date:</strong> ${data.payment?.Payment_Date ? new Date(data.payment.Payment_Date).toLocaleDateString() : 'N/A'}</p>
            </div>
        `;
        
        // Insert success message at the top of the form
        const form = document.getElementById('booking-form');
        form.insertBefore(successDiv, form.firstChild);

        // Hide success message after 5 seconds
        setTimeout(() => successDiv.remove(), 5000);

        // Hide modal and reset form
        hideBookingModal();
        form.reset();
        
        // Reload data
        loadCustomerBookings();
        loadAvailableCars();
    } catch (error) {
        console.error('Error creating booking:', error);
        
        // Show error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.textContent = error.message || 'Failed to create booking';
        e.target.insertBefore(errorDiv, e.target.firstChild);

        // Remove error message after 5 seconds
        setTimeout(() => errorDiv.remove(), 5000);
    }
});

// Add event listener for close modal button
document.querySelector('.close-modal').addEventListener('click', hideBookingModal);

// Add event listener for clicking outside modal to close it
document.getElementById('booking-modal').addEventListener('click', (e) => {
    if (e.target.id === 'booking-modal') {
        hideBookingModal();
    }
});

// Employee functions
async function loadRentals() {
    try {
        const response = await fetch(`${API_URL}/rentals/all`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load rentals');
        
        const rentals = await response.json();
        const tableBody = document.getElementById('rentals-table-body');
        
        tableBody.innerHTML = rentals.map(rental => {
            // Calculate status based on dates
            const currentDate = new Date();
            const returnDate = new Date(rental.Return_Date);
            const rentalDate = new Date(rental.Rental_Date);
            let status;
            
            if (currentDate > returnDate) {
                status = 'Completed';
            } else if (currentDate < rentalDate) {
                status = 'Upcoming';
            } else {
                status = 'Active';
            }

            return `
                <tr>
                    <td>${rental.Rental_ID}</td>
                    <td>${rental.Customer_Name}</td>
                    <td>${rental.Car_Model} ${rental.Company}</td>
                    <td>${formatDate(rental.Rental_Date)}</td>
                    <td>${formatDate(rental.Return_Date)}</td>
                    <td><span class="status-${status.toLowerCase()}">${status}</span></td>
                    <td>
                        <button onclick="updateRentalStatus(${rental.Rental_ID}, 'Completed')"
                                ${status === 'Completed' ? 'disabled' : ''}>
                            Mark as Completed
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading rentals:', error);
        document.getElementById('rentals-table-body').innerHTML = `
            <tr><td colspan="7" class="error">Failed to load rentals</td></tr>
        `;
    }
}

// Helper function to show messages
function showMessage(type, message) {
    const alertClass = type === 'error' ? 'alert-danger' : 'alert-success';
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${alertClass}`;
    alertDiv.textContent = message;
    
    // Find a suitable container for the message
    const container = document.querySelector('.employee-interface');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        
        // Remove the alert after 5 seconds
        setTimeout(() => alertDiv.remove(), 5000);
    }
}

async function loadCarStatus() {
    try {
        const response = await fetch(`${API_URL}/cars/status`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load car status');
        
        const cars = await response.json();
        const tableBody = document.getElementById('cars-table-body');
        
        if (!tableBody) {
            console.error('Cars table body element not found');
            return;
        }

        tableBody.innerHTML = cars.map(car => {
            // Handle null or undefined status, and convert 'Available' to 'Free'
            const status = car.Status ? (car.Status === 'Available' ? 'Free' : car.Status) : 'Free';
            
            // Add a small image preview if URL exists
            const imagePreview = car.Image_URL ? 
                `<img src="${car.Image_URL}" alt="${car.Company} ${car.Model}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">` : 
                'No image';
            
            // Debug log for car data
            console.log('Car data:', {
                id: car.Car_ID,
                status: car.Status,
                processedStatus: status,
                imageUrl: car.Image_URL
            });
            
            return `
                <tr>
                    <td>${car.Car_ID}</td>
                    <td>${car.Company || ''}</td>
                    <td>${car.Model || ''}</td>
                    <td>${car.Number_Plate || ''}</td>
                    <td>₹${car.Rent_Per_Day || 0}</td>
                    <td><span class="status-${status.toLowerCase()}">${status}</span></td>
                    <td>
                        <div class="car-actions">
                            <div class="image-preview">${imagePreview}</div>
                            <select class="form-control status-select" data-car-id="${car.Car_ID}">
                                <option value="Free" ${status === 'Free' ? 'selected' : ''}>Free</option>
                                <option value="Rented" ${status === 'Rented' ? 'selected' : ''}>Rented</option>
                                <option value="Service" ${status === 'Service' ? 'selected' : ''}>Service</option>
                            </select>
                            <button onclick="showEditCarModal(${JSON.stringify(car).replace(/"/g, '&quot;')})">
                                Edit
                            </button>
                            <button onclick="deleteCar(${car.Car_ID})">
                                Delete
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Add event listeners to status selects
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const carId = e.target.dataset.carId;
                const newStatus = e.target.value;
                updateCarStatus(carId, newStatus);
            });
        });
    } catch (error) {
        console.error('Error loading car status:', error);
        showMessage('error', 'Failed to load car status');
        
        const tableBody = document.getElementById('cars-table-body');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="7" class="error">Failed to load cars</td></tr>';
        }
    }
}

// Update car status
async function updateCarStatus(carId, newStatus) {
    try {
        const response = await fetch(`${API_URL}/cars/${carId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) throw new Error('Failed to update car status');
        
        showMessage('success', 'Car status updated successfully');
        loadCarStatus(); // Reload the car list
    } catch (error) {
        console.error('Error updating car status:', error);
        showMessage('error', 'Failed to update car status');
    }
}

// Helper function to format dates
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Update rental status
async function updateRentalStatus(rentalId, status) {
    try {
        const response = await fetch(`${API_URL}/rentals/${rentalId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) throw new Error('Failed to update rental status');
        
        loadRentals(); // Reload the rentals list
    } catch (error) {
        console.error('Error updating rental status:', error);
        alert('Failed to update rental status');
    }
}

// Employee car management functions
function showAddCarForm() {
    document.getElementById('add-car-form').classList.remove('hidden');
}

function hideAddCarForm() {
    document.getElementById('add-car-form').classList.add('hidden');
    document.getElementById('add-car-form').reset();
}

function showEditCarModal(car) {
    const modal = document.getElementById('edit-car-modal');
    const form = document.getElementById('edit-car-form');
    
    // Fill form with car details
    form.elements['car_id'].value = car.Car_ID;
    form.elements['model'].value = car.Model;
    form.elements['company'].value = car.Company;
    form.elements['number_plate'].value = car.Number_Plate;
    form.elements['rent_per_day'].value = car.Rent_Per_Day;
    form.elements['status'].value = car.Status;
    form.elements['image_url'].value = car.Image_URL || '';
    
    modal.classList.remove('hidden');
}

function hideEditCarModal() {
    const modal = document.getElementById('edit-car-modal');
    modal.classList.add('hidden');
    document.getElementById('edit-car-form').reset();
}

// Handle add car form submission
document.getElementById('add-car-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
        // Basic validation
        const model = formData.get('model');
        const company = formData.get('company');
        const number_plate = formData.get('number_plate');
        const rent_per_day = formData.get('rent_per_day');
        const status = formData.get('status');
        const Image_URL = formData.get('image_url') || ''; // Match database column name

        if (!model || !company || !number_plate || !rent_per_day || !status) {
            throw new Error('All fields are required');
        }

        if (rent_per_day <= 0) {
            throw new Error('Rent per day must be greater than 0');
        }

        const requestBody = {
            model: model,
            company: company.trim(),
            number_plate: number_plate.trim(),
            rent_per_day: parseFloat(rent_per_day),
            status: status,
            Image_URL: Image_URL // Match database column name
        };

        console.log('Add car request body:', requestBody);

        const response = await fetch(`${API_URL}/cars`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        console.log('Add car response:', data);
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to add car');
        }

        alert('Car added successfully!');
        hideAddCarForm();
        loadCarStatus();
    } catch (error) {
        console.error('Error adding car:', error);
        alert(error.message || 'Failed to add car');
    }
});

// Handle edit car form submission
document.getElementById('edit-car-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const carId = formData.get('car_id');
    
    try {
        // Create request body with exact database field names
        const requestBody = {
            Model: formData.get('model'),
            Company: formData.get('company'),
            Number_Plate: formData.get('number_plate'),
            Rent_Per_Day: parseFloat(formData.get('rent_per_day')),
            Status: formData.get('status'),
            Image_URL: formData.get('image_url') || ''
        };
        
        // Debug logs
        console.log('Form values:', {
            image_url: formData.get('image_url'),
            model: formData.get('model'),
            company: formData.get('company')
        });
        console.log('Edit car request body:', requestBody);

        const response = await fetch(`${API_URL}/cars/${carId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        console.log('Edit car response:', data);
        console.log('Raw response:', response);
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to update car');
        }

        alert('Car updated successfully!');
        hideEditCarModal();
        loadCarStatus();
    } catch (error) {
        console.error('Error updating car:', error);
        alert(error.message || 'Failed to update car');
    }
});

// Delete car function
async function deleteCar(carId) {
    if (!confirm('Are you sure you want to delete this car?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/cars/${carId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to delete car');
        }

        alert('Car deleted successfully!');
        loadCarStatus();
    } catch (error) {
        console.error('Error deleting car:', error);
        alert(error.message || 'Failed to delete car');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    // Add static backup buttons
    const navContainer = document.querySelector('.nav-links');
    if (navContainer) {
        const staticBookingsBtn = document.createElement('button');
        staticBookingsBtn.textContent = 'My Bookings';
        staticBookingsBtn.className = 'nav-btn static-btn';
        staticBookingsBtn.onclick = showBookingsModal;
        navContainer.appendChild(staticBookingsBtn);

        const staticLogoutBtn = document.createElement('button');
        staticLogoutBtn.textContent = 'Logout';
        staticLogoutBtn.className = 'nav-btn logout-btn static-btn';
        staticLogoutBtn.onclick = logout;
        navContainer.appendChild(staticLogoutBtn);
    }
    
    if (token && userType) {
        showInterface(userType);
        updateNavigation(userType);
    } else {
        document.getElementById('login-interface').classList.remove('hidden');
    }
});

function initializeAdminInterface() {
    showAdminSection('cars');
    loadAdminData();
}

function showAdminSection(section) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    
    // Remove active class from all buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show selected section and activate its button
    document.getElementById(`admin-${section}`).classList.remove('hidden');
    document.querySelector(`.nav-btn[onclick="showAdminSection('${section}')"]`).classList.add('active');
    
    // Load section data
    loadSectionData(section);
}

function loadSectionData(section) {
    switch(section) {
        case 'cars':
            loadCarsData();
            break;
        case 'employees':
            loadEmployeesData();
            break;
        case 'customers':
            loadCustomersData();
            break;
        case 'rentals':
            loadRentalsData();
            break;
        case 'revenue':
            loadRevenueData();
            break;
    }
}

function loadCarsData() {
    fetch('/api/cars')
        .then(response => response.json())
        .then(cars => {
            const tbody = document.getElementById('cars-data');
            tbody.innerHTML = cars.map(car => `
                <tr>
                    <td>${car.id}</td>
                    <td>${car.company}</td>
                    <td>${car.model}</td>
                    <td>${car.number_plate}</td>
                    <td>₹${car.rent_per_day}</td>
                    <td><span class="status-${car.status.toLowerCase()}">${car.status}</span></td>
                    <td>${car.image_url || 'N/A'}</td>
                    <td>
                        <button class="action-btn edit-btn" onclick="editCar(${car.id})">Edit</button>
                        <button class="action-btn delete-btn" onclick="deleteCar(${car.id})">Delete</button>
                    </td>
                </tr>
            `).join('');
        })
        .catch(error => console.error('Error loading cars:', error));
}

function loadEmployeesData() {
    fetch('/api/employees')
        .then(response => response.json())
        .then(employees => {
            const tbody = document.getElementById('employees-data');
            tbody.innerHTML = employees.map(emp => `
                <tr>
                    <td>${emp.id}</td>
                    <td>${emp.name}</td>
                    <td>${emp.email}</td>
                    <td>${emp.phone}</td>
                    <td>${emp.role}</td>
                    <td>₹${emp.salary}</td>
                    <td>${new Date(emp.join_date).toLocaleDateString()}</td>
                    <td>
                        <button class="action-btn edit-btn" onclick="editEmployee(${emp.id})">Edit</button>
                        <button class="action-btn delete-btn" onclick="deleteEmployee(${emp.id})">Delete</button>
                    </td>
                </tr>
            `).join('');
        })
        .catch(error => console.error('Error loading employees:', error));
}

function loadCustomersData() {
    fetch('/api/customers')
        .then(response => response.json())
        .then(customers => {
            const tbody = document.getElementById('customers-data');
            tbody.innerHTML = customers.map(customer => `
                <tr>
                    <td>${customer.id}</td>
                    <td>${customer.name}</td>
                    <td>${customer.email}</td>
                    <td>${customer.phone}</td>
                    <td>${customer.address}</td>
                    <td>${new Date(customer.join_date).toLocaleDateString()}</td>
                    <td>${customer.total_rentals}</td>
                    <td>
                        <button class="action-btn edit-btn" onclick="editCustomer(${customer.id})">Edit</button>
                        <button class="action-btn delete-btn" onclick="deleteCustomer(${customer.id})">Delete</button>
                    </td>
                </tr>
            `).join('');
        })
        .catch(error => console.error('Error loading customers:', error));
}

function loadRentalsData() {
    fetch('/api/rentals')
        .then(response => response.json())
        .then(rentals => {
            const tbody = document.getElementById('rentals-data');
            tbody.innerHTML = rentals.map(rental => `
                <tr>
                    <td>${rental.id}</td>
                    <td>${rental.customer_name}</td>
                    <td>${rental.car_model}</td>
                    <td>${new Date(rental.start_date).toLocaleDateString()}</td>
                    <td>${new Date(rental.end_date).toLocaleDateString()}</td>
                    <td>₹${rental.total_amount}</td>
                    <td><span class="status-${rental.status.toLowerCase()}">${rental.status}</span></td>
                    <td>
                        <button class="action-btn edit-btn" onclick="editRental(${rental.id})">Edit</button>
                        <button class="action-btn delete-btn" onclick="deleteRental(${rental.id})">Delete</button>
                    </td>
                </tr>
            `).join('');
        })
        .catch(error => console.error('Error loading rentals:', error));
}

function loadRevenueData() {
    // Load summary data
    fetch('/api/revenue/summary')
        .then(response => response.json())
        .then(data => {
            document.getElementById('total-revenue').textContent = `₹${data.total}`;
            document.getElementById('monthly-revenue').textContent = `₹${data.monthly}`;
            document.getElementById('daily-revenue').textContent = `₹${data.daily}`;
        })
        .catch(error => console.error('Error loading revenue summary:', error));

    // Load detailed data
    fetch('/api/revenue/details')
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('revenue-data');
            tbody.innerHTML = data.map(item => `
                <tr>
                    <td>${new Date(item.date).toLocaleDateString()}</td>
                    <td>${item.total_rentals}</td>
                    <td>₹${item.revenue}</td>
                    <td>₹${item.average_rental_value}</td>
                </tr>
            `).join('');
        })
        .catch(error => console.error('Error loading revenue details:', error));
}

// Modal Functions
function showAddCarModal() {
    document.getElementById('car-modal-title').textContent = 'Add New Car';
    document.getElementById('car-form').reset();
    document.getElementById('car-modal').classList.remove('hidden');
}

function showAddEmployeeModal() {
    document.getElementById('employee-modal-title').textContent = 'Add New Employee';
    document.getElementById('employee-form').reset();
    document.getElementById('employee-modal').classList.remove('hidden');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Form Submission Handlers
document.getElementById('car-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const carData = Object.fromEntries(formData.entries());
    
    fetch('/api/cars', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(carData)
    })
    .then(response => response.json())
    .then(() => {
        hideModal('car-modal');
        loadCarsData();
    })
    .catch(error => console.error('Error saving car:', error));
});

document.getElementById('employee-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const employeeData = Object.fromEntries(formData.entries());
    
    fetch('/api/employees', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData)
    })
    .then(response => response.json())
    .then(() => {
        hideModal('employee-modal');
        loadEmployeesData();
    })
    .catch(error => console.error('Error saving employee:', error));
});

// Edit Functions
function editCar(id) {
    fetch(`/api/cars/${id}`)
        .then(response => response.json())
        .then(car => {
            document.getElementById('car-modal-title').textContent = 'Edit Car';
            const form = document.getElementById('car-form');
            form.querySelector('[name="car_id"]').value = car.id;
            form.querySelector('[name="company"]').value = car.company;
            form.querySelector('[name="model"]').value = car.model;
            form.querySelector('[name="number_plate"]').value = car.number_plate;
            form.querySelector('[name="rent_per_day"]').value = car.rent_per_day;
            form.querySelector('[name="status"]').value = car.status;
            form.querySelector('[name="image_url"]').value = car.image_url || '';
            document.getElementById('car-modal').classList.remove('hidden');
        })
        .catch(error => console.error('Error loading car details:', error));
}

function editEmployee(id) {
    fetch(`/api/employees/${id}`)
        .then(response => response.json())
        .then(employee => {
            document.getElementById('employee-modal-title').textContent = 'Edit Employee';
            const form = document.getElementById('employee-form');
            form.querySelector('[name="employee_id"]').value = employee.id;
            form.querySelector('[name="name"]').value = employee.name;
            form.querySelector('[name="email"]').value = employee.email;
            form.querySelector('[name="phone"]').value = employee.phone;
            form.querySelector('[name="role"]').value = employee.role;
            form.querySelector('[name="salary"]').value = employee.salary;
            document.getElementById('employee-modal').classList.remove('hidden');
        })
        .catch(error => console.error('Error loading employee details:', error));
}

// Delete Functions
function deleteCar(id) {
    if (confirm('Are you sure you want to delete this car?')) {
        fetch(`/api/cars/${id}`, {
            method: 'DELETE'
        })
        .then(() => loadCarsData())
        .catch(error => console.error('Error deleting car:', error));
    }
}

function deleteEmployee(id) {
    if (confirm('Are you sure you want to delete this employee?')) {
        fetch(`/api/employees/${id}`, {
            method: 'DELETE'
        })
        .then(() => loadEmployeesData())
        .catch(error => console.error('Error deleting employee:', error));
    }
}

function deleteCustomer(id) {
    if (confirm('Are you sure you want to delete this customer?')) {
        fetch(`/api/customers/${id}`, {
            method: 'DELETE'
        })
        .then(() => loadCustomersData())
        .catch(error => console.error('Error deleting customer:', error));
    }
}

function deleteRental(id) {
    if (confirm('Are you sure you want to delete this rental?')) {
        fetch(`/api/rentals/${id}`, {
            method: 'DELETE'
        })
        .then(() => loadRentalsData())
        .catch(error => console.error('Error deleting rental:', error));
    }
}

// Function to show employee sections
function showEmployeeSection(section) {
    // Hide all sections
    document.querySelectorAll('.employee-section').forEach(s => s.classList.add('hidden'));
    
    // Remove active class from all buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show selected section and activate its button
    document.getElementById(`employee-${section}`).classList.remove('hidden');
    document.querySelector(`button[onclick="showEmployeeSection('${section}')"]`).classList.add('active');
    
    // Load section data
    if (section === 'rentals') {
        loadRentals();
    } else if (section === 'cars') {
        loadCarStatus();
    }
}

// Function to update booking summary
function updateBookingSummary() {
    const rentalDate = document.getElementById('rental-date').value;
    const returnDate = document.getElementById('return-date').value;
    const carPriceElement = document.getElementById('car-preview-price');
    
    if (!carPriceElement) return;
    
    const carPriceText = carPriceElement.textContent;
    const pricePerDay = parseFloat(carPriceText.replace(/[^0-9.-]+/g, ''));

    if (rentalDate && returnDate && !isNaN(pricePerDay)) {
        const days = calculateDays(rentalDate, returnDate);
        const totalAmount = days * pricePerDay;

        const durationElement = document.getElementById('rental-duration');
        const totalElement = document.getElementById('total-amount');
        
        if (durationElement && totalElement) {
            durationElement.textContent = `${days} days`;
            totalElement.textContent = `₹${totalAmount}`;
        }
    }
}

// Add event listeners to date inputs
document.getElementById('rental-date').addEventListener('change', updateBookingSummary);
document.getElementById('return-date').addEventListener('change', updateBookingSummary);

// Set minimum dates for the date inputs
function setMinDates() {
    const today = new Date().toISOString().split('T')[0];
    const rentalDateInput = document.getElementById('rental-date');
    const returnDateInput = document.getElementById('return-date');
    
    if (rentalDateInput) {
        rentalDateInput.min = today;
    }
    if (returnDateInput) {
        returnDateInput.min = today;
    }
}

// Update return date min value when rental date is selected
document.getElementById('rental-date').addEventListener('change', function() {
    document.getElementById('return-date').min = this.value;
    if (document.getElementById('return-date').value < this.value) {
        document.getElementById('return-date').value = this.value;
    }
    updateBookingSummary();
});

// Initialize date restrictions when modal opens
function initializeBookingModal(carData) {
    setMinDates();
    // Reset form
    document.getElementById('booking-form').reset();
    document.getElementById('rental-duration').textContent = '0 days';
    document.getElementById('total-amount').textContent = '₹0';
}

// Function to show car details in modal
function showCarDetails(car) {
    const modal = document.getElementById('booking-modal');
    const carName = document.getElementById('car-preview-name');
    const carPrice = document.getElementById('car-preview-price');
    const carImage = document.getElementById('car-preview-image');

    carName.textContent = `${car.company} ${car.model}`;
    carPrice.textContent = `₹${car.rent_per_day}/day`;
    
    // Initialize the booking modal
    initializeBookingModal(car);
    
    // Show the modal
    modal.classList.remove('hidden');
}

// Close modal when clicking the close button
document.querySelector('.close-modal').addEventListener('click', function() {
    document.getElementById('booking-modal').classList.add('hidden');
}); 
