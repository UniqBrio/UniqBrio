/**
 * One Time with Installments - Usage Examples
 * 
 * This file demonstrates how to use the One Time with Installments payment logic
 * in various scenarios.
 */

import {
  generateOneTimeInstallments,
  markInstallmentAsPaid,
  getNextUnpaidInstallment,
  calculateRemainingBalance,
  formatInstallmentSummary,
  validateInstallmentConfig,
  areAllInstallmentsPaid,
  getInstallmentsNeedingReminders,
} from '@/lib/dashboard/payments/one-time-installments-helper';

// =============================================================================
// Example 1: Generate installments for a new student
// =============================================================================

export function example1_GenerateInstallments() {
  console.log('=== Example 1: Generate Installments ===\n');

  // Course details
  const courseStartDate = new Date('2025-10-10');
  const courseEndDate = new Date('2025-12-30');
  const totalFees = 26500; // ₹25,000 (course) + ₹1,000 (course reg) + ₹500 (student reg)

  // Generate installments
  const config = generateOneTimeInstallments(
    courseStartDate,
    courseEndDate,
    totalFees,
    3
  );

  console.log('Installments Configuration:');
  console.log(`Total Amount: ₹${config.totalAmount.toLocaleString()}`);
  console.log(`Course Duration: ${config.courseDuration.durationInDays} days`);
  console.log(`Auto Stop on Full Payment: ${config.autoStopOnFullPayment}`);
  console.log(`Partial Payment Allowed: ${config.partialPaymentAllowed}\n`);

  config.installments.forEach((inst) => {
    console.log(formatInstallmentSummary(inst));
    console.log(`  Reminder: ${inst.reminderDate.toLocaleDateString('en-IN')}`);
    console.log(`  Invoice on Payment: ${inst.invoiceOnPayment}`);
    console.log(`  Stop Toggles: ${inst.stopReminderToggle ? 'Yes' : 'No'}\n`);
  });

  return config;
}

// =============================================================================
// Example 2: Record a payment for first installment
// =============================================================================

export function example2_RecordFirstPayment() {
  console.log('=== Example 2: Record First Payment ===\n');

  // Start with generated config
  let config = example1_GenerateInstallments();

  // Student pays first installment
  const firstInstallment = config.installments[0];
  console.log(`Recording payment for ${formatInstallmentSummary(firstInstallment)}`);

  config = markInstallmentAsPaid(
    config,
    1, // installment number
    firstInstallment.amount,
    'TXN001'
  );

  console.log('Payment recorded successfully!\n');
  console.log(`Remaining Balance: ₹${calculateRemainingBalance(config).toLocaleString()}`);
  console.log(`Next unpaid: ${formatInstallmentSummary(getNextUnpaidInstallment(config)!)}\n`);

  return config;
}

// =============================================================================
// Example 3: Complete payment cycle
// =============================================================================

export function example3_CompletePaymentCycle() {
  console.log('=== Example 3: Complete Payment Cycle ===\n');

  let config = example1_GenerateInstallments();

  // Pay all installments
  for (let i = 0; i < config.installments.length; i++) {
    const inst = config.installments[i];
    console.log(`\nPaying ${formatInstallmentSummary(inst)}...`);

    config = markInstallmentAsPaid(
      config,
      inst.installmentNumber,
      inst.amount,
      `TXN00${i + 1}`
    );

    console.log(`✓ Paid. Remaining: ₹${calculateRemainingBalance(config).toLocaleString()}`);

    if (areAllInstallmentsPaid(config)) {
      console.log('\n🎉 ALL INSTALLMENTS PAID!');
      console.log('→ Final invoice will be generated');
      console.log('→ All reminders will be automatically stopped');
      console.log('→ All toggles will be disabled');
    }
  }

  return config;
}

// =============================================================================
// Example 4: Check reminders needed
// =============================================================================

export function example4_CheckReminders() {
  console.log('=== Example 4: Check Reminders ===\n');

  const config = example1_GenerateInstallments();

  // Simulate different dates to check reminders
  const testDates = [
    new Date('2025-10-08'), // Before any reminders
    new Date('2025-10-24'), // First reminder date
    new Date('2025-11-07'), // Second reminder date
    new Date('2025-12-28'), // Final reminder date
  ];

  testDates.forEach((date) => {
    console.log(`\nDate: ${date.toLocaleDateString('en-IN')}`);
    const reminders = getInstallmentsNeedingReminders(config, date);

    if (reminders.length === 0) {
      console.log('  No reminders needed');
    } else {
      reminders.forEach((inst) => {
        console.log(`  → Send reminder for ${formatInstallmentSummary(inst)}`);
        console.log(`    Due: ${inst.dueDate.toLocaleDateString('en-IN')}`);
      });
    }
  });
}

