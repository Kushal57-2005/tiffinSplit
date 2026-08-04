import nodemailer from "nodemailer";

export interface InvoiceEmailParams {
  toEmail: string;
  friendName: string;
  monthName: string;
  year: number;
  totalMeals: number;
  totalQuantity: number;
  subtotalAmount: number;
  adjustmentAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  upiId?: string | null;
  upiPayload?: string | null;
  qrDataUrl?: string | null;
  invoiceId?: string | null;
  useCidForQr?: boolean;
}

export function createTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return null;
}

export function renderInvoiceHtml(params: InvoiceEmailParams): string {
  const {
    friendName,
    monthName,
    year,
    totalMeals,
    totalQuantity,
    subtotalAmount,
    adjustmentAmount,
    totalAmount,
    amountPaid,
    amountDue,
    upiId,
    upiPayload,
    qrDataUrl,
    invoiceId,
    useCidForQr,
  } = params;

  const qrImageSrc = useCidForQr ? "cid:upi-qr-code" : qrDataUrl;
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const webPayUrl = invoiceId ? `${baseUrl}/pay/${invoiceId}` : (upiPayload || "#");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TiffinSplit Invoice</title>
</head>
<body style="margin: 0; padding: 20px 10px; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    
    <!-- HEADER BAR -->
    <tr>
      <td style="padding: 28px 24px 20px 24px; text-align: center; border-bottom: 1px solid #334155; background-color: #1e293b;">
        <h1 style="margin: 0; font-size: 26px; font-weight: 900; color: #fbbf24; letter-spacing: -0.5px;">TiffinSplit Invoice</h1>
        <p style="margin: 4px 0 10px 0; font-size: 13px; color: #94a3b8;">Roommate Tiffin Billing Statement</p>
        <span style="display: inline-block; background-color: rgba(251, 191, 36, 0.15); color: #fbbf24; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; border: 1px solid rgba(251, 191, 36, 0.3);">
          ${monthName} ${year}
        </span>
      </td>
    </tr>

    <!-- GREETING & INTRO -->
    <tr>
      <td style="padding: 20px 24px 12px 24px;">
        <p style="margin: 0 0 8px 0; font-size: 15px; color: #f8fafc;">Hi <strong style="color: #fbbf24;">${friendName}</strong>,</p>
        <p style="margin: 0; font-size: 13px; color: #cbd5e1; line-height: 1.5;">Here is your itemized tiffin consumption summary for <strong>${monthName} ${year}</strong>:</p>
      </td>
    </tr>

    <!-- BILLING SUMMARY TABLE CARD -->
    <tr>
      <td style="padding: 0 24px 20px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f172a; border-radius: 12px; border: 1px solid #334155; width: 100%;">
          
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 13px;">Total Meal Days</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #f8fafc; font-weight: 700; font-size: 13px; text-align: right;">${totalMeals} Days</td>
          </tr>

          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 13px;">Total Tiffins Consumed</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #fbbf24; font-weight: 700; font-size: 13px; text-align: right;">${totalQuantity} Tiffins</td>
          </tr>

          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 13px;">Subtotal</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #f8fafc; font-weight: 700; font-size: 13px; text-align: right;">₹${subtotalAmount}</td>
          </tr>

          ${adjustmentAmount !== 0 ? `
          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 13px;">Adjustment</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #fbbf24; font-weight: 700; font-size: 13px; text-align: right;">₹${adjustmentAmount}</td>
          </tr>
          ` : ""}

          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 13px;">Total Bill</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #f8fafc; font-weight: 700; font-size: 13px; text-align: right;">₹${totalAmount}</td>
          </tr>

          <tr>
            <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 13px;">Amount Paid</td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #1e293b; color: #34d399; font-weight: 700; font-size: 13px; text-align: right;">₹${amountPaid}</td>
          </tr>

          <tr>
            <td style="padding: 14px 16px; color: #f8fafc; font-weight: 800; font-size: 15px;">Net Amount Due</td>
            <td style="padding: 14px 16px; color: #34d399; font-weight: 900; font-size: 20px; text-align: right; font-family: monospace;">₹${amountDue}</td>
          </tr>

        </table>
      </td>
    </tr>

    <!-- UPI PAYMENT & QR SECTION -->
    ${(upiId || qrImageSrc || webPayUrl) ? `
    <tr>
      <td style="padding: 0 24px 24px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f172a; border-radius: 12px; border: 1px solid #334155; width: 100%; text-align: center;">
          <tr>
            <td style="padding: 20px;">
              
              <h3 style="margin: 0 0 4px 0; font-size: 18px; color: #f8fafc; font-weight: 800;">Scan or Tap to Pay via UPI</h3>
              <p style="margin: 0 0 12px 0; font-size: 12px; color: #94a3b8;">Use GPay, PhonePe, Paytm, or any UPI App</p>

              ${upiId ? `
              <div style="margin: 0 0 16px 0;">
                <span style="font-family: monospace; font-size: 13px; font-weight: 700; color: #fbbf24; background-color: rgba(251, 191, 36, 0.12); padding: 6px 14px; border-radius: 6px; border: 1px solid rgba(251, 191, 36, 0.3); display: inline-block;">
                  ${upiId}
                </span>
              </div>
              ` : ""}

              ${qrImageSrc ? `
              <div style="margin: 12px 0 16px 0; text-align: center;">
                <img src="${qrImageSrc}" alt="UPI Payment QR Code" width="200" height="200" style="margin: 0 auto; display: block; border-radius: 12px; border: 3px solid #f59e0b; padding: 8px; background-color: #ffffff;" />
              </div>
              ` : ""}

              <!-- Clickable Web Payment Link (Gmail Safe) -->
              ${webPayUrl ? `
              <table border="0" cellspacing="0" cellpadding="0" align="center" style="margin: 20px auto 6px auto; text-align: center; width: 100%; max-width: 320px;">
                <tr>
                  <td align="center" bgcolor="#f59e0b" style="border-radius: 12px; background-color: #f59e0b; padding: 0;">
                    <a href="${webPayUrl}" target="_blank" style="font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a !important; text-decoration: none; border-radius: 12px; padding: 14px 24px; border: 1px solid #d97706; display: inline-block; font-weight: 900; background-color: #f59e0b;">
                      Pay ₹${amountDue} Now (Open UPI App) &rarr;
                    </a>
                  </td>
                </tr>
              </table>
              ` : ""}

            </td>
          </tr>
        </table>
      </td>
    </tr>
    ` : ""}

    <!-- FOOTER -->
    <tr>
      <td style="padding: 16px 24px 24px 24px; text-align: center; border-top: 1px solid #334155; font-size: 12px; color: #64748b;">
        Sent via TiffinSplit — Roommate Billing Application
      </td>
    </tr>

  </table>

</body>
</html>`;
}

export async function sendInvoiceEmail(params: InvoiceEmailParams) {
  const transporter = createTransporter();
  const html = renderInvoiceHtml({ ...params, useCidForQr: Boolean(transporter && params.qrDataUrl) });

  if (!transporter) {
    console.log(`[SMTP Not Configured] Invoice email preview generated for ${params.toEmail}:`);
    return {
      success: true,
      preview: true,
      message: `Email rendering successful. (Add SMTP_USER and SMTP_PASS to .env to send live emails)`,
    };
  }

  const mailOptions: any = {
    from: process.env.SMTP_FROM || `"TiffinSplit Admin" <${process.env.SMTP_USER}>`,
    to: params.toEmail,
    subject: `TiffinSplit Invoice — ${params.monthName} ${params.year} (Amount Due: ₹${params.amountDue})`,
    html,
  };

  if (params.qrDataUrl) {
    mailOptions.attachments = [
      {
        filename: "upi-qr-code.png",
        path: params.qrDataUrl,
        cid: "upi-qr-code",
      },
    ];
  }

  const info = await transporter.sendMail(mailOptions);
  return {
    success: true,
    preview: false,
    messageId: info.messageId,
  };
}
