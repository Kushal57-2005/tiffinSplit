import express from 'express';
import prisma from '../db.js';
import { authenticateUser } from '../middleware/auth.js';
import { verifyWorkspaceMember } from '../middleware/workspace.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

router.use('/workspaces', authenticateUser);

// List friends
router.get('/workspaces/:workspaceId/friends', verifyWorkspaceMember, async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const where = { workspaceId: req.workspaceId };
    if (includeInactive !== 'true') {
      where.isActive = true;
    }

    const friends = await prisma.friend.findMany({
      where,
      orderBy: { fullName: 'asc' }
    });

    return res.json(friends);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// Create friend
router.post('/workspaces/:workspaceId/friends', verifyWorkspaceMember, async (req, res) => {
  try {
    const { fullName, shortCode, email, phone, upiId, notes } = req.body;

    if (!fullName || !fullName.trim() || !shortCode || !shortCode.trim()) {
      return res.status(400).json({ error: 'Full name and short code are required' });
    }

    const cleanShortCode = shortCode.trim().toUpperCase();

    const existing = await prisma.friend.findUnique({
      where: {
        workspaceId_shortCode: {
          workspaceId: req.workspaceId,
          shortCode: cleanShortCode
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: `Short code "${cleanShortCode}" is already taken in this workspace` });
    }

    const friend = await prisma.friend.create({
      data: {
        workspaceId: req.workspaceId,
        fullName: fullName.trim(),
        shortCode: cleanShortCode,
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        upiId: upiId ? upiId.trim() : null,
        notes: notes ? notes.trim() : null,
        isActive: true
      }
    });

    await logActivity(prisma, {
      workspaceId: req.workspaceId,
      userId: req.user.id,
      action: 'FRIEND_CREATED',
      entityType: 'Friend',
      entityId: friend.id,
      message: `${req.user.name} added friend "${friend.fullName}" (${friend.shortCode})`
    });

    return res.status(201).json(friend);
  } catch (err) {
    console.error('Create friend error:', err);
    return res.status(500).json({ error: 'Failed to create friend' });
  }
});

// Get single friend detail
router.get('/workspaces/:workspaceId/friends/:friendId', verifyWorkspaceMember, async (req, res) => {
  try {
    const { friendId } = req.params;
    const friend = await prisma.friend.findFirst({
      where: { id: friendId, workspaceId: req.workspaceId },
      include: {
        invoices: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 12
        },
        payments: {
          orderBy: { paidAt: 'desc' },
          take: 10
        }
      }
    });

    if (!friend) {
      return res.status(404).json({ error: 'Friend not found' });
    }

    return res.json(friend);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch friend details' });
  }
});

// Edit friend
router.put('/workspaces/:workspaceId/friends/:friendId', verifyWorkspaceMember, async (req, res) => {
  try {
    const { friendId } = req.params;
    const { fullName, shortCode, email, phone, upiId, notes } = req.body;

    if (!fullName || !fullName.trim() || !shortCode || !shortCode.trim()) {
      return res.status(400).json({ error: 'Full name and short code are required' });
    }

    const cleanShortCode = shortCode.trim().toUpperCase();

    const existing = await prisma.friend.findFirst({
      where: {
        workspaceId: req.workspaceId,
        shortCode: cleanShortCode,
        id: { not: friendId }
      }
    });

    if (existing) {
      return res.status(400).json({ error: `Short code "${cleanShortCode}" is already taken by another friend` });
    }

    const updatedFriend = await prisma.friend.update({
      where: { id: friendId },
      data: {
        fullName: fullName.trim(),
        shortCode: cleanShortCode,
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        upiId: upiId ? upiId.trim() : null,
        notes: notes ? notes.trim() : null
      }
    });

    await logActivity(prisma, {
      workspaceId: req.workspaceId,
      userId: req.user.id,
      action: 'FRIEND_UPDATED',
      entityType: 'Friend',
      entityId: friendId,
      message: `${req.user.name} updated friend details for "${updatedFriend.fullName}"`
    });

    return res.json(updatedFriend);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update friend' });
  }
});

// Toggle friend active/inactive status
router.patch('/workspaces/:workspaceId/friends/:friendId/status', verifyWorkspaceMember, async (req, res) => {
  try {
    const { friendId } = req.params;
    const { isActive } = req.body;

    const updatedFriend = await prisma.friend.update({
      where: { id: friendId },
      data: { isActive: Boolean(isActive) }
    });

    const statusStr = updatedFriend.isActive ? 'activated' : 'deactivated';

    await logActivity(prisma, {
      workspaceId: req.workspaceId,
      userId: req.user.id,
      action: updatedFriend.isActive ? 'FRIEND_ACTIVATED' : 'FRIEND_DEACTIVATED',
      entityType: 'Friend',
      entityId: friendId,
      message: `${req.user.name} ${statusStr} friend "${updatedFriend.fullName}"`
    });

    return res.json(updatedFriend);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update friend status' });
  }
});

export default router;
