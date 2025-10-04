import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "employee", "manager", "finance", "director", "cfo"],
      default: "employee",
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true, // each user must belong to a company
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.role === "employee";
      },
    },
  },
  { timestamps: true } // adds createdAt & updatedAt
);

export default mongoose.model("User", userSchema);
