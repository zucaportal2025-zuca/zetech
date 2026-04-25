const nodemailer = require("nodemailer");

/**
 * Configure Transporter
 * Ensure EMAIL_USER and EMAIL_PASS are set in your .env file
 */
const transporter = nodemailer.createTransport({
  // Use the direct IPv4 for smtp.gmail.com to bypass DNS IPv6 issues
  host: '74.125.136.108', 
  port: 587,
  secure: false, // Must be false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Extra layer of protection
  family: 4, 
  tls: {
    // This allows the connection even if the certificate is for 'smtp.gmail.com' 
    // but we are connecting via IP address
    rejectUnauthorized: false 
  }
});
// Verify connection on startup to help with debugging
transporter.verify((error) => {
  if (error) {
    console.log("❌ MAILER ERROR: Check EMAIL_USER/PASS in .env");
    console.error(error);
  } else {
    console.log("✅ MAILER READY: SMTP connection established.");
  }
});

/**
 * Sends an official, branded password reset email
 * @param {string} email - Recipient's email address
 * @param {string} code - 6-digit verification code
 * @param {object} user - Object containing fullName and membership_number
 */
const sendPasswordResetEmail = async (email, code, user = {}) => {
  // Logic to get first name: "Chris Maina" -> "Chris"
  const firstName = user.fullName ? user.fullName.split(" ")[0] : "Member";
  const memberID = user.membership_number || "N/A";

  const mailOptions = {
    from: `"ZUCA Portal Admin" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔐 Action Required: Password Reset Verification",
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        
        <div style="background-color: #1a73e8; padding: 25px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px; letter-spacing: 1px;">ZUCA PORTAL</h1>
        </div>

        <div style="padding: 40px 30px; background-color: #ffffff;">
          <h2 style="color: #202124; margin-top: 0;">Password Reset Request</h2>
          
          <p style="font-size: 16px; line-height: 1.5; color: #5f6368;">
            Hello, <strong>${firstName}</strong> 👋
          </p>
          
          <p style="font-size: 15px; color: #5f6368;">
            A password reset was initiated for your account associated with: <br>
            <span style="color: #1a73e8; font-weight: bold; font-size: 16px;">ID: ZUCA-${memberID}</span>
          </p>
          
          <div style="margin: 35px 0; padding: 25px; background-color: #f8f9fa; border-radius: 8px; text-align: center; border: 1px solid #eee;">
            <p style="margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #70757a;">Your Verification Code</p>
            <span style="font-size: 36px; font-weight: bold; color: #1a73e8; letter-spacing: 10px; display: block;">
              ${code}
            </span>
          </div>

          <p style="font-size: 13px; color: #d93025; background-color: #fce8e6; padding: 12px; border-radius: 6px; text-align: center; border-left: 4px solid #d93025;">
            <strong>SECURITY NOTE:</strong> This code will expire in 15 minutes.
          </p>

          <p style="font-size: 14px; line-height: 1.6; color: #5f6368; margin-top: 30px;">
            If you did not request this, please ignore this email. For security concerns, contact 
            <a href="mailto:zucaportal2025@gmail.com" style="color: #1a73e8;">zucaportal2025@gmail.com</a> 
            or reach Chris (Websys) at <strong>0746893181</strong>.
          </p>
          
          <p style="font-size: 14px; color: #202124; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            Sincerely,<br>
            <strong>ZUCA IT Administration Team</strong>
          </p>
        </div>

        <div style="background-color: #f1f3f4; padding: 20px; text-align: center; font-size: 12px; color: #70757a; border-top: 1px solid #e0e0e0;">
          © 2026 ZUCA Community Portal. All rights reserved.<br>
          This is an automated security notification.
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Official Email sent successfully to: ${email}`);
    return info;
  } catch (err) {
    console.error("📧 Mailer Error:", err);
    throw err;
  }
};

module.exports = { sendPasswordResetEmail };