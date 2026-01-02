const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Meeting = require('../models/Meeting');

// @desc    Get comprehensive details for a specific employee
// @route   GET /api/manager/employee/:id
const getEmployeeWorkData = async (req, res) => {
  try {
    const employeeId = req.params.id;

    // 1. Fetch Basic Info
    const employee = await User.findById(employeeId).select('-password');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // 2. Fetch Active Projects
    const projects = await Project.find({
      'teamMembers.user': employeeId,
      status: { $ne: 'Completed' }
    }).select('title deadline status teamMembers');

    const projectData = projects.map(p => {
        const memberInfo = p.teamMembers.find(m => m.user.toString() === employeeId);
        return {
            _id: p._id,
            title: p.title,
            deadline: p.deadline,
            isWorkDone: memberInfo ? memberInfo.isWorkDone : false
        };
    });

    // 3. Fetch Pending Tasks
    const tasks = await Task.find({
      assignedTo: employeeId,
      status: { $ne: 'Done' }
    }).sort({ deadline: 1 });

    // 4. Fetch Upcoming Meetings (UPDATED)
    // Fix: We check if the user is an Attendee OR the Host
    const meetings = await Meeting.find({
      $or: [
        { attendees: employeeId }, 
        { host: employeeId }
      ],
      startTime: { $gte: new Date() } // Only shows future meetings.
    })
    .sort({ startTime: 1 });

    res.json({
      employee,
      projects: projectData,
      tasks,
      meetings
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getEmployeeWorkData };