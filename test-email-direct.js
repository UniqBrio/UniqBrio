// Direct email test
const nodemailer = require('nodemailer');

async function testEmailDirect() {
  console.log('Testing email directly...');
  
  // Email credentials from .env
  const EMAIL_USER = 'uniqbrio@gmail.com';
  const EMAIL_APP_PASSWORD = 'beuknjexoaydklxp';
  
  console.log('Creating transporter...');
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_APP_PASSWORD,
    },
  });
  
  try {
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"UniqBrio Test" <${EMAIL_USER}>`,
      to: 'shaziafarheen75@gmail.com',
      subject: 'Direct Email Test - KYC System',
      html: `
        <h2>Direct Email Test</h2>
        <p>This is a direct test of the email functionality.</p>
        <p>Timestamp: ${new Date().toLocaleString()}</p>
      `
    });
    
    console.log('Email sent successfully:', info.messageId);
    console.log('Email info:', info);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
}

testEmailDirect();
