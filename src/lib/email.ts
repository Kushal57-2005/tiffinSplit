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
    useCidForQr,
  } = params;

  const qrImageSrc = useCidForQr ? "cid:upi-qr-code" : qrDataUrl;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .header { text-align: center; border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 24px; }
          .title { font-size: 24px; font-weight: 800; color: #fbbf24; margin: 0; }
          .subtitle { font-size: 14px; color: #94a3b8; margin-top: 4px; }
          .badge { display: inline-block; background: rgba(251, 191, 36, 0.15); color: #fbbf24; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-top: 8px; border: 1px solid rgba(251, 191, 36, 0.3); }
          .card { background: #0f172a; border-radius: 12px; padding: 20px; border: 1px solid #334155; margin-bottom: 20px; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e293b; font-size: 14px; }
          .row:last-child { border-bottom: none; }
          .label { color: #94a3b8; }
          .value { font-weight: 700; color: #f8fafc; }
          .due { color: #34d399; font-size: 18px; font-weight: 800; }
          .qr-section { text-align: center; background: #0f172a; border-radius: 12px; padding: 24px 20px; border: 1px solid #334155; margin-top: 20px; }
          .upi-id { font-family: monospace; font-size: 14px; font-weight: 700; color: #fbbf24; background: rgba(251, 191, 36, 0.1); padding: 6px 14px; border-radius: 6px; display: inline-block; margin: 8px 0; border: 1px border: rgba(251, 191, 36, 0.3); }
          .pay-btn { background: linear-gradient(to right, #f59e0b, #ea580c); color: #0f172a !important; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 900; font-size: 15px; display: inline-block; margin-top: 16px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3); }
          .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">TiffinSplit Invoice</h1>
            <p class="subtitle">Roommate Tiffin Billing Statement</p>
            <div class="badge">${monthName} ${year}</div>
          </div>

          <p>Hi <strong>${friendName}</strong>,</p>
          <p>Here is your monthly tiffin consumption summary for <strong>${monthName} ${year}</strong>:</p>

          <div class="card">
            <div class="row">
              <span class="label">Total Meal Days</span>
              <span class="value">${totalMeals} Days</span>
            </div>
            <div class="row">
              <span class="label">Total Tiffins Consumed</span>
              <span class="value">${totalQuantity} Tiffins</span>
            </div>
            <div class="row">
              <span class="label">Subtotal</span>
              <span class="value">₹${subtotalAmount}</span>
            </div>
            ${adjustmentAmount !== 0 ? `
            <div class="row">
              <span class="label">Adjustment</span>
              <span class="value">₹${adjustmentAmount}</span>
            </div>
            ` : ""}
            <div class="row">
              <span class="label">Total Bill</span>
              <span class="value">₹${totalAmount}</span>
            </div>
            <div class="row">
              <span class="label">Amount Paid</span>
              <span class="value" style="color: #34d399;">₹${amountPaid}</span>
            </div>
            <div class="row" style="padding-top: 12px;">
              <span class="label" style="font-weight: 700; color: #f8fafc;">Net Amount Due</span>
              <span class="due">₹${amountDue}</span>
            </div>
          </div>

          ${(upiId || qrDataUrl || upiPayload) ? `
          <div class="qr-section">
            <h3 style="margin: 0; font-size: 18px; color: #f8fafc; font-weight: 800;">Scan to Pay via UPI</h3>
            <p style="font-size: 12px; color: #94a3b8; margin: 4px 0 12px 0;">Use GPay, PhonePe, Paytm, or any UPI App</p>
            
            ${upiId ? `<div class="upi-id">${upiId}</div>` : ""}

            ${qrImageSrc ? `
            <div style="margin: 16px 0;">
              <img src="${qrImageSrc}" alt="UPI Payment QR Code" width="200" height="200" style="margin: 0 auto; display: block; border-radius: 12px; border: 3px solid #f59e0b; padding: 8px; background: #ffffff;" />
            </div>
            ` : ""}

            ${upiPayload ? `
            <p style="margin-top: 16px;">
              <a href="${upiPayload}" class="pay-btn">Pay ₹${amountDue} Now (Open UPI App)</a>
            </p>
            ` : ""}
          </div>
          ` : ""}

          <div class="footer">
            Sent via TiffinSplit — Roommate Billing Application
          </div>
        </div>
      </body>
    </html>
  `;
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
