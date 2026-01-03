import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const EmployeeMonitoring = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  
  const [dbUser, setDbUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [monitorData, setMonitorData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 1. First, check WHO is logged in
  useEffect(() => {
    if (user) {
        axios.get(`https://team-schedule-manager-1.onrender.com/api/users/${user.id}`)
            .then(res => {
                setDbUser(res.data);
                // Redirect if not manager
                if (res.data.role !== 'Manager') {
                    // You can redirect to dashboard or just show access denied
                    // navigate('/dashboard'); 
                }
            })
            .catch(err => console.error(err));
    }
  }, [user, navigate]);

  // 2. Fetch List ONLY if Manager
  useEffect(() => {
    if (dbUser && dbUser.role === 'Manager') {
        fetchEmployees();
    }
  }, [dbUser]);

  // 3. Fetch Data when Employee Selected
  useEffect(() => {
    if (selectedEmpId && dbUser?.role === 'Manager') {
      fetchEmployeeData(selectedEmpId);
    }
  }, [selectedEmpId]);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('https://team-schedule-manager-1.onrender.com/api/users');
      setEmployees(res.data.filter(u => u.role !== 'Manager'));
    } catch (err) { console.error(err); }
  };

  const fetchEmployeeData = async (targetId) => {
    setLoading(true);
    try {
      // Pass the manager's ID to pass backend security check
      const res = await axios.get(`https://team-schedule-manager-1.onrender.com/api/manager/employee/${targetId}`, {
          params: { requesterId: user.id } 
      });
      setMonitorData(res.data);
    } catch (err) { 
        alert("Error: " + (err.response?.data?.message || "Could not fetch data"));
    }
    setLoading(false);
  };

  // --- ACCESS DENIED VIEW ---
  if (dbUser && dbUser.role !== 'Manager') {
      return (
          <div style={{ textAlign: 'center', marginTop: '50px', color: '#dc2626' }}>
              <h2>🚫 Access Denied</h2>
              <p>Only Managers can view this page.</p>
              <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 20px', cursor: 'pointer' }}>Go Back</button>
          </div>
      );
  }

  // --- LOADING VIEW ---
  if (!dbUser) return <p>Checking permissions...</p>;

  // --- MAIN VIEW (Identical to before) ---
  return (
    <div style={{ display: 'flex', height: '85vh', gap: '20px' }}>
      
      {/* Sidebar List */}
      <div style={{ width: '250px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflowY: 'auto' }}>
        <h3 style={{ marginTop: 0, color: '#444' }}>Employees</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {employees.map(emp => (
            <div 
              key={emp._id} 
              onClick={() => setSelectedEmpId(emp._id)}
              style={{ 
                padding: '12px', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                background: selectedEmpId === emp._id ? '#e0e7ff' : '#f9fafb',
                color: selectedEmpId === emp._id ? '#4338ca' : '#333',
                fontWeight: selectedEmpId === emp._id ? 'bold' : 'normal'
              }}
            >
              {emp.firstName} {emp.lastName}
            </div>
          ))}
        </div>
      </div>

      {/* Main Panel */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!selectedEmpId ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa' }}>
                <h3>Select an employee to view their timeline</h3>
            </div>
        ) : loading ? (
            <p>Loading data...</p>
        ) : monitorData && (
            <div>
                {/* Header */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ margin: 0 }}>{monitorData.employee.firstName}'s Activity Board</h2>
                    <p style={{ color: '#666', margin: '5px 0 0 0' }}>{monitorData.employee.email} • {monitorData.employee.role}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    
                    {/* Projects */}
                    <div style={cardStyle}>
                        <h4 style={{ borderBottom: '2px solid #4f46e5', paddingBottom: '10px', marginTop: 0 }}>🚀 Active Projects</h4>
                        {monitorData.projects.length === 0 && <p style={{color:'#aaa'}}>No active projects.</p>}
                        {monitorData.projects.map(p => (
                            <div key={p._id} style={itemStyle}>
                                <strong>{p.title}</strong>
                                <div style={{ fontSize: '0.85rem', marginTop: '5px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#666' }}>Due: {new Date(p.deadline).toLocaleDateString()}</span>
                                    <span style={{ color: p.isWorkDone ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>
                                        {p.isWorkDone ? 'Done' : 'In Progress'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tasks */}
                    <div style={cardStyle}>
                        <h4 style={{ borderBottom: '2px solid #f59e0b', paddingBottom: '10px', marginTop: 0 }}>📝 Pending Tasks</h4>
                        {monitorData.tasks.length === 0 && <p style={{color:'#aaa'}}>No pending tasks.</p>}
                        {monitorData.tasks.map(t => (
                            <div key={t._id} style={itemStyle}>
                                <strong>{t.title}</strong>
                                <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 'bold' }}>
                                    Due: {new Date(t.dueDate).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Meetings */}
                    <div style={cardStyle}>
                        <h4 style={{ borderBottom: '2px solid #10b981', paddingBottom: '10px', marginTop: 0 }}>📅 Upcoming Meetings</h4>
                        {monitorData.meetings.length === 0 && <p style={{color:'#aaa'}}>No upcoming meetings.</p>}
                        {monitorData.meetings.map(m => (
                            <div key={m._id} style={itemStyle}>
                                <strong>{m.title}</strong>
                                <div style={{ fontSize: '0.9rem' }}>
                                    {new Date(m.startTime).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        )}
      </div>
    </div>
  );
};

const cardStyle = { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', height: 'fit-content' };
const itemStyle = { borderBottom: '1px solid #eee', padding: '15px 0' };

export default EmployeeMonitoring;