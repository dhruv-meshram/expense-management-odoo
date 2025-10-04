/**
 * public/js/utils/auth.utils.js
 * Helper utilities for managing user state and local storage.
 */

const AuthUtils = (() => {
    const USER_STORAGE_KEY = 'currentUser';

    // Current user context (synced with local storage)
    let currentUser = null;

    const saveUser = (user) => {
        // In a real app, this would save a JWT token. Here, we save the user object.
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        currentUser = user;
    };

    const loadUser = () => {
        const userData = localStorage.getItem(USER_STORAGE_KEY);
        if (userData) {
            currentUser = JSON.parse(userData);
        }
        return currentUser;
    };
    
    const getCurrentUser = () => {
        return currentUser || loadUser();
    };

    const clearUser = () => {
        localStorage.removeItem(USER_STORAGE_KEY);
        currentUser = null;
    };

    return {
        saveUser,
        getCurrentUser,
        clearUser,
    };
})();