import mongoose from 'mongoose';

// Minimal Cohort schema used for student batch reconciliation
// We only define fields we actually need.
const CohortSchema = new mongoose.Schema({
  id: String,
  cohortId: String, // some docs might use cohortId
  enrolledStudents: [String],
  members: [String],
  currentStudents: [String], // actual live array name found in DB
}, { collection: 'cohorts', strict: false });

export default mongoose.models.Cohort || mongoose.model('Cohort', CohortSchema);
