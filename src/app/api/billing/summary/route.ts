import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getOrCreateDefaultOwner } from "@/lib/get-owner";
import { FriendModel, MealEntryModel, MonthlyInvoiceModel } from "@/models";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const owner = await getOrCreateDefaultOwner();

    const { searchParams } = new URL(request.url);
    const currentDate = new Date();

    const month = parseInt(searchParams.get("month") || (currentDate.getMonth() + 1).toString(), 10);
    const year = parseInt(searchParams.get("year") || currentDate.getFullYear().toString(), 10);

    // Timezone-safe UTC month bounds
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const friends = await FriendModel.find({ ownerId: owner.id, isActive: true }).sort({ fullName: 1 });

    const entries = await MealEntryModel.find({
      ownerId: owner.id,
      entryDate: { $gte: startDate, $lte: endDate },
    });

    const invoices = await MonthlyInvoiceModel.find({
      ownerId: owner.id,
      month,
      year,
    });
    const invoiceMap = new Map(invoices.map((inv) => [inv.friendId.toString(), inv]));

    const summaries = friends.map((friend) => {
      const friendIdStr = friend._id.toString();

      let totalMeals = 0;
      let totalQuantity = 0;
      let subtotalAmount = 0;
      let itemCount = 0;

      entries.forEach((entry) => {
        const item = entry.items.find((i) => String(i.friendId) === String(friendIdStr));
        if (item && item.quantity > 0) {
          totalMeals += 1;
          totalQuantity += item.quantity;
          subtotalAmount += item.lineTotal;
          itemCount += 1;
        }
      });

      const existingInvoice = invoiceMap.get(friendIdStr);

      let formattedInvoice = null;
      if (existingInvoice) {
        formattedInvoice = {
          id: existingInvoice._id.toString(),
          friendId: existingInvoice.friendId,
          friend: {
            id: friend._id.toString(),
            fullName: friend.fullName,
            shortCode: friend.shortCode,
            email: friend.email,
            upiId: friend.upiId,
          },
          month: existingInvoice.month,
          year: existingInvoice.year,
          totalMeals: existingInvoice.totalMeals,
          totalQuantity: existingInvoice.totalQuantity,
          subtotalAmount: existingInvoice.subtotalAmount,
          adjustmentAmount: existingInvoice.adjustmentAmount,
          totalAmount: existingInvoice.totalAmount,
          amountPaid: existingInvoice.amountPaid,
          amountDue: existingInvoice.amountDue,
          status: existingInvoice.status,
          generatedAt: existingInvoice.generatedAt,
          sentAt: existingInvoice.sentAt,
          emailSent: existingInvoice.emailSent,
          emailTo: existingInvoice.emailTo,
          qrPayload: existingInvoice.qrPayload,
          qrImageUrl: existingInvoice.qrImageUrl,
          items: existingInvoice.items.map((i) => ({
            id: i._id ? i._id.toString() : "",
            entryDate: i.entryDate,
            mealType: i.mealType,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            lineTotal: i.lineTotal,
            description: i.description,
          })),
        };
      }

      return {
        friend: {
          id: friend._id.toString(),
          fullName: friend.fullName,
          shortCode: friend.shortCode,
          phone: friend.phone,
          email: friend.email,
          upiId: friend.upiId,
        },
        month,
        year,
        liveStats: {
          totalMeals,
          totalQuantity,
          subtotalAmount,
          itemCount,
        },
        invoice: formattedInvoice,
        isGenerated: Boolean(existingInvoice),
      };
    });

    return NextResponse.json({
      month,
      year,
      summaries,
    });
  } catch (error) {
    console.error("GET /api/billing/summary error:", error);
    return NextResponse.json({ error: "Failed to compute billing summary." }, { status: 500 });
  }
}
