// server/utils/emailSender.js
const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Send email
 * @param {Object} options - Email options
 * @returns {Promise<Object>} - Nodemailer response
 */
const sendEmail = async (options) => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 465,
      secure: true, // port 465 = encrypted connection from the start
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // Set email options
    const mailOptions = {
      from: `Groupe Dan Inc. <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html // Optional HTML content
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
};

module.exports = sendEmail;