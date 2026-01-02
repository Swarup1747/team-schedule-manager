import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

const Sidebar = () => {
  const { user } = useUser();
  const [userRole, setUserRole] = useState('');

  // Fetch the user's role from your database when the component loads
  useEffect(() => {
    if (user) {
      axios.get(`http://localhost:5000/api/users/${user.id}`)
        .then(res => setUserRole(res.data.role))
        .catch(err => console.error("Error fetching role for sidebar:", err));
    }
  }, [user]);

  return (
    <div className="sidebar">
      <h3>Team Manager</h3>
      <ul>
        <li><Link to="/">Dashboard</Link></li>
        <li><Link to="/meetings">Meetings</Link></li>
        <li><Link to="/tasks">Tasks</Link></li>
        <li><Link to="/projects">Projects</Link></li>
        
        {/* --- CONDITIONAL RENDERING --- */}
        {userRole === 'Manager' && (
          <li>
            <Link to="/monitor" style={{ color: '#f59e0b', fontWeight: 'bold' }}>
              Monitor Employees
            </Link>
          </li>
        )}
        
      </ul>
    </div>
  );
};

export default Sidebar;