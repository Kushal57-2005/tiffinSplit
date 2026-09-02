/**
 * Utility functions for WhatsApp bill sharing in TiffinSplit.
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

// Runtime construct Unicode emojis via String.fromCodePoint for 100% encoding safety
const EMOJI_BENTO = String.fromCodePoint(0x1F371);   // 🍱
const EMOJI_RECEIPT = String.fromCodePoint(0x1F9FE); // 🧾
const EMOJI_CARD = String.fromCodePoint(0x1F4B3);    // 💳
const EMOJI_CROSS = String.fromCodePoint(0x274C);    // ❌
const SYMBOL_RUPEE = String.fromCodePoint(0x20B9);   // ₹

/**
 * Formats the WhatsApp bill message matching TiffinSplit message requirements.
 */
export function formatWhatsAppBillMessage({ friendName, monthName, year, amount, invoiceUrl }) {
  const name = friendName || 'there';
  const monthStr = year ? `${monthName} ${year}` : monthName;
  const formattedAmount = `${SYMBOL_RUPEE}${typeof amount === 'number' ? amount.toLocaleString('en-IN') : amount}`;

  return `${EMOJI_BENTO} TiffinSplit Bill

Hey ${name}! Your ${monthStr} tiffin bill is ${formattedAmount}.

${EMOJI_RECEIPT} View invoice:
${invoiceUrl}

${EMOJI_CARD} Please complete the payment from the invoice.`;
}

/**
 * Formats the WhatsApp message when a reported payment is rejected ("Payment Not Received").
 */
export function formatWhatsAppPaymentRejectedMessage({ friendName, amount, reason, invoiceUrl }) {
  const name = friendName || 'there';
  const formattedAmount = `${SYMBOL_RUPEE}${typeof amount === 'number' ? amount.toLocaleString('en-IN') : amount}`;
  const rejectionReason = reason && reason.trim() ? reason.trim() : 'Payment not found in bank/UPI statement';

  return `${EMOJI_CROSS} TiffinSplit Payment Notice

Hey ${name}! Your reported payment of ${formattedAmount} could not be verified in the bank/UPI account.

Reason: ${rejectionReason}

${EMOJI_RECEIPT} View invoice & re-submit payment:
${invoiceUrl}

${EMOJI_CARD} Please check your payment details and re-submit confirmation.`;
}

/**
 * Constructs a direct WhatsApp click-to-chat URL with safely encoded message text.
 * Uses api.whatsapp.com/send directly to avoid wa.me intermediate redirect encoding corruption.
 * Returns null if phone number is invalid or empty.
 */
export function createWhatsAppUrl(phone, message) {
  const cleanPhone = normalizePhoneNumber(phone);
  if (!cleanPhone) return null;
  const encodedText = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
}
