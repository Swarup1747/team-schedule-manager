const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const taskRoutes = require('./routes/taskRoutes');
const projectRoutes = require('./routes/projectRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const manager = require('./routes/manager');

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(express.json()); // Allows us to accept JSON data in the body
app.use(cors()); // Allows our React frontend to communicate with this backend

// Simple Route for Testing
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Use Routes
app.use('/api/users', userRoutes);

app.use('/api/meetings', meetingRoutes);

app.use('/api/tasks', taskRoutes);

app.use('/api/projects', projectRoutes);

app.use('/api/manager', manager);

// server.js

app.use('/api/dashboard', dashboardRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

