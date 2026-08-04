import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getOrCreateDefaultOwner } from "@/lib/get-owner";
import { FriendModel, MealEntryModel, MonthlyInvoiceModel } from "@/models";

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const owner = await getOrCreateDefaultOwner();
    const body = await request.json();

    const { month, year, friendId } = body;

    if (!month || !year) {
      return NextResponse.json({ error: "month and year are required." }, { status: 400 });
    }

    // Timezone-safe UTC month bounds
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const friendFilter: any = { ownerId: owner.id, isActive: true };
    if (friendId) friendFilter._id = friendId;

    const friends = await FriendModel.find(friendFilter);
    if (friends.length === 0) {
      return NextResponse.json({ error: "No active roommates found to generate invoices." }, { status: 400 });
    }

    const entries = await MealEntryModel.find({
      ownerId: owner.id,
      entryDate: { $gte: startDate, $lte: endDate },
    }).sort({ entryDate: 1 });

    const createdInvoices = [];

    for (const friend of friends) {
      const friendIdStr = friend._id.toString();

      const snapshotItems: any[] = [];
      let totalMeals = 0;
      let totalQuantity = 0;
      let subtotalAmount = 0;

      entries.forEach((entry) => {
        const item = entry.items.find((i) => String(i.friendId) === String(friendIdStr));
        if (item && item.quantity > 0) {
          totalMeals += 1;
          totalQuantity += item.quantity;
          subtotalAmount += item.lineTotal;

          snapshotItems.push({
            entryDate: entry.entryDate,
            mealType: entry.mealType,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            description: `${item.quantity} Tiffin (${entry.mealType}) @ ₹${item.unitPrice}`,
          });
        }
      });

      // Upsert invoice snapshot
      const existing = await MonthlyInvoiceModel.findOne({
        ownerId: owner.id,
        friendId: friendIdStr,
        month,
        year,
      });

      const adjustmentAmount = existing ? existing.adjustmentAmount : 0;
      const totalAmount = Math.max(0, subtotalAmount + adjustmentAmount);
      const amountPaid = existing ? existing.amountPaid : 0;
      const amountDue = Math.max(0, totalAmount - amountPaid);

      let status: "DRAFT" | "GENERATED" | "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED" = "GENERATED";
      if (amountPaid >= totalAmount && totalAmount > 0) {
        status = "PAID";
      } else if (amountPaid > 0) {
        status = "PARTIALLY_PAID";
      }

      let invoice;
      if (existing) {
        existing.totalMeals = totalMeals;
        existing.totalQuantity = totalQuantity;
        existing.subtotalAmount = subtotalAmount;
        existing.totalAmount = totalAmount;
        existing.amountDue = amountDue;
        existing.status = status as any;
        existing.items = snapshotItems;
        await existing.save();
        invoice = existing;
      } else {
        invoice = await MonthlyInvoiceModel.create({
          ownerId: owner.id,
          friendId: friendIdStr,
          month,
          year,
          totalMeals,
          totalQuantity,
          subtotalAmount,
          adjustmentAmount,
          totalAmount,
          amountPaid,
          amountDue,
          status,
          items: snapshotItems,
        });
      }

      createdInvoices.push(invoice);
    }

    return NextResponse.json({
      message: `Successfully generated ${createdInvoices.length} invoices for ${month}/${year}.`,
      invoices: createdInvoices,
    });
  } catch (error) {
    console.error("POST /api/billing/generate error:", error);
    return NextResponse.json({ error: "Failed to generate invoices." }, { status: 500 });
  }
}
