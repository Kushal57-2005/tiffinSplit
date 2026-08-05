import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getOrCreateDefaultOwner } from "@/lib/get-owner";
import { PaymentModel, MonthlyInvoiceModel, FriendModel } from "@/models";

export async function recalculateInvoice(invoiceId: string) {
  await connectToDatabase();
  const invoice = await MonthlyInvoiceModel.findById(invoiceId);
  if (!invoice) return null;

  const successfulPayments = await PaymentModel.find({
    invoiceId,
    paymentStatus: "SUCCESS",
  });

  const totalPaid = successfulPayments.reduce((sum, p) => sum + p.amount, 0);

  const amountPaid = totalPaid;
  const amountDue = Math.max(0, invoice.totalAmount - totalPaid);

  let status = invoice.status;
  if (totalPaid >= invoice.totalAmount && invoice.totalAmount > 0) {
    status = "PAID";
  } else if (totalPaid > 0) {
    status = "PARTIALLY_PAID";
  } else if (status === "PAID" || status === "PARTIALLY_PAID") {
    status = "GENERATED";
  }

  invoice.amountPaid = amountPaid;
  invoice.amountDue = amountDue;
  invoice.status = status as any;
  await invoice.save();

  return invoice;
}

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const owner = await getOrCreateDefaultOwner(request);

    const { searchParams } = new URL(request.url);
    const friendId = searchParams.get("friendId");
    const invoiceId = searchParams.get("invoiceId");

    const filter: any = { ownerId: owner.id };
    if (friendId) filter.friendId = friendId;
    if (invoiceId) filter.invoiceId = invoiceId;

    const payments = await PaymentModel.find(filter).sort({ paidAt: -1, createdAt: -1 });
    const friends = await FriendModel.find({ ownerId: owner.id });
    const friendMap = new Map(friends.map((f) => [f._id.toString(), f]));

    const formatted = payments.map((p) => {
      const friend = friendMap.get(p.friendId);
      return {
        id: p._id.toString(),
        ownerId: p.ownerId,
        friendId: p.friendId,
        invoiceId: p.invoiceId,
        friend: friend
          ? {
              id: friend._id.toString(),
              fullName: friend.fullName,
              shortCode: friend.shortCode,
            }
          : { id: p.friendId, fullName: "Unknown", shortCode: "??" },
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        paymentStatus: p.paymentStatus,
        transactionRef: p.transactionRef,
        notes: p.notes,
        paidAt: p.paidAt,
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /api/payments error:", error);
    return NextResponse.json({ error: "Failed to fetch payments." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const owner = await getOrCreateDefaultOwner(request);
    const body = await request.json();

    const { friendId, invoiceId, amount, paymentMethod = "UPI", transactionRef, notes, paidAt } = body;

    if (!friendId || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "friendId and a valid payment amount > 0 are required." },
        { status: 400 }
      );
    }

    const friend = await FriendModel.findOne({ _id: friendId, ownerId: owner.id });
    if (!friend) {
      return NextResponse.json({ error: "Friend not found." }, { status: 404 });
    }

    const numAmount = Number(amount);
    const paymentDate = paidAt ? new Date(paidAt) : new Date();

    const payment = await PaymentModel.create({
      ownerId: owner.id,
      friendId,
      invoiceId: invoiceId || undefined,
      amount: numAmount,
      paymentMethod,
      paymentStatus: "SUCCESS",
      transactionRef: transactionRef?.trim() || undefined,
      notes: notes?.trim() || undefined,
      paidAt: paymentDate,
    });

    let updatedInvoice = null;
    if (invoiceId) {
      updatedInvoice = await recalculateInvoice(invoiceId);
    }

    return NextResponse.json({
      payment: {
        id: payment._id.toString(),
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        transactionRef: payment.transactionRef,
        paidAt: payment.paidAt,
      },
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("POST /api/payments error:", error);
    return NextResponse.json({ error: "Failed to record payment." }, { status: 500 });
  }
}
