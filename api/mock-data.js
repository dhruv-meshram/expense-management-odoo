/**
 * MOCK DATA - REVISED
 * Includes multiple companies and tracks created users/passwords.
 * Simulates backend for company creation, user management, and expenses.
 */

// Global state to track companies and users
let mockCompanies = {}; // { 'companyId': { name, currency, users: [] } }
let currentCompanyId = null;

// Initial state for quick testing (the old setup)
const initialCompanyId = 'COMP-001';
mockCompanies[initialCompanyId] = {
    id: initialCompanyId,
    name: 'Odoo Demo Corp',
    currency: 'USD',
    country: 'United States',
    users: [
        { id: 101, email: 'admin@company.com', role: 'Admin', managerId: null, name: 'Admin User', password: 'password' },
        { id: 102, email: 'manager@company.com', role: 'Manager', managerId: 101, name: 'Manager Doe', password: 'password' },
        { id: 103, email: 'director@company.com', role: 'Director', managerId: 102, name: 'Director Smith', password: 'password' },
        { id: 201, email: 'employee@company.com', role: 'Employee', managerId: 102, name: 'Employee Jones', password: 'password' }
    ]
};
currentCompanyId = initialCompanyId; // Set default for initial testing

// Initial mock expenses (for COMP-001)
let mockExpenses = [
    {
        id: 'EXP-001', 
        companyId: initialCompanyId,
        employeeId: 201, 
        employeeName: 'Employee Jones (Employee)',
        amount: 55.00, 
        currency: 'USD',
        localAmount: 55.00, // Mock Company Currency: USD
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
        companyId: initialCompanyId,
        employeeId: 201, 
        employeeName: 'Employee Jones (Employee)',
        amount: 150.00, 
        currency: 'EUR',
        localAmount: 160.00, // Mock conversion (150 EUR ≈ 160 USD)
        category: 'Travel',
        description: 'Train ticket to client site',
        date: '2025-09-28',
        status: 'Approved',
        approvalChain: [
            { approverId: 102, role: 'Manager', status: 'Approved', sequence: 1, comment: 'Looks good' },
            { approverId: 103, role: 'Director', status: 'Approved', sequence: 2 }
        ]
    }
];


// --- Mock API Functions ---

const fetchUserByEmail = (email) => {
    // Check all companies for the user
    for (const companyId in mockCompanies) {
        const user = mockCompanies[companyId].users.find(user => user.email === email);
        if (user) {
            user.companyId = companyId; // Inject companyId for context
            currentCompanyId = companyId; // Set context for subsequent calls
            return user;
        }
    }
    return null;
};

const createCompanyAndAdmin = (companyName, adminEmail, adminPassword, currency, country) => {
    const newCompanyId = `COMP-${String(Object.keys(mockCompanies).length + 1).padStart(3, '0')}`;
    const newAdminId = 1; 
    
    const newCompany = {
        id: newCompanyId,
        name: companyName,
        currency: currency,
        country: country,
        users: []
    };
    
    const newAdmin = {
        id: newAdminId,
        name: 'Company Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'Admin',
        managerId: null,
        companyId: newCompanyId
    };
    
    newCompany.users.push(newAdmin);
    mockCompanies[newCompanyId] = newCompany;
    currentCompanyId = newCompanyId;
    return newAdmin;
};

const fetchCompanyUsers = (companyId) => {
    return mockCompanies[companyId] ? mockCompanies[companyId].users : [];
};

const addNewUser = (companyId, name, email, role, managerId, password) => {
    const company = mockCompanies[companyId];
    if (!company) return null;
    
    // Check for existing user (Mandatory criteria)
    if (company.users.find(u => u.email === email)) {
        return { error: 'User with this email already exists in the company.' };
    }
    
    const maxId = company.users.length > 0 ? Math.max(...company.users.map(u => u.id)) : 0;
    const newUserId = maxId + 1;
    
    const newUser = {
        id: newUserId,
        name: name,
        email: email,
        password: password,
        role: role,
        managerId: managerId || null,
        companyId: companyId
    };
    
    company.users.push(newUser);
    return newUser;
};


// --- Expense Mock Functions (Use currentCompanyId for context) ---

const fetchCompanyCurrency = () => {
    return mockCompanies[currentCompanyId] ? mockCompanies[currentCompanyId].currency : 'USD';
};

const fetchUserExpenses = (userId) => {
    return mockExpenses.filter(exp => exp.employeeId === userId && exp.companyId === currentCompanyId);
};

// Gets expenses where the current user is the next required approver
const fetchPendingApprovals = (userId) => {
    return mockExpenses.filter(exp => {
        if (exp.companyId !== currentCompanyId) return false;
        
        // Find the next step in the approval chain for this expense
        const nextStep = exp.approvalChain.find(step => step.status === 'Pending');
        // Check if the current user is the approver for that step
        return nextStep && nextStep.approverId === userId;
    });
};

const updateExpenseStatus = (expenseId, approverId, status, comment = null) => {
    const expense = mockExpenses.find(exp => exp.id === expenseId && exp.companyId === currentCompanyId);
    if (!expense) return false;

    // Find the current pending step
    const currentStepIndex = expense.approvalChain.findIndex(step => step.status === 'Pending' && step.approverId === approverId);

    if (currentStepIndex !== -1) {
        // 1. Update the current step
        expense.approvalChain[currentStepIndex].status = status;
        expense.approvalChain[currentStepIndex].comment = comment;

        // 2. If APPROVED, check the next step (Sequential Flow Mock)
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
    
    // MOCK: Simplify currency conversion for hackathon. 
    // USD/EUR is 1.07. All others are 1.0.
    const companyCurrency = fetchCompanyCurrency();
    let mockConversionRate = 1.0;
    if (expenseData.currency === 'EUR' && companyCurrency === 'USD') {
        mockConversionRate = 1.07;
    } else if (expenseData.currency === 'USD' && companyCurrency === 'EUR') {
        mockConversionRate = 0.93;
    }
    const localAmount = expenseData.amount * mockConversionRate;

    // Default flow: Manager (ID 102) then Director (ID 103)
    const newExpense = {
        ...expenseData,
        id: newId,
        companyId: currentCompanyId, // Link to the current company
        localAmount: localAmount, 
        status: 'Pending',
        approvalChain: [
            { approverId: expenseData.managerId || 102, role: 'Manager', status: 'Pending', sequence: 1 }, // Use employee's manager
            { approverId: 103, role: 'Director', status: 'Not Started', sequence: 2 }
        ]
    };
    mockExpenses.unshift(newExpense); 
    return newExpense;
};