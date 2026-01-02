import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useUser();
  const [dbUser, setDbUser] = useState(null);

  const [stats, setStats] = useState({
    taskCount: 0,
    projectCount: 0,
    nextMeeting: null
  });
  const [recentTasks, setRecentTasks] = useState([]);

  useEffect(() => {
    if (user) {
      axios.get(`http://localhost:5000/api/users/${user.id}`)
        .then(res => setDbUser(res.data))
        .catch(err => console.error("Error fetching user:", err));
    }
  }, [user]);

  useEffect(() => {
    if (dbUser) {
      loadDashboardData();
    }
  }, [dbUser]);

  const loadDashboardData = async () => {
    try {
      // --- LOGIC CHANGE 1: Pass 'clerkId' to API calls ---
      // This ensures the backend only returns data relevant to THIS user
      const [tasksRes, projectsRes, meetingsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/tasks/${user.id}`), // Already has ID in URL
        axios.get('http://localhost:5000/api/projects', { params: { clerkId: user.id } }), // ADDED PARAM
        axios.get(`http://localhost:5000/api/meetings/${user.id}`)
      ]);

      const allTasks = tasksRes.data;
      const myProjects = projectsRes.data; // Backend now returns only YOUR projects
      const myMeetings = meetingsRes.data;

      // --- LOGIC CHANGE 2: Simplified Filtering ---
      // We don't need to check "Am I manager?" anymore because the backend did that.
      // We only need to check if the project is Active.
      const activeProjects = myProjects.filter(p => p.status !== 'Completed');

      // --- CALCULATE STATS ---
      const now = new Date();

      // Sort meetings by date to find the absolute next one
      const upcomingMeeting = myMeetings
        .filter(m => new Date(m.startTime) > now)
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0];

      setStats({
        taskCount: allTasks.filter(t => t.status !== 'Completed').length,
        projectCount: activeProjects.length,
        nextMeeting: upcomingMeeting || null
      });

      // Get top 3 pending tasks
      setRecentTasks(allTasks.filter(t => t.status === 'To Do' || t.status === 'In Progress').slice(0, 3));

    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '10px' }}>Welcome back, {dbUser?.firstName || user?.firstName}!</h2>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Role: <span style={{ fontWeight: 'bold', color: '#4f46e5' }}>{dbUser?.role}</span>
      </p>

      {/* --- STATS CARDS --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>

        <div style={cardStyle}>
          <h3 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', color: '#4f46e5' }}>{stats.projectCount}</h3>
          <span style={{ color: '#6b7280', fontWeight: '500' }}>Active Projects</span>
        </div>

        <div style={cardStyle}>
          <h3 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', color: '#f59e0b' }}>{stats.taskCount}</h3>
          <span style={{ color: '#6b7280', fontWeight: '500' }}>Pending Tasks</span>
        </div>

        <div style={{ ...cardStyle, borderLeft: '5px solid #10b981' }}>
          <span style={{ display: 'block', color: '#10b981', fontWeight: 'bold', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '5px' }}>
            Next Meeting
          </span>
          {stats.nextMeeting ? (
            <div>
              <h4 style={{ margin: '0 0 5px 0' }}>{stats.nextMeeting.title}</h4>
              <p style={{ fontSize: '0.9rem', color: '#555' }}>
                {new Date(stats.nextMeeting.startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ) : (
            <p style={{ color: '#aaa' }}>No upcoming meetings.</p>
          )}
        </div>
      </div>

      {/* --- SPLIT SECTION --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>

        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

            {dbUser?.role === 'Manager' ? (
              <>
                <Link to="/meetings" style={actionBtnStyle}>📅 Schedule a Meeting</Link>
                <Link to="/tasks" style={actionBtnStyle}>📝 Assign a New Task</Link>
                <Link to="/projects" style={actionBtnStyle}>🚀 Start a Project</Link>
              </>
            ) : (
              <>
                <Link to="/tasks" style={actionBtnStyle}>✅ View My Tasks</Link>
                <Link to="/projects" style={actionBtnStyle}>💬 Go to Project Chat</Link>
                <Link to="/meetings" style={actionBtnStyle}>📅 View Calendar</Link>
              </>
            )}

          </div>
        </div>

        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Priority Tasks</h3>
          {recentTasks.length > 0 ? (
            <ul style={{ padding: 0 }}>
              {recentTasks.map(task => (
                <li key={task._id} style={{ padding: '10px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{task.title}</span>
                  <span style={{ fontSize: '0.8rem', background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '10px' }}>
                    {task.priority}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#aaa' }}>No pending tasks.</p>
          )}
          <Link to="/tasks" style={{ display: 'block', marginTop: '15px', color: '#4f46e5', fontWeight: 'bold' }}>View Board &rarr;</Link>
        </div>

      </div>
    </div>
  );
};

// --- STYLES KEPT EXACTLY AS PROVIDED ---
const cardStyle = {
  background: 'white',
  padding: '25px',
  borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center'
};

const actionBtnStyle = {
  display: 'block',
  background: '#f3f4f6',
  padding: '12px',
  borderRadius: '8px',
  color: '#374151',
  fontWeight: '500',
  textAlign: 'center',
  textDecoration: 'none',
  transition: 'background 0.2s'
};

export default Dashboard;