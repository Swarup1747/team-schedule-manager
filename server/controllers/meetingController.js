const Meeting = require('../models/Meeting');
const User = require('../models/User');
const sendEmail = require('../utils/emailService');

const createMeeting = async (req, res) => {
    try {
        const { title, description, startTime, endTime, meetingLink, clerkId, attendees } = req.body;

        const user = await User.findOne({ clerkId });

        if (user.role !== 'Manager') {
            return res.status(403).json({ message: 'Access Denied: Only Managers can schedule meetings.' });
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // 1. Ensure Host is included in attendees
        const uniqueAttendees = [...new Set([...(attendees || []), user._id.toString()])];

        const newMeeting = new Meeting({
            title,
            description,
            startTime,
            endTime,
            meetingLink,
            host: user._id,
            attendees: uniqueAttendees
        });

        const savedMeeting = await newMeeting.save();

        // --- NEW: SEND EMAIL TO ALL ATTENDEES ---
        // Fetch full user details (email) for everyone in the list
        const attendeesList = await User.find({ _id: { $in: uniqueAttendees } });

        // Loop through and send emails
        attendeesList.forEach(attendee => {
            if (attendee.email) {
                const emailSubject = `📅 Invitation: ${title}`;
                const emailText = `You are invited to a meeting.\n\nTopic: ${title}\nTime: ${new Date(startTime).toLocaleString()}\nLink: ${meetingLink}`;
                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                        <h2 style="color: #4f46e5;">Meeting Invitation</h2>
                        <p><strong>Topic:</strong> ${title}</p>
                        <p><strong>Host:</strong> ${user.firstName} ${user.lastName}</p>
                        <p><strong>Time:</strong> ${new Date(startTime).toLocaleString()}</p>
                        <br/>
                        <a href="${meetingLink}" style="background-color: #4f46e5; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px;">Join Meeting</a>
                        <p style="margin-top: 20px; color: #666;">${description || ''}</p>
                    </div>
                `;
                
                // Send email (no await here so the API response isn't delayed)
                sendEmail(attendee.email, emailSubject, emailText, emailHtml);
            }
        });

        res.status(201).json(savedMeeting);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getMeetings = async (req, res) => {
    try {
        const { clerkId } = req.params;
        const user = await User.findOne({ clerkId });

        if (!user) return res.status(404).json({ message: 'User not found' });

        const meetings = await Meeting.find({
            $or: [
                { host: user._id },
                { attendees: user._id }
            ]
        })
        .populate('host', 'firstName lastName')
        .sort({ startTime: 1 });

        res.status(200).json(meetings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createMeeting, getMeetings };