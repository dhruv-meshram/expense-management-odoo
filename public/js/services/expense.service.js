/**
 * public/js/services/expense.service.js
 * Handles all employee expense-related business logic.
 * Depends on: api.service.js, auth.utils.js, helpers.js
 */

const ExpenseService = (() => {
    
    const submitExpense = async (formData) => {
        const currentUser = AuthUtils.getCurrentUser();
        if (!currentUser || currentUser.role !== 'Employee') {
            Helper.displayMessage('Authentication required to submit expenses.', 'error');
            return null;
        }

        const expenseData = {
            employeeId: currentUser.id,
            managerId: currentUser.managerId, 
            employeeName: currentUser.name,
            amount: parseFloat(formData.amount),
            currency: formData.currency,
            date: formData.date,
            description: formData.description,
            category: formData.category,
            paidBy: formData.paidBy,
            remarks: formData.remarks
        };

        const newExpense = APIService.createExpense(expenseData);

        if (newExpense.id) {
            Helper.displayMessage(`Expense ${newExpense.id} submitted successfully! Status: ${newExpense.status}`, 'success');
            return newExpense;
        } else {
            Helper.displayMessage('Failed to submit expense.', 'error');
            return null;
        }
    };

    const fetchMyExpenses = () => {
        const currentUser = AuthUtils.getCurrentUser();
        if (!currentUser) return [];
        return APIService.fetchUserExpenses(currentUser.id);
    };
    
    const mockOcrScan = (file) => {
        // --- MOCK OCR LOGIC ---
        if (file) {
            Helper.displayMessage(`Scanning receipt: ${file.name}... (Mock)`, 'info');
            
            // Simulate 1 second delay for "processing"
            setTimeout(() => {
                document.getElementById('expense-amount').value = '19.99';
                document.getElementById('expense-date').value = new Date().toISOString().substring(0, 10);
                document.getElementById('expense-desc').value = 'Lunch at Mock Cafe';
                document.getElementById('expense-category').value = 'food';
                document.getElementById('expense-currency').value = 'USD';
                Helper.displayMessage('Receipt scanned and fields populated!', 'success');
            }, 1000);
        }
    };


    return {
        submitExpense,
        fetchMyExpenses,
        mockOcrScan,
    };
})();