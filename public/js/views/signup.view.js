/**
 * public/js/views/signup.view.js
 * Script specific to the signup.html page (Admin creation).
 * Depends on: auth.service.js, helpers.js
 */

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    Helper.populateCountryDropdown('country-select'); // Populate country selector on load

    if (signupForm) {
        signupForm.addEventListener('submit', handleAdminSignup);
    }
});

const handleAdminSignup = (event) => {
    event.preventDefault();
    const companyName = document.getElementById('company-name').value;
    const adminEmail = document.getElementById('admin-email').value;
    const adminPassword = document.getElementById('admin-password').value;
    const countryValue = document.getElementById('country-select').value;
    
    AuthService.signupAdmin(companyName, adminEmail, adminPassword, countryValue);
};