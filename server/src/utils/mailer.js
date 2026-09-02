// Mail system disabled in TiffinSplit

export const emailLogs = [];

export async function sendInvitationEmail() {
  console.log('[Mailer] Mail system is disabled. Invitation email skipped.');
  return false;
}

export async function sendInvoiceEmail() {
  console.log('[Mailer] Mail system is disabled. Invoice email skipped.');
  return { success: false, error: 'Mail system is disabled' };
}

export async function sendPaymentReportedEmail() {
  console.log('[Mailer] Mail system is disabled. Payment reported email skipped.');
  return false;
}

export async function sendPaymentRejectedEmail() {
  console.log('[Mailer] Mail system is disabled. Payment rejected email skipped.');
  return false;
}
