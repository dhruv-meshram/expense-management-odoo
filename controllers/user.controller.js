import User from "../models/user.model.js";
import { hashPassword } from "../utils/passwordUtils.js";
import { sendEmail } from "../utils/mailUtils.js";
import crypto from "crypto";

export const createUser = async (req, res, next) => {
  try {
    const { name, email, role } = req.body;
    const admin = req.user; // extracted by auth middleware

    if (admin.role !== "admin")
      return res.status(403).json({ message: "Only admin can create users" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "User already exists" });

    // Generate random password
    const tempPassword = crypto.randomBytes(6).toString("hex");
    const hashed = await hashPassword(tempPassword);

    const newUser = await User.create({
      name,
      email,
      password: hashed,
      role,
      companyId: admin.companyId,
    });

    // Send email with temporary password
    await sendEmail(
      email,
      "Your Expense App Account Password",
      `Hello ${name},\n\nYour account has been created.\nTemporary password: ${tempPassword}\n\nPlease change it after login.`
    );

    res.status(201).json({ message: "User created and password sent via email" });
  } catch (err) {
    next(err);
  }
};
