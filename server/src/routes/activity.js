import express from 'express';
import prisma from '../db.js';
import { authenticateUser } from '../middleware/auth.js';
import { verifyWorkspaceMember } from '../middleware/workspace.js';

const router = express.Router();

router.use('/workspaces', authenticateUser);

// Get activity logs
router.get('/workspaces/:workspaceId/activity', verifyWorkspaceMember, async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const logs = await prisma.activityLog.findMany({
      where: { workspaceId: req.workspaceId },
      include: {
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit) || 50
    });

    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch activity log' });
  }
});

export default router;
