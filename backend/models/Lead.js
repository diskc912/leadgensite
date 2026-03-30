import mongoose from 'mongoose';

const LeadSchema = new mongoose.Schema({
  queryKey: { type: String, required: true, index: true }, // Cache key, e.g., "gyms_delhi"
  name: { type: String, required: true },
  address: String,
  phone: String,
  website: String,
  rating: Number,
  reviewCount: Number,
  thumbnail: String, // UI Business Image
  
  // Enrichment Data
  hasSocialMedia: { type: Boolean, default: false },
  emailContacts: { type: [String], default: [] },
  
  // Lead Scoring & Outreach
  score: { type: Number, default: 0 }, // 0 to 100
  aiOutreachDraft: String, // AI Generated personalized message
  
  status: { type: String, enum: ['New', 'Contacted', 'Closed'], default: 'New' }
}, { timestamps: true });

export default mongoose.model('Lead', LeadSchema);
