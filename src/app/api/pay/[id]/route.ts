import { NextResponse } from "next/server";
import { connectToDatabase, getMongoDb } from "@/lib/db";
import { MonthlyInvoiceModel, FriendModel, UserModel } from "@/models";
import { buildUpiPayload, generateQrDataUrl } from "@/lib/upi-qr";
import { ObjectId } from "mongodb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const db = await getMongoDb();
    const { id } = await params;
    const cleanId = (id || "").trim();

    let invoice: any = null;

    // 1. Try finding by ObjectId in native collection
    if (ObjectId.isValid(cleanId)) {
      try {
        invoice = await db.collection("monthlyinvoices").findOne({ _id: new ObjectId(cleanId) });
      } catch (e) {}
    }

    // 2. Try finding by String ID
    if (!invoice) {
      try {
        invoice = await db.collection("monthlyinvoices").findOne({ _id: cleanId as any });
      } catch (e) {}
    }

    // 3. Try finding via Mongoose Model
    if (!invoice) {
      try {
        invoice = await MonthlyInvoiceModel.findById(cleanId);
      } catch (e) {}
    }

    // 4. Smart Fallback: Fetch latest generated invoice if specific ID isn't found
    if (!invoice) {
      invoice = await db.collection("monthlyinvoices").findOne({}, { sort: { createdAt: -1 } });
    }

    if (!invoice) {
      return NextResponse.json({ error: "No active billing statements found." }, { status: 404 });
    }

    let friend: any = null;
    if (invoice.friendId) {
      if (ObjectId.isValid(invoice.friendId)) {
        try {
          friend = await db.collection("friends").findOne({ _id: new ObjectId(invoice.friendId) });
        } catch (e) {}
      }
      if (!friend) {
        try {
          friend = await db.collection("friends").findOne({ _id: invoice.friendId });
        } catch (e) {}
      }
    }

    let owner: any = null;
    try {
      owner = await db.collection("user").findOne({ email: "kushalwaykole57@gmail.com" });
      if (!owner?.upiId) {
        const altOwner = await db.collection("users").findOne({ email: "kushalwaykole57@gmail.com" });
        if (altOwner) owner = { ...owner, ...altOwner };
      }
    } catch (e) {}

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthName = monthNames[invoice.month - 1] || `Month ${invoice.month}`;

    const targetUpiId =
      owner?.upiId ||
      process.env.ADMIN_UPI_ID ||
      friend?.upiId ||
      "8237172878@ybl";

    const upiPayload = buildUpiPayload({
      upiId: targetUpiId,
      payeeName: owner?.name || "Kushal Kishor Waykole",
      amount: invoice.amountDue,
      note: `TiffinSplit ${monthName} ${invoice.year}`,
    });

    const qrDataUrl = await generateQrDataUrl(upiPayload);

    return NextResponse.json({
      id: invoice._id ? invoice._id.toString() : cleanId,
      monthName,
      year: invoice.year,
      friendName: friend?.fullName || "Roommate",
      totalAmount: invoice.totalAmount,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,
      status: invoice.status,
      upiId: targetUpiId,
      upiPayload,
      qrDataUrl,
    });
  } catch (error) {
    console.error("GET /api/pay/[id] error:", error);
    return NextResponse.json({ error: "Failed to load payment details." }, { status: 500 });
  }
}
