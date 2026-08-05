import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getOrCreateDefaultOwner } from "@/lib/get-owner";
import { MealEntryModel } from "@/models";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const owner = await getOrCreateDefaultOwner(request);
    const { id } = await params;

    const entry = await MealEntryModel.findOne({ _id: id, ownerId: owner.id });
    if (!entry) {
      return NextResponse.json({ error: "Meal entry not found." }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("GET /api/entries/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch meal entry." }, { status: 500 });
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

    const entry = await MealEntryModel.findOne({ _id: id, ownerId: owner.id });
    if (!entry) {
      return NextResponse.json({ error: "Meal entry not found." }, { status: 404 });
    }

    const { entryDate, mealType, defaultPrice, notes, items } = body;

    if (entryDate) entry.entryDate = new Date(entryDate);
    if (mealType) entry.mealType = mealType;
    if (defaultPrice !== undefined) entry.defaultPrice = Number(defaultPrice);
    if (notes !== undefined) entry.notes = notes?.trim() || undefined;

    if (Array.isArray(items) && items.length > 0) {
      const price = entry.defaultPrice || 70;
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

      entry.items = validItems as any;
      entry.totalPersons = validItems.length;
      entry.totalQuantity = validItems.reduce((sum, i) => sum + i.quantity, 0);
      entry.totalAmount = validItems.reduce((sum, i) => sum + i.lineTotal, 0);
    }

    await entry.save();

    return NextResponse.json(entry);
  } catch (error) {
    console.error("PATCH /api/entries/[id] error:", error);
    return NextResponse.json({ error: "Failed to update meal entry." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const owner = await getOrCreateDefaultOwner(request);
    const { id } = await params;

    const deleted = await MealEntryModel.findOneAndDelete({ _id: id, ownerId: owner.id });
    if (!deleted) {
      return NextResponse.json({ error: "Meal entry not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Meal entry deleted successfully." });
  } catch (error) {
    console.error("DELETE /api/entries/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete meal entry." }, { status: 500 });
  }
}
