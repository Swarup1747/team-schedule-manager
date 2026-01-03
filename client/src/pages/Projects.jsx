import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';

const Projects = () => {
  const { user } = useUser();
  const [projects, setProjects] = useState([]);
  const [dbUser, setDbUser] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState([]);
  const [commentText, setCommentText] = useState({});
  const [newProject, setNewProject] = useState({ title: '', description: '', deadline: '' });

  useEffect(() => {
    if (user) {
      fetchUserRole();
      fetchProjects();
      fetchAllUsers();
    }
  }, [user]);

  const fetchUserRole = async () => {
    try {
      const res = await axios.get(`https://team-schedule-manager-1.onrender.com/api/users/${user.id}`);
      setDbUser(res.data);
    } catch (error) { console.error(error); }
  };

  const fetchProjects = async () => {
    try {
      const res = await axios.get('https://team-schedule-manager-1.onrender.com/api/projects', {
        params: { clerkId: user.id }
      });
      setProjects(res.data);
    } catch (err) { console.error("Error fetching projects:", err); }
  };

  const fetchAllUsers = async () => {
    const res = await axios.get('https://team-schedule-manager-1.onrender.com/api/users');
    setUsersList(res.data);
  };

  const handleCheckboxChange = (userId) => {
    if (selectedTeam.includes(userId)) {
      setSelectedTeam(selectedTeam.filter(id => id !== userId));
    } else {
      setSelectedTeam([...selectedTeam, userId]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://team-schedule-manager-1.onrender.com/api/projects', {
        ...newProject,
        clerkId: user.id,
        teamMembers: selectedTeam
      });
      fetchProjects();
      setNewProject({ title: '', description: '', deadline: '' });
      setSelectedTeam([]);
    } catch (error) { alert("Only Managers can create projects!"); }
  };

  const handleComment = async (projectId) => {
    if (!commentText[projectId]) return;
    try {
      await axios.post(`https://team-schedule-manager-1.onrender.com/api/projects/${projectId}/comments`, {
        text: commentText[projectId],
        clerkId: user.id
      });
      setCommentText({ ...commentText, [projectId]: '' });
      fetchProjects();
    } catch (error) {
      alert(error.response?.data?.message || "Error sending message");
    }
  };

  const handleToggleWork = async (projectId) => {
    try {
      await axios.put(`https://team-schedule-manager-1.onrender.com/api/projects/${projectId}/work`, {
        clerkId: user.id
      });
      fetchProjects();
    } catch (error) {
      console.error("Error toggling work", error);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Team Projects</h2>
        {dbUser && (
          <span style={{ padding: '5px 10px', background: '#e0e7ff', color: '#4338ca', borderRadius: '15px', fontWeight: 'bold' }}>
            {dbUser.role}
          </span>
        )}
      </div>

      {/* --- MANAGER CREATE FORM --- */}
      {dbUser?.role === 'Manager' && (
        <form onSubmit={handleCreate} style={{ background: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
           <h4>Start a New Project</h4>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <input type="text" placeholder="Title" value={newProject.title} onChange={(e) => setNewProject({...newProject, title: e.target.value})} required style={{ padding: '10px' }} />
            <input type="date" value={newProject.deadline} onChange={(e) => setNewProject({...newProject, deadline: e.target.value})} required style={{ padding: '10px' }} />
            <textarea placeholder="Description" value={newProject.description} onChange={(e) => setNewProject({...newProject, description: e.target.value})} style={{ gridColumn: '1 / span 2', height: '60px', padding: '10px' }} />
          </div>
          <div style={{ marginTop: '15px' }}>
            <label style={{fontWeight: 'bold'}}>Select Team:</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
              {/* UPDATED: Show ALL users (including Managers) so you can select yourself */}
              {usersList.map(u => (
                <div key={u._id} style={{ padding: '8px 12px', background: '#f3f4f6', borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={selectedTeam.includes(u._id)} onChange={() => handleCheckboxChange(u._id)} />
                  <span>{u.firstName} {u.lastName}</span>
                </div>
              ))}
            </div>
          </div>
          <button type="submit" style={{ marginTop: '20px', padding: '10px 20px', background: '#6610f2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Create Project</button>
        </form>
      )}

      {/* --- PROJECTS GRID --- */}
      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', background: '#f9fafb', borderRadius: '8px', color: '#666', border: '2px dashed #ccc' }}>
            <h3>Currently not working on any project</h3>
            <p>You have not been assigned to any active projects yet.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => {
             const managerId = project.manager?._id || project.manager;
             const myId = dbUser?._id;

             // Check if I am in the worker list (regardless of whether I am a manager or not)
             const myMemberData = project.teamMembers.find(m => {
                 const memberId = m.user?._id || m.user;
                 return String(memberId) === String(myId);
             });

             const isManager = String(managerId) === String(myId);
             
             // UPDATED: Logic for buttons and chat
             // If I am in the list, I can mark work done.
             const canMarkWork = !!myMemberData; 
             const canChat = (isManager || !!myMemberData) && project.status !== 'Completed';
             const isMyWorkDone = myMemberData?.isWorkDone;

             return (
               <div key={project._id} className="project-card">
                 <h3>{project.title}</h3>
                 <p style={{ color: '#555', fontSize: '0.9rem' }}>{project.description}</p>
                 
                 <div style={{ margin: '15px 0', fontSize: '0.85rem', color: '#666' }}>
                    <span className={`status-badge status-${project.status.toLowerCase()}`}>
                        {project.status === 'Completed' ? '✅ Completed' : '⏳ In Progress'}
                    </span>
                    <span style={{ float: 'right' }}>📅 {new Date(project.deadline).toLocaleDateString()}</span>
                 </div>

                 <div style={{ background: '#f9fafb', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
                    <small style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Team Progress:</small>
                    
                    {/* Show EVERYONE in the list (including Manager if they assigned themselves) */}
                    {project.teamMembers.map((member, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
                            <span>{member.user?.firstName} {member.user?.lastName}</span>
                            <span>{member.isWorkDone ? '✅ Done' : '🕒 Working'}</span>
                        </div>
                    ))}
                    
                    {project.teamMembers.length === 0 && (
                        <span style={{fontSize: '0.8rem', color: '#999'}}>No employees assigned.</span>
                    )}
                </div>

                {/* Show Button if I am assigned (even if I am Manager) */}
                {canMarkWork && project.status !== 'Completed' && (
                    <button 
                        onClick={() => handleToggleWork(project._id)}
                        style={{ width: '100%', padding: '10px', background: isMyWorkDone ? '#10b981' : '#f59e0b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '15px', fontWeight: 'bold'}}
                    >
                        {isMyWorkDone ? "Completed! (Click to Undo)" : "Mark My Work as Done"}
                    </button>
                )}

                 <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '15px 0' }} />
                 
                 <div>
                    <h5 style={{ margin: '0 0 10px 0', color: '#444' }}>Team Chat</h5>
                    <div style={{ maxHeight: '150px', overflowY: 'auto', background: '#f9fafb', padding: '10px', borderRadius: '5px', marginBottom: '10px', border: '1px solid #eee' }}>
                        {project.comments.length === 0 && <p style={{fontSize: '0.8rem', color:'#aaa', textAlign:'center'}}>No messages yet.</p>}
                        {project.comments.map((c, i) => (
                        <div key={i} style={{ marginBottom: '8px', fontSize: '0.85rem' }}>
                            <strong style={{color: '#4f46e5'}}>{c.user?.firstName}: </strong> {c.text}
                        </div>
                        ))}
                    </div>

                    {canChat ? (
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <input type="text" placeholder="Type a message..." value={commentText[project._id] || ''} onChange={(e) => setCommentText({...commentText, [project._id]: e.target.value})} style={{ marginBottom: 0, padding: '8px', flexGrow: 1 }} />
                            <button onClick={() => handleComment(project._id)} style={{ padding: '8px 12px', background: '#4f46e5', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>Send</button>
                        </div>
                    ) : (
                        <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: '#888', textAlign: 'center', padding: '10px', background: '#eee', borderRadius: '4px' }}>
                            {project.status === 'Completed' ? "🔒 Project Completed - Chat Closed" : "🚫 View Only - Access Restricted"}
                        </div>
                    )}
                 </div>
               </div>
             );
          })}
        </div>
      )}
    </div>
  );
};

export default Projects;