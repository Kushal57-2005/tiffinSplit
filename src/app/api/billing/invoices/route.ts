import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getOrCreateDefaultOwner } from "@/lib/get-owner";
import { MonthlyInvoiceModel, FriendModel } from "@/models";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const owner = await getOrCreateDefaultOwner(request);

    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get("month");
    const yearStr = searchParams.get("year");
    const friendId = searchParams.get("friendId");

    const filter: any = { ownerId: owner.id };
    if (monthStr) filter.month = parseInt(monthStr, 10);
    if (yearStr) filter.year = parseInt(yearStr, 10);
    if (friendId) filter.friendId = friendId;

    const invoices = await MonthlyInvoiceModel.find(filter).sort({ year: -1, month: -1 });
    const friends = await FriendModel.find({ ownerId: owner.id });
    const friendMap = new Map(friends.map((f) => [f._id.toString(), f]));

    const formatted = invoices.map((inv) => {
      const friend = friendMap.get(inv.friendId);
      return {
        id: inv._id.toString(),
        ownerId: inv.ownerId,
        friendId: inv.friendId,
        friend: friend
          ? {
              id: friend._id.toString(),
              fullName: friend.fullName,
              shortCode: friend.shortCode,
              email: friend.email,
              phone: friend.phone,
              upiId: friend.upiId,
            }
          : { id: inv.friendId, fullName: "Unknown", shortCode: "??" },
        month: inv.month,
        year: inv.year,
        totalMeals: inv.totalMeals,
        totalQuantity: inv.totalQuantity,
        subtotalAmount: inv.subtotalAmount,
        adjustmentAmount: inv.adjustmentAmount,
        totalAmount: inv.totalAmount,
        amountPaid: inv.amountPaid,
        amountDue: inv.amountDue,
        status: inv.status,
        generatedAt: inv.generatedAt,
        sentAt: inv.sentAt,
        emailSent: inv.emailSent,
        emailTo: inv.emailTo,
        qrPayload: inv.qrPayload,
        qrImageUrl: inv.qrImageUrl,
        items: inv.items.map((i) => ({
          id: i._id ? i._id.toString() : "",
          entryDate: i.entryDate,
          mealType: i.mealType,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineTotal: i.lineTotal,
          description: i.description,
        })),
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /api/billing/invoices error:", error);
    return NextResponse.json({ error: "Failed to fetch invoices." }, { status: 500 });
  }
}
