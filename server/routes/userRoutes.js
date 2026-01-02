const express = require('express');
const router = express.Router();
const { syncUser, getUserByClerkId, getAllUsers } = require('../controllers/userController');

router.post('/sync', syncUser);       // Sync User on login
router.get('/', getAllUsers);         // Get list for dropdowns
router.get('/:clerkId', getUserByClerkId); // Get specific user role

module.exports = router;