/**
 * public/js/services/admin.service.js
 * Handles all Admin/Manager/Director business logic: user creation, approvals, and rules.
 * Depends on: api.service.js, auth.utils.js, helpers.js
 */

const AdminService = (() => {

    let selectedExpenseId = null;
    let selectedRuleUserId = null;


    // --- USER MANAGEMENT ---

    const createNewUser = async (formData) => {
        const currentUser = AuthUtils.getCurrentUser();
        const companyId = currentUser.companyId;

        const name = formData.name;
        const email = formData.email;
        const role = formData.role;
        const managerId = parseInt(formData.managerId) || null;
        
        // Generate a random password (simulating backend generating temporary password)
        const password = 'password'; 

        const newUser = APIService.addNewUser(companyId, name, email, role, managerId, password);

        if (newUser && newUser.error) {
             Helper.displayMessage(newUser.error, 'error');
             return false;
        }
        
        Helper.displayMessage(`User ${name} (${role}) created successfully! Password: ${password} (Simulated Email Send)`, 'success');
        return true;
    };

    // --- APPROVALS ---

    const fetchPendingApprovals = () => {
        const currentUser = AuthUtils.getCurrentUser();
        if (!currentUser) return [];
        return APIService.fetchPendingApprovals(currentUser.id);
    };

    const openApprovalModal = (expenseId) => {
        selectedExpenseId = expenseId;
        const expense = APIService.mockExpenses.find(e => e.id === expenseId && e.companyId === AuthUtils.getCurrentUser().companyId);
        if (!expense) return;
        
        const company = APIService.fetchCompanyDetails(AuthUtils.getCurrentUser().companyId);

        document.getElementById('modal-expense-id').textContent = expenseId;
        document.getElementById('modal-details').innerHTML = `
            <p><strong>Employee:</strong> ${expense.employeeName}</p>
            <p><strong>Submitted Amount:</strong> ${expense.amount} ${expense.currency}</p>
            <p><strong>Local Amount:</strong> ${expense.localAmount.toFixed(2)} ${company.currency}</p>
            <p><strong>Category:</strong> ${expense.category}</p>
            <p><strong>Paid By:</strong> ${expense.paidBy}</p>
            <p><strong>Description:</strong> ${expense.description}</p>
            <p><strong>Remarks:</strong> ${expense.remarks || 'N/A'}</p>
            <p style="font-weight: bold; margin-top: 10px;">Your Role: ${AuthUtils.getCurrentUser().role}</p>
        `;
        
        document.getElementById('approval-modal').style.display = 'block';
    };

    const closeApprovalModal = () => {
        document.getElementById('approval-modal').style.display = 'none';
        document.getElementById('modal-comment').value = ''; 
        selectedExpenseId = null;
    };

    const processApproval = async (status) => {
        if (!selectedExpenseId) return;

        const comment = document.getElementById('modal-comment').value.trim();
        const currentUser = AuthUtils.getCurrentUser();
        
        const success = APIService.updateExpenseStatus(selectedExpenseId, currentUser.id, status, comment);

        if (success) {
            Helper.displayMessage(`Expense ${selectedExpenseId} ${status}.`, 'success');
            closeApprovalModal();
            // Re-render the dashboard tab
            DashboardView.renderApprovalDashboard();
        } else {
            Helper.displayMessage('Failed to update expense status or you are not the current approver.', 'error');
        }
    };

    // --- APPROVAL RULES ---

    const fetchRules = () => {
        return APIService.fetchApprovalRules();
    };

    const openRuleModal = (userId) => {
        selectedRuleUserId = userId;
        const currentUser = AuthUtils.getCurrentUser();
        const company = APIService.fetchCompanyDetails(currentUser.companyId);
        const targetUser = company.users.find(u => u.id === userId);
        
        // Approvers are Admins, Managers, and Directors, excluding the user himself
        const approvers = company.users.filter(u => u.role !== 'Employee' && u.id !== userId); 
        const existingRule = APIService.fetchUserRule(userId);
        
        if (!targetUser) return;
        
        document.getElementById('rule-user-id').value = userId;
        document.getElementById('rule-user-name').textContent = targetUser.name;
        
        // Populate Approvers List
        const approversListDiv = document.getElementById('approvers-list');
        const userManagerId = targetUser.managerId;
        
        let approverHtml = `<p style="font-weight: 600;">Check to include in the flow:</p><table>`;
        
        approvers.forEach(user => {
            // Manager is handled by the checkbox, but must be selectable if not their manager
            if (user.id === userManagerId) return; 
            
            const isChecked = existingRule && existingRule.approvers.includes(user.id);
            approverHtml += `
                <tr>
                    <td style="width: 20px;"><input type="checkbox" name="approver" value="${user.id}" id="approver-${user.id}" ${isChecked ? 'checked' : ''}></td>
                    <td><label for="approver-${user.id}">${user.name} (${user.role})</label></td>
                </tr>
            `;
        });
        approverHtml += '</table>';
        approversListDiv.innerHTML = approverHtml;

        // Load existing rule values
        if (existingRule) {
            document.getElementById('is-manager-approver').checked = existingRule.isManagerApprover;
            document.getElementById('is-sequential-flow').checked = existingRule.isSequential;
            document.getElementById('min-percentage').value = existingRule.minPercentage;
        } else {
            // Reset to defaults
            document.getElementById('is-manager-approver').checked = true;
            document.getElementById('is-sequential-flow').checked = true;
            document.getElementById('min-percentage').value = 100;
        }

        document.getElementById('rule-modal').style.display = 'block';
    };

    const closeRuleModal = () => {
        document.getElementById('rule-modal').style.display = 'none';
        document.getElementById('approval-rule-form').reset();
        selectedRuleUserId = null;
    };

    const saveApprovalRule = (formData) => {
        const userId = selectedRuleUserId;
        
        if (!userId) {
            Helper.displayMessage('Error: User ID is missing for rule configuration.', 'error');
            return null;
        }
        
        const isManagerApprover = formData.isManagerApprover;
        const isSequential = formData.isSequential;
        const minPercentage = parseInt(formData.minPercentage);

        const selectedApprovers = Array.from(document.querySelectorAll('#approvers-list input[name="approver"]:checked'))
            .map(cb => parseInt(cb.value));
            
        const ruleData = {
            userId: userId,
            isManagerApprover: isManagerApprover,
            isSequential: isSequential,
            approvers: selectedApprovers,
            minPercentage: minPercentage
        };

        const savedRule = APIService.saveApprovalRule(ruleData);
        
        Helper.displayMessage(`Approval Rule for ${document.getElementById('rule-user-name').textContent} saved successfully! (Total Steps: ${savedRule.approvers.length})`, 'success');
        closeRuleModal();
        return savedRule;
    };


    return {
        createNewUser,
        fetchPendingApprovals,
        openApprovalModal,
        closeApprovalModal,
        processApproval,
        fetchRules,
        openRuleModal,
        closeRuleModal,
        saveApprovalRule,
    };
})();