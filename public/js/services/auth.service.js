/**
 * public/js/services/auth.service.js
 * Handles login, logout, and admin signup business logic.
 * Depends on: api.service.js, auth.utils.js, helpers.js
 */

const AuthService = (() => {

    const login = async (email, password) => {
        const user = APIService.fetchUserByEmail(email);
        
        if (user && user.password === password) {
            AuthUtils.saveUser(user);
            Helper.displayMessage('Login successful! Redirecting...', 'success');
            // Redirect to the main dashboard
            window.location.href = 'dashboard.html';
            return user;
        } else {
            Helper.displayMessage('Invalid email or password.', 'error');
            return null;
        }
    };

    const signupAdmin = async (companyName, adminEmail, adminPassword, countryValue) => {
        const [country, currency] = countryValue.split('|');

        if (!country || !currency) {
            Helper.displayMessage('Please select a valid country/currency.', 'error');
            return null;
        }

        const adminUser = APIService.createCompanyAndAdmin(companyName, adminEmail, adminPassword, currency, country);

        if (adminUser.error) {
             Helper.displayMessage(adminUser.error, 'error');
             return null;
        }

        AuthUtils.saveUser(adminUser);
        Helper.displayMessage(`Company ${companyName} created! Admin logged in. Redirecting to setup...`, 'success');
        // Redirect to dashboard, which will show the Admin Setup view
        window.location.href = 'dashboard.html';
        return adminUser;
    };

    const logout = () => {
        AuthUtils.clearUser();
        // Redirect to login page
        window.location.href = 'login.html';
    };

    return {
        login,
        signupAdmin,
        logout
    };
})();