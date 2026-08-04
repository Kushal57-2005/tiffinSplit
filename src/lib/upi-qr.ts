import QRCode from "qrcode";

export interface UpiQrOptions {
  upiId: string;
  payeeName: string;
  amount: number;
  note?: string;
}

export function buildUpiPayload(options: UpiQrOptions): string {
  const { upiId, payeeName, amount, note = "TiffinSplit Settlement" } = options;
  const cleanUpi = upiId.trim();
  const cleanName = payeeName.trim();
  const cleanAmount = Number(amount).toFixed(2);
  const cleanNote = note.trim();

  return `upi://pay?pa=${cleanUpi}&pn=${encodeURIComponent(cleanName)}&am=${cleanAmount}&tn=${encodeURIComponent(cleanNote)}&cu=INR`;
}

export async function generateQrDataUrl(payload: string): Promise<string> {
  try {
    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 300,
      color: {
        dark: "#0f172a", // Slate-900
        light: "#ffffff",
      },
    });
  } catch (error) {
    console.error("Failed to generate QR Data URL:", error);
    throw error;
  }
}
