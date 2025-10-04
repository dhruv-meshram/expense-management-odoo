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
        // Ensuring user-badge class is properly applied
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
            document.getElementById('nav-item-employee').classList.add('active');
            document.getElementById('nav-item-admin-setup').style.display = 'none';

            document.getElementById('nav-rules').style.display = 'none';
            document.getElementById('nav-admin').style.display = 'none';
            showEmployeeTab('submission');
            bindEmployeeFormListeners();
        } else if (role === 'Manager' || role === 'Director' || role === 'Admin') {
            document.getElementById('manager-admin-view').classList.add('active');
            document.getElementById('nav-item-manager').classList.add('active');
            document.getElementById('nav-item-admin-setup').style.display = 'none';

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

    // Exported function to switch views from the sidebar (if you added sidebar links)
    const showView = (viewId) => {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
    }

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

    // MODIFICATION 1: Enhance renderExpenseHistory table with status badge
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
                        <th>Amount (Local)</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (expenses.length === 0) {
            historyHTML += `<tr><td colspan="5" style="text-align: center; color: var(--color-text-light);">No expenses submitted yet. Get started by submitting your first one!</td></tr>`;
        } else {
            expenses.forEach(exp => {
                // Use the new status badge classes for cleaner visual presentation
                const statusHtml = `<span class="status-badge status-${exp.status}">${exp.status}</span>`;

                historyHTML += `
                    <tr>
                        <td data-label="ID">${exp.id}</td>
                        <td data-label="Date">${Helper.formatDate(exp.date)}</td>
                        <td data-label="Description">${exp.description}</td>
                        <td data-label="Amount"><strong>${exp.localAmount.toFixed(2)} ${companyCurrency}</strong><br><small>(${exp.amount} ${exp.currency})</small></td>
                        <td data-label="Status">${statusHtml}</td>
                    </tr>
                `;
            });
        }

        historyHTML += `</tbody></table>`;
        tableContainer.innerHTML = historyHTML;
    };


    // --- ADMIN SETUP VIEW FUNCTIONS (REUSED FOR USER MANAGEMENT TAB) ---

    const renderAdminSetupView = () => {
        const companyId = currentUser.companyId;

        document.getElementById('setup-company-name').textContent = companyDetails.name;
        document.getElementById('setup-company-currency').textContent = companyDetails.currency;

        renderExistingUsersTable(companyId);
        populateManagerDropdown(companyId);
        bindUserCreationListener();
    };

    const bindUserCreationListener = () => {
        // NOTE: This targets the form ID. Since both 'admin-setup-view' and 'admin-users' 
        // will now contain a form with ID 'user-creation-form' at different times,
        // this listener is bound whenever the view is rendered.
        const userCreationForm = document.getElementById('user-creation-form');
        if (userCreationForm) {
            userCreationForm.removeEventListener('submit', handleUserCreation); // Prevent duplicate listeners
            userCreationForm.addEventListener('submit', handleUserCreation);
        }
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
            
            // Determine which view to re-render to update the table
            if (document.getElementById('admin-setup-view').classList.contains('active')) {
                renderAdminSetupView(); // Re-render initial setup view
            } else {
                renderUserManagement(); // Re-render the ongoing user management tab
            }
        }
    };

    const renderExistingUsersTable = (companyId) => {
        const users = APIService.fetchCompanyUsers(companyId);
        // CRITICAL: Must select the table body, as the table itself is rendered dynamically
        // either inside renderAdminSetupView or renderUserManagement.
        const tableBody = document.querySelector('#existing-users-table tbody');
        
        // This function will fail if it runs before the table is added to the DOM.
        if (!tableBody) return; 
        
        tableBody.innerHTML = '';

        users.forEach(user => {
            const row = tableBody.insertRow();
            row.insertCell(0).textContent = user.name;
            row.insertCell(1).textContent = user.email;
            row.insertCell(2).textContent = user.role;

            // UX Improvement: Show Manager Name instead of ID
            const manager = users.find(u => u.id === user.managerId);
            row.insertCell(3).textContent = manager ? `${manager.name} (${manager.role})` : 'N/A';
            
            // Only the Admin Setup view needs the password column (column 4)
            if (row.cells.length === 5) {
                row.insertCell(4).textContent = user.password;
            }
        });
    };

    const populateManagerDropdown = (companyId) => {
        // CRITICAL: Look for the dropdown wherever it is now placed.
        const managerSelect = document.getElementById('new-user-manager-id');
        
        if (!managerSelect) return;
        
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
            // CRITICAL: Call the updated function
            renderUserManagement();
        } else if (tabName === 'rules') {
            // Calls the function in the separate approvalRules.view.js file
            ApprovalRulesView.renderApprovalRulesConfig();
        }
    };

    // MODIFICATION 2: Enhance renderApprovalDashboard table with action-btn class
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
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--color-text-light);">No expenses waiting for your ${currentUser.role} approval.</td></tr>`;
            return;
        }

        pendingExpenses.forEach(expense => {
            const row = tableBody.insertRow();

            row.insertCell(0).setAttribute('data-label', 'Employee');
            row.cells[0].textContent = expense.employeeName;

            row.insertCell(1).setAttribute('data-label', 'Date');
            row.cells[1].textContent = Helper.formatDate(expense.date);

            row.insertCell(2).setAttribute('data-label', 'Description');
            // UX Improvement: Truncate long descriptions to prevent wide tables
            const truncatedDesc = expense.description.length > 50 ? expense.description.substring(0, 47) + '...' : expense.description;
            row.cells[2].textContent = truncatedDesc;

            row.insertCell(3).setAttribute('data-label', 'Amount');
            // Use strong tag for better emphasis on the local amount
            row.cells[3].innerHTML = `<strong>${expense.localAmount.toFixed(2)} ${companyCurrency}</strong><br><small style="color: var(--color-text-light);">(${expense.amount} ${expense.currency})</small>`;

            const actionCell = row.insertCell(4);
            actionCell.setAttribute('data-label', 'Action');
            const actionButton = document.createElement('button');
            actionButton.textContent = 'Review';

            // Apply the new action-btn class
            actionButton.className = 'action-btn';

            // Calls the modal function in AdminService
            actionButton.onclick = () => AdminService.openApprovalModal(expense.id);
            actionCell.appendChild(actionButton);
        });
    };

    // CRITICAL MODIFICATION: Updated renderUserManagement to include the form
    const renderUserManagement = () => {
        const area = document.getElementById('admin-users');
        const company = companyDetails;
        const companyId = currentUser.companyId;

        // --- DYNAMICALLY RENDER THE FORM AND TABLE STRUCTURE ---
        area.innerHTML = `
            <p class="quick-test-info">
                The **User Management** tab allows administrators to create new users and review the complete list of company personnel in **${company.name}**.
            </p>

            <div class="card" style="margin-bottom: 30px;">
                <h4 class="card-header">Create New User</h4>
                <form id="user-creation-form">
                    <table class="data-table" style="margin-bottom: 20px;">
                        <thead>
                            <tr>
                                <th>Name</th><th>Email</th><th>Role</th><th>Manager</th><th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><input type="text" id="new-user-name" required placeholder="John Doe" class="form-control"></td>
                                <td><input type="email" id="new-user-email" required placeholder="john@alpha.com" class="form-control"></td>
                                <td>
                                    <select id="new-user-role" required class="form-control">
                                        <option value="Employee">Employee</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Director">Director</option>
                                    </select>
                                </td>
                                <td>
                                    <select id="new-user-manager-id" class="form-control">
                                        </select>
                                </td>
                                <td>
                                    <button type="submit" class="primary-btn submit-lg" style="font-size: 0.9rem; padding: 8px 15px; width: auto; margin: 0;">
                                        Create & Email
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </form>
            </div>

            <h3 style="margin-top: 30px;">Existing Users</h3>
            <table id="existing-users-table" class="data-table" style="max-width: 100%;">
                <thead>
                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Manager</th></tr>
                </thead>
                <tbody>
                    </tbody>
            </table>
        `;
        
        // --- BIND LISTENERS AND POPULATE DROPDOWNS/TABLE ---
        populateManagerDropdown(companyId);
        // Note: The existing-users-table here has 4 columns (no password), 
        // the renderExistingUsersTable function is smart enough to handle this.
        renderExistingUsersTable(companyId); 
        bindUserCreationListener();
    }


    // Initialize the dashboard when the DOM is ready
    document.addEventListener('DOMContentLoaded', init);

    return {
        init, // Added init for manual re-call if needed
        showEmployeeTab,
        showManagerTab,
        showView, // Exported showView for sidebar interaction
        renderApprovalDashboard,
        renderAdminSetupView,
        renderUserManagement // Export the updated function
    };
})();