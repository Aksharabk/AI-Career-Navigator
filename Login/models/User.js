const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    default: '',
  },
  age: {
    type: Number,
    default: null,
  },
  gender: {
    type: String,
    default: '',
  },
  education: {
    type: String,
    default: '',
  },
  quizScores: [
    {
      category: {
        type: String,
        default: 'General Knowledge',
      },
      score: {
        type: Number,
        required: true,
      },
      total: {
        type: Number,
        required: true,
      },
      percentage: {
        type: Number,
        required: true,
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  resumeAnalyses: [
    {
      fileName: { type: String, default: 'Uploaded Resume' },
      targetRole: { type: String, default: 'General Software Engineer' },
      atsScore: { type: Number, required: true },
      breakdown: {
        keywordScore: { type: Number, default: 0 },
        sectionScore: { type: Number, default: 0 },
        impactScore: { type: Number, default: 0 },
        formattingScore: { type: Number, default: 0 }
      },
      foundKeywords: [{ type: String }],
      missingKeywords: [{ type: String }],
      recommendations: [{ type: String }],
      summarySuggestion: { type: String, default: '' },
      date: { type: Date, default: Date.now }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
