import express from 'express';
import prisma from '../db.js';
import { authenticateUser } from '../middleware/auth.js';
import { verifyWorkspaceMember, verifyWorkspaceHead } from '../middleware/workspace.js';
import { logActivity } from '../utils/activityLogger.js';
import { sendPaymentReportedEmail, sendPaymentRejectedEmail, emailLogs } from '../utils/mailer.js';

const router = express.Router();

// Public quick action link endpoint for Head (called directly from Gmail email buttons without requiring redirect to app form)
router.get('/payments/quick-action', async (req, res) => {
  try {
    const { action, paymentId } = req.query;
    const clientUrl = (process.env.CLIENT_URL || 'https://tiffinsplit.vercel.app').trim();

    if (!paymentId) {
      return res.status(400).send('Invalid payment request: missing paymentId');
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        friend: { select: { fullName: true, shortCode: true, email: true } },
        invoice: true,
        workspace: { include: { setting: true } }
      }
    });

    if (!payment) {
      return res.status(404).send(`
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 60px auto; padding: 30px; text-align: center; border: 1px solid #E5E0DA; border-radius: 16px; background-color: #FAFAF8;">
          <h2 style="color: #C62828;">Payment Record Not Found</h2>
          <p style="color: #6F6A68;">The requested payment record could not be found.</p>
        </div>
      `);
    }

    if (payment.paymentStatus !== 'PENDING') {
      return res.send(`
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 60px auto; padding: 30px; text-align: center; border: 1px solid #E5E0DA; border-radius: 16px; background-color: #FAFAF8;">
          <h2 style="color: #4A4A4A;">Payment Already Processed</h2>
          <p style="color: #6F6A68;">This payment is already in status: <strong>${payment.paymentStatus}</strong>.</p>
          <a href="${clientUrl}/payments" style="display: inline-block; margin-top: 1.25rem; background-color: #946D6D; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">Go to App Payments</a>
        </div>
      `);
    }

    if (action === 'verify') {
      // 1. Mark payment as SUCCESS
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            paymentStatus: 'SUCCESS',
            verifiedAt: new Date()
          }
        });

        if (payment.invoiceId) {
          const allSuccessPayments = await tx.payment.findMany({
            where: { invoiceId: payment.invoiceId, paymentStatus: 'SUCCESS' }
          });
          const totalPaid = allSuccessPayments.reduce((acc, p) => acc + p.amount, 0);

          const inv = await tx.monthlyInvoice.findUnique({
            where: { id: payment.invoiceId }
          });

          if (inv) {
            const due = Math.max(0, inv.totalAmount - totalPaid);
            let status = 'GENERATED';
            if (totalPaid >= inv.totalAmount) status = 'PAID';
            else if (totalPaid > 0) status = 'PARTIALLY_PAID';

            await tx.monthlyInvoice.update({
              where: { id: payment.invoiceId },
              data: { amountPaid: totalPaid, amountDue: due, status }
            });
          }
        }

        await logActivity(tx, {
          workspaceId: payment.workspaceId,
          userId: payment.recordedById,
          action: 'PAYMENT_VERIFIED',
          entityType: 'Payment',
          entityId: payment.id,
          message: `Verified payment of ₹${payment.amount.toLocaleString()} for ${payment.friend.fullName} via direct email button`
        });
      });

      return res.send(`
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 60px auto; padding: 32px 24px; text-align: center; border: 1px solid #C8E6C9; border-radius: 16px; background-color: #F1F8E9;">
          <div style="font-size: 3.5rem; color: #2E7D32; margin-bottom: 0.5rem;">✔</div>
          <h2 style="color: #1B5E20; margin-bottom: 0.5rem;">Payment Verified & Marked Paid!</h2>
          <p style="color: #33691E; font-size: 1.05rem; line-height: 1.5; margin-bottom: 1.5rem;">
            The payment of <strong>₹${payment.amount.toLocaleString()}</strong> reported by <strong>${payment.friend.fullName}</strong> has been successfully verified. Invoice & household totals are updated.
          </p>
          <a href="${clientUrl}/payments" style="display: inline-block; background-color: #2E7D32; color: #ffffff; padding: 12px 26px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Return to App Dashboard
          </a>
        </div>
      `);
    } else if (action === 'reject') {
      const rejectionReason = 'Payment not received in bank/UPI account';

      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          paymentStatus: 'REJECTED',
          rejectionReason,
          updatedAt: new Date()
        }
      });

      await logActivity(prisma, {
        workspaceId: payment.workspaceId,
        userId: payment.recordedById,
        action: 'PAYMENT_REJECTED',
        entityType: 'Payment',
        entityId: payment.id,
        message: `Rejected payment report of ₹${payment.amount.toLocaleString()} for ${payment.friend.fullName} via direct email button`
      });

      const invRef = payment.invoice
        ? `INV-${payment.invoice.year}-${String(payment.invoice.month).padStart(2, '0')}-${payment.friend.shortCode}`
        : 'N/A';

      if (payment.friend.email) {
        sendPaymentRejectedEmail({
          roommateEmail: payment.friend.email,
          roommateName: payment.friend.fullName,
          amount: payment.amount,
          invoiceNumber: invRef,
          amountDue: payment.invoice ? payment.invoice.amountDue : payment.amount,
          upiId: payment.workspace?.setting?.upiId || '8237172878@ibl',
          payeeName: payment.workspace?.setting?.payeeName || 'Kushal Waykole',
          payUrl: `${clientUrl}/invoices/${payment.invoiceId || ''}`
        }).catch((err) => console.error('Failed sending rejection email from quick action:', err));
      }

      return res.send(`
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 60px auto; padding: 32px 24px; text-align: center; border: 1px solid #FFCDD2; border-radius: 16px; background-color: #FFEBEE;">
          <div style="font-size: 3.5rem; color: #C62828; margin-bottom: 0.5rem;">✖</div>
          <h2 style="color: #B71C1C; margin-bottom: 0.5rem;">Payment Marked as Not Received</h2>
          <p style="color: #C62828; font-size: 1.05rem; line-height: 1.5; margin-bottom: 1.5rem;">
            The payment report of <strong>₹${payment.amount.toLocaleString()}</strong> for <strong>${payment.friend.fullName}</strong> has been rejected. Rejection notice email sent to roommate.
          </p>
          <a href="${clientUrl}/payments" style="display: inline-block; background-color: #C62828; color: #ffffff; padding: 12px 26px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Return to App Dashboard
          </a>
        </div>
      `);
    } else {
      return res.status(400).send('Invalid action type');
    }
  } catch (err) {
    console.error('Quick action payment error:', err);
    return res.status(500).send('Server error processing payment action');
  }
});

