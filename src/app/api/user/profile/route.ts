import { NextResponse } from "next/server";
import { connectToDatabase, getMongoDb } from "@/lib/db";

export async function GET() {
  try {
    await connectToDatabase();
    const db = await getMongoDb();

    const user = await db.collection("user").findOne({ email: "kushalwaykole57@gmail.com" }) ||
                 await db.collection("user").findOne({});

    return NextResponse.json({
      id: user?._id?.toString() || "",
      name: user?.name || "Kushal Waykole",
      email: user?.email || "kushalwaykole57@gmail.com",
      phone: user?.phone || "",
      upiId: user?.upiId || "",
    });
  } catch (error) {
    console.error("GET /api/user/profile error:", error);
    return NextResponse.json({ error: "Failed to fetch user profile." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();
    const db = await getMongoDb();
    const body = await request.json();

    const { name, email, phone, upiId } = body;
    const targetEmail = email?.trim() || "kushalwaykole57@gmail.com";

    const updateFields: any = {
      updatedAt: new Date(),
    };
    if (name) updateFields.name = name.trim();
    if (targetEmail) updateFields.email = targetEmail;
    if (phone !== undefined) updateFields.phone = phone.trim();
    if (upiId !== undefined) updateFields.upiId = upiId.trim();

    await db.collection("user").updateOne(
      { email: targetEmail },
      { $set: updateFields },
      { upsert: true }
    );

    // Also update users collection for compatibility
    try {
      await db.collection("users").updateOne(
        { email: targetEmail },
        { $set: updateFields },
        { upsert: false }
      );
    } catch (e) {
      // Ignore
    }

    const updatedUser = await db.collection("user").findOne({ email: targetEmail });

    return NextResponse.json({
      message: "Settings updated successfully.",
      user: {
        id: updatedUser?._id?.toString(),
        name: updatedUser?.name,
        email: updatedUser?.email,
        phone: updatedUser?.phone || "",
        upiId: updatedUser?.upiId || "",
      },
    });
  } catch (error) {
    console.error("PUT /api/user/profile error:", error);
    return NextResponse.json({ error: "Failed to update settings." }, { status: 500 });
  }
}
