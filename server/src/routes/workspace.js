import express from 'express';
import prisma from '../db.js';
import { authenticateUser } from '../middleware/auth.js';
import { verifyWorkspaceMember } from '../middleware/workspace.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

router.use(authenticateUser);

// List user's workspaces
router.get('/', async (req, res) => {
  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: req.user.id },
      include: {
        workspace: {
          include: {
            setting: true,
            _count: {
              select: { members: true, friends: true }
            }
          }
        }
      }
    });

    return res.json(memberships.map((m) => m.workspace));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
});

// Create new workspace
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    const workspace = await prisma.$transaction(async (tx) => {
      const newWs = await tx.workspace.create({
        data: {
          name: name.trim(),
          members: {
            create: {
              userId: req.user.id
            }
          },
          setting: {
            create: {
              morningDefaultRate: 40,
              nightDefaultRate: 40,
              currency: 'INR',
              currencySymbol: '₹'
            }
          }
        },
        include: { setting: true }
      });

      await logActivity(tx, {
        workspaceId: newWs.id,
        userId: req.user.id,
        action: 'WORKSPACE_CREATED',
        entityType: 'Workspace',
        entityId: newWs.id,
        message: `${req.user.name} created workspace "${newWs.name}"`
      });

      return newWs;
    });

    return res.status(201).json(workspace);
  } catch (err) {
    console.error('Failed to create workspace:', err);
    return res.status(500).json({ error: 'Failed to create workspace' });
  }
});

// Get specific workspace details (requires membership check)
router.get('/:workspaceId', verifyWorkspaceMember, async (req, res) => {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: req.workspaceId },
      include: {
        setting: true,
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: { friends: true, mealEntries: true, invoices: true }
        }
      }
    });

    return res.json(workspace);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch workspace details' });
  }
});

export default router;
