/**
 * public/js/main.js
 * Global script: Handles initial setup, event listeners, and common application logic.
 */

document.addEventListener('DOMContentLoaded', () => {
    // This file mostly handles global event delegation and ensures core utility functions are available.
    
    // Example: Add global click listener for modal closing if needed,
    // though the modals in dashboard.html now call functions directly in AdminService.
    window.addEventListener('click', (event) => {
        const approvalModal = document.getElementById('approval-modal');
        const ruleModal = document.getElementById('rule-modal');
        
        if (event.target === approvalModal) {
            AdminService.closeApprovalModal();
        }
        if (event.target === ruleModal) {
            AdminService.closeRuleModal();
        }
    });

    // We no longer need to check login here as index.html and the specific view files handle the redirection.
});