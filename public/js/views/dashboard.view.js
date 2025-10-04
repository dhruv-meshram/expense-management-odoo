/**
 * public/js/views/dashboard.view.js
 * IMPORTANT: Contains logic to render different views (Employee, Manager, Admin).
 * Depends on: auth.utils.js, api.service.js, expense.service.js, admin.service.js
 */

const DashboardView = (() => {

    let currentUser = null;
    let companyDetails = null;

    const init = () => {
        currentUser = AuthUtils.getCurrentUser();
        if (!currentUser) {
            // CRITICAL REDIRECT: If no user, go to login and STOP.
            window.location.href = 'login.html';
            return; 
        }
        
        // This line requires the user to have a companyId, which is set on login/signup.
        // It fetches details from the APIService (mock backend).
        companyDetails = APIService.fetchCompanyDetails(currentUser.companyId);
        
        updateHeader(currentUser);
        renderInitialView(currentUser.role);
    };

    const updateHeader = (user) => {
        document.getElementById('user-role-display').textContent = `${user.name} (${user.role})`;
    };

    const renderInitialView = (role) => {
        // Hide all major sections initially
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

        // Handle Admin Setup Logic
        const users = APIService.fetchCompanyUsers(currentUser.companyId);
        if (role === 'Admin' && users.length <= 1) { // Check if only the admin user exists
             renderAdminSetupView();
             document.getElementById('admin-setup-view').classList.add('active');
        } 
        // Handle Role-based Dashboard
        else if (role === 'Employee') {
            document.getElementById('employee-view').classList.add('active');
            // Hide manager/admin tabs
            document.getElementById('nav-rules').style.display = 'none';
            document.getElementById('nav-admin').style.display = 'none';
            showEmployeeTab('submission');
            bindEmployeeFormListeners();
        } else if (role === 'Manager' || role === 'Director' || role === 'Admin') {
            document.getElementById('manager-admin-view').classList.add('active');
            
            // Show Admin tabs if Admin
            if (role === 'Admin') {
                document.getElementById('manager-admin-title').textContent = 'Admin Dashboard';
                document.getElementById('nav-rules').style.display = 'block';
                document.getElementById('nav-admin').style.display = 'block';
                showManagerTab('approvals'); // Default tab for admin is approvals
            } else {
                // Manager/Director View
                document.getElementById('manager-admin-title').textContent = `${role} Approvals Dashboard`;
                document.getElementById('nav-rules').style.display = 'none';
                document.getElementById('nav-admin').style.display = 'none';
                showManagerTab('approvals'); 
            }
        }
    };
    
    // --- EMPLOYEE VIEW FUNCTIONS ---

    const bindEmployeeFormListeners = () => {
        const expenseForm = document.getElementById('expense-form');
        if (expenseForm) {
            expenseForm.addEventListener('submit', handleExpenseSubmission);
        }
        Helper.populateCurrencyDropdown('expense-currency', companyDetails.currency);
    };

    const handleExpenseSubmission = async (event) => {
        event.preventDefault();
        const formData = {
            amount: document.getElementById('expense-amount').value,
            currency: document.getElementById('expense-currency').value,
            date: document.getElementById('expense-date').value,
            description: document.getElementById('expense-desc').value,
            category: document.getElementById('expense-category').value,
            paidBy: document.getElementById('paid-by').value,
            remarks: document.getElementById('expense-remarks').value,
        };
        const newExpense = await ExpenseService.submitExpense(formData);
        if (newExpense) {
            // Reset form and switch to history tab
            document.getElementById('expense-form').reset();
            showEmployeeTab('history');
        }
    };
    
    const showEmployeeTab = (tabName) => {
        document.querySelectorAll('.employee-tab').forEach(t => t.classList.remove('active-tab'));
        document.querySelectorAll('#employee-sub-nav button').forEach(b => b.classList.remove('active-nav'));

        document.getElementById(`employee-${tabName}`).classList.add('active-tab');
        document.getElementById(`tab-${tabName}`).classList.add('active-nav');

        if (tabName === 'history') {
            renderExpenseHistory();
        }
    };

    const renderExpenseHistory = () => {
        const expenses = ExpenseService.fetchMyExpenses();
        const tableContainer = document.getElementById('employee-history');
        const companyCurrency = companyDetails.currency;
        
        let historyHTML = `
            <h3>My Expense History</h3>
            <p class="quick-test-info">Amounts are converted to your company's currency: ${companyCurrency}</p>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        if (expenses.length === 0) {
            historyHTML += `<tr><td colspan="5">No expenses submitted yet.</td></tr>`;
        } else {
            expenses.forEach(exp => {
                const statusClass = `status-${exp.status}`;
                historyHTML += `
                    <tr>
                        <td data-label="ID">${exp.id}</td>
                        <td data-label="Date">${Helper.formatDate(exp.date)}</td>
                        <td data-label="Description">${exp.description}</td>
                        <td data-label="Amount">${exp.localAmount.toFixed(2)} ${companyCurrency} (${exp.amount} ${exp.currency})</td>
                        <td data-label="Status" class="${statusClass}">${exp.status}</td>
                    </tr>
                `;
            });
        }
        
        historyHTML += `</tbody></table>`;
        tableContainer.innerHTML = historyHTML;
    };


    // --- ADMIN SETUP VIEW FUNCTIONS ---

    const renderAdminSetupView = () => {
        const companyId = currentUser.companyId;
        
        document.getElementById('setup-company-name').textContent = companyDetails.name;
        document.getElementById('setup-company-currency').textContent = companyDetails.currency;

        renderExistingUsersTable(companyId);
        populateManagerDropdown(companyId);
        bindUserCreationListener();
    };
    
    const bindUserCreationListener = () => {
        const userCreationForm = document.getElementById('user-creation-form');
        userCreationForm.removeEventListener('submit', handleUserCreation); // Prevent duplicate listeners
        userCreationForm.addEventListener('submit', handleUserCreation);
    };

    const handleUserCreation = async (event) => {
        event.preventDefault();
        const formData = {
            name: document.getElementById('new-user-name').value.trim(),
            email: document.getElementById('new-user-email').value.trim(),
            role: document.getElementById('new-user-role').value,
            managerId: document.getElementById('new-user-manager-id').value,
        };
        
        const success = await AdminService.createNewUser(formData);
        if (success) {
            document.getElementById('user-creation-form').reset();
            renderAdminSetupView();
        }
    };

    const renderExistingUsersTable = (companyId) => {
        const users = APIService.fetchCompanyUsers(companyId);
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
    };

    const populateManagerDropdown = (companyId) => {
        const managerSelect = document.getElementById('new-user-manager-id');
        const users = APIService.fetchCompanyUsers(companyId);
        
        const managers = users.filter(u => u.role === 'Admin' || u.role === 'Manager' || u.role === 'Director');
        
        managerSelect.innerHTML = '<option value="">N/A (Admin/Manager)</option>';
        
        managers.forEach(manager => {
            const option = document.createElement('option');
            option.value = manager.id;
            option.textContent = `${manager.name} (${manager.role})`;
            managerSelect.appendChild(option);
        });
    };
    
    
    // --- MANAGER/ADMIN VIEW FUNCTIONS ---
    
    const showManagerTab = (tabName) => {
        document.querySelectorAll('.manager-tab').forEach(t => t.classList.remove('active-tab'));
        document.querySelectorAll('#manager-sub-nav button').forEach(b => b.classList.remove('active-nav'));

        const tabContent = document.getElementById(`admin-${tabName}`) || document.getElementById(`manager-${tabName}`);
        const tabButton = document.getElementById(`nav-${tabName}`);

        if (tabContent && tabButton) {
            tabContent.classList.add('active-tab');
            tabButton.classList.add('active-nav');
        }

        if (tabName === 'approvals') {
            renderApprovalDashboard();
        } else if (tabName === 'users') {
            renderUserManagement();
        } else if (tabName === 'rules') {
            // Calls the function in the separate approvalRules.view.js file
            ApprovalRulesView.renderApprovalRulesConfig(); 
        }
    };
    
    const renderApprovalDashboard = () => {
        const approverId = currentUser.id;
        const pendingExpenses = AdminService.fetchPendingApprovals(approverId);
        const tableContainer = document.querySelector('#manager-approvals');
        const companyCurrency = companyDetails.currency;

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

        const tableBody = document.querySelector('#approval-table tbody');
        tableBody.innerHTML = ''; 


        if (pendingExpenses.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5">No expenses waiting for your ${currentUser.role} approval.</td></tr>`;
            return;
        }

        pendingExpenses.forEach(expense => {
            const row = tableBody.insertRow();
            
            row.insertCell(0).setAttribute('data-label', 'Employee');
            row.cells[0].textContent = expense.employeeName;

            row.insertCell(1).setAttribute('data-label', 'Date');
            row.cells[1].textContent = Helper.formatDate(expense.date);

            row.insertCell(2).setAttribute('data-label', 'Description');
            row.cells[2].textContent = expense.description;
            
            row.insertCell(3).setAttribute('data-label', 'Amount');
            row.cells[3].innerHTML = `<strong>${expense.localAmount.toFixed(2)} ${companyCurrency}</strong><br><small>(${expense.amount} ${expense.currency})</small>`;
            
            const actionCell = row.insertCell(4);
            actionCell.setAttribute('data-label', 'Action');
            const actionButton = document.createElement('button');
            actionButton.textContent = 'Review';
            actionButton.className = 'primary-btn action-button';
            // Calls the modal function in AdminService
            actionButton.onclick = () => AdminService.openApprovalModal(expense.id); 
            actionCell.appendChild(actionButton);
        });
    };
    
    const renderUserManagement = () => {
        const area = document.getElementById('admin-users');
        const company = companyDetails;
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
            <p style="margin-top: 20px;">For creating new users, please use the **Company Setup - Users** view or Admin Setup after signing up.</p>
        `;
    }
    

    // Initialize the dashboard when the DOM is ready
    document.addEventListener('DOMContentLoaded', init);

    return {
        showEmployeeTab,
        showManagerTab,
        renderApprovalDashboard,
        renderAdminSetupView // Exporting for reuse in setup flow
    };
})();