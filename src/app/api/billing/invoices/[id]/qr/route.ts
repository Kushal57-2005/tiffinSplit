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

    if (!friend || !friend.upiId) {
      return NextResponse.json(
        { error: `Roommate ${friend?.fullName || ""} does not have a UPI ID configured.` },
        { status: 400 }
      );
    }

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthName = monthNames[invoice.month - 1] || `Month ${invoice.month}`;

    const upiPayload = buildUpiPayload({
      upiId: friend.upiId,
      payeeName: friend.fullName,
      amount: invoice.amountDue,
      note: `TiffinSplit ${monthName} ${invoice.year}`,
    });

    const qrDataUrl = await generateQrDataUrl(upiPayload);

    invoice.qrPayload = upiPayload;
    invoice.qrImageUrl = qrDataUrl;
    await invoice.save();

    return NextResponse.json({
      upiId: friend.upiId,
      amountDue: invoice.amountDue,
      upiPayload,
      qrDataUrl,
    });
  } catch (error) {
    console.error("GET /api/billing/invoices/[id]/qr error:", error);
    return NextResponse.json({ error: "Failed to generate QR code." }, { status: 500 });
  }
}
