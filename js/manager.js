/**
 * js/manager.js
 * Handles Manager, Director, and Admin views: approvals, user management, rules.
 * Depends on: mock-data.js (for fetchPendingApprovals, updateExpenseStatus), app.js (for currentUser, displayMessage)
 */

let selectedExpenseId = null;

// --- Approval Dashboard Display ---

function renderApprovalDashboard(approverId) {
    // 1. Fetch the data (Mock API Call)
    const pendingExpenses = fetchPendingApprovals(approverId);
    const tableBody = document.querySelector('#approval-table tbody');
    tableBody.innerHTML = ''; // Clear existing rows

    if (pendingExpenses.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5">No expenses waiting for your ${currentUser.role} approval.</td></tr>`;
        return;
    }

    // 2. Loop and generate table rows
    pendingExpenses.forEach(expense => {
        const row = tableBody.insertRow();
        
        row.insertCell(0).setAttribute('data-label', 'Employee');
        row.cells[0].textContent = expense.employeeName;

        row.insertCell(1).setAttribute('data-label', 'Date');
        row.cells[1].textContent = expense.date;

        row.insertCell(2).setAttribute('data-label', 'Description');
        row.cells[2].textContent = expense.description;
        
        // Manager's view must show amount in company's default currency
        row.insertCell(3).setAttribute('data-label', 'Amount');
        row.cells[3].innerHTML = `<strong>${expense.localAmount.toFixed(2)} USD</strong><br><small>(${expense.amount} ${expense.currency})</small>`;
        
        // Action button cell
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
    const expense = mockExpenses.find(e => e.id === expenseId);
    if (!expense) return;

    // Populate modal details
    document.getElementById('modal-expense-id').textContent = expenseId;
    document.getElementById('modal-details').innerHTML = `
        <p><strong>Employee:</strong> ${expense.employeeName}</p>
        <p><strong>Amount:</strong> ${expense.localAmount.toFixed(2)} USD (${expense.amount} ${expense.currency})</p>
        <p><strong>Category:</strong> ${expense.category}</p>
        <p><strong>Description:</strong> ${expense.description}</p>
        <p><strong>Current Step:</strong> ${currentUser.role} (${currentUser.id})</p>
    `;
    
    document.getElementById('approval-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('approval-modal').style.display = 'none';
    document.getElementById('modal-comment').value = ''; // Clear comment
    selectedExpenseId = null;
}

function processApproval(status) {
    if (!selectedExpenseId) return;

    const comment = document.getElementById('modal-comment').value.trim();
    
    // --- MOCK API CALL ---
    const success = updateExpenseStatus(selectedExpenseId, currentUser.id, status, comment);

    if (success) {
        displayMessage(`Expense ${selectedExpenseId} ${status}.`, 'success');
        closeModal();
        renderApprovalDashboard(currentUser.id); // Refresh the table
    } else {
        displayMessage('Failed to update expense status. Check logs.', 'error');
    }
}

// Close the modal if the user clicks anywhere outside of it
window.onclick = function(event) {
    const modal = document.getElementById('approval-modal');
    if (event.target == modal) {
        closeModal();
    }
}


// --- Admin-Only Features (Simplified Mock) ---

function renderUserManagement() {
    const area = document.getElementById('user-management-area');
    area.innerHTML = `
        <p class="quick-test-info">Admin Feature Mock: This area would contain a table to manage all ${mockUsers.length} users, and forms to assign roles (Employee, Manager, Director, Admin) and set their reporting manager.</p>
        
        <h4>User List (Mock)</h4>
        <ul style="list-style-type: disc; padding-left: 20px;">
            ${mockUsers.map(u => `<li>${u.email} (${u.role}) - Manager ID: ${u.managerId || 'N/A'} <button style="margin-left: 10px;" class="primary-btn">Edit</button></li>`).join('')}
        </ul>
    `;
}

function renderApprovalRulesConfig() {
    const area = document.getElementById('admin-rules');
    area.innerHTML = `
        <p class="quick-test-info">Admin Feature Mock: This feature is critical for the hackathon criteria!</p>
        <h4>Approval Rule Configuration (High-Value Mock)</h4>
        
        <p><strong>Current Rule:</strong> Any expense over 1000 USD requires Manager (102) AND Director (103) approval.</p>
        
        <form style="border: 1px solid #ddd; padding: 20px; border-radius: 4px; margin-top: 15px;">
            <label for="threshold">Define Threshold:</label>
            <input type="number" id="threshold" value="1000" style="max-width: 150px;"> USD

            <label style="margin-top: 20px;">Approval Flow Steps:</label>
            
            <div style="padding: 10px; border: 1px dashed #ccc; margin-bottom: 10px;">
                <strong>Step 1 (Sequential):</strong> <select><option>Manager (102)</option></select> must approve.
            </div>
            
            <div style="padding: 10px; border: 1px dashed #ccc; margin-bottom: 10px;">
                <strong>Step 2 (Conditional):</strong> Approval required if (60% of Approvers OR Director (103) approves).
            </div>

            <button type="button" class="primary-btn submit-lg" style="margin-top: 20px;">Save Complex Rule</button>
        </form>
    `;
}