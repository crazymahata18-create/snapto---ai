const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Sends a confirmation email to the user.
 * @param {string} toEmail - The recipient's email address.
 * @param {string} subject - The subject of the email.
 * @param {string} htmlContent - The HTML content of the email.
 */
async function sendEmail(toEmail, subject, htmlContent) {
  try {
    const mailOptions = {
      from: `"SnapTo AI" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: subject,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Email Service] Email sent: %s', info.messageId);
    return true;
  } catch (err) {
    console.error('[Email Service Error]', err);
    return false;
  }
}

/**
 * Sends a pre-booking confirmation email.
 * @param {string} toEmail - The recipient's email address.
 * @param {string} name - The recipient's name (optional).
 */
async function sendBookingConfirmation(toEmail, name = 'Valued Customer') {
  const subject = 'Booking Confirmed - SnapTo AI';
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #00ffcc;">SnapTo AI Confirmation</h2>
      <p>Hello ${name},</p>
      <p>Your booking is confirmed!</p>
      <p><strong>Thanks for choosing us and we are very thankful that you trust us.</strong></p>
      <p>We are excited to help you transform your workplace intelligence.</p>
      <hr style="border: 0; border-top: 1px solid #eee;">
      <p style="font-size: 0.8rem; color: #666;">This is an automated message from SnapTo AI Intelligence Platform.</p>
    </div>
  `;
  return await sendEmail(toEmail, subject, htmlContent);
}

module.exports = { sendBookingConfirmation };
