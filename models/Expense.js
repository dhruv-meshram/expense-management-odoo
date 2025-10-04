import mongoose from "mongoose";

const approverSchema = new mongoose.Schema({
  approver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  isRequired: { type: Boolean, default: false },
  hasApproved: { type: Boolean, default: false },
  hasRejected: { type: Boolean, default: false },
  comments: { type: String },
  sequenceOrder: { type: Number, default: null }, // for sequence flow
});

const expenseSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    category: { type: String },
    description: { type: String },
    date: { type: Date, default: Date.now },

    // 👇 Approval flow
    approvers: [approverSchema],
    sequentialFlow: { type: Boolean, default: false },
    approvalPercentage: { type: Number, default: 60 },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);
