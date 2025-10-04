/**
 * js/manager.js
 * Handles Manager, Director, and Admin views: approvals, user management, rules.
 * Includes all logic for the Admin Setup View (user creation).
 * Depends on: mock-data.js, app.js
 */

let selectedExpenseId = null;

// --- Admin Setup View Rendering and Logic ---

function renderAdminSetupView() {
    if (currentUser.role !== 'Admin' || !currentUser.companyId) return;

    const company = mockCompanies[currentUser.companyId];
    
    document.getElementById('setup-title').textContent = `${company.name} Setup - Users`;
    document.getElementById('setup-company-name').textContent = company.name;
    document.getElementById('setup-company-currency').textContent = company.currency;

    renderExistingUsersTable(company.id);
    populateManagerDropdown(company.id);
}

function renderExistingUsersTable(companyId) {
    const users = fetchCompanyUsers(companyId);
    const tableBody = document.querySelector('#existing-users-table tbody');
    tableBody.innerHTML = '';
    
    users.forEach(user => {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = user.name;
        row.insertCell(1).textContent = user.email;
        row.insertCell(2).textContent = user.role;
        
        const manager = users.find(u => u.id === user.managerId);
        row.insertCell(3).textContent = manager ? manager.name : 'N/A';
        
        row.insertCell(4).textContent = user.password; 
    });
}

function populateManagerDropdown(companyId) {
    const managerSelect = document.getElementById('new-user-manager-id');
    const users = fetchCompanyUsers(companyId);
    
    const managers = users.filter(u => u.role === 'Admin' || u.role === 'Manager' || u.role === 'Director');
    
    managerSelect.innerHTML = '<option value="">N/A (Admin/Manager)</option>';
    
    managers.forEach(manager => {
        const option = document.createElement('option');
        option.value = manager.id;
        option.textContent = `${manager.name} (${manager.role})`;
        managerSelect.appendChild(option);
    });
}

