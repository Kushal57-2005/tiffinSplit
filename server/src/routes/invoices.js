import express from 'express';
import prisma from '../db.js';
import { authenticateUser } from '../middleware/auth.js';
import { verifyWorkspaceMember } from '../middleware/workspace.js';
import { logActivity } from '../utils/activityLogger.js';
import { sendInvoiceEmail } from '../utils/mailer.js';

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

router.use('/workspaces', authenticateUser);

// List all generated monthly invoices for active workspace
router.get('/workspaces/:workspaceId/invoices', verifyWorkspaceMember, async (req, res) => {
  try {
    const invoices = await prisma.monthlyInvoice.findMany({
      where: { workspaceId: req.workspaceId },
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
          const paidSum = existing.payments.reduce((acc, p) => (p.paymentStatus === 'SUCCESS' ? acc + p.amount : acc), 0);
          const due = Math.max(0, totalAmount - paidSum);
          let status = 'GENERATED';
          if (paidSum >= totalAmount) status = 'PAID';
          else if (paidSum > 0) status = 'PARTIALLY_PAID';

          await tx.monthlyInvoiceItem.deleteMany({
            where: { invoiceId: existing.id }
          });

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
    return res.status(500).json({ error: 'Failed to generate monthly invoices' });
  }
});

// Batch send monthly bill emails to ALL roommates
router.post('/workspaces/:workspaceId/invoices/send-all-emails', verifyWorkspaceMember, async (req, res) => {
  try {
    const invoices = await prisma.monthlyInvoice.findMany({
      where: { workspaceId: req.workspaceId },
      include: {
        friend: true,
        workspace: { include: { setting: true } }
      }
    });

    if (invoices.length === 0) {
      return res.status(404).json({ error: 'No invoices found to send' });
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const clientUrl = (process.env.CLIENT_URL || 'https://tiffinsplit.vercel.app').trim();
    let sentCount = 0;
    let failedCount = 0;
    const results = [];

    for (const inv of invoices) {
      const recipientEmail = inv.friend.email;
      if (!recipientEmail) {
        failedCount++;
        results.push({ friend: inv.friend.fullName, email: 'None', status: 'FAILED', error: 'No email address specified' });
        continue;
      }

      const setting = inv.workspace?.setting || {};
      const invoiceUrl = `${clientUrl}/invoices/view/${inv.id}`;

      try {
        const sent = await sendInvoiceEmail({
          recipientEmail,
          friendName: inv.friend.fullName,
          monthName: monthNames[inv.month - 1],
          year: inv.year,
          totalAmount: inv.totalAmount,
          amountDue: inv.amountDue,
          invoiceUrl,
          upiId: setting.upiId,
          payeeName: setting.payeeName
        });

        if (sent) {
          sentCount++;
          results.push({ friend: inv.friend.fullName, email: recipientEmail, status: 'SUCCESS' });
        } else {
          failedCount++;
          results.push({ friend: inv.friend.fullName, email: recipientEmail, status: 'FAILED' });
        }
      } catch (err) {
        failedCount++;
        results.push({ friend: inv.friend.fullName, email: recipientEmail, status: 'FAILED', error: err.message });
      }
    }

    await logActivity(prisma, {
      workspaceId: req.workspaceId,
      userId: req.user.id,
      action: 'INVOICES_SENT_ALL',
      entityType: 'MonthlyInvoice',
      entityId: null,
      message: `${req.user.name} sent monthly bill emails to ${sentCount} roommates`
    });

    return res.json({
      message: `Dispatched bill statement emails to ${sentCount} roommates (${failedCount} failed)`,
      sentCount,
      failedCount,
      results
    });
  } catch (err) {
    console.error('Send all invoice emails error:', err);
    return res.status(500).json({ error: 'Failed to send bulk invoice emails' });
  }
});

// Send single invoice statement via email
router.post('/workspaces/:workspaceId/invoices/:invoiceId/send-email', verifyWorkspaceMember, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { email } = req.body;

    const invoice = await prisma.monthlyInvoice.findFirst({
      where: { id: invoiceId, workspaceId: req.workspaceId },
      include: {
        friend: true,
        workspace: { include: { setting: true } }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const recipientEmail = (email && email.trim()) || invoice.friend.email;
    if (!recipientEmail) {
      return res.status(400).json({ error: 'Recipient email address is required' });
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const clientUrl = (process.env.CLIENT_URL || 'https://tiffinsplit.vercel.app').trim();
    const invoiceUrl = `${clientUrl}/invoices/view/${invoice.id}`;
    const setting = invoice.workspace?.setting || {};

    const sent = await sendInvoiceEmail({
      recipientEmail,
      friendName: invoice.friend.fullName,
      monthName: monthNames[invoice.month - 1],
      year: invoice.year,
      totalAmount: invoice.totalAmount,
      amountDue: invoice.amountDue,
      invoiceUrl,
      upiId: setting.upiId,
      payeeName: setting.payeeName
    });

    if (!sent) {
      return res.status(500).json({ error: 'Failed to send email statement. Check SMTP credentials.' });
    }

    await logActivity(prisma, {
      workspaceId: req.workspaceId,
      userId: req.user.id,
      action: 'INVOICE_SENT',
      entityType: 'MonthlyInvoice',
      entityId: invoice.id,
      message: `${req.user.name} sent monthly bill statement to ${invoice.friend.fullName} (${recipientEmail})`
    });

    return res.json({ message: `Statement email sent successfully to ${recipientEmail}` });
  } catch (err) {
    console.error('Send invoice email error:', err);
    return res.status(500).json({ error: 'Failed to send statement email' });
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
