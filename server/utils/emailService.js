const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'swaroopshinde47@gmail.com', // Replace with your email
        pass: 'dtjjplnylkmpqbiw'     // Replace with your App Password
      }
    });

    const mailOptions = {
      from: '"TeamFlow Manager" <swaroopshinde47@gmail.com>',
      to: to,
      subject: subject,
      text: text,
      html: html
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    console.error('❌ Email send failed:', error);
  }
};

module.exports = sendEmail;