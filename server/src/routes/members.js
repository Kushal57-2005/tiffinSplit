import express from 'express';
import crypto from 'crypto';
import prisma from '../db.js';
import { authenticateUser } from '../middleware/auth.js';
import { verifyWorkspaceMember } from '../middleware/workspace.js';
import { logActivity } from '../utils/activityLogger.js';
import { sendInvitationEmail } from '../utils/mailer.js';

const router = express.Router();

// Get members and invitations for workspace
router.get('/workspaces/:workspaceId/members', authenticateUser, verifyWorkspaceMember, async (req, res) => {
  try {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: req.workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { joinedAt: 'asc' }
    });

    const pendingInvitations = await prisma.invitation.findMany({
      where: {
        workspaceId: req.workspaceId,
        acceptedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      members: members.map((m) => ({
        id: m.id,
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        joinedAt: m.joinedAt
      })),
      pendingInvitations
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch workspace members' });
  }
});

// Invite member by email
router.post('/workspaces/:workspaceId/invitations', authenticateUser, verifyWorkspaceMember, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: req.workspaceId,
        user: { email: cleanEmail }
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this workspace' });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: req.workspaceId }
    });

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await prisma.invitation.create({
      data: {
        workspaceId: req.workspaceId,
        email: cleanEmail,
        token,
        expiresAt
      }
    });

    const clientUrl = (process.env.CLIENT_URL || 'https://tiffin-split.vercel.app').trim();
    const inviteLink = `${clientUrl}/register?invite=${token}`;

    // Send invitation email in background
    sendInvitationEmail({
      recipientEmail: cleanEmail,
      workspaceName: workspace ? workspace.name : 'TiffinSplit Workspace',
      inviterName: req.user.name,
      inviteLink
    });

    await logActivity(prisma, {
      workspaceId: req.workspaceId,
      userId: req.user.id,
      action: 'MEMBER_INVITED',
      entityType: 'Invitation',
      entityId: invitation.id,
      message: `${req.user.name} invited ${cleanEmail} to the workspace`
    });

    return res.status(201).json(invitation);
  } catch (err) {
    console.error('Invite error:', err);
    return res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// Get invitation details by token
router.get('/invitations/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        workspace: {
          select: { id: true, name: true }
        }
      }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.acceptedAt) {
      return res.status(400).json({ error: 'Invitation has already been accepted' });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    return res.json(invitation);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to check invitation' });
  }
});

// Accept invitation
router.post('/invitations/accept', authenticateUser, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Invitation token is required' });
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { workspace: true }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.acceptedAt) {
      return res.status(400).json({ error: 'Invitation has already been accepted' });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    const membership = await prisma.$transaction(async (tx) => {
      const existing = await tx.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: invitation.workspaceId,
            userId: req.user.id
          }
        }
      });

      if (!existing) {
        await tx.workspaceMember.create({
          data: {
            workspaceId: invitation.workspaceId,
            userId: req.user.id
          }
        });
      }

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() }
      });

      await logActivity(tx, {
        workspaceId: invitation.workspaceId,
        userId: req.user.id,
        action: 'MEMBER_JOINED',
        entityType: 'User',
        entityId: req.user.id,
        message: `${req.user.name} joined workspace "${invitation.workspace.name}"`
      });

      return invitation.workspace;
    });

    return res.json({ message: 'Successfully joined workspace', workspace: membership });
  } catch (err) {
    console.error('Accept invitation error:', err);
    return res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

export default router;
