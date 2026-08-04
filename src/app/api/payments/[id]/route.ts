import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getOrCreateDefaultOwner } from "@/lib/get-owner";
import { PaymentModel } from "@/models";
import { recalculateInvoice } from "../route";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const owner = await getOrCreateDefaultOwner();
    const { id } = await params;

    const payment = await PaymentModel.findOne({ _id: id, ownerId: owner.id });
    if (!payment) {
      return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
    }

    const invoiceId = payment.invoiceId;

    await PaymentModel.deleteOne({ _id: id });

    let updatedInvoice = null;
    if (invoiceId) {
      updatedInvoice = await recalculateInvoice(invoiceId);
    }

    return NextResponse.json({
      message: "Payment deleted successfully.",
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("DELETE /api/payments/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete payment." }, { status: 500 });
  }
}
