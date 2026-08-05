import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getOrCreateDefaultOwner } from "@/lib/get-owner";
import { FriendModel } from "@/models";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const owner = await getOrCreateDefaultOwner(request);
    const { id } = await params;
    const body = await request.json();

    const friend = await FriendModel.findOne({ _id: id, ownerId: owner.id });
    if (!friend) {
      return NextResponse.json({ error: "Friend not found." }, { status: 404 });
    }

    if (body.shortCode) {
      const cleanShortCode = body.shortCode.trim().toUpperCase();
      if (cleanShortCode !== friend.shortCode) {
        const existing = await FriendModel.findOne({
          ownerId: owner.id,
          shortCode: cleanShortCode,
          _id: { $ne: id },
        });

        if (existing) {
          return NextResponse.json(
            { error: `Short code '${cleanShortCode}' is already taken.` },
            { status: 400 }
          );
        }
        friend.shortCode = cleanShortCode;
      }
    }

    if (body.fullName !== undefined) friend.fullName = body.fullName.trim();
    if (body.phone !== undefined) friend.phone = body.phone?.trim() || undefined;
    if (body.email !== undefined) friend.email = body.email?.trim() || undefined;
    if (body.upiId !== undefined) friend.upiId = body.upiId?.trim() || undefined;
    if (body.notes !== undefined) friend.notes = body.notes?.trim() || undefined;
    if (body.isActive !== undefined) friend.isActive = Boolean(body.isActive);

    await friend.save();

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
  } catch (error) {
    console.error("PATCH /api/friends/[id] error:", error);
    return NextResponse.json({ error: "Failed to update friend." }, { status: 500 });
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

    // Soft delete to protect historical entries
    const friend = await FriendModel.findOneAndUpdate(
      { _id: id, ownerId: owner.id },
      { isActive: false },
      { new: true }
    );

    if (!friend) {
      return NextResponse.json({ error: "Friend not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Friend deactivated successfully.", friend });
  } catch (error) {
    console.error("DELETE /api/friends/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete friend." }, { status: 500 });
  }
}
