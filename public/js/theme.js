/**
 * public/js/theme.js
 * Handles light (Latte) and dark (Mocha) theme switching.
 */

const ThemeSwitcher = (() => {
    // Find the toggle button in any of the HTML pages
    const themeToggleButton = document.getElementById('theme-toggle');
    
    // Check user's system preference
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Get saved theme from browser's local storage
    const currentTheme = localStorage.getItem('theme');

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            // The dark theme is default, so we remove the attribute
            document.body.removeAttribute('data-theme');
            if (themeToggleButton) themeToggleButton.textContent = '☀️'; // Sun icon to switch to light
            localStorage.setItem('theme', 'dark');
        } else {
            // The light theme is applied by adding the data-theme attribute
            document.body.setAttribute('data-theme', 'light');
            if (themeToggleButton) themeToggleButton.textContent = '🌙'; // Moon icon to switch to dark
            localStorage.setItem('theme', 'light');
        }
    };

    const toggleTheme = () => {
        const activeTheme = localStorage.getItem('theme');
        // If the current theme is light, switch to dark, and vice versa
        if (activeTheme === 'light') {
            applyTheme('dark');
        } else {
            applyTheme('light');
        }
    };

    const init = () => {
        // On page load, apply the saved theme or the system preference
        if (currentTheme) {
            applyTheme(currentTheme);
        } else {
            // If no theme is saved, use the user's OS preference
            applyTheme(prefersDarkScheme.matches ? 'dark' : 'light');
        }

        // Add the click event listener to the button
        if (themeToggleButton) {
            themeToggleButton.addEventListener('click', toggleTheme);
        }
    };

    return {
        init,
    };
})();

// Initialize the theme switcher as soon as the page content is loaded
document.addEventListener('DOMContentLoaded', ThemeSwitcher.init);