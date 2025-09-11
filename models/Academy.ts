import mongoose from "mongoose";

const AcademySchema = new mongoose.Schema({
  academyId: { type: String, required: true, unique: true },
  name: String,
  legalEntityName: String,
  email: String,
  phone: String,
  industryType: String,
  servicesOffered: [String],
  studentSize: String,
  staffCount: String,
  country: String,
  state: String,
  city: String,
  address: String,
  website: String,
  preferredLanguage: String,
  logoUrl: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Academy || mongoose.model("Academy", AcademySchema);
