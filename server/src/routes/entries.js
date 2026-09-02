import express from 'express';
import prisma from '../db.js';
import { authenticateUser } from '../middleware/auth.js';
import { verifyWorkspaceMember } from '../middleware/workspace.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

router.use('/workspaces', authenticateUser);

// List meal entries
router.get('/workspaces/:workspaceId/entries', verifyWorkspaceMember, async (req, res) => {
  try {
    const { month, year, startDate, endDate, mealType, friendId } = req.query;
    const where = { workspaceId: req.workspaceId };

    if (mealType) {
      where.mealType = mealType;
    }

    if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      const start = new Date(Date.UTC(y, m - 1, 1));
      const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
      where.entryDate = { gte: start, lte: end };
    } else if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(startDate);
      if (endDate) where.entryDate.lte = new Date(endDate);
    }

    if (friendId) {
      where.items = { some: { friendId } };
    }

    const entries = await prisma.mealEntry.findMany({
      where,
      include: {
        items: {
          include: {
            friend: { select: { id: true, fullName: true, shortCode: true } }
          }
        },
        createdBy: { select: { id: true, name: true } },
        updatedBy: { select: { id: true, name: true } }
      },
      orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }]
    });

    return res.json(entries);
  } catch (err) {
    console.error('Fetch entries error:', err);
    return res.status(500).json({ error: 'Failed to fetch meal entries' });
  }
});

// Create single meal entry
router.post('/workspaces/:workspaceId/entries', verifyWorkspaceMember, async (req, res) => {
  try {
    const { entryDate, mealType, defaultPrice, notes, rawNote, items } = req.body;

    if (!entryDate || !mealType || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Entry date, meal type, and at least one friend item are required' });
    }

    const price = parseFloat(defaultPrice) || 40;
    const parsedDate = new Date(entryDate);

    const result = await prisma.$transaction(async (tx) => {
      const entry = await tx.mealEntry.create({
        data: {
          workspaceId: req.workspaceId,
          entryDate: parsedDate,
          mealType: mealType.toUpperCase(),
          defaultPrice: price,
          notes: notes ? notes.trim() : null,
          rawNote: rawNote ? rawNote.trim() : null,
          createdById: req.user.id,
          updatedById: req.user.id,
          items: {
            create: items.map((item) => {
              const qty = parseInt(item.quantity) || 1;
              const unitP = parseFloat(item.unitPrice) || price;
              return {
                friendId: item.friendId,
                quantity: qty,
                unitPrice: unitP,
                lineTotal: qty * unitP
              };
            })
          }
        },
        include: {
          items: {
            include: { friend: { select: { fullName: true, shortCode: true } } }
          }
        }
      });

      const totalPeople = entry.items.length;
      const totalQty = entry.items.reduce((acc, i) => acc + i.quantity, 0);

      await logActivity(tx, {
        workspaceId: req.workspaceId,
        userId: req.user.id,
        action: 'MEAL_CREATED',
        entityType: 'MealEntry',
        entityId: entry.id,
        message: `${req.user.name} added ${entry.mealType.toLowerCase()} meal on ${parsedDate.toLocaleDateString()} for ${totalPeople} ${totalPeople === 1 ? 'person' : 'people'} (${totalQty} ${totalQty === 1 ? 'meal' : 'meals'})`
      });

      return entry;
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error('Create entry error:', err);
    return res.status(500).json({ error: 'Failed to create meal entry' });
  }
});

// Bulk create meal entries
router.post('/workspaces/:workspaceId/entries/bulk', verifyWorkspaceMember, async (req, res) => {
  try {
    const { entries } = req.body;

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'At least one valid meal entry is required' });
    }

    const createdEntries = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const entryData of entries) {
        const { entryDate, mealType, defaultPrice, notes, rawNote, items } = entryData;
        const price = parseFloat(defaultPrice) || 40;
        const parsedDate = new Date(entryDate);

        const entry = await tx.mealEntry.create({
          data: {
            workspaceId: req.workspaceId,
            entryDate: parsedDate,
            mealType: mealType.toUpperCase(),
            defaultPrice: price,
            notes: notes ? notes.trim() : null,
            rawNote: rawNote ? rawNote.trim() : null,
            createdById: req.user.id,
            updatedById: req.user.id,
            items: {
              create: items.map((item) => {
                const qty = parseInt(item.quantity) || 1;
                const unitP = parseFloat(item.unitPrice) || price;
                return {
                  friendId: item.friendId,
                  quantity: qty,
                  unitPrice: unitP,
                  lineTotal: qty * unitP
                };
              })
            }
          },
          include: {
            items: {
              include: { friend: { select: { fullName: true, shortCode: true } } }
            }
          }
        });
        results.push(entry);
      }

      await logActivity(tx, {
        workspaceId: req.workspaceId,
        userId: req.user.id,
        action: 'MEAL_BULK_CREATED',
        entityType: 'MealEntry',
        entityId: null,
        message: `${req.user.name} bulk imported ${results.length} meal entries`
      });

      return results;
    });

    return res.status(201).json(createdEntries);
  } catch (err) {
    console.error('Bulk meal create error:', err);
    return res.status(500).json({ error: 'Failed to bulk import meal entries' });
  }
});

