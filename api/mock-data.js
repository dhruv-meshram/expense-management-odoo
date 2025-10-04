/**
 * MOCK DATA - Simulates your backend API responses for Users and Expenses.
 * Use this to quickly prototype your front-end logic.
 */

const mockUsers = [
    { id: 101, email: 'admin@company.com', role: 'Admin', managerId: null }, // Can override approvals [cite: 63]
    { id: 102, email: 'manager@company.com', role: 'Manager', managerId: 101 }, // Can approve/reject team expenses [cite: 63]
    { id: 103, email: 'director@company.com', role: 'Director', managerId: 102 }, // Added for multi-level approval [cite: 42]
    { id: 201, email: 'employee@company.com', role: 'Employee', managerId: 102 } // Can submit expenses [cite: 63]
];

// Note: In a real app, this would be fetched from an endpoint.
// For the hackathon, this is our initial data state.
let mockExpenses = [
    {
        id: 'EXP-001', 
        employeeId: 201, 
        employeeName: 'John Doe (Employee)',
        amount: 55.00, 
        currency: 'USD',
        localAmount: 4500.00, 
        category: 'Food',
        description: 'Team lunch for project review',
        date: '2025-10-01',
        status: 'Pending', // Current step is PENDING Manager (102)
        approvalChain: [
            { approverId: 102, role: 'Manager', status: 'Pending', sequence: 1 },
            { approverId: 103, role: 'Director', status: 'Not Started', sequence: 2 }
        ]
    },
    {
        id: 'EXP-002', 
        employeeId: 201, 
        employeeName: 'John Doe (Employee)',
        amount: 150.00, 
        currency: 'EUR',
        localAmount: 13000.00, 
        category: 'Travel',
        description: 'Train ticket to client site',
        date: '2025-09-28',
        status: 'Approved',
        approvalChain: [
            { approverId: 102, role: 'Manager', status: 'Approved', sequence: 1, comment: 'Looks good' },
            { approverId: 103, role: 'Director', status: 'Approved', sequence: 2 }
        ]
    },
    {
        id: 'EXP-003', 
        employeeId: 201, 
        employeeName: 'John Doe (Employee)',
        amount: 5.00, 
        currency: 'USD',
        localAmount: 400.00, 
        category: 'Supplies',
        description: 'Pens and notebook',
        date: '2025-10-02',
        status: 'Rejected',
        approvalChain: [
            { approverId: 102, role: 'Manager', status: 'Rejected', sequence: 1, comment: 'Not covered by policy.' }
        ]
    }
];

// --- Mock API Functions ---

const fetchUserByEmail = (email) => {
    return mockUsers.find(user => user.email === email);
};

const fetchUserExpenses = (userId) => {
    return mockExpenses.filter(exp => exp.employeeId === userId);
};

// Gets expenses where the current user is the next required approver
const fetchPendingApprovals = (userId) => {
    return mockExpenses.filter(exp => {
        // Find the next step in the approval chain for this expense
        const nextStep = exp.approvalChain.find(step => step.status === 'Pending');
        // Check if the current user is the approver for that step
        return nextStep && nextStep.approverId === userId;
    });
};

const updateExpenseStatus = (expenseId, approverId, status, comment = null) => {
    const expense = mockExpenses.find(exp => exp.id === expenseId);
    if (!expense) return false;

    // Find the current pending step
    const currentStepIndex = expense.approvalChain.findIndex(step => step.status === 'Pending' && step.approverId === approverId);

    if (currentStepIndex !== -1) {
        // 1. Update the current step
        expense.approvalChain[currentStepIndex].status = status;
        expense.approvalChain[currentStepIndex].comment = comment;

        // 2. If APPROVED, check the next step
        if (status === 'Approved') {
            const nextStep = expense.approvalChain[currentStepIndex + 1];
            if (nextStep) {
                // Move to the next approver
                nextStep.status = 'Pending';
                expense.status = 'Pending';
            } else {
                // Final approval
                expense.status = 'Approved';
            }
        } else {
            // If REJECTED, the expense is fully rejected
            expense.status = 'Rejected';
        }
        
        return true;
    }

    return false;
};

const createExpense = (expenseData) => {
    const newId = `EXP-${String(mockExpenses.length + 1).padStart(3, '0')}`;
    const newExpense = {
        ...expenseData,
        id: newId,
        localAmount: expenseData.amount * 82, // Simple mock conversion
        status: 'Pending',
        // Default chain: Manager then Director
        approvalChain: [
            { approverId: 102, role: 'Manager', status: 'Pending', sequence: 1 },
            { approverId: 103, role: 'Director', status: 'Not Started', sequence: 2 }
        ]
    };
    mockExpenses.unshift(newExpense); // Add to the front
    return newExpense;
};