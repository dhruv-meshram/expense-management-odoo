/**
 * js/auth.js
 * Handles user login and session management.
 * Depends on: mock-data.js (for fetchUserByEmail), app.js (for handlePostLogin, logout, updateHeader)
 */

function handleLogin(event) {
    event.preventDefault(); // Stop the form from submitting traditionally

    const email = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    // Simple client-side validation for quick feedback
    if (!email || !password) {
        displayMessage('Email and password are required.', 'error');
        return;
    }

    // --- MOCK AUTHENTICATION START ---
    // In a real hackathon, you'd use fetch() here to call your backend API.
    // Example: fetch('/api/login', { method: 'POST', body: JSON.stringify({ email, password }) })
    
    const user = fetchUserByEmail(email); 

    if (user) {
        // Mock successful login (password check is skipped for hackathon speed)
        currentUser = user; 
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        updateHeader();
        handlePostLogin(user.role);
        
        displayMessage(`Welcome back, ${user.role}!`, 'success');
    } else {
        // Mock failed login
        displayMessage('Login failed. Invalid email or password.', 'error');
    }
    // --- MOCK AUTHENTICATION END ---
}