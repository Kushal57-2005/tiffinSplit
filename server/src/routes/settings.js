import express from 'express';
import prisma from '../db.js';
import { authenticateUser } from '../middleware/auth.js';
import { verifyWorkspaceMember } from '../middleware/workspace.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

router.use('/workspaces', authenticateUser);

// Get workspace settings (including workspace name)
router.get('/workspaces/:workspaceId/settings', verifyWorkspaceMember, async (req, res) => {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.workspaceId },
      select: { id: true, name: true }
    });

    let setting = await prisma.workspaceSetting.findUnique({
      where: { workspaceId: req.workspaceId }
    });

    if (!setting) {
      setting = await prisma.workspaceSetting.create({
        data: {
          workspaceId: req.workspaceId,
          morningDefaultRate: 40,
          nightDefaultRate: 40,
          currency: 'INR',
          currencySymbol: '₹'
        }
      });
    }

    return res.json({
      ...setting,
      workspaceName: workspace ? workspace.name : 'TiffinSplit Workspace'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch workspace settings' });
  }
});

// Update workspace settings & workspace name
router.put('/workspaces/:workspaceId/settings', verifyWorkspaceMember, async (req, res) => {
  try {
    const { workspaceName, morningDefaultRate, nightDefaultRate, currency, currencySymbol, upiId, payeeName, invoiceFooter } = req.body;

    const mRate = parseFloat(morningDefaultRate);
    const nRate = parseFloat(nightDefaultRate);

    // Update Workspace Name if provided
    if (workspaceName && workspaceName.trim()) {
      await prisma.workspace.update({
        where: { id: req.workspaceId },
        data: { name: workspaceName.trim() }
      });
    }

    const setting = await prisma.workspaceSetting.upsert({
      where: { workspaceId: req.workspaceId },
      update: {
        morningDefaultRate: !isNaN(mRate) ? mRate : 40,
        nightDefaultRate: !isNaN(nRate) ? nRate : 40,
        currency: currency ? currency.trim() : 'INR',
        currencySymbol: currencySymbol ? currencySymbol.trim() : '₹',
        upiId: upiId ? upiId.trim() : null,
        payeeName: payeeName ? payeeName.trim() : null,
        invoiceFooter: invoiceFooter ? invoiceFooter.trim() : null
      },
      create: {
        workspaceId: req.workspaceId,
        morningDefaultRate: !isNaN(mRate) ? mRate : 40,
        nightDefaultRate: !isNaN(nRate) ? nRate : 40,
        currency: currency ? currency.trim() : 'INR',
        currencySymbol: currencySymbol ? currencySymbol.trim() : '₹',
        upiId: upiId ? upiId.trim() : null,
        payeeName: payeeName ? payeeName.trim() : null,
        invoiceFooter: invoiceFooter ? invoiceFooter.trim() : null
      }
    });

    await logActivity(prisma, {
      workspaceId: req.workspaceId,
      userId: req.user.id,
      action: 'SETTINGS_UPDATED',
      entityType: 'WorkspaceSetting',
      entityId: setting.id,
      message: `${req.user.name} updated household settings and workspace name`
    });

    return res.json({
      ...setting,
      workspaceName: workspaceName ? workspaceName.trim() : 'TiffinSplit Workspace'
    });
  } catch (err) {
    console.error('Update settings error:', err);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
