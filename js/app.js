/**
 * js/app.js
 * Core logic: state management, view switching ("routing"), and general utilities.
 */

let currentUser = null;

// Function to handle view switching with smooth transitions
function showView(viewId) {
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
        if (view.id === viewId) {
            view.classList.add('active');
            
            // --- New View Logic ---
            if (viewId === 'signup-view') {
                loadCountriesForSignup(); 
            }
            if (viewId === 'admin-setup-view') {
                // Ensure only admin can access this view
                if (currentUser && currentUser.role === 'Admin') {
                    renderAdminSetupView();
                } else {
                    displayMessage('Access Denied: Admin Setup only.', 'error');
                    showView('login-view');
                }
            }
        } else {
            view.classList.remove('active');
        }
    });
}

function updateHeader() {
    const userInfoDiv = document.getElementById('user-info');
    const roleDisplay = document.getElementById('user-role-display');

    if (currentUser) {
        userInfoDiv.style.display = 'flex';
        roleDisplay.textContent = `${currentUser.role} | ${mockCompanies[currentUser.companyId].name}`;
    } else {
        userInfoDiv.style.display = 'none';
        roleDisplay.textContent = '';
    }
}

function initializeApp() {
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        
        // Re-fetch user to establish currentCompanyId context in mock-data.js
        const reloadedUser = fetchUserByEmail(currentUser.email); 
        
        if (reloadedUser) {
            currentUser = reloadedUser; // Update with full context
            updateHeader();
            handlePostLogin(currentUser.role);
        } else {
             // User was deleted or error
            logout();
        }
    } else {
        showView('login-view');
    }
}

// Called after successful login
function handlePostLogin(role) {
    if (role === 'Employee') {
        showView('employee-view');
        renderEmployeeHistory(); 
        showEmployeeTab('submission'); 
    } else if (role === 'Manager' || role === 'Director' || role === 'Admin') {
        showView('manager-admin-view');
        
        const titleElement = document.getElementById('manager-admin-title');
        titleElement.textContent = `${mockCompanies[currentUser.companyId].name} - ${role} Dashboard`;

        // Only show Admin/Rules tabs for Admin role
        const isAdmin = (role === 'Admin');
        document.getElementById('nav-admin').style.display = isAdmin ? 'block' : 'none';
        document.getElementById('nav-rules').style.display = isAdmin ? 'block' : 'none';
        
        showManagerTab('approvals');
    } else {
        showView('login-view');
    }
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    updateHeader();
    showView('login-view');
}

// Initial check when the page loads
document.addEventListener('DOMContentLoaded', initializeApp);

// --- Tab Switching Handlers ---

function showEmployeeTab(tabName) {
    const tabs = document.querySelectorAll('.employee-tab');
    tabs.forEach(tab => tab.classList.remove('active-tab'));
    document.getElementById(`employee-${tabName}`).classList.add('active-tab');

    document.querySelectorAll('#employee-view .sub-nav button').forEach(btn => btn.classList.remove('active-nav'));
    document.getElementById(`tab-${tabName}`).classList.add('active-nav');

    if (tabName === 'history') {
        renderEmployeeHistory();
    }
}

function showManagerTab(tabName) {
    const tabs = document.querySelectorAll('.manager-tab');
    tabs.forEach(tab => tab.classList.remove('active-tab'));
    
    const tabId = tabName === 'approvals' ? 'manager-approvals' : 
                  tabName === 'users' ? 'admin-users' : 'admin-rules';
                  
    document.getElementById(tabId).classList.add('active-tab');

    document.querySelectorAll('#manager-admin-view .sub-nav button').forEach(btn => btn.classList.remove('active-nav'));
    document.getElementById(`nav-${tabName}`).classList.add('active-nav');
    
    // Call specific render functions
    if (tabName === 'approvals') {
        renderApprovalDashboard(currentUser.id);
    } else if (tabName === 'users') {
        renderUserManagement();
    } else if (tabName === 'rules') {
        renderApprovalRulesConfig();
    }
}

// --- General Utility ---

function displayMessage(message, type = 'success') {
    console.log(`${type.toUpperCase()}: ${message}`);
    // Use a simple alert for critical feedback in the hackathon demo
    alert(`${type.toUpperCase()}: ${message}`); 
}