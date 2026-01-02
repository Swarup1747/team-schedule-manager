const express = require('express');
const router = express.Router();
const { createProject, getProjects, addComment, toggleProjectWork } = require('../controllers/projectController');

router.get('/', getProjects);
router.post('/', createProject);
router.post('/:id/comments', addComment);

// NEW ROUTE
router.put('/:id/work', toggleProjectWork);

module.exports = router;