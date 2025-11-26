require('dotenv').config();
const nodemailer = require('nodemailer');

async function testPasswordResetEmail() {
  console.log('Testing Zeptomail password reset email...\n');

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.ZEPTO_HOST || 'smtp.zeptomail.in',
    port: Number(process.env.ZEPTO_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.ZEPTO_USER || '',
      pass: process.env.ZEPTO_PASS || '',
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });

  // Generate test email
  const testEmail = 'shaziafarheen74@gmail.com';
  const testToken = 'test-token-' + Date.now();
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password/${testToken}`;

  const emailHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the button below to reset your password:</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${resetUrl}" 
           style="background-color: #8B5CF6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Reset My Password
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">
        If the button doesn't work, copy this link: ${resetUrl}
      </p>
      <p style="color: #666; font-size: 14px;">
        This link will expire in 1 hour.
      </p>
    </div>
  `;

  try {
    console.log('Sending test email to:', testEmail);
    console.log('From:', process.env.ZEPTO_FROM_EMAIL);
    console.log('SMTP Host:', process.env.ZEPTO_HOST);
    console.log('SMTP Port:', process.env.ZEPTO_PORT);
    console.log('Reset URL:', resetUrl);
    console.log('\nAttempting to send...\n');

    const info = await transporter.sendMail({
      from: `"UniqBrio Test" <${process.env.ZEPTO_FROM_EMAIL || 'noreply@uniqbotz.com'}>`,
      to: testEmail,
      subject: 'TEST: Reset your password - UniqBrio',
      html: emailHTML,
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('\n✅ Password reset email is working correctly!');
    console.log('Check your inbox at:', testEmail);
    
  } catch (error) {
    console.error('❌ Error sending email:');
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('SMTP Response:', error.response);
    }
    if (error.code) {
      console.error('Error code:', error.code);
    }
    console.error('\nFull error:', error);
  }
}

testPasswordResetEmail();
