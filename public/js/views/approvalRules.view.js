/**
 * public/js/views/approvalRules.view.js
 * Script specific to rendering and interacting with the Approval Rules tab for Admins.
 * Depends on: admin.service.js, auth.utils.js, api.service.js
 */

const ApprovalRulesView = (() => {

    const renderApprovalRulesConfig = () => {
        const area = document.getElementById('admin-rules');
        const currentUser = AuthUtils.getCurrentUser();
        const company = APIService.fetchCompanyDetails(currentUser.companyId);
        
        // Users to configure rules for (excluding Admin)
        const users = APIService.fetchCompanyUsers(company.id).filter(u => u.role !== 'Admin'); 
        const rules = AdminService.fetchRules();

        let userListHtml = '';
        users.forEach(user => {
            const rule = rules.find(r => r.userId === user.id);
            const ruleStatus = rule ? 
                `<span class="status-Approved">Configured (${rule.approvers.length} steps)</span>` : 
                `<span class="status-Pending">Not Configured</span>`;
            
            userListHtml += `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.role}</td>
                    <td>${ruleStatus}</td>
                    <td>
                        <button class="primary-btn" onclick="ApprovalRulesView.openRuleModal(${user.id})" style="padding: 5px 10px;">
                            ${rule ? 'Edit Rule' : 'Set Rule'}
                        </button>
                    </td>
                </tr>
            `;
        });
        
        area.innerHTML = `
            <h3 style="margin-bottom: 5px;">Approval Rules Configuration</h3>
            <p class="quick-test-info">
                Configure the specific approval flow (sequential, concurrent, conditional) for each non-admin user in **${company.name}**.
            </p>
            
            <table id="rule-config-table" class="data-table" style="max-width: 900px;">
                <thead>
                    <tr><th>User Name</th><th>Role</th><th>Rule Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                    ${userListHtml}
                </tbody>
            </table>
        `;
        
        bindRuleFormListener();
    };
    
    const bindRuleFormListener = () => {
        const ruleForm = document.getElementById('approval-rule-form');
        if (ruleForm) {
            ruleForm.removeEventListener('submit', handleSaveRule);
            ruleForm.addEventListener('submit', handleSaveRule);
        }
    };
    
    const openRuleModal = (userId) => {
        AdminService.openRuleModal(userId);
    };

    const handleSaveRule = async (event) => {
        event.preventDefault();
        
        const formData = {
            isManagerApprover: document.getElementById('is-manager-approver').checked,
            isSequential: document.getElementById('is-sequential-flow').checked,
            minPercentage: document.getElementById('min-percentage').value,
        };

        const savedRule = await AdminService.saveApprovalRule(formData);
        if (savedRule) {
            renderApprovalRulesConfig(); 
        }
    };


    return {
        renderApprovalRulesConfig,
        openRuleModal,
    };
})();