// --- Core Application Logic ---

let currentUser = null;

// Function to handle view switching with smooth transitions
function showView(viewId) {
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
        if (view.id === viewId) {
            view.classList.add('active');
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
        roleDisplay.textContent = currentUser.role;
    } else {
        userInfoDiv.style.display = 'none';
        roleDisplay.textContent = '';
    }
}

function initializeApp() {
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        updateHeader();
        handlePostLogin(currentUser.role);
    } else {
        showView('login-view');
    }
}

// Called after successful login
function handlePostLogin(role) {
    if (role === 'Employee') {
        showView('employee-view');
        renderEmployeeHistory(); // Load initial data
        // Ensure submission tab is active by default
        showEmployeeTab('submission');
    } else if (role === 'Manager' || role === 'Director' || role === 'Admin') {
        showView('manager-admin-view');
        renderApprovalDashboard(currentUser.id); // Load pending approvals
        
        const titleElement = document.getElementById('manager-admin-title');
        titleElement.textContent = `${role} Dashboard`;

        // Only show Admin tabs if role is Admin
        document.getElementById('nav-admin').style.display = (role === 'Admin') ? 'block' : 'none';
        document.getElementById('nav-rules').style.display = (role === 'Admin') ? 'block' : 'none';
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

    // Update sub-navigation buttons
    document.querySelectorAll('.sub-nav button').forEach(btn => btn.classList.remove('active-nav'));
    document.getElementById(`tab-${tabName}`).classList.add('active-nav');

    if (tabName === 'history') {
        renderEmployeeHistory();
    }
}

function showManagerTab(tabName) {
    const tabs = document.querySelectorAll('.manager-tab');
    tabs.forEach(tab => tab.classList.remove('active-tab'));
    document.getElementById(`manager-admin-view`).querySelector(`#${tabName === 'approvals' ? 'manager-approvals' : tabName === 'users' ? 'admin-users' : 'admin-rules'}`).classList.add('active-tab');

    // Update sub-navigation buttons
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

// Simple alert function to provide user feedback
function displayMessage(message, type = 'success') {
    alert(`${type.toUpperCase()}: ${message}`);
}