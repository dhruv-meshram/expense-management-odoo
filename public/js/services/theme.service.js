const ThemeService = (function() {
    const THEME_KEY = 'appTheme';
    const DARK_CLASS = 'dark-theme';
    const body = document.body;
    
    // Find the toggle button element
    const themeToggle = document.getElementById('theme-toggle');

    function applyTheme(theme) {
        if (theme === 'dark') {
            body.classList.add(DARK_CLASS);
            // Update button text to reflect the NEXT action
            if (themeToggle) themeToggle.textContent = 'Light Mode'; 
        } else {
            body.classList.remove(DARK_CLASS);
            // Update button text to reflect the NEXT action
            if (themeToggle) themeToggle.textContent = 'Dark Mode';
        }
        localStorage.setItem(THEME_KEY, theme);
    }

    function toggleTheme() {
        // Check if the dark-theme class is currently active
        const isDark = body.classList.contains(DARK_CLASS);
        const newTheme = isDark ? 'light' : 'dark';
        applyTheme(newTheme);
    }

    function initTheme() {
        // Get saved theme or default to 'light'
        let savedTheme = localStorage.getItem(THEME_KEY) || 'light';
        applyTheme(savedTheme);
    }

    // Initialize the theme immediately when the page loads
    // We use DOMContentLoaded here just in case, but usually running JS at the bottom is fine.
    document.addEventListener('DOMContentLoaded', initTheme);

    return {
        toggleTheme: toggleTheme,
    };
})();