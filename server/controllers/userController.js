const User = require('../models/User');

// @desc    Sync user data from Clerk to MongoDB
// @route   POST /api/users/sync
const syncUser = async (req, res) => {
  try {
    const { clerkId, email, firstName, lastName, photo } = req.body;

    // upsert: true means "Create if not found, Update if found"
    const user = await User.findOneAndUpdate(
      { clerkId },
      { clerkId, email, firstName, lastName, photo },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json(user);
  } catch (error) {
    console.error("Sync Error:", error);
    res.status(500).json({ message: 'Server Error during sync' });
  }
};

// @desc    Get user by Clerk ID (Used for Role Checking)
// @route   GET /api/users/:clerkId
const getUserByClerkId = async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all users (Used for Manager Assignment Dropdown)
// @route   GET /api/users
const getAllUsers = async (req, res) => {
  try {
    // We explicitly select fields. '_id' is included by default (CRITICAL for assigning tasks)
    const users = await User.find().select('firstName lastName email role photo');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { syncUser, getUserByClerkId, getAllUsers };