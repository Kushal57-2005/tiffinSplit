import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getOrCreateDefaultOwner } from "@/lib/get-owner";
import { MonthlyInvoiceModel, FriendModel } from "@/models";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const owner = await getOrCreateDefaultOwner(request);
    const { id } = await params;

    const invoice = await MonthlyInvoiceModel.findOne({ _id: id, ownerId: owner.id });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    const friend = await FriendModel.findOne({ _id: invoice.friendId });

    return NextResponse.json({
      id: invoice._id.toString(),
      ownerId: invoice.ownerId,
      friendId: invoice.friendId,
      friend: friend
        ? {
            id: friend._id.toString(),
            fullName: friend.fullName,
            shortCode: friend.shortCode,
            email: friend.email,
            upiId: friend.upiId,
          }
        : null,
      month: invoice.month,
      year: invoice.year,
      totalMeals: invoice.totalMeals,
      totalQuantity: invoice.totalQuantity,
      subtotalAmount: invoice.subtotalAmount,
      previousDue: invoice.previousDue || 0,
      adjustmentAmount: invoice.adjustmentAmount,
      totalAmount: invoice.totalAmount,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,
      status: invoice.status,
      generatedAt: invoice.generatedAt,
      sentAt: invoice.sentAt,
      emailSent: invoice.emailSent,
      emailTo: invoice.emailTo,
      qrPayload: invoice.qrPayload,
      qrImageUrl: invoice.qrImageUrl,
      items: invoice.items,
    });
  } catch (error) {
    console.error("GET /api/billing/invoices/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch invoice." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const owner = await getOrCreateDefaultOwner(request);
    const { id } = await params;
    const body = await request.json();

    const invoice = await MonthlyInvoiceModel.findOne({ _id: id, ownerId: owner.id });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    if (body.previousDue !== undefined) {
      invoice.previousDue = Math.max(0, Number(body.previousDue));
    }

    if (body.adjustmentAmount !== undefined) {
      invoice.adjustmentAmount = Number(body.adjustmentAmount);
    }

    if (body.previousDue !== undefined || body.adjustmentAmount !== undefined) {
      const prevDue = invoice.previousDue || 0;
      const adj = invoice.adjustmentAmount || 0;
      invoice.totalAmount = Math.max(0, invoice.subtotalAmount + prevDue + adj);
      invoice.amountDue = Math.max(0, invoice.totalAmount - invoice.amountPaid);

      if (invoice.amountPaid >= invoice.totalAmount && invoice.totalAmount > 0) {
        invoice.status = "PAID";
      } else if (invoice.amountPaid > 0) {
        invoice.status = "PARTIALLY_PAID";
      } else {
        invoice.status = "GENERATED";
      }
    }

    if (body.status) {
      invoice.status = body.status;
    }

    await invoice.save();

    const friend = await FriendModel.findOne({ _id: invoice.friendId });

    return NextResponse.json({
      id: invoice._id.toString(),
      ownerId: invoice.ownerId,
      friendId: invoice.friendId,
      friend: friend
        ? {
            id: friend._id.toString(),
            fullName: friend.fullName,
            shortCode: friend.shortCode,
            email: friend.email,
            upiId: friend.upiId,
          }
        : null,
      month: invoice.month,
      year: invoice.year,
      totalMeals: invoice.totalMeals,
      totalQuantity: invoice.totalQuantity,
      subtotalAmount: invoice.subtotalAmount,
      previousDue: invoice.previousDue || 0,
      adjustmentAmount: invoice.adjustmentAmount,
      totalAmount: invoice.totalAmount,
      amountPaid: invoice.amountPaid,
      amountDue: invoice.amountDue,
      status: invoice.status,
      items: invoice.items,
    });
  } catch (error) {
    console.error("PATCH /api/billing/invoices/[id] error:", error);
    return NextResponse.json({ error: "Failed to update invoice." }, { status: 500 });
  }
}
