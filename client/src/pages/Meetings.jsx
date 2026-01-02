import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';

const Meetings = () => {
    const { user } = useUser();
    const [dbUser, setDbUser] = useState(null);
    const [meetings, setMeetings] = useState([]); // Store fetched meetings

    // NEW: State for User Selection
    const [usersList, setUsersList] = useState([]);
    const [selectedAttendees, setSelectedAttendees] = useState([]);

    const [formData, setFormData] = useState({
        title: '', description: '', startTime: '', endTime: '', meetingLink: ''
    });
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (user) {
            fetchUserRole();
            fetchMeetings(); // Fetch meetings to display list
            fetchAllUsers(); // Fetch employees for the form
        }
    }, [user]);

    const fetchUserRole = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/users/${user.id}`);
            setDbUser(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchMeetings = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/meetings/${user.id}`);
            setMeetings(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchAllUsers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/users');
            setUsersList(res.data);
        } catch (error) { console.error(error); }
    };

    const handleCheckboxChange = (userId) => {
        if (selectedAttendees.includes(userId)) {
            setSelectedAttendees(selectedAttendees.filter(id => id !== userId));
        } else {
            setSelectedAttendees([...selectedAttendees, userId]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('Creating meeting...');
        try {
            await axios.post('http://localhost:5000/api/meetings', {
                ...formData,
                clerkId: user.id,
                attendees: selectedAttendees // Send selected IDs
            });
            setStatus('Meeting Created!');
            setFormData({ title: '', description: '', startTime: '', endTime: '', meetingLink: '' });
            setSelectedAttendees([]); // Reset selection
            fetchMeetings(); // Refresh list
        } catch (error) {
            if (error.response && error.response.status === 403) {
                setStatus('❌ Access Denied: Only Managers can schedule meetings.');
            } else {
                setStatus('Error creating meeting.');
            }
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Meetings</h2>

            {/* --- MANAGER FORM --- */}
            {dbUser?.role === 'Manager' ? (
                <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                    <h3>Schedule a Meeting</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '600px' }}>

                        <input type="text" name="title" placeholder="Meeting Title" value={formData.title} onChange={handleChange} required style={{ padding: '10px' }} />
                        <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} style={{ padding: '10px', height: '60px' }} />

                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <label>Start Time:</label>
                                <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label>End Time:</label>
                                <input type="datetime-local" name="endTime" value={formData.endTime} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
                            </div>
                        </div>

                        <input type="text" name="meetingLink" placeholder="Zoom/Google Meet Link" value={formData.meetingLink} onChange={handleChange} style={{ padding: '10px' }} />

                        {/* NEW: Select Attendees */}
                        <div>
                            <label style={{ fontWeight: 'bold' }}>Select Attendees:</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px', maxHeight: '150px', overflowY: 'auto' }}>
                                {usersList.map(u => (
                                    <div key={u._id} style={{ padding: '5px 10px', background: '#f3f4f6', borderRadius: '5px', display: 'flex', alignItems: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedAttendees.includes(u._id)}
                                            onChange={() => handleCheckboxChange(u._id)}
                                            style={{ marginRight: '8px' }}
                                        />
                                        {u.firstName} {u.lastName}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button type="submit" style={{ padding: '12px', background: '#007BFF', color: '#fff', border: 'none', cursor: 'pointer', marginTop: '10px' }}>Create Meeting</button>
                    </form>
                    {status && <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{status}</p>}
                </div>
            ) : (
                <div></div>
            )
            }

            {/* --- DISPLAY MEETINGS LIST (Visible to Everyone) --- */}
            <div style={{ marginTop: '30px' }}>
                <h3>Your Upcoming Meetings</h3>
                {meetings.length === 0 ? <p style={{ color: '#666' }}>No meetings scheduled.</p> : (
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {meetings.map(m => (
                            <div key={m._id} style={{ background: 'white', padding: '15px', borderRadius: '8px', borderLeft: '5px solid #007BFF', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                <h4 style={{ margin: '0 0 5px 0' }}>{m.title}</h4>
                                <p style={{ margin: '0 0 10px 0', color: '#555' }}>
                                    📅 {new Date(m.startTime).toLocaleString()} - {new Date(m.endTime).toLocaleTimeString()}
                                </p>
                                {m.meetingLink && (
                                    <a href={m.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: '#007BFF', fontWeight: 'bold' }}>Join Meeting &rarr;</a>
                                )}
                                <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>Host: {m.host?.firstName || 'Manager'}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

export default Meetings;