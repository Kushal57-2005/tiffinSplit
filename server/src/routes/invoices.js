import express from 'express';
import prisma from '../db.js';
import { authenticateUser } from '../middleware/auth.js';
import { verifyWorkspaceMember } from '../middleware/workspace.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

// Public unauthenticated route to view monthly bill statement (accessed directly from Gmail email links)
router.get('/invoices/public/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await prisma.monthlyInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        friend: { select: { id: true, fullName: true, shortCode: true, email: true, phone: true } },
        generatedBy: { select: { id: true, name: true, email: true } },
        items: { orderBy: [{ entryDate: 'asc' }, { mealType: 'asc' }] },
        payments: {
          orderBy: { paidAt: 'desc' },
          include: { recordedBy: { select: { id: true, name: true } } }
        },
        workspace: { include: { setting: true } }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice statement not found' });
    }

    return res.json(invoice);
  } catch (err) {
    console.error('Fetch public invoice error:', err);
    return res.status(500).json({ error: 'Failed to fetch invoice statement' });
  }
});

// Public unauthenticated route to report payment ("I Paid") for an invoice from WhatsApp link
router.post('/invoices/public/:invoiceId/report', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { amount, paymentMethod, transactionRef, notes, paidAt } = req.body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'A positive payment amount is required' });
    }

    const targetInvoice = await prisma.monthlyInvoice.findUnique({
      where: { id: invoiceId },
      include: { friend: true }
    });

    if (!targetInvoice) {
      return res.status(404).json({ error: 'Invoice statement not found' });
    }

    if (parsedAmount > targetInvoice.amountDue) {
      return res.status(400).json({
        error: `Reported payment of ₹${parsedAmount} exceeds current invoice amount due of ₹${targetInvoice.amountDue}`
      });
    }

    // Check for existing pending payment report
    const existingPending = await prisma.payment.findFirst({
      where: {
        invoiceId,
        amount: parsedAmount,
        paymentStatus: 'PENDING'
      }
    });

    if (existingPending) {
      return res.status(400).json({
        error: 'Payment verification already pending. You already reported this payment. Please wait for the Household Head to verify it.'
      });
    }

    const method = (paymentMethod || 'UPI').toUpperCase();
    const reportedTime = new Date();

    const newPayment = await prisma.payment.create({
      data: {
        workspaceId: targetInvoice.workspaceId,
        friendId: targetInvoice.friendId,
        invoiceId: targetInvoice.id,
        amount: parsedAmount,
        paymentMethod: method,
        paymentStatus: 'PENDING',
        transactionRef: transactionRef ? transactionRef.trim() : null,
        notes: notes ? notes.trim() : null,
        paidAt: paidAt ? new Date(paidAt) : reportedTime,
        reportedAt: reportedTime,
        recordedById: targetInvoice.generatedById
      },
      include: {
        friend: { select: { fullName: true, shortCode: true, email: true } },
        invoice: { select: { id: true, month: true, year: true, totalAmount: true, amountDue: true } }
      }
    });

    const invRef = `INV-${targetInvoice.year}-${String(targetInvoice.month).padStart(2, '0')}-${targetInvoice.friend.shortCode}`;

    await logActivity(prisma, {
      workspaceId: targetInvoice.workspaceId,
      userId: targetInvoice.generatedById,
      action: 'PAYMENT_REPORTED',
      entityType: 'Payment',
      entityId: newPayment.id,
      message: `${newPayment.friend.fullName} reported a payment of ₹${parsedAmount.toLocaleString()} for invoice ${invRef}`
    });

    return res.status(201).json(newPayment);
  } catch (err) {
    console.error('Public report payment error:', err);
    return res.status(500).json({ error: 'Failed to report payment' });
  }
});

router.use('/workspaces', authenticateUser);

// List all generated monthly invoices for active workspace
router.get('/workspaces/:workspaceId/invoices', verifyWorkspaceMember, async (req, res) => {
  try {
    const { month, year } = req.query;
    const where = { workspaceId: req.workspaceId };
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);

    const invoices = await prisma.monthlyInvoice.findMany({
      where,
      include: {
        friend: { select: { id: true, fullName: true, shortCode: true, email: true, phone: true } },
        generatedBy: { select: { id: true, name: true, email: true } },
        payments: {
          select: { id: true, amount: true, paymentMethod: true, paymentStatus: true, paidAt: true }
        }
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }]
    });

    return res.json(invoices);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Preview invoice generation for a specific month & year
router.get('/workspaces/:workspaceId/invoices/preview', verifyWorkspaceMember, async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    const m = parseInt(month);
    const y = parseInt(year);

    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

    // Get all meal items for workspace in date range
    const mealItems = await prisma.mealEntryItem.findMany({
      where: {
        mealEntry: {
          workspaceId: req.workspaceId,
          entryDate: { gte: startDate, lte: endDate }
        }
      },
      include: {
        friend: { select: { id: true, fullName: true, shortCode: true, email: true } },
        mealEntry: { select: { entryDate: true, mealType: true } }
      }
    });

    // Group items by friend
    const friendMap = {};
    mealItems.forEach((item) => {
      if (!friendMap[item.friendId]) {
        friendMap[item.friendId] = {
          friend: item.friend,
          totalMeals: 0,
          totalQuantity: 0,
          subtotalAmount: 0,
          totalAmount: 0,
          itemsCount: 0
        };
      }
      friendMap[item.friendId].totalMeals += 1;
      friendMap[item.friendId].totalQuantity += item.quantity;
      friendMap[item.friendId].subtotalAmount += item.lineTotal;
      friendMap[item.friendId].totalAmount += item.lineTotal;
      friendMap[item.friendId].itemsCount += 1;
    });

    // Check existing invoices for this month
    const existingInvoices = await prisma.monthlyInvoice.findMany({
      where: {
        workspaceId: req.workspaceId,
        month: m,
        year: y
      }
    });

    const existingMap = {};
    existingInvoices.forEach((inv) => {
      existingMap[inv.friendId] = inv;
    });

    const previews = Object.values(friendMap).map((data) => ({
      ...data,
      alreadyGenerated: Boolean(existingMap[data.friend.id]),
      existingInvoiceId: existingMap[data.friend.id] ? existingMap[data.friend.id].id : null
    }));

    return res.json({ month: m, year: y, previews });
  } catch (err) {
    console.error('Invoice preview error:', err);
    return res.status(500).json({ error: 'Failed to generate invoice preview' });
  }
});

