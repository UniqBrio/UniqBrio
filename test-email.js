// Test email functionality
const { sendEmail } = require('./lib/email.ts');

async function testEmail() {
  try {
    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test KYC Email - UniqBrio',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #16a34a;">✅ KYC Verification Test Email</h2>
          <p>This is a test email to verify the email functionality is working.</p>
          <p>If you receive this email, the KYC email system is functioning correctly.</p>
        </div>
      `
    });
    
    console.log('Test email result:', result);
  } catch (error) {
    console.error('Test email error:', error);
  }
}

testEmail();
