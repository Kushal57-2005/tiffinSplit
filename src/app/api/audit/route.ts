import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getOrCreateDefaultOwner } from "@/lib/get-owner";
import { AuditTaskModel } from "@/models";

const INITIAL_AUDIT_TASKS = [
  { title: "Finalize PRD and scope freeze", category: "Planning", status: "COMPLETED", priority: "HIGH" },
  { title: "Set up Better Auth and catch-all auth route", category: "Auth", status: "COMPLETED", priority: "HIGH" },
  { title: "Create Prisma schema", category: "Database", status: "COMPLETED", priority: "CRITICAL" },
  { title: "Run initial PostgreSQL migration", category: "Database", status: "COMPLETED", priority: "CRITICAL" },
  { title: "Build friend CRUD", category: "Friends", status: "COMPLETED", priority: "HIGH" },
  { title: "Enforce short-code uniqueness per owner", category: "Friends", status: "COMPLETED", priority: "CRITICAL" },
  { title: "Build tick-based meal entry form", category: "Entries", status: "COMPLETED", priority: "HIGH" },
  { title: "Build entry edit/delete flow", category: "Entries", status: "COMPLETED", priority: "MEDIUM" },
  { title: "Build bulk shorthand parser", category: "Entries", status: "COMPLETED", priority: "MEDIUM" },
  { title: "Build monthly grouping logic", category: "Billing", status: "COMPLETED", priority: "HIGH" },
  { title: "Generate invoice + store snapshot items", category: "Billing", status: "COMPLETED", priority: "CRITICAL" },
  { title: "Record payment (amount, method, date, ref)", category: "Payments", status: "COMPLETED", priority: "HIGH" },
  { title: "Recalculate invoice paid/due/status on payment", category: "Payments", status: "COMPLETED", priority: "CRITICAL" },
  { title: "Add invoice email sending", category: "Email", status: "COMPLETED", priority: "MEDIUM" },
  { title: "Add UPI QR payload generation + preview", category: "QR", status: "COMPLETED", priority: "MEDIUM" },
  { title: "Validate duplicate entries and total accuracy", category: "Testing", status: "COMPLETED", priority: "CRITICAL" },
  { title: "Validate invoice uniqueness constraint", category: "Testing", status: "COMPLETED", priority: "CRITICAL" },
  { title: "Deploy app + database", category: "Deployment", status: "COMPLETED", priority: "HIGH" },
  { title: "Add README and architecture notes", category: "Documentation", status: "COMPLETED", priority: "HIGH" },
  { title: "Switch database layer to MongoDB using Mongoose", category: "Database", status: "COMPLETED", priority: "CRITICAL" },
];

export async function GET() {
  try {
    await connectToDatabase();
    const owner = await getOrCreateDefaultOwner();

    let dbTasks = await AuditTaskModel.find({ ownerId: owner.id }).sort({ createdAt: 1 });

    if (dbTasks.length === 0) {
      await AuditTaskModel.insertMany(
        INITIAL_AUDIT_TASKS.map((t) => ({
          ownerId: owner.id,
          title: t.title,
          category: t.category,
          status: t.status as any,
          priority: t.priority as any,
          completedAt: t.status === "COMPLETED" ? new Date() : null,
        }))
      );

      dbTasks = await AuditTaskModel.find({ ownerId: owner.id }).sort({ createdAt: 1 });
    }

    const totalTasks = dbTasks.length;
    const completedTasks = dbTasks.filter((t) => t.status === "COMPLETED").length;
    const inProgressTasks = dbTasks.filter((t) => t.status === "IN_PROGRESS").length;
    const blockedTasks = dbTasks.filter((t) => t.status === "BLOCKED").length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const formattedTasks = dbTasks.map((t) => ({
      id: t._id.toString(),
      ownerId: t.ownerId,
      title: t.title,
      category: t.category,
      status: t.status,
      priority: t.priority,
      notes: t.notes,
      evidenceUrl: t.evidenceUrl,
      completedAt: t.completedAt,
    }));

    return NextResponse.json({
      metrics: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        blockedTasks,
        completionRate,
      },
      tasks: formattedTasks,
    });
  } catch (error) {
    console.error("GET /api/audit error:", error);
    return NextResponse.json({ error: "Failed to fetch audit metrics." }, { status: 500 });
  }
}
