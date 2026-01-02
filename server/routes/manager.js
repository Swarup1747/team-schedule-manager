const express = require('express');
const router = express.Router();
const { getEmployeeWorkData } = require('../controllers/managerController');

// Route: /api/manager/employee/:id
router.get('/employee/:id', getEmployeeWorkData);

module.exports = router;