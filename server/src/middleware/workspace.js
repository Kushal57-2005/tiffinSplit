import prisma from '../db.js';

export async function verifyWorkspaceMember(req, res, next) {
  try {
    const workspaceId =
      req.headers['x-workspace-id'] ||
      req.params.workspaceId ||
      req.body.workspaceId ||
      req.query.workspaceId;

    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID required' });
    }

    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspaceId,
          userId: req.user.id
        }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this workspace' });
    }

    req.workspaceId = workspaceId;
    req.membership = membership;
    req.userRole = membership.role || 'HEAD';
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Error verifying workspace membership' });
  }
}

export async function verifyWorkspaceHead(req, res, next) {
  await verifyWorkspaceMember(req, res, () => {
    if (req.userRole !== 'HEAD') {
      return res.status(403).json({ error: 'Access denied: Only the Household Head can verify or reject payment reports' });
    }
    next();
  });
}
