/**
 * js/employee.js
 * Handles Employee views: submission form and expense history.
 * Includes Currency fetching/selection, the OCR mock feature, and the Summary Header.
 * Depends on: mock-data.js, app.js
 */

document.addEventListener('DOMContentLoaded', loadCurrencies);

// --- Currency Fetching (For submission form) ---
async function loadCurrencies() {
    const currencySelect = document.getElementById('expense-currency');
    
    if (currencySelect.children.length > 1 && currencySelect.children[1].value !== "") return;
    
    currencySelect.innerHTML = '<option value="">Loading Currencies...</option>';

    const COMPANY_CURRENCY = fetchCompanyCurrency();

    try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,currencies');
        const countries = await response.json();
        
        let currencyCodes = new Set([COMPANY_CURRENCY, 'EUR', 'GBP', 'INR']); 
        countries.forEach(country => {
            if (country.currencies) {
                Object.keys(country.currencies).forEach(code => currencyCodes.add(code));
            }
        });

        currencySelect.innerHTML = '<option value="">Select Currency</option>';
        Array.from(currencyCodes).sort().forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = code;
            currencySelect.appendChild(option);
        });

        currencySelect.value = COMPANY_CURRENCY;

    } catch (error) {
        console.error("Failed to load currencies for employee:", error);
        currencySelect.innerHTML = `<option value="${COMPANY_CURRENCY}">${COMPANY_CURRENCY} (Default)</option><option value="EUR">EUR</option>`;
    }
}

function updateAmountDisplay() {
    console.log(`Submitted currency set to: ${document.getElementById('expense-currency').value}`);
}

// --- Expense Submission ---

function submitExpense(event) {
    event.preventDefault(); 
    
    const expenseForm = document.getElementById('expense-form');
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const currency = document.getElementById('expense-currency').value; 
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value;
    const description = document.getElementById('expense-desc').value.trim();
    const paidBy = document.getElementById('paid-by').value;
    const remarks = document.getElementById('expense-remarks').value.trim();

    if (isNaN(amount) || amount <= 0 || !currency || !category || !date || !description || !paidBy) {
        displayMessage('All required fields (Amount, Currency, Date, Description, Category, Paid By) must be filled.', 'error');
        return;
    }
    
    const companyUsers = fetchCompanyUsers(currentUser.companyId);
    const employeeManager = companyUsers.find(u => u.id === currentUser.managerId);

    const expenseData = {
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        amount: amount,
        currency: currency,
        category: category,
        description: description,
        date: date,
        paidBy: paidBy,
        remarks: remarks,
        managerId: employeeManager ? employeeManager.id : 102
    };

    const newExpense = createExpense(expenseData);
    
    displayMessage(`Expense ${newExpense.id} submitted successfully! Status: Pending.`, 'success');
    expenseForm.reset();
    loadCurrencies(); 
    
    showEmployeeTab('history'); 
}

// --- OCR Mock Feature ---

function mockOcrScan(file) {
    if (!file) return;

    displayMessage(`Scanning receipt: ${file.name}... (Simulating OCR processing)`);
    
    setTimeout(() => {
        const mockAmount = 99.99;
        const mockCurrency = 'EUR'; 
        const mockDescription = "Client Dinner (OCR Scan)";
        const today = new Date().toISOString().split('T')[0];
        
        document.getElementById('expense-amount').value = mockAmount;
        document.getElementById('expense-currency').value = mockCurrency; 
        document.getElementById('expense-category').value = 'food';
        document.getElementById('expense-date').value = today;
        document.getElementById('expense-desc').value = mockDescription;
        document.getElementById('paid-by').value = 'Self';
        
        displayMessage('OCR successful! Fields auto-populated.', 'success');
    }, 800);
}


// --- Expense History Display with Summary Header ---

function renderEmployeeHistory() {
    const historyData = fetchUserExpenses(currentUser.id);
    const tableContainer = document.getElementById('employee-history');
    
    // --- 1. Calculate Summary Stats ---
    let totalPendingAmount = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    const companyCurrency = fetchCompanyCurrency();

    historyData.forEach(expense => {
        if (expense.status === 'Pending') {
            totalPendingAmount += expense.localAmount;
            pendingCount++;
        } else if (expense.status === 'Approved') {
            approvedCount++;
        }
    });

    // --- 2. Create/Update Summary Header HTML ---
    let summaryHtml = `
        <div class="summary-header">
            <div class="summary-card">
                <h4>Amount to be Approved</h4>
                <p><strong>${totalPendingAmount.toFixed(2)} ${companyCurrency}</strong></p>
            </div>
            <div class="summary-card">
                <h4>Submitted for Approval</h4>
                <p><strong>${pendingCount}</strong> Expenses</p>
            </div>
            <div class="summary-card">
                <h4>Approved Expenses</h4>
                <p><strong>${approvedCount}</strong> Expenses</p>
            </div>
        </div>
        <h3>My Expense History</h3>
    `;
    
    tableContainer.innerHTML = `
        ${summaryHtml}
        <table id="history-table" class="data-table">
            <thead>
                <tr>
                    <th>Employee Name</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Paid By</th>
                    <th>Remarks</th>
                    <th>Amount (Local)</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                </tbody>
        </table>
    `;


    // --- 3. Populate Table Body ---
    const tableBody = document.querySelector('#history-table tbody');

    if (historyData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8">No expenses submitted yet.</td></tr>';
        return;
    }

    historyData.forEach(expense => {
        const row = tableBody.insertRow();
        
        row.insertCell(0).setAttribute('data-label', 'Employee Name');
        row.cells[0].textContent = expense.employeeName;

        row.insertCell(1).setAttribute('data-label', 'Description');
        row.cells[1].textContent = expense.description;

        row.insertCell(2).setAttribute('data-label', 'Date');
        row.cells[2].textContent = expense.date;

        row.insertCell(3).setAttribute('data-label', 'Category');
        row.cells[3].textContent = expense.category;
        
        row.insertCell(4).setAttribute('data-label', 'Paid By');
        row.cells[4].textContent = expense.paidBy;
        
        row.insertCell(5).setAttribute('data-label', 'Remarks');
        row.cells[5].textContent = expense.remarks || 'N/A';
        
        row.insertCell(6).setAttribute('data-label', 'Amount');
        row.cells[6].innerHTML = `<strong>${expense.amount.toFixed(2)} ${expense.currency}</strong><br><small>(${expense.localAmount.toFixed(2)} ${companyCurrency})</small>`;
        
        row.insertCell(7).setAttribute('data-label', 'Status');
        row.cells[7].innerHTML = `<span class="status-${expense.status}">${expense.status}</span>`;
        
        row.onclick = () => displayMessage(`Viewing details for ${expense.id}. Status: ${expense.status}`, 'info');
    });
}