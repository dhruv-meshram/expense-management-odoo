/**
 * public/js/services/api.service.js
 * Mock Backend/API Layer: All data storage and manipulation happens here.
 * When integrating the real backend, only the functions inside this service
 * will need to be replaced with actual HTTP requests (fetch).
 */

const APIService = (() => {

    // --- MOCK DATA STRUCTURES ---
    let mockCompanies = {}; 
    let currentCompanyId = null;

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
    currentCompanyId = initialCompanyId; 
    
    let mockApprovalRules = [
        // Example Rule for Employee Jones (id: 201 in COMP-001)
        {
            userId: 201, 
            companyId: initialCompanyId,
            isManagerApprover: true, 
            isSequential: true,
            approvers: [102, 103], // Manager (102) and Director (103)
            minPercentage: 100 
        }
    ];

    let mockExpenses = [
        {
            id: 'EXP-001', companyId: initialCompanyId, employeeId: 201, employeeName: 'Employee Jones',
            amount: 55.00, currency: 'USD', localAmount: 55.00, category: 'Food',
            description: 'Team lunch for project review', paidBy: 'Self', remarks: 'Discussed Q4 plans.', 
            date: '2025-10-01', status: 'Pending', 
            approvalChain: [
                { approverId: 102, role: 'Manager', status: 'Pending', sequence: 1 },
                { approverId: 103, role: 'Director', status: 'Not Started', sequence: 2 }
            ]
        },
        {
            id: 'EXP-002', companyId: initialCompanyId, employeeId: 201, employeeName: 'Employee Jones',
            amount: 150.00, currency: 'EUR', localAmount: 160.00, category: 'Travel',
            description: 'Train ticket to client site', paidBy: 'Company Card', remarks: 'Used train due to flight cost.', 
            date: '2025-09-28', status: 'Approved',
            approvalChain: [
                { approverId: 102, role: 'Manager', status: 'Approved', sequence: 1, comment: 'Looks good' },
                { approverId: 103, role: 'Director', status: 'Approved', sequence: 2 }
            ]
        }
    ];

    // --- UTILITIES (Hidden from public) ---
    const getNextExpenseId = () => `EXP-${String(mockExpenses.length + 1).padStart(3, '0')}`;
    const getNextUserId = (company) => {
        return company.users.length > 0 ? Math.max(...company.users.map(u => u.id)) + 1 : 1;
    };
    const getMockConversionRate = (from, to) => {
        if (from === to) return 1.0;
        if (from === 'EUR' && to === 'USD') return 1.07;
        if (from === 'USD' && to === 'EUR') return 0.93;
        // Simple mock for other cases
        return 1.1; 
    };

    // --- USER/AUTH ENDPOINTS ---
    const fetchUserByEmail = (email) => {
        for (const companyId in mockCompanies) {
            const user = mockCompanies[companyId].users.find(user => user.email === email);
            if (user) {
                user.companyId = companyId; 
                currentCompanyId = companyId; 
                return user;
            }
        }
        return null;
    };

    const createCompanyAndAdmin = (companyName, adminEmail, adminPassword, currency, country) => {
        if (fetchUserByEmail(adminEmail)) {
            return { error: 'Admin email already exists.' };
        }
        const newCompanyId = `COMP-${String(Object.keys(mockCompanies).length + 1).padStart(3, '0')}`;
        
        const newCompany = {
            id: newCompanyId,
            name: companyName,
            currency: currency,
            country: country,
            users: []
        };
        
        const newAdminId = getNextUserId(newCompany);

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

    // --- ADMIN/USER MANAGEMENT ENDPOINTS ---
    const fetchCompanyUsers = (companyId) => {
        return mockCompanies[companyId] ? mockCompanies[companyId].users : [];
    };

    const addNewUser = (companyId, name, email, role, managerId, password) => {
        const company = mockCompanies[companyId];
        if (!company) return null;
        if (company.users.find(u => u.email === email)) {
            return { error: 'User with this email already exists in the company.' };
        }
        
        const newUserId = getNextUserId(company);
        
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

    const fetchCompanyDetails = (companyId) => {
        return mockCompanies[companyId];
    };

    // --- EXPENSE ENDPOINTS ---

    const fetchUserExpenses = (userId) => {
        return mockExpenses.filter(exp => exp.employeeId === userId && exp.companyId === currentCompanyId);
    };

    const createExpense = (expenseData) => {
        const company = mockCompanies[currentCompanyId];
        const companyCurrency = company.currency;
        const localAmount = expenseData.amount * getMockConversionRate(expenseData.currency, companyCurrency);

        const userRule = fetchUserRule(expenseData.employeeId);
        const companyUsers = fetchCompanyUsers(currentCompanyId);
        
        let approvalChain = [];
        
        // --- Apply Approval Rule ---
        if (userRule && userRule.approvers.length > 0) {
            userRule.approvers.forEach((approverId, index) => {
                const approver = companyUsers.find(u => u.id === approverId);
                if (approver) {
                    approvalChain.push({
                        approverId: approverId,
                        role: approver.role,
                        // If not sequential, all steps are pending from start
                        status: (index === 0 || !userRule.isSequential) ? 'Pending' : 'Not Started', 
                        sequence: index + 1
                    });
                }
            });
        } else {
            // Fallback default: just the employee's manager
            const defaultManager = companyUsers.find(u => u.id === expenseData.managerId);
            if (defaultManager) {
                approvalChain.push({ approverId: defaultManager.id, role: defaultManager.role, status: 'Pending', sequence: 1 });
            }
        }


        const newExpense = {
            ...expenseData,
            id: getNextExpenseId(),
            companyId: currentCompanyId,
            localAmount: localAmount, 
            status: 'Pending',
            approvalChain: approvalChain
        };
        mockExpenses.unshift(newExpense); 
        return newExpense;
    };

    // --- APPROVAL ENDPOINTS ---

    const fetchPendingApprovals = (userId) => {
        return mockExpenses.filter(exp => {
            if (exp.companyId !== currentCompanyId) return false;
            
            // In a real sequential flow, only the NEXT pending step matters
            const nextStep = exp.approvalChain.find(step => step.status === 'Pending');
            
            // In a concurrent flow, any pending step by this user counts
            const isConcurrentApprover = exp.approvalChain.find(step => step.status === 'Pending' && step.approverId === userId);

            // If a sequential step exists, and this user is it, show it.
            if (nextStep && nextStep.approverId === userId) return true;
            
            // If the flow is not sequential (implied by nextStep not being found/relevant), check if user is a concurrent approver
            if (!nextStep && isConcurrentApprover) return true; 

            // Simple combined logic for mock: if user has a pending step, show it.
            return exp.approvalChain.some(step => step.status === 'Pending' && step.approverId === userId);
        });
    };

    const updateExpenseStatus = (expenseId, approverId, status, comment = null) => {
        const expense = mockExpenses.find(exp => exp.id === expenseId && exp.companyId === currentCompanyId);
        if (!expense) return false;

        const rule = fetchUserRule(expense.employeeId);
        
        const currentStepIndex = expense.approvalChain.findIndex(step => step.status === 'Pending' && step.approverId === approverId);

        if (currentStepIndex !== -1) {
            expense.approvalChain[currentStepIndex].status = status;
            expense.approvalChain[currentStepIndex].comment = comment;

            if (status === 'Approved') {
                
                const totalApprovers = expense.approvalChain.length;
                const approvedCount = expense.approvalChain.filter(step => step.status === 'Approved').length;

                // Check for Conditional/Percentage Approval Rule 
                if (rule && rule.minPercentage < 100) {
                     const requiredApprovers = Math.ceil(totalApprovers * (rule.minPercentage / 100));
                     
                     if (approvedCount >= requiredApprovers) {
                        expense.status = 'Approved';
                        // Stop sequential/concurrent checks if percentage rule met
                        return true;
                     }
                }

                // Sequential Flow
                if (rule && rule.isSequential) {
                    const nextStep = expense.approvalChain[currentStepIndex + 1];
                    if (nextStep) {
                        nextStep.status = 'Pending';
                        expense.status = 'Pending';
                    } else {
                        expense.status = 'Approved';
                    }
                } else {
                    // Concurrent Flow
                    if (approvedCount === totalApprovers) {
                        expense.status = 'Approved';
                    }
                    // Else, stay pending until all required are approved
                }
            } else {
                // Rejection always auto-rejects the whole expense flow
                expense.status = 'Rejected';
            }
            
            return true;
        }

        return false;
    };


    // --- APPROVAL RULE ENDPOINTS ---

    const fetchUserRule = (userId) => {
         return mockApprovalRules.find(r => r.userId === userId && r.companyId === currentCompanyId);
    }

    const fetchApprovalRules = () => {
        return mockApprovalRules.filter(r => r.companyId === currentCompanyId);
    };

    const saveApprovalRule = (ruleData) => {
        const index = mockApprovalRules.findIndex(r => r.userId === ruleData.userId && r.companyId === currentCompanyId);
        
        const company = mockCompanies[currentCompanyId];
        const targetUser = company.users.find(u => u.id === ruleData.userId);
        const userManagerId = targetUser?.managerId;

        let finalApprovers = [...ruleData.approvers];
        
        if (ruleData.isManagerApprover && userManagerId) {
            if (ruleData.isSequential) {
                finalApprovers = finalApprovers.filter(id => id !== userManagerId);
                finalApprovers.unshift(userManagerId);
            } else if (!finalApprovers.includes(userManagerId)) {
                finalApprovers.push(userManagerId);
            }
        }
        
        // Remove duplicates and the user himself
        finalApprovers = finalApprovers.filter((id, i, arr) => arr.indexOf(id) === i && id !== ruleData.userId);

        const newRule = {
            ...ruleData,
            companyId: currentCompanyId,
            approvers: finalApprovers,
        };

        if (index !== -1) {
            mockApprovalRules[index] = newRule;
        } else {
            mockApprovalRules.push(newRule);
        }
        return newRule;
    };

    return {
        // Auth
        fetchUserByEmail,
        createCompanyAndAdmin,
        // Company/Admin
        fetchCompanyDetails,
        fetchCompanyUsers,
        addNewUser,
        // Expenses
        fetchUserExpenses,
        createExpense,
        // Approvals
        fetchPendingApprovals,
        updateExpenseStatus,
        // Rules
        fetchApprovalRules,
        fetchUserRule,
        saveApprovalRule,
    };
})();