// Update meal entry
router.put('/workspaces/:workspaceId/entries/:entryId', verifyWorkspaceMember, async (req, res) => {
  try {
    const { entryId } = req.params;
    const { entryDate, mealType, defaultPrice, notes, rawNote, items } = req.body;

    if (!entryDate || !mealType || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Entry date, meal type, and friend items are required' });
    }

    const price = parseFloat(defaultPrice) || 40;
    const parsedDate = new Date(entryDate);

    const existing = await prisma.mealEntry.findUnique({
      where: { id: entryId }
    });

    if (!existing || existing.workspaceId !== req.workspaceId) {
      return res.status(404).json({ error: 'Meal entry not found' });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.mealEntryItem.deleteMany({
        where: { mealEntryId: entryId }
      });

      const updated = await tx.mealEntry.update({
        where: { id: entryId },
        data: {
          entryDate: parsedDate,
          mealType: mealType.toUpperCase(),
          defaultPrice: price,
          notes: notes ? notes.trim() : null,
          rawNote: rawNote ? rawNote.trim() : null,
          updatedById: req.user.id,
          items: {
            create: items.map((item) => {
              const qty = parseInt(item.quantity) || 1;
              const unitP = parseFloat(item.unitPrice) || price;
              return {
                friendId: item.friendId,
                quantity: qty,
                unitPrice: unitP,
                lineTotal: qty * unitP
              };
            })
          }
        },
        include: {
          items: {
            include: { friend: { select: { fullName: true, shortCode: true } } }
          }
        }
      });

      await logActivity(tx, {
        workspaceId: req.workspaceId,
        userId: req.user.id,
        action: 'MEAL_UPDATED',
        entityType: 'MealEntry',
        entityId: entryId,
        message: `${req.user.name} edited meal entry for ${parsedDate.toLocaleDateString()}`
      });

      return updated;
    });

    return res.json(result);
  } catch (err) {
    console.error('Update entry error:', err);
    return res.status(500).json({ error: 'Failed to update meal entry' });
  }
});

// Delete meal entry
router.delete('/workspaces/:workspaceId/entries/:entryId', verifyWorkspaceMember, async (req, res) => {
  try {
    const { entryId } = req.params;

    const existing = await prisma.mealEntry.findUnique({
      where: { id: entryId }
    });

    if (!existing || existing.workspaceId !== req.workspaceId) {
      return res.status(404).json({ error: 'Meal entry not found' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.mealEntry.delete({
        where: { id: entryId }
      });

      await logActivity(tx, {
        workspaceId: req.workspaceId,
        userId: req.user.id,
        action: 'MEAL_DELETED',
        entityType: 'MealEntry',
        entityId: entryId,
        message: `${req.user.name} deleted meal entry for ${new Date(existing.entryDate).toLocaleDateString()}`
      });
    });

    return res.json({ message: 'Meal entry deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete meal entry' });
  }
});

export default router;
