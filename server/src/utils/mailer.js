import nodemailer from "nodemailer";

let transporter = null;

// Store in-memory email log for dev testing / preview
export const emailLogs = [];

function getTransporter() {
  if (transporter) return transporter;

  const host = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const secure = process.env.SMTP_SECURE !== undefined
    ? (process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1")
    : port === 465;

  const user = (process.env.SMTP_USER || "").trim();
  const rawPass = process.env.SMTP_PASS || "";
  const cleanPass = rawPass.replace(/\s+/g, "");

  if (!user || !cleanPass) return null;

  console.log(`[SMTP Diagnostic] Transporter Config -> Host: ${host}, Port: ${port}, Secure: ${secure}, User: ${user}`);

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass: cleanPass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false
    }
  });

  return transporter;
}

function getFromAddress() {
  const user = process.env.SMTP_USER || "no-reply@tiffinsplit.local";
  const rawFrom = process.env.SMTP_FROM ? process.env.SMTP_FROM.trim() : "";

  if (!rawFrom) {
    return `TiffinSplit <${user}>`;
  }
  if (rawFrom.includes("@")) {
    return rawFrom;
  }
  return `"${rawFrom}" <${user}>`;
}

// Unified Email Sending Engine: Uses Resend HTTPS API when RESEND_API_KEY is present, with Nodemailer SMTP fallback
async function sendEmailUnified({ to, subject, html, logItem }) {
  if (logItem) {
    emailLogs.unshift(logItem);
  }

  const resendApiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : "";

  if (resendApiKey) {
    const from = (process.env.RESEND_FROM || process.env.SMTP_FROM || "TiffinSplit <onboarding@resend.dev>").trim();
    console.log(`[Email Dispatch - Resend API] Recipient: ${to} | Sender: "${from}"`);

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = data.message || data.error || (data.name ? `${data.name}: ${data.message}` : `Resend HTTP ${res.status}`);
        console.error(`❌ Resend API error sending email to ${to}:`, errMsg);
        return { success: false, error: errMsg };
      }

      console.log(`✔ Resend email sent successfully to ${to} (ID: ${data.id})`);
      return { success: true, messageId: data.id };
    } catch (err) {
      console.error(`❌ Exception sending email via Resend HTTPS API to ${to}:`, err.message);
      return { success: false, error: `Resend API network error: ${err.message}` };
    }
  }

  // Local SMTP Fallback
  const mailTransporter = getTransporter();
  const from = getFromAddress();

  if (!mailTransporter) {
    console.log(`[Mailer Log] Neither RESEND_API_KEY nor SMTP credentials configured. Email logged in-memory for ${to}`);
    return { success: false, error: "Neither RESEND_API_KEY nor SMTP credentials configured on server." };
  }

  try {
    const info = await mailTransporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log(`✔ SMTP email sent successfully to ${to}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Failed sending SMTP email to ${to}:`, err);
    return { success: false, error: err.message || err.toString() };
  }
}

