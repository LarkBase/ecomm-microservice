const nodemailer = require("nodemailer");
const logger = require("../utils/logger");
const { EMAIL_CONFIG } = require("../config/config");

// Validate Email Configurations
if (!EMAIL_CONFIG.host || !EMAIL_CONFIG.port || !EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
  logger.error("❌ Email configuration is missing. Please check your environment variables.");
  throw new Error("Email configuration is missing. Please check your .env file.");
}

// ✅ Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
  host: EMAIL_CONFIG.host,
  port: EMAIL_CONFIG.port,
  secure: EMAIL_CONFIG.port === 465, // ✅ True for port 465 (SSL), false for others (TLS)
  auth: {
    user: EMAIL_CONFIG.auth.user,
    pass: EMAIL_CONFIG.auth.pass,
  },
});

// ✅ Email Sending Function
async function sendEmail(to, subject, text, html) {
  try {
    if (!to || !subject || (!text && !html)) {
      logger.warn("⚠️ Email not sent: Missing required fields.");
      return { success: false, message: "Email recipient, subject, or content missing." };
    }

    const mailOptions = {
      from: EMAIL_CONFIG.from,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`✅ Email sent to ${to}: ${info.messageId}`);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    logger.error(`❌ Email sending failed to ${to}: ${error.message}`);
    return { success: false, message: "Email sending failed", error: error.message };
  }
}

module.exports = sendEmail;
