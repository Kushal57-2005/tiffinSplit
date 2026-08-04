import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getOrCreateDefaultOwner } from "@/lib/get-owner";
import { MealEntryModel, FriendModel } from "@/models";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const owner = await getOrCreateDefaultOwner();

    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get("month");
    const yearStr = searchParams.get("year");
    const mealType = searchParams.get("mealType");

    const filter: any = { ownerId: owner.id };

    if (mealType === "MORNING" || mealType === "NIGHT") {
      filter.mealType = mealType;
    }

    if (monthStr && yearStr) {
      const month = parseInt(monthStr, 10);
      const year = parseInt(yearStr, 10);
      const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      filter.entryDate = { $gte: startDate, $lte: endDate };
    }

    const entries = await MealEntryModel.find(filter).sort({ entryDate: -1, createdAt: -1 });
    const friends = await FriendModel.find({ ownerId: owner.id });
    const friendMap = new Map(friends.map((f) => [f._id.toString(), f]));

    const formatted = entries.map((entry) => ({
      id: entry._id.toString(),
      ownerId: entry.ownerId,
      entryDate: entry.entryDate,
      mealType: entry.mealType,
      defaultPrice: entry.defaultPrice,
      totalPersons: entry.totalPersons,
      totalQuantity: entry.totalQuantity,
      totalAmount: entry.totalAmount,
      notes: entry.notes,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      items: entry.items.map((item) => {
        const friend = friendMap.get(item.friendId);
        return {
          id: item._id ? item._id.toString() : item.friendId,
          mealEntryId: entry._id.toString(),
          friendId: item.friendId,
          friend: friend
            ? {
                id: friend._id.toString(),
                fullName: friend.fullName,
                shortCode: friend.shortCode,
              }
            : { id: item.friendId, fullName: "Unknown", shortCode: "??" },
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        };
      }),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /api/entries error:", error);
    return NextResponse.json({ error: "Failed to fetch meal entries." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const owner = await getOrCreateDefaultOwner();
    const body = await request.json();

    const { entryDate, mealType, defaultPrice = 70, notes, items } = body;

    if (!entryDate || !mealType) {
      return NextResponse.json(
        { error: "entryDate and mealType are required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one roommate meal item is required." },
        { status: 400 }
      );
    }

    const price = Number(defaultPrice) > 0 ? Number(defaultPrice) : 70;
    
    // Timezone safe date parsing (Noon UTC)
    let cleanDate: Date;
    if (typeof entryDate === "string" && entryDate.includes("-")) {
      const parts = entryDate.split("T")[0].split("-").map(Number);
      cleanDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
    } else {
      cleanDate = new Date(entryDate);
    }

    const validItems = items
      .filter((i: any) => Number(i.quantity) > 0)
      .map((i: any) => {
        const qty = Number(i.quantity);
        const itemPrice = Number(i.unitPrice) > 0 ? Number(i.unitPrice) : price;
        return {
          friendId: i.friendId,
          quantity: qty,
          unitPrice: itemPrice,
          lineTotal: qty * itemPrice,
        };
      });

    if (validItems.length === 0) {
      return NextResponse.json(
        { error: "Please select at least 1 roommate with quantity > 0." },
        { status: 400 }
      );
    }

    const totalPersons = validItems.length;
    const totalQuantity = validItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = validItems.reduce((sum, item) => sum + item.lineTotal, 0);

    const entry = await MealEntryModel.create({
      ownerId: owner.id,
      entryDate: cleanDate,
      mealType,
      defaultPrice: price,
      totalPersons,
      totalQuantity,
      totalAmount,
      notes: notes?.trim() || null,
      items: validItems,
    });

    return NextResponse.json({
      id: entry._id.toString(),
      entryDate: entry.entryDate,
      mealType: entry.mealType,
      totalPersons: entry.totalPersons,
      totalQuantity: entry.totalQuantity,
      totalAmount: entry.totalAmount,
    });
  } catch (error) {
    console.error("POST /api/entries error:", error);
    return NextResponse.json({ error: "Failed to save meal entry." }, { status: 500 });
  }
}