// Generate monthly invoices (creates immutable MonthlyInvoiceItem snapshots)
router.post('/workspaces/:workspaceId/invoices/generate', verifyWorkspaceMember, async (req, res) => {
  try {
    const { month, year, friendIds } = req.body;
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    const m = parseInt(month);
    const y = parseInt(year);

    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

    const result = await prisma.$transaction(async (tx) => {
      const whereItem = {
        mealEntry: {
          workspaceId: req.workspaceId,
          entryDate: { gte: startDate, lte: endDate }
        }
      };

      if (friendIds && Array.isArray(friendIds) && friendIds.length > 0) {
        whereItem.friendId = { in: friendIds };
      }

      const mealItems = await tx.mealEntryItem.findMany({
        where: whereItem,
        include: {
          mealEntry: { select: { entryDate: true, mealType: true } }
        }
      });

      const grouped = {};
      mealItems.forEach((item) => {
        if (!grouped[item.friendId]) {
          grouped[item.friendId] = [];
        }
        grouped[item.friendId].push(item);
      });

      const generatedInvoices = [];

      for (const [fId, items] of Object.entries(grouped)) {
        const totalMeals = items.length;
        const totalQuantity = items.reduce((acc, i) => acc + i.quantity, 0);
        const subtotalAmount = items.reduce((acc, i) => acc + i.lineTotal, 0);
        const totalAmount = subtotalAmount;

        const existing = await tx.monthlyInvoice.findUnique({
          where: {
            workspaceId_friendId_month_year: {
              workspaceId: req.workspaceId,
              friendId: fId,
              month: m,
              year: y
            }
          },
          include: { payments: true }
        });

        let invoice;

        if (existing) {
          const paidSum = (existing.payments || []).reduce((acc, p) => (p.paymentStatus === 'SUCCESS' ? acc + p.amount : acc), 0);
          const due = Math.max(0, totalAmount - paidSum);
          let status = 'GENERATED';
          if (paidSum >= totalAmount) status = 'PAID';
          else if (paidSum > 0) status = 'PARTIALLY_PAID';

          invoice = await tx.monthlyInvoice.update({
            where: { id: existing.id },
            data: {
              totalMeals,
              totalQuantity,
              subtotalAmount,
              totalAmount,
              amountPaid: paidSum,
              amountDue: due,
              status,
              items: {
                deleteMany: {},
                create: items.map((i) => ({
                  mealEntryItemId: i.id,
                  entryDate: i.mealEntry.entryDate,
                  mealType: i.mealEntry.mealType,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                  lineTotal: i.lineTotal
                }))
              }
            }
          });
        } else {
          invoice = await tx.monthlyInvoice.create({
            data: {
              workspaceId: req.workspaceId,
              friendId: fId,
              month: m,
              year: y,
              totalMeals,
              totalQuantity,
              subtotalAmount,
              totalAmount,
              amountPaid: 0,
              amountDue: totalAmount,
              status: 'GENERATED',
              generatedById: req.user.id,
              items: {
                create: items.map((i) => ({
                  mealEntryItemId: i.id,
                  entryDate: i.mealEntry.entryDate,
                  mealType: i.mealEntry.mealType,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                  lineTotal: i.lineTotal
                }))
              }
            }
          });
        }

        generatedInvoices.push(invoice);
      }

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      await logActivity(tx, {
        workspaceId: req.workspaceId,
        userId: req.user.id,
        action: 'INVOICES_GENERATED',
        entityType: 'MonthlyInvoice',
        entityId: null,
        message: `${req.user.name} generated ${generatedInvoices.length} ${generatedInvoices.length === 1 ? 'invoice' : 'invoices'} for ${monthNames[m - 1]} ${y}`
      });

      return generatedInvoices;
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error('Generate invoices error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate monthly invoices' });
  }
});



// Get single invoice detail for workspace members
router.get('/workspaces/:workspaceId/invoices/:invoiceId', verifyWorkspaceMember, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await prisma.monthlyInvoice.findFirst({
      where: { id: invoiceId, workspaceId: req.workspaceId },
      include: {
        friend: true,
        generatedBy: { select: { id: true, name: true, email: true } },
        items: { orderBy: [{ entryDate: 'asc' }, { mealType: 'asc' }] },
        payments: {
          orderBy: { paidAt: 'desc' },
          include: { recordedBy: { select: { id: true, name: true } } }
        },
        workspace: { include: { setting: true } }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    return res.json(invoice);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch invoice details' });
  }
});

export default router;
