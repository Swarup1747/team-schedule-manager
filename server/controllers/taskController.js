const Task = require('../models/Task');
const User = require('../models/User');
const sendEmail = require('../utils/emailService');

// @desc    Create a new task
// @route   POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate, clerkId, assignedTo } = req.body;

    const manager = await User.findOne({ clerkId });
    if (manager.role !== 'Manager') {
      return res.status(403).json({ message: 'Only Managers can assign tasks.' });
    }

    // Use the passed 'assignedTo' ID, or default to the manager if empty
    const targetUserId = assignedTo || manager._id;

    // --- NEW: Fetch the assigned user to get their email ---
    const assignedUser = await User.findById(targetUserId);

    const newTask = new Task({
      title,
      description,
      priority,
      dueDate, // Note: Frontend might send 'dueDate' or 'deadline', ensure naming matches
      status: 'To Do',
      assignedTo: targetUserId,
      assignedBy: manager._id
    });

    const savedTask = await newTask.save();

    // --- NEW: SEND EMAIL ---
    if (assignedUser && assignedUser.email && assignedUser._id.toString() !== manager._id.toString()) {
        const subject = `📝 New Task Assigned: ${title}`;
        const html = `
            <h3>New Task Assigned</h3>
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Assigned By:</strong> ${manager.firstName} ${manager.lastName}</p>
            <p><strong>Priority:</strong> <span style="color:red">${priority}</span></p>
            <p><strong>Due Date:</strong> ${dueDate ? new Date(dueDate).toDateString() : 'No date set'}</p>
        `;
        sendEmail(assignedUser.email, subject, `New Task: ${title}`, html);
    }

    res.status(201).json(savedTask);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all tasks for a specific user
// @route   GET /api/tasks/:clerkId
const getUserTasks = async (req, res) => {
    try {
        const { clerkId } = req.params;

        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Find tasks where 'assignedTo' matches this user
        const tasks = await Task.find({ assignedTo: user._id }).sort({ createdAt: -1 });

        res.status(200).json(tasks);

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update task status (e.g., To Do -> In Progress)
// @route   PUT /api/tasks/:id
const updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body; 
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true } 
        );
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getAllTasks = async (req, res) => {
    try {
        // Fetch all tasks and sort by newest
        // Populate 'assignedTo' so we can see who the task belongs to
        const tasks = await Task.find()
            .populate('assignedTo', 'firstName lastName') 
            .sort({ createdAt: -1 });

        res.status(200).json(tasks);
    } catch (error) {
        console.error("Error fetching all tasks:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Don't forget to export it!
module.exports = { createTask, getUserTasks, updateTaskStatus, getAllTasks };