#!/usr/bin/env node

/**
 * KYC Reminder Scheduler
 * 
 * This script should be run daily via cron job or task scheduler
 * to send KYC reminder emails to users who haven't completed verification.
 * 
 * Usage:
 * - Add to cron: 0 9 * * * node /path/to/kyc-reminder-scheduler.js
 * - Or run manually: node scripts/kyc-reminder-scheduler.js
 */

const fetch = require('node-fetch');

async function runKYCReminders() {
  try {
    console.log(`[${new Date().toISOString()}] Starting KYC reminder scheduler...`);
    
    // Determine the base URL
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/kyc-reminders`;
    
    console.log(`[${new Date().toISOString()}] Calling KYC reminders API: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add internal API key if you implement one for security
        // 'Authorization': `Bearer ${process.env.INTERNAL_API_KEY}`
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`[${new Date().toISOString()}] KYC reminders completed successfully:`);
      console.log(`  - Reminders sent: ${result.remindersSent}`);
      console.log(`  - Message: ${result.message}`);
    } else {
      console.error(`[${new Date().toISOString()}] KYC reminders failed:`, result.error);
    }
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error running KYC reminder scheduler:`, error);
  }
}

// Run the scheduler
runKYCReminders();
