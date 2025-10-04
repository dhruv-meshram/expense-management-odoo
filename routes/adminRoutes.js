import express from "express";
import { assignApprovers, getAllExpenses } from "../controllers/adminController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// View all expenses (admin dashboard)
router.get("/expenses", protect, adminOnly, getAllExpenses);

// Assign / update approvers
router.put("/expenses/:id/approvers", protect, adminOnly, assignApprovers);

export default router;
