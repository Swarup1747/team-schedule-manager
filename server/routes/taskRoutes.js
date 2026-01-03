const express = require('express');
const router = express.Router();
const { createTask, getUserTasks, updateTaskStatus, getAllTasks } = require('../controllers/taskController');

router.post('/', createTask);

// 1. ADD THIS ROUTE for Managers (Matches "GET /api/tasks")
router.get('/', getAllTasks); 

// 2. Existing route for specific users (Matches "GET /api/tasks/user_123")
router.get('/:clerkId', getUserTasks);

router.put('/:id', updateTaskStatus);

module.exports = router;