import User from "../models/user.model.js";
import Company from "../models/company.model.js";
import { hashPassword, comparePassword } from "../utils/passwordUtils.js";
import { generateToken } from "../utils/jwtUtils.js";
import { z } from "zod";

// Signup Validation
const signupSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  country: z.string(),
  companyName: z.string(),
});

export const signup = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, country, companyName } =
      signupSchema.parse(req.body);

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const currencyMap = {
      India: "INR",
      USA: "USD",
      UK: "GBP",
      Germany: "EUR",
      Japan: "JPY",
    };
    const currency = currencyMap[country] || "USD";

    // Create company
    const company = await Company.create({
      name: companyName,
      country,
      currency,
    });

    // Create admin
    const hashed = await hashPassword(password);
    const admin = await User.create({
      name,
      email,
      password: hashed,
      role: "admin",
      companyId: company._id,
    });

    const token = generateToken(admin);

    res.status(201).json({
      message: "Admin account created",
      token,
      user: { id: admin._id, email: admin.email, role: admin.role },
    });
  } catch (err) {
    next(err);
  }
};

// Signin
export const signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate("companyId");

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.companyId.name,
      },
    });
  } catch (err) {
    next(err);
  }
};
