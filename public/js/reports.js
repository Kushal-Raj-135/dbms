// Reports Management
let revenueChart, paymentModeChart, transactionChart, carRevenueChart;

async function initializeReports() {
    try {
        // Set default date range (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        
        if (startDateInput && endDateInput) {
            startDateInput.value = startDate.toISOString().split('T')[0];
            endDateInput.value = endDate.toISOString().split('T')[0];
            
            // Initialize the charts with empty data first
            initializeCharts();
            
            // Then fetch and update with actual data
            await updateReports();
        } else {
            console.error('Date input elements not found');
        }
    } catch (error) {
        console.error('Error in initializeReports:', error);
        throw error;
    }
}

function initializeCharts() {
    // Initialize Revenue Trend Chart
    const revenueTrendCtx = document.getElementById('revenue-trend-chart');
    if (revenueTrendCtx) {
        revenueChart = new Chart(revenueTrendCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Monthly Revenue',
                    data: [],
                    borderColor: '#0066FF',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // Initialize Payment Mode Chart
    const paymentModeCtx = document.getElementById('payment-mode-chart');
    if (paymentModeCtx) {
        paymentModeChart = new Chart(paymentModeCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: ['#0066FF', '#10B981', '#F59E0B', '#EF4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // Initialize Transaction Volume Chart
    const transactionVolumeCtx = document.getElementById('transaction-volume-chart');
    if (transactionVolumeCtx) {
        transactionChart = new Chart(transactionVolumeCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Number of Transactions',
                    data: [],
                    backgroundColor: '#0066FF'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // Initialize Car Revenue Chart
    const carRevenueCtx = document.getElementById('car-revenue-chart');
    if (carRevenueCtx) {
        carRevenueChart = new Chart(carRevenueCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Revenue by Car Model',
                    data: [],
                    backgroundColor: '#10B981'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

async function updateReports() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/payment-report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ start_date: startDate, end_date: endDate })
        });

        if (!response.ok) throw new Error('Failed to fetch payment data');
        const data = await response.json();

        updateStatistics(data.summary);
        updatePaymentTable(data.payments);
        updateCharts(data);
    } catch (error) {
        console.error('Error updating reports:', error);
        showError('Failed to update reports');
    }
}

function updateStatistics(summary) {
    document.getElementById('total-revenue').textContent = `₹${summary.total_amount.toLocaleString()}`;
    document.getElementById('total-transactions').textContent = summary.total_payments.toLocaleString();
    document.getElementById('avg-transaction').textContent = `₹${(summary.total_amount / summary.total_payments).toLocaleString()}`;
    
    // Find most used payment mode
    const popularMode = Object.entries(summary.payment_modes)
        .sort((a, b) => b[1].count - a[1].count)[0];
    document.getElementById('popular-payment').textContent = popularMode[0];
}

function updatePaymentTable(payments) {
    const tbody = document.getElementById('payments-table').querySelector('tbody');
    tbody.innerHTML = payments.map(payment => `
        <tr>
            <td>#${payment.Payment_ID}</td>
            <td>${new Date(payment.Payment_Date).toLocaleDateString()}</td>
            <td>${payment.Customer_Name}</td>
            <td>${payment.Model}</td>
            <td>₹${payment.Amount.toLocaleString()}</td>
            <td>${payment.Payment_Mode}</td>
            <td><span class="status-badge status-completed">Completed</span></td>
        </tr>
    `).join('');
}

function updateCharts(data) {
    updateRevenueChart(data);
    updatePaymentModeChart(data);
    updateTransactionChart(data);
    updateCarRevenueChart(data);
}

function updateRevenueChart(data) {
    const monthlyData = processMonthlyRevenue(data.payments);
    
    if (revenueChart) revenueChart.destroy();
    
    revenueChart = new Chart(
        document.getElementById('revenue-trend-chart'),
        {
            type: 'line',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'Monthly Revenue',
                    data: monthlyData.values,
                    borderColor: '#0066FF',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Monthly Revenue Trend'
                    }
                }
            }
        }
    );
}

function updatePaymentModeChart(data) {
    const modeData = processPaymentModes(data.summary.payment_modes);
    
    if (paymentModeChart) paymentModeChart.destroy();
    
    paymentModeChart = new Chart(
        document.getElementById('payment-mode-chart'),
        {
            type: 'doughnut',
            data: {
                labels: modeData.labels,
                datasets: [{
                    data: modeData.values,
                    backgroundColor: [
                        '#0066FF',
                        '#10B981',
                        '#F59E0B',
                        '#EF4444'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Payment Mode Distribution'
                    }
                }
            }
        }
    );
}

function updateTransactionChart(data) {
    const dailyData = processDailyTransactions(data.payments);
    
    if (transactionChart) transactionChart.destroy();
    
    transactionChart = new Chart(
        document.getElementById('transaction-volume-chart'),
        {
            type: 'bar',
            data: {
                labels: dailyData.labels,
                datasets: [{
                    label: 'Number of Transactions',
                    data: dailyData.values,
                    backgroundColor: '#0066FF'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Daily Transaction Volume'
                    }
                }
            }
        }
    );
}

function updateCarRevenueChart(data) {
    const carData = processCarRevenue(data.payments);
    
    if (carRevenueChart) carRevenueChart.destroy();
    
    carRevenueChart = new Chart(
        document.getElementById('car-revenue-chart'),
        {
            type: 'bar',
            data: {
                labels: carData.labels,
                datasets: [{
                    label: 'Revenue by Car Model',
                    data: carData.values,
                    backgroundColor: '#10B981'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Revenue by Car Model'
                    }
                }
            }
        }
    );
}

function processMonthlyRevenue(payments) {
    const monthlyRevenue = {};
    
    payments.forEach(payment => {
        const month = new Date(payment.Payment_Date).toLocaleString('default', { month: 'short', year: 'numeric' });
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + payment.Amount;
    });
    
    return {
        labels: Object.keys(monthlyRevenue),
        values: Object.values(monthlyRevenue)
    };
}

function processPaymentModes(modes) {
    return {
        labels: Object.keys(modes),
        values: Object.values(modes).map(mode => mode.count)
    };
}

function processDailyTransactions(payments) {
    const dailyCount = {};
    
    payments.forEach(payment => {
        const date = new Date(payment.Payment_Date).toLocaleDateString();
        dailyCount[date] = (dailyCount[date] || 0) + 1;
    });
    
    return {
        labels: Object.keys(dailyCount),
        values: Object.values(dailyCount)
    };
}

function processCarRevenue(payments) {
    const carRevenue = {};
    
    payments.forEach(payment => {
        carRevenue[payment.Model] = (carRevenue[payment.Model] || 0) + payment.Amount;
    });
    
    // Sort by revenue
    const sorted = Object.entries(carRevenue)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Top 10 cars
    
    return {
        labels: sorted.map(([model]) => model),
        values: sorted.map(([, revenue]) => revenue)
    };
}

async function exportPaymentReport() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/payment-report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ start_date: startDate, end_date: endDate })
        });

        if (!response.ok) throw new Error('Failed to fetch payment data');
        const data = await response.json();

        // Create CSV content
        const csvContent = [
            ['Payment ID', 'Date', 'Customer', 'Car Model', 'Amount', 'Payment Mode'],
            ...data.payments.map(payment => [
                payment.Payment_ID,
                payment.Payment_Date,
                payment.Customer_Name,
                payment.Model,
                payment.Amount,
                payment.Payment_Mode
            ])
        ].map(row => row.join(',')).join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment_report_${startDate}_to_${endDate}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting payment report:', error);
        showError('Failed to export payment report');
    }
} 