// =============================================================================
// Example 5: Validation
// =============================================================================

export function example5_Validation() {
  console.log('=== Example 5: Validation ===\n');

  const config = example1_GenerateInstallments();

  const validation = validateInstallmentConfig(config);

  console.log('Validation Results:');
  console.log(`Valid: ${validation.valid}`);
  if (!validation.valid) {
    console.log('Errors:');
    validation.errors.forEach((error) => console.log(`  - ${error}`));
  } else {
    console.log('✓ Configuration is valid and ready to use');
  }
}

// =============================================================================
// Example 6: Business Rules Demonstration
// =============================================================================

export function example6_BusinessRules() {
  console.log('=== Example 6: Business Rules ===\n');

  const config = example1_GenerateInstallments();

  console.log('FIRST INSTALLMENT RULES:');
  const first = config.installments[0];
  console.log(`  Stage: ${first.stage}`);
  console.log(`  Reminder: ${first.reminderDaysBefore} days before`);
  console.log(`  Invoice on Payment: ${first.invoiceOnPayment} (only when fully paid)`);
  console.log(`  Stop Reminder Toggle: ${first.stopReminderToggle} (disabled)`);
  console.log(`  Stop Access Toggle: ${first.stopAccessToggle} (disabled)`);

  console.log('\nMIDDLE INSTALLMENT RULES:');
  const middle = config.installments[1];
  console.log(`  Stage: ${middle.stage}`);
  console.log(`  Reminder: ${middle.reminderDaysBefore} days before`);
  console.log(`  Invoice on Payment: ${middle.invoiceOnPayment} (includes next EMI date)`);
  console.log(`  Stop Reminder Toggle: ${middle.stopReminderToggle} (enabled)`);
  console.log(`  Stop Access Toggle: ${middle.stopAccessToggle} (enabled)`);

  console.log('\nLAST INSTALLMENT RULES:');
  const last = config.installments[2];
  console.log(`  Stage: ${last.stage}`);
  console.log(`  Reminder: ${last.reminderDaysBefore} days before`);
  console.log(`  Invoice on Payment: ${last.invoiceOnPayment}`);
  console.log(`  Final Invoice: ${last.finalInvoice} (thank you message)`);
  console.log(`  Stop Reminder Toggle: ${last.stopReminderToggle} (enabled)`);
  console.log(`  Stop Access Toggle: ${last.stopAccessToggle} (enabled)`);
  console.log('  On completion: Auto-stop all reminders and disable toggles');
}

// =============================================================================
// Example 7: JSON Output for API/Database Storage
// =============================================================================

export function example7_JSONOutput() {
  console.log('=== Example 7: JSON Output ===\n');

  const config = example1_GenerateInstallments();

  // This is the format stored in database or sent via API
  const jsonOutput = {
    paymentType: config.paymentType,
    autoStopOnFullPayment: config.autoStopOnFullPayment,
    partialPaymentAllowed: config.partialPaymentAllowed,
    totalAmount: config.totalAmount,
    courseDuration: {
      startDate: config.courseDuration.startDate.toISOString(),
      endDate: config.courseDuration.endDate.toISOString(),
      durationInDays: config.courseDuration.durationInDays,
    },
    installments: config.installments.map((inst) => ({
      installmentNumber: inst.installmentNumber,
      stage: inst.stage,
      dueDate: inst.dueDate.toISOString(),
      reminderDate: inst.reminderDate.toISOString(),
      reminderDaysBefore: inst.reminderDaysBefore,
      amount: inst.amount,
      invoiceOnPayment: inst.invoiceOnPayment,
      finalInvoice: inst.finalInvoice,
      stopReminderToggle: inst.stopReminderToggle,
      stopAccessToggle: inst.stopAccessToggle,
      status: inst.status,
      messageTemplate: inst.messageTemplate,
    })),
  };

  console.log('JSON Format (for API/Database):');
  console.log(JSON.stringify(jsonOutput, null, 2));

  return jsonOutput;
}

// =============================================================================
// Run all examples
// =============================================================================

export function runAllExamples() {
  example1_GenerateInstallments();
  console.log('\n' + '='.repeat(70) + '\n');

  example2_RecordFirstPayment();
  console.log('\n' + '='.repeat(70) + '\n');

  example3_CompletePaymentCycle();
  console.log('\n' + '='.repeat(70) + '\n');

  example4_CheckReminders();
  console.log('\n' + '='.repeat(70) + '\n');

  example5_Validation();
  console.log('\n' + '='.repeat(70) + '\n');

  example6_BusinessRules();
  console.log('\n' + '='.repeat(70) + '\n');

  example7_JSONOutput();
}

// Uncomment to run
// runAllExamples();
