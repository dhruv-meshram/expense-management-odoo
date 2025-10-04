/**
 * js/employee.js
 * Handles Employee views: submission form and expense history.
 * Depends on: mock-data.js (for fetchUserExpenses, createExpense), app.js (for currentUser, displayMessage)
 */

// --- Expense Submission ---

function submitExpense(event) {
    event.preventDefault();
    
    // 1. Collect form data
    const expenseForm = document.getElementById('expense-form');
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value;
    const description = document.getElementById('expense-desc').value.trim();

    // 2. Robust Client-side Validation (Mandatory Criteria)
    if (isNaN(amount) || amount <= 0) {
        displayMessage('Please enter a valid amount greater than zero.', 'error');
        return;
    }
    if (!category || !date || !description) {
        displayMessage('All fields (Category, Date, Description) are required.', 'error');
        return;
    }
    
    // 3. Construct the payload
    const expenseData = {
        employeeId: currentUser.id,
        employeeName: `${currentUser.role} (${currentUser.email})`,
        amount: amount,
        currency: 'USD', // Simplified for the mock. Use the API if time allows.
        category: category,
        description: description,
        date: date,
    };

    // --- MOCK API CALL ---
    const newExpense = createExpense(expenseData);
    
    // 4. Feedback and UI Reset
    displayMessage(`Expense ${newExpense.id} submitted successfully! Status: Pending.`, 'success');
    expenseForm.reset();
    
    // Automatically switch to history view to see the new expense
    showEmployeeTab('history'); 
}

// --- OCR Mock Feature (Additional Feature) ---

function mockOcrScan(file) {
    if (!file) return;

    // Acknowledge the file upload and mock the processing time
    displayMessage(`Scanning receipt: ${file.name}... (Simulating OCR processing)`);
    
    // Use a slight delay to simulate an API call
    setTimeout(() => {
        // Mock Data extraction
        const mockAmount = 75.50;
        const mockDescription = "Dinner with client (Mock OCR)";
        const today = new Date().toISOString().split('T')[0];
        
        // Populate form fields
        document.getElementById('expense-amount').value = mockAmount;
        document.getElementById('expense-category').value = 'food';
        document.getElementById('expense-date').value = today;
        document.getElementById('expense-desc').value = mockDescription;
        
        displayMessage('OCR successful! Fields auto-populated.', 'success');
    }, 800);
}


// --- Expense History Display ---

function renderEmployeeHistory() {
    // 1. Fetch the data (Mock API Call)
    const historyData = fetchUserExpenses(currentUser.id);
    const tableBody = document.querySelector('#history-table tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    if (historyData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">No expenses submitted yet.</td></tr>';
        return;
    }

    // 2. Loop and generate table rows (DOM manipulation)
    historyData.forEach(expense => {
        const row = tableBody.insertRow();
        
        // Mandatory: Add data-label for mobile responsiveness
        row.insertCell(0).setAttribute('data-label', 'Date');
        row.cells[0].textContent = expense.date;

        row.insertCell(1).setAttribute('data-label', 'Description');
        row.cells[1].textContent = expense.description;
        
        row.insertCell(2).setAttribute('data-label', 'Amount');
        row.cells[2].textContent = `${expense.amount.toFixed(2)} ${expense.currency}`;
        
        row.insertCell(3).setAttribute('data-label', 'Status');
        const statusCell = row.cells[3];
        statusCell.innerHTML = `<span class="status-${expense.status}">${expense.status}</span>`;
        
        // Optional: Add click event to view details (not fully implemented here)
        row.onclick = () => displayMessage(`Viewing details for ${expense.id}. Status: ${expense.status}`, 'info');
    });
}