import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';

const Tasks = () => {
  const { user } = useUser();
  const [tasks, setTasks] = useState([]);
  const [dbUser, setDbUser] = useState(null);
  const [usersList, setUsersList] = useState([]);

  // 1. ADDED: 'dueDate' field to state
  const [newTask, setNewTask] = useState({
    title: '', description: '', priority: 'Medium', assignedTo: '', dueDate: ''
  });

  useEffect(() => {
    if (user) {
      fetchUserRole();
      fetchAllUsers();
    }
  }, [user]);

  useEffect(() => {
    if (dbUser) {
      fetchTasks();
    }
  }, [dbUser]);

  const fetchUserRole = async () => {
    try {
      const res = await axios.get(`https://team-schedule-manager-1.onrender.com/api/users/${user.id}`);
      setDbUser(res.data);
    } catch (error) { console.error("Error fetching role:", error); }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get('https://team-schedule-manager-1.onrender.com/api/users');
      setUsersList(res.data);
    } catch (error) { console.error("Error fetching users", error); }
  };

  const fetchTasks = async () => {
    try {
      let endpoint = '';
      if (dbUser.role === 'Manager') {
        endpoint = 'https://team-schedule-manager-1.onrender.com/api/tasks';
      } else {
        endpoint = `https://team-schedule-manager-1.onrender.com/api/tasks/${user.id}`;
      }

      const res = await axios.get(endpoint);
      setTasks(res.data);
    } catch (error) { console.error("Error fetching tasks:", error); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://team-schedule-manager-1.onrender.com/api/tasks', {
        ...newTask,
        clerkId: user.id
      });
      fetchTasks();
      // Reset form including dueDate
      setNewTask({ title: '', description: '', priority: 'Medium', assignedTo: '', dueDate: '' });
    } catch (error) {
      alert("Error creating task");
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(`https://team-schedule-manager-1.onrender.com/api/tasks/${id}`, { status: newStatus });
      fetchTasks();
    } catch (error) { console.error("Error updating status:", error); }
  };

  const getAssigneeName = (id) => {
    const found = usersList.find(u => u._id === id);
    return found ? `${found.firstName} ${found.lastName}` : 'Unassigned';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Task Board</h2>
        {dbUser && <span style={{ padding: '5px 10px', background: '#ddd', borderRadius: '4px' }}>Logged in as: <strong>{dbUser.role}</strong></span>}
      </div>

      {/* --- MANAGER FORM --- */}
      {dbUser?.role === 'Manager' ? (
        <form onSubmit={handleCreate} style={{ marginBottom: '30px', background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h4>Assign New Task</h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '15px' }}>
            {/* Title */}
            <input
              type="text"
              placeholder="Task Title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              required
              style={{ padding: '8px' }}
            />

            {/* Priority */}
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              style={{ padding: '8px' }}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            {/* Assign To */}
            <select
              value={newTask.assignedTo}
              onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
              required
              style={{ padding: '8px' }}
            >
              <option value="">-- Assign To --</option>
              {usersList.map(u => (
                <option key={u._id} value={u._id}>
                  {u.firstName} {u.lastName} ({u.role})
                </option>
              ))}
            </select>

            {/* 2. ADDED: Date Input */}
            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              required
              style={{ padding: '8px' }}
            />
          </div>

          <textarea
            placeholder="Description..."
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            style={{ width: '100%', height: '60px', padding: '8px', marginBottom: '10px' }}
          />

          <button type="submit" style={{ padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Assign Task
          </button>
        </form>
      ) : (
        <p style={{ color: '#666', marginBottom: '20px', fontStyle: 'italic' }}>
          Viewing tasks assigned to you.
        </p>
      )}

      {/* --- KANBAN COLUMNS --- */}
      <div style={{ display: 'flex', gap: '20px' }}>
        <TaskColumn
          title="To Do"
          tasks={tasks.filter(t => t.status === 'To Do')}
          color="#ffc107"
          onMove={(id) => updateStatus(id, 'In Progress')}
          getAssigneeName={getAssigneeName}
        />
        <TaskColumn
          title="In Progress"
          tasks={tasks.filter(t => t.status === 'In Progress')}
          color="#17a2b8"
          onMove={(id) => updateStatus(id, 'Completed')}
          getAssigneeName={getAssigneeName}
        />
        <TaskColumn
          title="Completed"
          tasks={tasks.filter(t => t.status === 'Completed')}
          color="#28a745"
          onMove={null}
          getAssigneeName={getAssigneeName}
        />
      </div>
    </div>
  );
};

// Updated TaskColumn to show dueDate
const TaskColumn = ({ title, tasks, color, onMove, getAssigneeName }) => {
  return (
    <div style={{ flex: 1, background: '#f8f9fa', padding: '15px', borderRadius: '8px', minHeight: '400px' }}>
      <h3 style={{ borderBottom: `4px solid ${color}`, paddingBottom: '10px' }}>{title} ({tasks.length})</h3>

      {tasks.map(task => {
        // 3. ADDED: Logic to check if overdue
        const dateObj = new Date(task.dueDate);
        const isOverdue = dateObj < new Date() && title !== "Completed";
        const dateColor = isOverdue ? '#dc3545' : '#666';

        return (
          <div key={task._id} style={{ background: '#fff', padding: '15px', marginBottom: '10px', borderRadius: '5px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h4 style={{ margin: '0 0 5px 0' }}>{task.title}</h4>

            <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>
              <strong>To:</strong> {getAssigneeName(task.assignedTo)}
            </div>

            {/* 4. ADDED: Display dueDate */}
            {task.dueDate && (
              <div style={{ fontSize: '0.8rem', color: dateColor, fontWeight: 'bold', marginBottom: '8px' }}>
                📅 Due: {dateObj.toLocaleDateString()}
              </div>
            )}

            <p style={{ fontSize: '0.9rem', color: '#333' }}>{task.description}</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '10px', background: '#eee', fontWeight: 'bold' }}>
                {task.priority}
              </span>
              {onMove && (
                <button onClick={() => onMove(task._id)} style={{ fontSize: '0.8rem', padding: '5px 10px', cursor: 'pointer', background: color, color: '#fff', border: 'none', borderRadius: '4px' }}>
                  Move &rarr;
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Tasks;