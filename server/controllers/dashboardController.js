const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Get counts for Dashboard
// @route   GET /api/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    const { clerkId } = req.query;

    if (!clerkId) return res.status(400).json({ message: "Clerk ID required" });

    // 1. Find User
    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2. Define Filters based on Role
    let projectFilter = {};
    let taskFilter = {};

    if (user.role === 'Manager') {
      // Manager sees EVERYTHING
      projectFilter = {}; 
      taskFilter = {};    
    } else {
      // Employee sees ONLY assigned items
      projectFilter = { 'teamMembers.user': user._id };
      taskFilter = { assignedTo: user._id };
    }

    // 3. Run Calculations in Parallel
    const [
      activeProjects,
      completedProjects,
      pendingTasks,
      completedTasks
    ] = await Promise.all([
      Project.countDocuments({ ...projectFilter, status: 'Active' }),
      Project.countDocuments({ ...projectFilter, status: 'Completed' }),
      Task.countDocuments({ ...taskFilter, status: { $ne: 'Done' } }), // "Not Equal" to Done
      Task.countDocuments({ ...taskFilter, status: 'Done' })
    ]);

    // 4. Send Response
    res.json({
      activeProjects,
      completedProjects,
      pendingTasks,
      completedTasks,
      role: user.role,
      userName: user.firstName
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getDashboardStats };