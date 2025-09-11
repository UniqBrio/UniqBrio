import mongoose from "mongoose";

const UsersSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  academyId: { type: String, required: true },
  businessInfo: { type: Object, required: true },
  adminInfo: { type: Object, required: true },
  preferences: { type: Object },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.users || mongoose.model("users", UsersSchema);
