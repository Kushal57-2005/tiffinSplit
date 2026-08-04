import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getOrCreateDefaultOwner } from "@/lib/get-owner";
import { MonthlyInvoiceModel, FriendModel } from "@/models";
import { buildUpiPayload, generateQrDataUrl } from "@/lib/upi-qr";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const owner = await getOrCreateDefaultOwner();
    const { id } = await params;

    const invoice = await MonthlyInvoiceModel.findOne({ _id: id, ownerId: owner.id });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    const friend = await FriendModel.findOne({ _id: invoice.friendId });

    const targetUpiId =
      owner.upiId ||
      process.env.ADMIN_UPI_ID ||
      friend?.upiId ||
      process.env.DEFAULT_UPI_ID;

    if (!targetUpiId) {
      return NextResponse.json(
        { error: "Please configure your Payee UPI ID in Settings before generating QR code." },
        { status: 400 }
      );
    }

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthName = monthNames[invoice.month - 1] || `Month ${invoice.month}`;

    const upiPayload = buildUpiPayload({
      upiId: targetUpiId,
      payeeName: owner.name || "TiffinSplit User",
      amount: invoice.amountDue,
      note: `TiffinSplit ${monthName} ${invoice.year}`,
    });

    const qrDataUrl = await generateQrDataUrl(upiPayload);

    invoice.qrPayload = upiPayload;
    invoice.qrImageUrl = qrDataUrl;
    await invoice.save();

    return NextResponse.json({
      upiId: targetUpiId,
      amountDue: invoice.amountDue,
      upiPayload,
      qrDataUrl,
    });
  } catch (error) {
    console.error("GET /api/billing/invoices/[id]/qr error:", error);
    return NextResponse.json({ error: "Failed to generate QR code." }, { status: 500 });
  }
}
