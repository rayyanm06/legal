import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const HearingSchema = new mongoose.Schema({
  date: Date,
  notes: String,
  reminderSent: { type: Boolean, default: false }
}, { _id: true });

const TrackedCaseSchema = new mongoose.Schema({
  caseId: String,
  caseTitle: String,
  court: String,
  state: String,
  category: {
    type: String,
    enum: ['Consumer', 'Criminal', 'Civil', 'Property', 'Labour', 'Family']
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'dropped'],
    default: 'active'
  },
  filingDate: Date,
  hearings: [HearingSchema],
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const NotificationSchema = new mongoose.Schema({
  message: String,
  category: {
    type: String,
    enum: ['COMPLIANCE', 'PROPERTY', 'TAX', 'HEARING', 'ALERT'],
    default: 'ALERT'
  },
  daysUntil: Number,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  // Gamification details
  totalPoints: { type: Number, default: 0 },
  completedScenarios: { type: [Number], default: [] },
  correctAnswers: { type: Number, default: 0 },
  totalAnswers: { type: Number, default: 0 },
  badges: { type: [String], default: [] },

  // Dashboard / Case Tracking
  trackedCases: [TrackedCaseSchema],
  notifications: [NotificationSchema],
  legalHealthScore: { type: Number, default: 50 },
  docsVerified: { type: Number, default: 0 },
  totalDocs: { type: Number, default: 0 },
  consultationHrs: { type: Number, default: 0 },
  alertsCleared: { type: Number, default: 0 },
  totalAlerts: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Pre-save hook to hash password
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare passwords for login
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Recalculate legal health score helper
UserSchema.methods.recalcHealthScore = function() {
  const total = this.trackedCases.length;
  const resolved = this.trackedCases.filter(c => c.status === 'resolved').length;
  const docRatio = this.totalDocs > 0 ? this.docsVerified / this.totalDocs : 0;
  const caseRatio = total > 0 ? resolved / total : 0;
  this.legalHealthScore = Math.round(50 + caseRatio * 30 + docRatio * 20);
};

export default mongoose.model('User', UserSchema);
