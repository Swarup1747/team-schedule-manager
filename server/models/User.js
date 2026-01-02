const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  photo: { type: String },
  role: { 
    type: String, 
    enum: ['Manager', 'Employee'], 
    default: 'Employee' 
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);