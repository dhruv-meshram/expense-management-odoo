import Expense from "../models/Expense.js";
import User from "../models/User.js";

// 📘 Get all expenses with employee + approver info
export const getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate("employee", "name email role")
      .populate("approvers.approver", "name role");
    res.status(200).json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🧩 Assign approvers and manager for an expense
export const assignApprovers = async (req, res) => {
  try {
    const { id } = req.params;
    const { managerId, approvers, sequentialFlow } = req.body;

    const expense = await Expense.findById(id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    // Update manager (optional)
    if (managerId) {
      const employee = await User.findById(expense.employee);
      employee.manager = managerId;
      await employee.save();
    }

    // Update approvers
    if (approvers && Array.isArray(approvers)) {
      expense.approvers = approvers.map((a, i) => ({
        approver: a.approver,
        isRequired: a.isRequired || false,
        sequenceOrder: sequentialFlow ? i + 1 : null,
      }));
    }

    expense.sequentialFlow = sequentialFlow || false;
    await expense.save();

    res.status(200).json({
      message: "Approvers assigned successfully",
      expense,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
