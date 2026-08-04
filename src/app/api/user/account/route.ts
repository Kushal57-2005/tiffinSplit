import { NextResponse } from "next/server";
import { connectToDatabase, getMongoDb } from "@/lib/db";
import { getOrCreateDefaultOwner } from "@/lib/get-owner";
import { 
  UserModel, 
  FriendModel, 
  MealEntryModel, 
  MonthlyInvoiceModel, 
  PaymentModel,
  AuditTaskModel
} from "@/models";

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();
    const db = await getMongoDb();
    const owner = await getOrCreateDefaultOwner();

    const ownerId = owner.id;

    // 1. Delete all Friends / Roommates
    const friendResult = await FriendModel.deleteMany({ ownerId });

    // 2. Delete all Meal Entries
    const entryResult = await MealEntryModel.deleteMany({ ownerId });

    // 3. Delete all Monthly Invoices
    const invoiceResult = await MonthlyInvoiceModel.deleteMany({ ownerId });

    // 4. Delete all Payments
    const paymentResult = await PaymentModel.deleteMany({ ownerId });

    // 5. Delete Audit Tasks
    const auditResult = await AuditTaskModel.deleteMany({ ownerId });

    // 6. Delete User Profile
    await UserModel.deleteOne({ _id: ownerId as any });

    // 7. Delete Better Auth Session & Account collections
    try {
      await db.collection("session").deleteMany({ userId: ownerId } as any);
      await db.collection("account").deleteMany({ userId: ownerId } as any);
      await db.collection("user").deleteMany({ _id: ownerId } as any);
    } catch (e) {
      console.warn("Notice: Optional auth cleanup completed with warnings:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Account and all associated roommate records deleted successfully.",
      stats: {
        deletedFriends: friendResult.deletedCount,
        deletedMealEntries: entryResult.deletedCount,
        deletedInvoices: invoiceResult.deletedCount,
        deletedPayments: paymentResult.deletedCount,
        deletedAuditTasks: auditResult.deletedCount,
      },
    });
  } catch (error) {
    console.error("DELETE /api/user/account error:", error);
    return NextResponse.json(
      { error: "Failed to delete user account and associated records." },
      { status: 500 }
    );
  }
}
