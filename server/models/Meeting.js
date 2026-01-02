const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  meetingLink: { type: String },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // NEW: Array of users invited to the meeting
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] 
}, { timestamps: true });

module.exports = mongoose.model('Meeting', MeetingSchema);