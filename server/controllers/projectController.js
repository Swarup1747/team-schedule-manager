const Project = require('../models/Project');
const User = require('../models/User');

const createProject = async (req, res) => {
  try {
    const { title, description, deadline, clerkId, teamMembers } = req.body;
    
    const user = await User.findOne({ clerkId });
    if (!user || user.role !== 'Manager') {
        return res.status(403).json({ message: 'Access Denied' });
    }

    // --- UPDATED: Allow Manager to be in the list ---
    // We just ensure IDs are unique, we do NOT filter out the manager anymore.
    const uniqueEmployeeIds = [...new Set(teamMembers || [])];

    const membersObjectList = uniqueEmployeeIds.map(id => ({
      user: id,
      isWorkDone: false
    }));

    const newProject = new Project({
      title, 
      description, 
      deadline,
      manager: user._id, 
      teamMembers: membersObjectList
    });

    const savedProject = await newProject.save();
    
    await savedProject.populate('manager', 'firstName');
    await savedProject.populate('teamMembers.user', 'firstName lastName');

    res.status(201).json(savedProject);
  } catch (error) { 
      console.error(error); 
      res.status(500).json({ message: 'Server Error' }); 
  }
};

const toggleProjectWork = async (req, res) => {
  try {
    const { clerkId } = req.body;
    const projectId = req.params.id;

    const user = await User.findOne({ clerkId });
    const project = await Project.findById(projectId);

    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.status === 'Completed') {
        return res.status(400).json({ message: 'Project is already completed' });
    }

    const member = project.teamMembers.find(m => m.user.toString() === user._id.toString());

    if (!member) {
      return res.status(403).json({ message: 'You are not assigned to this project.' });
    }

    member.isWorkDone = !member.isWorkDone;

    const allFinished = project.teamMembers.every(m => m.isWorkDone === true);
    project.status = allFinished ? 'Completed' : 'Active';

    await project.save();
    res.json(project);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getProjects = async (req, res) => {
  try {
    const { clerkId } = req.query; 
    if (!clerkId) return res.status(400).json({ message: "Clerk ID is required" });

    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ message: "User not found" });

    let filter = {};

    if (user.role === 'Manager') {
        // Manager sees projects they own
        // Note: If you want Manager to see projects where they are just a 'worker' but not owner,
        // you would change this to: { $or: [{ manager: user._id }, { 'teamMembers.user': user._id }] }
        filter = { manager: user._id }; 
    } else {
        filter = { 'teamMembers.user': user._id };
    }

    const projects = await Project.find(filter)
      .populate('manager', 'firstName')
      .populate('teamMembers.user', 'firstName lastName')
      .populate('comments.user', 'firstName photo')
      .sort({ createdAt: -1 });
      
    res.status(200).json(projects);

  } catch (error) { 
      console.error(error);
      res.status(500).json({ message: 'Error fetching projects' }); 
  }
};

const addComment = async (req, res) => {
  try {
    const { text, clerkId } = req.body;
    const projectId = req.params.id;

    const user = await User.findOne({ clerkId });
    const project = await Project.findById(projectId);

    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.status === 'Completed') {
        return res.status(400).json({ message: 'This project is completed. Chat is closed.' });
    }

    const isMember = project.teamMembers.some(m => m.user.toString() === user._id.toString());
    const isManager = project.manager.toString() === user._id.toString();

    if (!isMember && !isManager) {
        return res.status(403).json({ message: 'Access Denied.' });
    }

    project.comments.push({ user: user._id, text: text });
    await project.save();
    await project.populate('comments.user', 'firstName photo');
    
    res.status(200).json(project);
  } catch (error) { 
      console.error(error);
      res.status(500).json({ message: 'Server Error' }); 
  }
};

module.exports = { createProject, getProjects, addComment, toggleProjectWork };