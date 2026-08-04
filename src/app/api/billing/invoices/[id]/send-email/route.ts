import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getOrCreateDefaultOwner } from "@/lib/get-owner";
import { MonthlyInvoiceModel, FriendModel } from "@/models";
import { buildUpiPayload, generateQrDataUrl } from "@/lib/upi-qr";
import { sendInvoiceEmail } from "@/lib/email";

export async function POST(
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

    if (!friend || !friend.email) {
      return NextResponse.json(
        { error: `Roommate ${friend?.fullName || ""} does not have an email address configured.` },
        { status: 400 }
      );
    }

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthName = monthNames[invoice.month - 1] || `Month ${invoice.month}`;

    const targetUpiId = owner.upiId || process.env.ADMIN_UPI_ID || friend.upiId;

    if (!targetUpiId) {
      return NextResponse.json(
        { error: "Please enter your Payee UPI ID in Settings before sending email invoices." },
        { status: 400 }
      );
    }

    const upiPayload = buildUpiPayload({
      upiId: targetUpiId,
      payeeName: owner.name || "TiffinSplit Admin",
      amount: invoice.amountDue,
      note: `TiffinSplit ${monthName} ${invoice.year}`,
    });

    const qrDataUrl = await generateQrDataUrl(upiPayload);

    const result = await sendInvoiceEmail({
      toEmail: friend.email,
      friendName: friend.fullName,
      monthName,
      year: invoice.year,
      totalMeals: invoice.totalMeals,
      totalQuantity: invoice.totalQuantity,
      subtotalAmount: invoice.subtotalAmount,
      adjustmentAmount: invoice.adjustmentAmount,
      totalAmount: invoice.totalAmount,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,
      upiId: targetUpiId,
      upiPayload,
      qrDataUrl,
      invoiceId: invoice._id.toString(),
    });

    invoice.emailSent = true;
    invoice.emailTo = friend.email;
    invoice.sentAt = new Date();
    if (invoice.status === "GENERATED") {
      invoice.status = "SENT";
    }
    await invoice.save();

    return NextResponse.json({
      message: (result as any).message || "Email sent successfully",
      delivered: Boolean((result as any).messageId),
      emailTo: friend.email,
      invoice: {
        id: invoice._id.toString(),
        status: invoice.status,
        emailSent: invoice.emailSent,
        sentAt: invoice.sentAt,
      },
    });
  } catch (error) {
    console.error("POST /api/billing/invoices/[id]/send-email error:", error);
    return NextResponse.json({ error: "Failed to send invoice email." }, { status: 500 });
  }
}