function generateRandomPassword() {
    const length = 10;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

function createUser(event) {
    event.preventDefault();

    const name = document.getElementById('new-user-name').value.trim();
    const email = document.getElementById('new-user-email').value.trim();
    const role = document.getElementById('new-user-role').value;
    const managerId = parseInt(document.getElementById('new-user-manager-id').value) || null;
    const companyId = currentUser.companyId;

    if (!name || !email || !role) {
        displayMessage('Name, Email, and Role are required.', 'error');
        return;
    }

    const randomPassword = generateRandomPassword();
    
    const newUser = addNewUser(companyId, name, email, role, managerId, randomPassword);

    if (newUser && newUser.error) {
         displayMessage(newUser.error, 'error');
         return;
    }
    
    displayMessage(`User ${name} (${role}) created successfully! Password: ${randomPassword} (Simulated Email Send)`, 'success');
    
    document.getElementById('user-creation-form').reset();
    renderAdminSetupView();
}


// --- Approval Dashboard Display (Manager/Director/Admin) ---

function renderApprovalDashboard(approverId) {
    const pendingExpenses = fetchPendingApprovals(approverId);
    const tableContainer = document.querySelector('#manager-approvals');
    const tableBody = document.querySelector('#approval-table tbody');
    tableBody.innerHTML = ''; 
    const companyCurrency = fetchCompanyCurrency();

    // Re-create the dashboard structure if needed (ensure table is present)
    if (!document.getElementById('approval-table')) {
        tableContainer.innerHTML = `
            <h3>Expenses Waiting for Your Review</h3>
            <table id="approval-table" class="data-table">
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Amount (Local Currency)</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        `;
    }


    if (pendingExpenses.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5">No expenses waiting for your ${currentUser.role} approval.</td></tr>`;
        return;
    }

    pendingExpenses.forEach(expense => {
        const row = tableBody.insertRow();
        
        row.insertCell(0).setAttribute('data-label', 'Employee');
        row.cells[0].textContent = expense.employeeName;

        row.insertCell(1).setAttribute('data-label', 'Date');
        row.cells[1].textContent = expense.date;

        row.insertCell(2).setAttribute('data-label', 'Description');
        row.cells[2].textContent = expense.description;
        
        row.insertCell(3).setAttribute('data-label', 'Amount');
        row.cells[3].innerHTML = `<strong>${expense.localAmount.toFixed(2)} ${companyCurrency}</strong><br><small>(${expense.amount} ${expense.currency})</small>`;
        
        const actionCell = row.insertCell(4);
        actionCell.setAttribute('data-label', 'Action');
        const actionButton = document.createElement('button');
        actionButton.textContent = 'Review';
        actionButton.className = 'primary-btn action-button';
        actionButton.onclick = () => openApprovalModal(expense.id);
        actionCell.appendChild(actionButton);
    });
}

// --- Approval Modal Logic ---

function openApprovalModal(expenseId) {
    selectedExpenseId = expenseId;
    const expense = mockExpenses.find(e => e.id === expenseId && e.companyId === currentUser.companyId);
    if (!expense) return;
    
    const companyCurrency = fetchCompanyCurrency();

    document.getElementById('modal-expense-id').textContent = expenseId;
    document.getElementById('modal-details').innerHTML = `
        <p><strong>Employee:</strong> ${expense.employeeName}</p>
        <p><strong>Submitted Amount:</strong> ${expense.amount} ${expense.currency}</p>
        <p><strong>Local Amount:</strong> ${expense.localAmount.toFixed(2)} ${companyCurrency}</p>
        <p><strong>Category:</strong> ${expense.category}</p>
        <p><strong>Paid By:</strong> ${expense.paidBy}</p>
        <p><strong>Description:</strong> ${expense.description}</p>
        <p><strong>Remarks:</strong> ${expense.remarks || 'N/A'}</p>
        <p style="font-weight: bold; margin-top: 10px;">Reviewer Role: ${currentUser.role}</p>
    `;
    
    document.getElementById('approval-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('approval-modal').style.display = 'none';
    document.getElementById('modal-comment').value = ''; 
    selectedExpenseId = null;
}

function processApproval(status) {
    if (!selectedExpenseId) return;

    const comment = document.getElementById('modal-comment').value.trim();
    
    const success = updateExpenseStatus(selectedExpenseId, currentUser.id, status, comment);

    if (success) {
        displayMessage(`Expense ${selectedExpenseId} ${status}. The request moves to the next approver.`, 'success');
        closeModal();
        renderApprovalDashboard(currentUser.id); 
    } else {
        displayMessage('Failed to update expense status or you are not the current approver.', 'error');
    }
}

window.onclick = function(event) {
    const modal = document.getElementById('approval-modal');
    if (event.target === modal) {
        closeModal();
    }
}

// --- Admin User Management Tab (Simplified view for Admin Dashboard) ---

function renderUserManagement() {
    const area = document.getElementById('admin-users');
    const company = mockCompanies[currentUser.companyId];
    area.innerHTML = `
        <p class="quick-test-info">
            Admin Feature Mock: This interface shows all users in **${company.name}** and their roles/managers.
        </p>
        
        <h4>Company User List</h4>
        <table class="data-table">
            <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Manager ID</th></tr>
            </thead>
            <tbody>
                ${company.users.map(u => `
                    <tr>
                        <td>${u.name}</td>
                        <td>${u.email}</td>
                        <td>${u.role}</td>
                        <td>${u.managerId || 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <p style="margin-top: 20px;">For creating new users, please use the **Company Setup - Users** view accessible right after Admin Sign Up.</p>
    `;
}

// --- Approval Rules Configuration Tab (High-Value Feature Mock) ---

function renderApprovalRulesConfig() {
    const area = document.getElementById('admin-rules');
    area.innerHTML = `
        <p class="quick-test-info">
            **MANDATORY FEATURE MOCK**: This UI demonstrates the capability to configure **Sequential** and **Conditional (Percentage/Specific)** approval rules.
        </p>
        
        <h4>Rule: Travel Expenses over $500</h4>
        <form style="border: 1px solid #ddd; padding: 20px; border-radius: 4px; margin-top: 15px;">
            <label>Trigger Condition:</label>
            <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                <select style="max-width: 150px;"><option>Category</option></select>
                <select style="max-width: 150px;"><option>is</option></select>
                <select><option>Travel</option></select>
                <select style="max-width: 150px;"><option>AND</option></select>
                <select style="max-width: 150px;"><option>Amount</option></select>
                <select style="max-width: 150px;"><option>></option></select>
                <input type="number" value="500" style="max-width: 100px;">
            </div>

            <label>Approval Flow Steps (Sequential):</label>
            
            <div class="approval-step-box">
                <h5>Step 1: Standard Review</h5>
                <p>Required Approver: <select><option>Employee's Direct Manager</option></select></p>
            </div>
            
            <div class="approval-step-box">
                <h5>Step 2: High-Value Review (Conditional/Hybrid)</h5>
                
                <p><strong>Conditional Rule Logic:</strong></p>
                
                <div style="border: 1px dashed #e9ecef; padding: 15px; margin-top: 10px; background-color: #fcfcfc;">
                    Rule: Approve if 
                    <select style="max-width: 120px;"><option>60%</option><option>80%</option></select> of Approvers (e.g., Finance Team)
                    <select style="max-width: 80px;"><option>OR</option></select>
                    <select><option>CFO/Director (Specific Approver)</option></select> approves.
                </div>
            </div>

            <button type="button" class="primary-btn submit-lg" style="margin-top: 20px;">Save Complex Rule</button>
        </form>

        <style>
            .approval-step-box {
                border: 1px solid #ced4da;
                padding: 15px;
                border-radius: 4px;
                margin-bottom: 15px;
                background-color: #f7f7f7;
            }
            .approval-step-box h5 { margin-top: 0; color: #007bff; }
        </style>
    `;
}