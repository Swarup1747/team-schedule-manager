const express = require('express');
const router = express.Router();
const { createTask, getUserTasks, updateTaskStatus } = require('../controllers/taskController');

router.post('/', createTask);
router.get('/:clerkId', getUserTasks);
router.put('/:id', updateTaskStatus);

module.exports = router;