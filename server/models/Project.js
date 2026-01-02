const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  deadline: { type: Date },
  status: { type: String, enum: ['Active', 'Completed'], default: 'Active' },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // UPDATED: Now stores User ID AND their work status
  teamMembers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isWorkDone: { type: Boolean, default: false }
  }],
  
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: String,
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);