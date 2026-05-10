const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;
let isTestAccount = false;

async function initTransporter() {
  const isDefaultUser = process.env.EMAIL_USER === 'your-email@gmail.com' || !process.env.EMAIL_USER;
  const isDefaultPass = process.env.EMAIL_PASS === 'your-app-password' || !process.env.EMAIL_PASS;

  if (isDefaultUser || isDefaultPass) {
    console.log('\n[Email Service] ⚠️ WARNING: Real email credentials not found in .env');
    console.log('[Email Service] 🔄 Using Ethereal test account fallback.');
    
    try {
      let testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      isTestAccount = true;
    } catch (err) {
      console.error('[Email Service] ❌ Failed to create Ethereal test account:', err.message);
    }
  } else {
    console.log('[Email Service] 🛡️ Attempting to use real credentials for:', process.env.EMAIL_USER);
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    isTestAccount = false;
  }
}

/**
 * Sends a confirmation email to the user.
 */
async function sendEmail(toEmail, subject, htmlContent) {
  try {
    if (!transporter) await initTransporter();
    if (!transporter) return false;
    
    const mailOptions = {
      from: `"SnapTo AI" <${isTestAccount ? 'no-reply@snapto.ai' : process.env.EMAIL_USER}>`,
      to: toEmail,
      bcc: isTestAccount ? undefined : process.env.EMAIL_USER,
      subject: subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Email Service] ✅ Email sent to:', toEmail);
    
    if (isTestAccount) {
      console.log('[Email Service] 🔗 VIEW EMAIL PREVIEW HERE: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (err) {
    if (err.code === 'EAUTH') {
      console.error('\n[Email Service] ❌ AUTHENTICATION FAILED!');
      console.error('[Email Service] 💡 Check your .env file: EMAIL_USER and EMAIL_PASS are incorrect.');
      console.error('[Email Service] 💡 If using Gmail, you MUST use an "App Password", not your regular password.\n');
    } else {
      console.error('[Email Service Error]', err.message);
    }
    return false;
  }
}

/**
 * Sends a pre-order/waitlist confirmation email.
 */
async function sendPreOrderConfirmation(toEmail) {
  const subject = 'Priority Waitlist Confirmed - SnapTo AI';
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #00e5ff;">SnapTo AI — Priority Waitlist</h2>
      <p>Hello,</p>
      <p>We are absolutely thrilled to inform you that you have been successfully added to our <strong>Priority Waitlist</strong> for the SnapTo AI platform!</p>
      <p>We are very happy that you chose to trust us with your workplace intelligence. At SnapTo AI, we believe that the future of operational management lies in transparency, safety, and data-driven insights. By joining the waitlist, you are now at the front of the line to experience how our AI brain can transform your existing CCTV network into a powerful workforce management system.</p>
      <p><strong>What happens next?</strong></p>
      <ul style="color: #444;">
        <li>Our team will review your request and prioritize your account for early access.</li>
        <li>You will receive exclusive updates on our global rollout (launching August 15, 2026).</li>
        <li>One of our deployment specialists may reach out to discuss your specific office needs.</li>
      </ul>
      <p>Once again, thank you for your trust. We are working hard to build a system that works for you, and we can't wait to show you what's coming.</p>
      <hr style="border: 0; border-top: 1px solid #eee;">
      <p style="font-size: 0.8rem; color: #666;">This is an automated message from SnapTo AI Technologies Pvt. Ltd.</p>
    </div>
  `;
  return await sendEmail(toEmail, subject, htmlContent);
}

/**
 * Sends a meeting booking confirmation email.
 */
async function sendBookingConfirmation(toEmail, name = 'Valued Customer', date, time) {
  const subject = 'Meeting Confirmed - SnapTo AI';
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #00ffcc;">Meeting Confirmed</h2>
      <p>Hello ${name},</p>
      <p>Your meeting with the SnapTo AI team is officially scheduled!</p>
      
      <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #00ffcc;">
        <p style="margin: 0; font-weight: bold; color: #333;">Meeting Details:</p>
        <p style="margin: 5px 0 0 0;">📅 <strong>Date:</strong> ${date}</p>
        <p style="margin: 5px 0 0 0;">⏰ <strong>Time:</strong> ${time}</p>
      </div>

      <p><strong>Thanks for choosing us and we are very thankful that you trust us.</strong> We look forward to discussing how we can help secure and optimize your workspace.</p>
      <hr style="border: 0; border-top: 1px solid #eee;">
      <p style="font-size: 0.8rem; color: #666;">SnapTo AI Command Center</p>
    </div>
  `;
  return await sendEmail(toEmail, subject, htmlContent);
}

/**
 * Sends a welcome email to newly registered users.
 */
async function sendWelcomeEmail(toEmail, name) {
  const subject = 'Welcome to SnapTo AI Portal';
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #00e5ff;">Welcome to SnapTo AI!</h2>
      <p>Hello ${name},</p>
      <p>Your account has been successfully created on the SnapTo AI Facility Intelligence Platform.</p>
      <p>You can now log in to your dashboard to monitor your workplace intelligence, manage facility safety, and access real-time AI insights.</p>
      <div style="margin: 20px 0;">
        <a href="http://localhost:3000/portal.html" style="background: #00e5ff; color: #000; padding: 10px 20px; text-decoration: none; font-weight: bold; border-radius: 5px;">Access Your Portal</a>
      </div>
      <p>Thank you for joining our ecosystem.</p>
      <hr style="border: 0; border-top: 1px solid #eee;">
      <p style="font-size: 0.8rem; color: #666;">SnapTo AI Operations Team</p>
    </div>
  `;
  return await sendEmail(toEmail, subject, htmlContent);
}

module.exports = { sendBookingConfirmation, sendPreOrderConfirmation, sendWelcomeEmail };
