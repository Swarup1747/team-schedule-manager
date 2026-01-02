const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  status: { 
    type: String, 
    enum: ['To Do', 'In Progress', 'Completed'], 
    default: 'To Do' 
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who does this task?
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }  // Who created it?
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);