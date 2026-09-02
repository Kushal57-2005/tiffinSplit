/**
 * Utility functions for WhatsApp bill sharing in TiffinSplit.
 */

/**
 * Normalizes a phone number for WhatsApp wa.me links.
 * Requirements:
 * - Remove spaces, +, -, brackets and other formatting.
 * - Preserve country code if present.
 * - For 10-digit Indian numbers (starting with 6, 7, 8, 9), convert to 91XXXXXXXXXX.
 * - For 11-digit numbers starting with 0 (e.g. 08237172878), strip leading 0 and prepend 91 -> 918237172878.
 * - If +918237172878 or 918237172878, remove + and keep 918237172878.
 * - Do NOT blindly prepend 91 to non-Indian numbers (e.g. +1 415 555 2671 -> 14155552671).
 */
export function normalizePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return '';

  // Strip all non-digit characters
  let digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  // If 11 digits starting with 0 (e.g., 08237172878), strip leading 0
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // 10-digit Indian mobile number (starts with 6, 7, 8, or 9)
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `91${digits}`;
  }

  return digits;
}

/**
 * Formats the WhatsApp bill message matching TiffinSplit message requirements.
 * Uses explicit Unicode escapes to prevent file-encoding corrupted characters.
 */
export function formatWhatsAppBillMessage({ friendName, monthName, year, amount, invoiceUrl }) {
  const name = friendName || 'there';
  const monthStr = year ? `${monthName} ${year}` : monthName;
  const formattedAmount = `\u{20B9}${typeof amount === 'number' ? amount.toLocaleString('en-IN') : amount}`;

  return `\u{1F371} TiffinSplit Bill

Hey ${name}! Your ${monthStr} tiffin bill is ${formattedAmount}.

\u{1F9FE} View invoice:
${invoiceUrl}

\u{1F4B3} Please complete the payment from the invoice.`;
}

/**
 * Formats the WhatsApp message when a reported payment is rejected ("Payment Not Received").
 */
export function formatWhatsAppPaymentRejectedMessage({ friendName, amount, reason, invoiceUrl }) {
  const name = friendName || 'there';
  const formattedAmount = `\u{20B9}${typeof amount === 'number' ? amount.toLocaleString('en-IN') : amount}`;
  const rejectionReason = reason && reason.trim() ? reason.trim() : 'Payment not found in bank/UPI statement';

  return `\u{274C} TiffinSplit Payment Notice

Hey ${name}! Your reported payment of ${formattedAmount} could not be verified in the bank/UPI account.

Reason: ${rejectionReason}

\u{1F9FE} View invoice & re-submit payment:
${invoiceUrl}

\u{1F4B3} Please check your payment details and re-submit confirmation.`;
}

/**
 * Constructs a wa.me click-to-chat URL with safely encoded message text.
 * Returns null if phone number is invalid or empty.
 */
export function createWhatsAppUrl(phone, message) {
  const cleanPhone = normalizePhoneNumber(phone);
  if (!cleanPhone) return null;
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
