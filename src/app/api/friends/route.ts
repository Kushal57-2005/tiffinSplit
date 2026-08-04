import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getOrCreateDefaultOwner } from "@/lib/get-owner";
import { FriendModel } from "@/models";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    const owner = await getOrCreateDefaultOwner();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    const filter: any = { ownerId: owner.id };
    if (activeOnly) filter.isActive = true;

    const friends = await FriendModel.find(filter).sort({ fullName: 1 });

    const formatted = friends.map((f) => ({
      id: f._id.toString(),
      ownerId: f.ownerId,
      fullName: f.fullName,
      shortCode: f.shortCode,
      phone: f.phone,
      email: f.email,
      upiId: f.upiId,
      notes: f.notes,
      isActive: f.isActive,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /api/friends error:", error);
    return NextResponse.json({ error: "Failed to fetch friends." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const owner = await getOrCreateDefaultOwner();
    const body = await request.json();

    const { fullName, shortCode, phone, email, upiId, notes } = body;

    if (!fullName || !shortCode) {
      return NextResponse.json(
        { error: "fullName and shortCode are required." },
        { status: 400 }
      );
    }

    const cleanShortCode = shortCode.trim().toUpperCase();

    // Check duplicate
    const existing = await FriendModel.findOne({
      ownerId: owner.id,
      shortCode: cleanShortCode,
    });

    if (existing) {
      return NextResponse.json(
        { error: `Short code '${cleanShortCode}' is already taken in your room.` },
        { status: 400 }
      );
    }

    const friend = await FriendModel.create({
      ownerId: owner.id,
      fullName: fullName.trim(),
      shortCode: cleanShortCode,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      upiId: upiId?.trim() || null,
      notes: notes?.trim() || null,
      isActive: true,
    });

    return NextResponse.json({
      id: friend._id.toString(),
      ownerId: friend.ownerId,
      fullName: friend.fullName,
      shortCode: friend.shortCode,
      phone: friend.phone,
      email: friend.email,
      upiId: friend.upiId,
      notes: friend.notes,
      isActive: friend.isActive,
      createdAt: friend.createdAt,
      updatedAt: friend.updatedAt,
    });
  } catch (error: any) {
    console.error("POST /api/friends error:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Short code is already registered in your room." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to create friend." }, { status: 500 });
  }
}
