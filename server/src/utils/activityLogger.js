import prisma from '../db.js';

export async function logActivity(dbOrTx, { workspaceId, userId, action, entityType, entityId = null, message }) {
  try {
    const client = dbOrTx || prisma;
    return await client.activityLog.create({
      data: {
        workspaceId,
        userId,
        action,
        entityType,
        entityId,
        message
      }
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}
