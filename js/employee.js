/**
 * js/employee.js
 * Handles Employee views: submission form and expense history.
 * Includes Currency fetching/selection and the OCR mock feature.
 * Depends on: mock-data.js, app.js
 */

document.addEventListener('DOMContentLoaded', loadCurrencies);

// --- Currency Fetching (For submission form) ---
async function loadCurrencies() {
    const currencySelect = document.getElementById('expense-currency');
    
    // Only fetch if necessary
    if (currencySelect.children.length > 1 && currencySelect.children[1].value !== "") return;
    
    currencySelect.innerHTML = '<option value="">Loading Currencies...</option>';

    const COMPANY_CURRENCY = fetchCompanyCurrency(); // Get actual company currency from mock-data

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
    // Hook for real-time currency conversion
    console.log(`Submitted currency set to: ${document.getElementById('expense-currency').value}`);
}

// --- Expense Submission ---

function submitExpense(event) {
    event.preventDefault(); 
    
    // 1. Collect form data
    const expenseForm = document.getElementById('expense-form');
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const currency = document.getElementById('expense-currency').value; 
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value;
    const description = document.getElementById('expense-desc').value.trim();

    if (isNaN(amount) || amount <= 0 || !currency || !category || !date || !description) {
        displayMessage('All fields are required.', 'error');
        return;
    }
    
    // Find employee's manager ID for the approval chain start
    const companyUsers = fetchCompanyUsers(currentUser.companyId);
    const employeeManager = companyUsers.find(u => u.id === currentUser.managerId);

    const expenseData = {
        employeeId: currentUser.id,
        employeeName: `${currentUser.name} (${currentUser.role})`,
        amount: amount,
        currency: currency,
        category: category,
        description: description,
        date: date,
        managerId: employeeManager ? employeeManager.id : 102 // Fallback to ID 102
    };

    const newExpense = createExpense(expenseData);
    
    displayMessage(`Expense ${newExpense.id} submitted successfully! Status: Pending.`, 'success');
    expenseForm.reset();
    loadCurrencies(); 
    
    showEmployeeTab('history'); 
}

// --- OCR Mock Feature (Additional Feature) ---

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
        
        displayMessage('OCR successful! Fields auto-populated.', 'success');
    }, 800);
}


// --- Expense History Display ---

function renderEmployeeHistory() {
    const historyData = fetchUserExpenses(currentUser.id);
    const tableBody = document.querySelector('#history-table tbody');
    tableBody.innerHTML = ''; 

    if (historyData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">No expenses submitted yet.</td></tr>';
        return;
    }

    historyData.forEach(expense => {
        const row = tableBody.insertRow();
        
        row.insertCell(0).setAttribute('data-label', 'Date');
        row.cells[0].textContent = expense.date;

        row.insertCell(1).setAttribute('data-label', 'Description');
        row.cells[1].textContent = expense.description;
        
        row.insertCell(2).setAttribute('data-label', 'Amount');
        row.cells[2].innerHTML = `<strong>${expense.amount.toFixed(2)} ${expense.currency}</strong><br><small>(${expense.localAmount.toFixed(2)} ${fetchCompanyCurrency()})</small>`;
        
        row.insertCell(3).setAttribute('data-label', 'Status');
        const statusCell = row.cells[3];
        statusCell.innerHTML = `<span class="status-${expense.status}">${expense.status}</span>`;
        
        row.onclick = () => displayMessage(`Viewing details for ${expense.id}. Status: ${expense.status}`, 'info');
    });
}