router.use('/workspaces', authenticateUser);

// List payments
router.get('/workspaces/:workspaceId/payments', verifyWorkspaceMember, async (req, res) => {
  try {
    const { friendId, invoiceId, status } = req.query;

    const where = { workspaceId: req.workspaceId };
    if (friendId) where.friendId = friendId;
    if (invoiceId) where.invoiceId = invoiceId;
    if (status) where.paymentStatus = status;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        friend: { select: { id: true, fullName: true, shortCode: true, email: true } },
        invoice: { select: { id: true, month: true, year: true, totalAmount: true, amountDue: true, status: true } },
        recordedBy: { select: { id: true, name: true, email: true } },
        verifiedBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(payments);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// GET Pending payment verification requests (Head view)
router.get('/workspaces/:workspaceId/payments/pending', verifyWorkspaceMember, async (req, res) => {
  try {
    const pendingPayments = await prisma.payment.findMany({
      where: {
        workspaceId: req.workspaceId,
        paymentStatus: 'PENDING'
      },
      include: {
        friend: { select: { id: true, fullName: true, shortCode: true, email: true } },
        invoice: { select: { id: true, month: true, year: true, totalAmount: true, amountDue: true, amountPaid: true, status: true } },
        recordedBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(pendingPayments);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch pending payment verifications' });
  }
});

// ROOMMATE: Report Payment ("I Paid") -> Status set to PENDING (NO invoice due/paid changes)
router.post('/workspaces/:workspaceId/payments/report', verifyWorkspaceMember, async (req, res) => {
  try {
    const { friendId, invoiceId, amount, paymentMethod, transactionRef, notes, paidAt } = req.body;

    const parsedAmount = parseFloat(amount);
    if (!friendId || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Friend ID and a positive payment amount are required' });
    }

    // If invoiceId provided, validate invoice exists and check outstanding due
    let targetInvoice = null;
    if (invoiceId) {
      targetInvoice = await prisma.monthlyInvoice.findFirst({
        where: { id: invoiceId, workspaceId: req.workspaceId },
        include: { friend: true }
      });

      if (!targetInvoice) {
        return res.status(404).json({ error: 'Invoice not found in this workspace' });
      }

      if (parsedAmount > targetInvoice.amountDue) {
        return res.status(400).json({
          error: `Reported payment of ₹${parsedAmount} exceeds current invoice amount due of ₹${targetInvoice.amountDue}`
        });
      }

      // PREVENT DUPLICATE REPORTS: Check for an existing PENDING payment report for the same invoice & amount
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
    }

    const method = (paymentMethod || 'UPI').toUpperCase();
    const reportedTime = new Date();

    // Create PENDING Payment Record
    const newPayment = await prisma.payment.create({
      data: {
        workspaceId: req.workspaceId,
        friendId,
        invoiceId: invoiceId || null,
        amount: parsedAmount,
        paymentMethod: method,
        paymentStatus: 'PENDING',
        transactionRef: transactionRef ? transactionRef.trim() : null,
        notes: notes ? notes.trim() : null,
        paidAt: paidAt ? new Date(paidAt) : reportedTime,
        reportedAt: reportedTime,
        recordedById: req.user.id
      },
      include: {
        friend: { select: { fullName: true, shortCode: true, email: true } },
        invoice: { select: { id: true, month: true, year: true, totalAmount: true, amountDue: true } }
      }
    });

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const invRef = targetInvoice
      ? `INV-${targetInvoice.year}-${String(targetInvoice.month).padStart(2, '0')}-${newPayment.friend.shortCode}`
      : 'N/A';

    // Log PAYMENT_REPORTED Activity
    await logActivity(prisma, {
      workspaceId: req.workspaceId,
      userId: req.user.id,
      action: 'PAYMENT_REPORTED',
      entityType: 'Payment',
      entityId: newPayment.id,
      message: `${newPayment.friend.fullName} reported a payment of ₹${parsedAmount.toLocaleString()} for invoice ${invRef}`
    });

    // Find Head user for workspace email dispatch
    const headMember = await prisma.workspaceMember.findFirst({
      where: { workspaceId: req.workspaceId, role: 'HEAD' },
      include: { user: true }
    });

    const headEmailAddress = (headMember && headMember.user && headMember.user.email)
      ? headMember.user.email
      : (req.user && req.user.email)
      ? req.user.email
      : null;

    const headNameString = (headMember && headMember.user && headMember.user.name)
      ? headMember.user.name
      : 'Household Head';

    const apiUrl = process.env.API_URL || 'http://localhost:5000/api';
    const verifyUrl = `${apiUrl}/payments/quick-action?action=verify&paymentId=${newPayment.id}`;
    const rejectUrl = `${apiUrl}/payments/quick-action?action=reject&paymentId=${newPayment.id}`;

    // Send email to Household Head with TWO DIRECT BUTTONS (Verify & Reject)
    if (headEmailAddress) {
      await sendPaymentReportedEmail({
        headEmail: headEmailAddress,
        headName: headNameString,
        roommateName: newPayment.friend.fullName,
        amount: parsedAmount,
        invoiceNumber: invRef,
        paymentMethod: method,
        transactionRef: newPayment.transactionRef,
        reportedAt: reportedTime,
        verifyUrl,
        rejectUrl
      }).catch((err) => console.error('Failed sending reported email to Head:', err));
    }

    return res.status(201).json(newPayment);
  } catch (err) {
    console.error('Report payment error:', err);
    return res.status(500).json({ error: 'Failed to report payment' });
  }
});

// HEAD: Verify & Mark Paid -> Status set to SUCCESS, update invoice.amountPaid & amountDue
router.post('/workspaces/:workspaceId/payments/:paymentId/verify', verifyWorkspaceHead, async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, workspaceId: req.workspaceId },
      include: {
        friend: { select: { fullName: true, shortCode: true, email: true } },
        invoice: true
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    if (payment.paymentStatus !== 'PENDING') {
      return res.status(400).json({ error: `Payment is already in '${payment.paymentStatus}' status` });
    }

    const updatedPayment = await prisma.$transaction(async (tx) => {
      // 1. Mark payment as SUCCESS
      const verified = await tx.payment.update({
        where: { id: paymentId },
        data: {
          paymentStatus: 'SUCCESS',
          verifiedAt: new Date(),
          verifiedById: req.user.id
        },
        include: {
          friend: { select: { fullName: true, shortCode: true } },
          invoice: true
        }
      });

      // 2. Update Invoice totals if invoiceId linked
      if (verified.invoiceId) {
        const allSuccessPayments = await tx.payment.findMany({
          where: { invoiceId: verified.invoiceId, paymentStatus: 'SUCCESS' }
        });

        const totalPaid = allSuccessPayments.reduce((acc, p) => acc + p.amount, 0);

        const inv = await tx.monthlyInvoice.findUnique({
          where: { id: verified.invoiceId }
        });

        if (inv) {
          const due = Math.max(0, inv.totalAmount - totalPaid);
          let status = 'GENERATED';
          if (totalPaid >= inv.totalAmount) status = 'PAID';
          else if (totalPaid > 0) status = 'PARTIALLY_PAID';

          await tx.monthlyInvoice.update({
            where: { id: verified.invoiceId },
            data: { amountPaid: totalPaid, amountDue: due, status }
          });
        }
      }

      // 3. Log PAYMENT_VERIFIED Activity
      await logActivity(tx, {
        workspaceId: req.workspaceId,
        userId: req.user.id,
        action: 'PAYMENT_VERIFIED',
        entityType: 'Payment',
        entityId: verified.id,
        message: `${req.user.name} verified a payment of ₹${verified.amount.toLocaleString()} for ${verified.friend.fullName}`
      });

      return verified;
    });

    return res.json(updatedPayment);
  } catch (err) {
    console.error('Verify payment error:', err);
    return res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// HEAD: Payment Not Received -> Status set to REJECTED (NO invoice due/paid changes, sends email to roommate)
router.post('/workspaces/:workspaceId/payments/:paymentId/reject', verifyWorkspaceHead, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, workspaceId: req.workspaceId },
      include: {
        friend: true,
        invoice: true
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    if (payment.paymentStatus !== 'PENDING') {
      return res.status(400).json({ error: `Payment is already in '${payment.paymentStatus}' status` });
    }

    const rejectionReason = reason || 'Payment not received in bank/UPI account';

    const rejectedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        paymentStatus: 'REJECTED',
        rejectionReason,
        verifiedById: req.user.id,
        updatedAt: new Date()
      },
      include: {
        friend: true,
        invoice: true
      }
    });

    // Log PAYMENT_REJECTED Activity
    await logActivity(prisma, {
      workspaceId: req.workspaceId,
      userId: req.user.id,
      action: 'PAYMENT_REJECTED',
      entityType: 'Payment',
      entityId: rejectedPayment.id,
      message: `${req.user.name} rejected a payment report of ₹${rejectedPayment.amount.toLocaleString()} for ${rejectedPayment.friend.fullName}`
    });

    // Fetch workspace settings for UPI details
    const settings = await prisma.workspaceSetting.findUnique({
      where: { workspaceId: req.workspaceId }
    });

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const invRef = payment.invoice
      ? `INV-${payment.invoice.year}-${String(payment.invoice.month).padStart(2, '0')}-${payment.friend.shortCode}`
      : 'N/A';

    const clientUrl = (process.env.CLIENT_URL || 'https://tiffinsplit.vercel.app').trim();

    // Send Rejection Email to Roommate
    if (payment.friend.email) {
      sendPaymentRejectedEmail({
        roommateEmail: payment.friend.email,
        roommateName: payment.friend.fullName,
        amount: payment.amount,
        invoiceNumber: invRef,
        amountDue: payment.invoice ? payment.invoice.amountDue : payment.amount,
        upiId: settings ? settings.upiId : '8237172878@ibl',
        payeeName: settings ? settings.payeeName : 'Kushal Waykole',
        payUrl: `${clientUrl}/invoices/${payment.invoiceId || ''}`
      }).catch((err) => console.error('Failed sending rejection email to roommate:', err));
    }

    return res.json(rejectedPayment);
  } catch (err) {
    console.error('Reject payment error:', err);
    return res.status(500).json({ error: 'Failed to reject payment' });
  }
});

// Direct Record Payment (Head bypass for manual instant cash entry)
router.post('/workspaces/:workspaceId/payments', verifyWorkspaceMember, async (req, res) => {
  try {
    const { friendId, invoiceId, amount, paymentMethod, transactionRef, notes, paidAt } = req.body;

    const parsedAmount = parseFloat(amount);
    if (!friendId || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Friend ID and a positive payment amount are required' });
    }

    const method = (paymentMethod || 'UPI').toUpperCase();

    const payment = await prisma.$transaction(async (tx) => {
      let targetInvoiceId = invoiceId;
      if (!targetInvoiceId) {
        const openInvoice = await tx.monthlyInvoice.findFirst({
          where: {
            workspaceId: req.workspaceId,
            friendId,
            status: { in: ['GENERATED', 'PARTIALLY_PAID', 'SENT'] }
          },
          orderBy: { createdAt: 'desc' }
        });
        if (openInvoice) targetInvoiceId = openInvoice.id;
      }

      const newPayment = await tx.payment.create({
        data: {
          workspaceId: req.workspaceId,
          friendId,
          invoiceId: targetInvoiceId || null,
          amount: parsedAmount,
          paymentMethod: method,
          paymentStatus: 'SUCCESS',
          transactionRef: transactionRef ? transactionRef.trim() : null,
          notes: notes ? notes.trim() : null,
          paidAt: paidAt ? new Date(paidAt) : new Date(),
          verifiedAt: new Date(),
          recordedById: req.user.id,
          verifiedById: req.user.id
        },
        include: {
          friend: { select: { fullName: true, shortCode: true } },
          invoice: { select: { month: true, year: true, totalAmount: true } }
        }
      });

      if (targetInvoiceId) {
        const allPayments = await tx.payment.findMany({
          where: { invoiceId: targetInvoiceId, paymentStatus: 'SUCCESS' }
        });

        const totalPaid = allPayments.reduce((acc, p) => acc + p.amount, 0);

        const inv = await tx.monthlyInvoice.findUnique({
          where: { id: targetInvoiceId }
        });

        if (inv) {
          const due = Math.max(0, inv.totalAmount - totalPaid);
          let status = 'GENERATED';
          if (totalPaid >= inv.totalAmount) status = 'PAID';
          else if (totalPaid > 0) status = 'PARTIALLY_PAID';

          await tx.monthlyInvoice.update({
            where: { id: targetInvoiceId },
            data: { amountPaid: totalPaid, amountDue: due, status }
          });
        }
      }

      await logActivity(tx, {
        workspaceId: req.workspaceId,
        userId: req.user.id,
        action: 'PAYMENT_RECORDED',
        entityType: 'Payment',
        entityId: newPayment.id,
        message: `${req.user.name} recorded ₹${parsedAmount.toLocaleString()} ${method} payment for ${newPayment.friend.shortCode}`
      });

      return newPayment;
    });

    return res.status(201).json(payment);
  } catch (err) {
    console.error('Record payment error:', err);
    return res.status(500).json({ error: 'Failed to record payment' });
  }
});

export default router;
