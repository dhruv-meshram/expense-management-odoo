/**
 * js/auth.js
 * Handles user login and the new Company Admin Sign Up process.
 * Depends on: mock-data.js, app.js
 */

const COUNTRY_API = 'https://restcountries.com/v3.1/all?fields=name,currencies';

// --- Country/Currency Fetching (For Sign Up) ---

async function loadCountriesForSignup() {
    const select = document.getElementById('country-select');
    if (select.children.length > 1 && select.children[1].value !== "") return;

    select.innerHTML = '<option value="">Loading Countries...</option>';

    try {
        const response = await fetch(COUNTRY_API);
        const countries = await response.json();
        
        select.innerHTML = '<option value="">Select a Country</option>';
        
        countries.sort((a, b) => a.name.common.localeCompare(b.name.common));

        countries.forEach(country => {
            const currencyCode = country.currencies ? Object.keys(country.currencies)[0] : 'N/A';
            if (currencyCode !== 'N/A') {
                const option = document.createElement('option');
                option.value = `${country.name.common}|${currencyCode}`;
                option.textContent = `${country.name.common} (${currencyCode})`;
                select.appendChild(option);
            }
        });
    } catch (error) {
        console.error("Failed to load countries:", error);
        select.innerHTML = '<option value="United States|USD">United States (USD) - Fallback</option>';
        displayMessage('Failed to load country data. Using mock fallback.', 'error');
    }
}

// --- Company Admin Sign Up ---

function handleAdminSignup(event) {
    event.preventDefault();

    const companyName = document.getElementById('company-name').value.trim();
    const adminEmail = document.getElementById('admin-email').value.trim();
    const adminPassword = document.getElementById('admin-password').value;
    const countryData = document.getElementById('country-select').value;

    if (!companyName || !adminEmail || !adminPassword || !countryData || countryData === "") {
        displayMessage('All fields are required for signup.', 'error');
        return;
    }
    
    const [countryName, currencyCode] = countryData.split('|');

    if (fetchUserByEmail(adminEmail)) {
         displayMessage('This email is already registered. Please login or use a different email.', 'error');
         return;
    }
    
    const newAdmin = createCompanyAndAdmin(companyName, adminEmail, adminPassword, currencyCode, countryName);
    
    if (newAdmin) {
        displayMessage(`Company ${companyName} created successfully! Redirecting to setup.`, 'success');
        
        currentUser = newAdmin;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateHeader();
        showView('admin-setup-view');
    } else {
        displayMessage('Signup failed due to a mock server error.', 'error');
    }
}


// --- User Login (THE FUNCTION CALLED ON BUTTON CLICK) ---

function handleLogin(event) {
    event.preventDefault(); 

    const email = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!email || !password) {
        displayMessage('Email and password are required.', 'error');
        return;
    }
    
    // Uses fetchUserByEmail from mock-data.js
    const user = fetchUserByEmail(email); 

    if (user && user.password === password) { 
        currentUser = user; 
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Uses global functions from app.js
        updateHeader();
        handlePostLogin(user.role);
        
        displayMessage(`Welcome back, ${user.role}!`, 'success');
    } else {
        displayMessage('Login failed. Invalid email or password.', 'error');
    }
}