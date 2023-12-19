import mongoose from "mongoose";

const passwordResetSchema = new mongoose.Schema(
  {
    userId: { type: String, unique: true },
    email: { type: String, unique: true },
    token: { type: String },
    createdAt: { type: Date },
    expiresAt: Date,
  },
  { timestamps: true }
);

const PasswordReset = mongoose.model("PasswordReset", passwordResetSchema);

export default PasswordReset;
