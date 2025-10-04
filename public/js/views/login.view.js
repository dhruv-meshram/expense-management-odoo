/**
 * public/js/views/login.view.js
 * Script specific to the login.html page.
 * Depends on: auth.service.js
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

const handleLogin = (event) => {
    event.preventDefault();
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    AuthService.login(email, password);
};