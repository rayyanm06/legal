import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const lawyerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  barCouncilNumber: { type: String, required: true },
  state: String,
  city: String,
  specializations: [String],
  verified: { type: Boolean, default: false },

  clients: [
    {
      name: String,
      email: String,
      phone: String,
      addedAt: { type: Date, default: Date.now }
    }
  ],

  cases: [
    {
      caseId: String,
      clientName: String,
      title: String,
      court: String,
      category: {
        type: String,
        enum: ['Consumer', 'Criminal', 'Civil', 'Property', 'Labour', 'Family', 'Corporate', 'Other']
      },
      status: {
        type: String,
        enum: ['active', 'won', 'lost', 'settled', 'dropped'],
        default: 'active'
      },
      filingDate: Date,
      hearings: [
        {
          date: Date,
          notes: String,
          reminderSent: { type: Boolean, default: false }
        }
      ],
      documents: [
        {
          fileName: String,
          fileType: String,
          content: String,
          uploadedAt: { type: Date, default: Date.now }
        }
      ],
      aiNotes: [
        {
          query: String,
          response: String,
          citedCases: [String],
          createdAt: { type: Date, default: Date.now }
        }
      ],
      createdAt: { type: Date, default: Date.now }
    }
  ],

  notifications: [
    {
      message: String,
      type: {
        type: String,
        enum: ['hearing', 'case', 'client', 'ai', 'alert'],
        default: 'alert'
      },
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    }
  ],

  createdAt: { type: Date, default: Date.now }
});

lawyerSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

lawyerSchema.methods.matchPassword = async function(entered) {
  return await bcrypt.compare(entered, this.password);
};

export default mongoose.model('Lawyer', lawyerSchema);
