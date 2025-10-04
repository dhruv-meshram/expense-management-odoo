/**
 * public/js/utils/helpers.js
 * Helper functions for date formatting, messaging, etc.
 */

const Helper = (() => {

    const displayMessage = (message, type = 'info') => {
        const area = document.getElementById('message-area');
        if (!area) return;

        area.textContent = message;
        area.className = `message-area message-${type}`;
        area.style.display = 'block';

        // Auto-hide the message after 5 seconds
        setTimeout(() => {
            area.style.display = 'none';
        }, 5000);
    };

    const populateCurrencyDropdown = (selectId, companyCurrency = 'USD') => {
        const selectElement = document.getElementById(selectId);
        if (!selectElement) return;

        // Mock common currencies
        const currencies = [
            'USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD'
        ];
        
        selectElement.innerHTML = '';

        currencies.forEach(currency => {
            const option = document.createElement('option');
            option.value = currency;
            option.textContent = currency;
            if (currency === companyCurrency) {
                // Ensure company currency is easily selectable, but not necessarily the default for submission
            }
            selectElement.appendChild(option);
        });
        
        // Set USD as default for the employee submission form
        selectElement.value = 'USD';
    };

    const populateCountryDropdown = async (selectId) => {
        const selectElement = document.getElementById(selectId);
        if (!selectElement) return;

        selectElement.innerHTML = '<option value="">Loading Countries...</option>';

        // Mocking the country list (since we can't use the external API)
        const mockCountries = [
            { name: { common: "United States" }, currencies: { USD: {} } },
            { name: { common: "United Kingdom" }, currencies: { GBP: {} } },
            { name: { common: "India" }, currencies: { INR: {} } },
            { name: { common: "Germany" }, currencies: { EUR: {} } },
        ];
        
        selectElement.innerHTML = '<option value="">Select Country</option>';
        mockCountries.forEach(country => {
            const currencyCode = Object.keys(country.currencies)[0];
            const option = document.createElement('option');
            option.value = `${country.name.common}|${currencyCode}`;
            option.textContent = `${country.name.common} (${currencyCode})`;
            selectElement.appendChild(option);
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return {
        displayMessage,
        populateCurrencyDropdown,
        populateCountryDropdown,
        formatDate,
    };
})();