export async function sendInvitationEmail({
  recipientEmail,
  workspaceName,
  inviterName,
  inviteLink,
}) {
  if (!recipientEmail) return false;

  const subject = `Invitation to join "${workspaceName}" on TiffinSplit`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E0DA; border-radius: 12px; background-color: #FAFAF8;">
      <div style="background-color: #946D6D; color: #ffffff; padding: 18px 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="margin: 0; font-size: 1.4rem; letter-spacing: 0.05em;">TiffinSplit Workspace Invitation</h2>
      </div>
      <div style="padding: 24px 20px; color: #292929;">
        <p style="font-size: 1rem; margin-bottom: 1rem;">Hello,</p>
        <p style="font-size: 1rem; line-height: 1.6; margin-bottom: 1.5rem;">
          <strong>${inviterName}</strong> has invited you to join the shared roommate workspace <strong>"${workspaceName}"</strong> on TiffinSplit!
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #946D6D; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 1rem; display: inline-block; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
            Accept & Join Workspace
          </a>
        </div>
        <p style="font-size: 0.85rem; color: #6F6A68; margin-top: 2rem;">
          Or copy and paste this direct link into your browser:<br/>
          <a href="${inviteLink}" style="color: #946D6D; word-break: break-all;">${inviteLink}</a>
        </p>
      </div>
      <div style="border-top: 1px solid #E5E0DA; padding-top: 15px; text-align: center; font-size: 0.8rem; color: #6F6A68;">
        Shared Roommate & Tiffin Billing Management
      </div>
    </div>
  `;

  const logItem = {
    type: "INVITATION",
    recipient: recipientEmail,
    subject,
    timestamp: new Date().toISOString(),
    html,
  };

  const res = await sendEmailUnified({ to: recipientEmail, subject, html, logItem });
  return res.success;
}

export async function sendInvoiceEmail({
  recipientEmail,
  friendName,
  monthName,
  year,
  totalAmount,
  amountDue,
  invoiceUrl,
  upiId,
  payeeName,
}) {
  if (!recipientEmail) return { success: false, error: "Recipient email address is required" };

  const amt = amountDue !== undefined ? amountDue : totalAmount;
  const payeeUpi = upiId || "8237172878@ibl";
  const payeeStr = payeeName || "Kushal Waykole";
  const payee = encodeURIComponent(payeeStr);
  const note = encodeURIComponent(`TiffinSplit Bill ${monthName} ${year}`);
  const upiRawString = `upi://pay?pa=${payeeUpi}&pn=${payee}&am=${amt}&cu=INR&tn=${note}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiRawString)}`;
  const subject = `Pay Bill: ₹${amt} for ${monthName} ${year} — TiffinSplit`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E0DA; border-radius: 12px; background-color: #FAFAF8;">
      <div style="background-color: #946D6D; color: #ffffff; padding: 18px 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="margin: 0; font-size: 1.4rem; letter-spacing: 0.05em;">Monthly Tiffin Bill — ${monthName} ${year}</h2>
      </div>
      <div style="padding: 24px 20px; color: #292929;">
        <p style="font-size: 1rem; margin-bottom: 1rem;">Hi ${friendName},</p>
        <p style="font-size: 1rem; line-height: 1.6;">
          Your monthly tiffin bill statement for <strong>${monthName} ${year}</strong> has been generated.
        </p>

        <div style="background-color: #F5F3EF; padding: 18px 22px; border-radius: 10px; margin: 20px 0; border: 1px solid #E5E0DA;">
          <p style="margin: 6px 0; font-size: 1rem; color: #4A4A4A;"><strong>Total Bill Amount:</strong> ₹${totalAmount}</p>
          <p style="margin: 6px 0; font-size: 1.2rem; color: #C62828;"><strong>Amount Due:</strong> ₹${amt}</p>
          <p style="margin: 6px 0 0 0; font-size: 0.85rem; color: #6F6A68;">UPI ID: <strong>${payeeUpi}</strong> (${payeeStr})</p>
        </div>

        <div style="text-align: center; margin: 24px 0 20px 0; background-color: #FFFFFF; padding: 20px; border-radius: 12px; border: 1px solid #E5E0DA;">
          <p style="font-size: 0.95rem; font-weight: bold; color: #292929; margin: 0 0 12px 0;">
            📷 Scan QR Code to Pay ₹${amt} (${payeeUpi})
          </p>
          <img src="${qrImageUrl}" alt="UPI QR Code" style="width: 190px; height: 190px; border: 3px solid #946D6D; border-radius: 10px; padding: 4px; background: #fff;" />
          <p style="font-size: 0.8rem; color: #6F6A68; margin: 10px 0 0 0;">Open PhonePe, Google Pay or Paytm scanner and point at this QR</p>
          <p style="font-size: 0.85rem; margin: 10px 0 0 0; color: #6F6A68;">
            Already paid? <a href="${invoiceUrl}" style="color: #946D6D; font-weight: bold; text-decoration: underline;">Click here to report payment ("I Paid")</a>
          </p>
        </div>

        <div style="text-align: center; margin: 24px 0 10px 0;">
          <a href="${invoiceUrl}" style="background-color: #2E7D32; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 1.05rem; display: inline-block; box-shadow: 0 3px 8px rgba(46,125,50,0.35);">
            💳 Pay Now ₹${amt} / View Detailed Statement
          </a>
        </div>
      </div>
      <div style="border-top: 1px solid #E5E0DA; padding-top: 15px; text-align: center; font-size: 0.8rem; color: #6F6A68;">
        TiffinSplit Shared Household Ledger
      </div>
    </div>
  `;

  const logItem = {
    type: "INVOICE",
    recipient: recipientEmail,
    subject,
    timestamp: new Date().toISOString(),
    html,
  };

  return await sendEmailUnified({ to: recipientEmail, subject, html, logItem });
}

export async function sendPaymentReportedEmail({
  headEmail,
  headName,
  roommateName,
  amount,
  invoiceNumber,
  paymentMethod,
  transactionRef,
  reportedAt,
  verifyUrl,
  rejectUrl,
}) {
  if (!headEmail) {
    console.warn("Cannot send Payment Reported email: Target head email is missing.");
    return false;
  }

  const clientUrl = (process.env.CLIENT_URL || "https://tiffin-split.vercel.app").trim();
  const vUrl = verifyUrl || `${clientUrl}/payments`;
  const rUrl = rejectUrl || `${clientUrl}/payments`;
  const subject = `Payment Reported - ₹${amount} - ${roommateName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E0DA; border-radius: 12px; background-color: #FAFAF8;">
      <div style="background-color: #946D6D; color: #ffffff; padding: 18px 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="margin: 0; font-size: 1.3rem; letter-spacing: 0.04em;">Payment Reported — Verification Required</h2>
      </div>
      <div style="padding: 24px 20px; color: #292929;">
        <p style="font-size: 1rem; margin-bottom: 1rem;">Hi ${headName || "Household Head"},</p>
        <p style="font-size: 1rem; line-height: 1.6; margin-bottom: 1.25rem;">
          <strong>${roommateName}</strong> has reported a payment of <strong style="color: #2E7D32; font-size: 1.1rem;">₹${amount}</strong>.
        </p>

        <div style="background-color: #F5F3EF; padding: 16px 20px; border-radius: 10px; margin: 15px 0; border: 1px solid #E5E0DA;">
          <p style="margin: 4px 0; font-size: 0.9rem;"><strong>Invoice Ref:</strong> ${invoiceNumber || "N/A"}</p>
          <p style="margin: 4px 0; font-size: 0.9rem;"><strong>Reported Amount:</strong> ₹${amount}</p>
          <p style="margin: 4px 0; font-size: 0.9rem;"><strong>Payment Method:</strong> ${paymentMethod || "UPI"}</p>
          <p style="margin: 4px 0; font-size: 0.9rem;"><strong>UTR / Transaction ID:</strong> <code style="background: #E5E0DA; padding: 2px 6px; border-radius: 4px;">${transactionRef || "None"}</code></p>
          <p style="margin: 4px 0; font-size: 0.9rem;"><strong>Reported At:</strong> ${reportedAt ? new Date(reportedAt).toLocaleString() : new Date().toLocaleString()}</p>
          <p style="margin: 8px 0 0 0; font-size: 0.85rem; color: #D84315;"><strong>Status:</strong> Pending Verification</p>
        </div>

        <p style="font-size: 0.9rem; color: #6F6A68; font-style: italic; margin-bottom: 1.5rem; text-align: center;">
          "Please check your UPI/bank account before confirming this payment."
        </p>

        <div style="text-align: center; margin: 24px 0 10px 0; display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
          <a href="${vUrl}" style="background-color: #2E7D32; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 0.95rem; display: inline-block; box-shadow: 0 2px 6px rgba(46,125,50,0.3);">
            ✅ Verify & Mark Paid
          </a>
          <a href="${rUrl}" style="background-color: #C62828; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 0.95rem; display: inline-block; box-shadow: 0 2px 6px rgba(198,40,40,0.3);">
            ❌ Reject / Payment Not Received
          </a>
        </div>
      </div>
      <div style="border-top: 1px solid #E5E0DA; padding-top: 12px; text-align: center; font-size: 0.8rem; color: #6F6A68;">
        TiffinSplit Manual Verification Workflow
      </div>
    </div>
  `;

  const logItem = {
    type: "PAYMENT_REPORTED",
    recipient: headEmail,
    subject,
    timestamp: new Date().toISOString(),
    html,
  };

  const res = await sendEmailUnified({ to: headEmail, subject, html, logItem });
  return res.success;
}

export async function sendPaymentRejectedEmail({
  roommateEmail,
  roommateName,
  amount,
  invoiceNumber,
  amountDue,
  upiId,
  payeeName,
  payUrl,
}) {
  if (!roommateEmail) {
    console.warn("Cannot send Payment Rejected email: Target roommate email is missing.");
    return false;
  }

  const payeeUpi = upiId || "8237172878@ibl";
  const payeeStr = payeeName || "Kushal Waykole";
  const clientUrl = (process.env.CLIENT_URL || "https://tiffin-split.vercel.app").trim();
  const url = payUrl || `${clientUrl}/invoices`;
  const amtDue = amountDue !== undefined ? amountDue : amount;
  const payee = encodeURIComponent(payeeStr);
  const note = encodeURIComponent(`Retry TiffinSplit Bill Payment`);
  const upiRawString = `upi://pay?pa=${payeeUpi}&pn=${payee}&am=${amtDue}&cu=INR&tn=${note}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiRawString)}`;
  const subject = `Payment Not Verified - TiffinSplit Invoice`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E5E0DA; border-radius: 12px; background-color: #FAFAF8;">
      <div style="background-color: #C62828; color: #ffffff; padding: 18px 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="margin: 0; font-size: 1.3rem; letter-spacing: 0.04em;">Payment Not Verified</h2>
      </div>
      <div style="padding: 24px 20px; color: #292929;">
        <p style="font-size: 1rem; margin-bottom: 1rem;">Hi ${roommateName || "Roommate"},</p>
        <p style="font-size: 1rem; line-height: 1.6; margin-bottom: 1rem;">
          The payment of <strong>₹${amount}</strong> reported for your invoice could not be verified by the Household Head.
        </p>

        <div style="background-color: #FFEBEE; padding: 16px 20px; border-radius: 10px; margin: 15px 0; border: 1px solid #FFCDD2;">
          <p style="margin: 4px 0; font-size: 0.9rem; color: #B71C1C;"><strong>Invoice Ref:</strong> ${invoiceNumber || "N/A"}</p>
          <p style="margin: 4px 0; font-size: 1.1rem; color: #C62828;"><strong>Amount Due Remaining:</strong> ₹${amtDue}</p>
        </div>

        <p style="font-size: 0.95rem; color: #292929; margin-bottom: 1.25rem;">
          Please complete the payment and submit the payment confirmation again.
        </p>

        <div style="background-color: #FFFFFF; padding: 18px; border-radius: 10px; border: 1px solid #E5E0DA; text-align: center; margin-bottom: 1.5rem;">
          <p style="font-size: 0.9rem; margin: 0 0 10px 0;"><strong>UPI ID:</strong> <code style="font-size: 1rem; background: #F5F3EF; padding: 2px 6px; border-radius: 4px;">${payeeUpi}</code> (${payeeStr})</p>
          <img src="${qrImageUrl}" alt="UPI QR Code" style="width: 170px; height: 170px; border: 2px solid #C62828; border-radius: 8px; padding: 4px;" />
        </div>

        <div style="text-align: center; margin: 20px 0 10px 0;">
          <a href="${url}" style="background-color: #946D6D; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 1rem; display: inline-block;">
            Pay ₹${amtDue} / Resubmit Payment
          </a>
        </div>
      </div>
      <div style="border-top: 1px solid #E5E0DA; padding-top: 12px; text-align: center; font-size: 0.8rem; color: #6F6A68;">
        TiffinSplit Shared Household Ledger
      </div>
    </div>
  `;

  const logItem = {
    type: "PAYMENT_REJECTED",
    recipient: roommateEmail,
    subject,
    timestamp: new Date().toISOString(),
    html,
  };

  const res = await sendEmailUnified({ to: roommateEmail, subject, html, logItem });
  return res.success;
}
