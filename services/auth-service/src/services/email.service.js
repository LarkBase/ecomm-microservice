const nodemailer = require("nodemailer");
const { EMAIL_CONFIG } = require("../config/config");

const transporter = nodemailer.createTransport({
  host: EMAIL_CONFIG.host,
  port: EMAIL_CONFIG.port,
  secure: false, // Use TLS (false for STARTTLS, true for SSL)
  auth: {
    user: EMAIL_CONFIG.auth.user,
    pass: EMAIL_CONFIG.auth.pass,
  },
});

async function sendEmail(to, subject, text, html) {
  try {
    const mailOptions = {
      from: EMAIL_CONFIG.from,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.messageId}`);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error(`❌ Email sending failed: ${error.message}`);
    return { success: false, message: "Email sending failed", error: error.message };
  }
}

module.exports = sendEmail;
