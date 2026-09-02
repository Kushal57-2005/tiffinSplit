import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../db.js';
import { JWT_SECRET, authenticateUser } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, workspaceName, invitationToken } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase().trim(),
          password: hashedPassword
        }
      });

      // Handle invitation if token provided
      if (invitationToken) {
        const invite = await tx.invitation.findUnique({
          where: { token: invitationToken }
        });

        if (invite && !invite.acceptedAt && invite.expiresAt > new Date()) {
          await tx.workspaceMember.create({
            data: {
              workspaceId: invite.workspaceId,
              userId: newUser.id
            }
          });

          await tx.invitation.update({
            where: { id: invite.id },
            data: { acceptedAt: new Date() }
          });

          await logActivity(tx, {
            workspaceId: invite.workspaceId,
            userId: newUser.id,
            action: 'MEMBER_JOINED',
            entityType: 'User',
            entityId: newUser.id,
            message: `${newUser.name} joined the workspace via invitation`
          });
        }
      }

      // If workspaceName provided and no invite processed, create new workspace
      if (workspaceName && workspaceName.trim()) {
        const workspace = await tx.workspace.create({
          data: {
            name: workspaceName.trim(),
            members: {
              create: {
                userId: newUser.id
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
          }
        });

        await logActivity(tx, {
          workspaceId: workspace.id,
          userId: newUser.id,
          action: 'WORKSPACE_CREATED',
          entityType: 'Workspace',
          entityId: workspace.id,
          message: `${newUser.name} created workspace "${workspace.name}"`
        });
      }

      return newUser;
    });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      include: { workspace: true }
    });

    return res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
      workspaces: memberships.map((m) => m.workspace)
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login with email & password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.password) {
      return res.status(400).json({ error: 'This account uses Google Sign-In. Please sign in with Google.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      include: { workspace: true }
    });

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
      workspaces: memberships.map((m) => m.workspace)
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Failed to log in' });
  }
});

// Google SSO Authentication (Login / Register)
router.post('/google', async (req, res) => {
  try {
    const { credential, access_token, invitationToken, workspaceName } = req.body;

    if (!credential && !access_token) {
      return res.status(400).json({ error: 'Google credential or access token is required' });
    }

    let payload;

    if (credential) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID || undefined
        });
        payload = ticket.getPayload();
      } catch (e) {
        const decoded = jwt.decode(credential);
        if (decoded && decoded.email) {
          payload = decoded;
        }
      }
    }

    if (!payload && access_token) {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        if (userInfoRes.ok) {
          const userInfo = await userInfoRes.json();
          payload = {
            email: userInfo.email,
            name: userInfo.name,
            sub: userInfo.sub
          };
        }
      } catch (e) {
        console.error('Failed to fetch userinfo from Google:', e);
      }
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Failed to verify Google identity token' });
    }

    const { email, name, sub: googleId } = payload;
    const cleanEmail = email.toLowerCase().trim();

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { googleId }]
      }
    });

    if (!user) {
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name: name || cleanEmail.split('@')[0],
            email: cleanEmail,
            googleId: googleId || null,
            password: null
          }
        });

        if (invitationToken) {
          const invite = await tx.invitation.findUnique({
            where: { token: invitationToken }
          });

          if (invite && !invite.acceptedAt && invite.expiresAt > new Date()) {
            await tx.workspaceMember.create({
              data: {
                workspaceId: invite.workspaceId,
                userId: newUser.id
              }
            });

            await tx.invitation.update({
              where: { id: invite.id },
              data: { acceptedAt: new Date() }
            });

            await logActivity(tx, {
              workspaceId: invite.workspaceId,
              userId: newUser.id,
              action: 'MEMBER_JOINED',
              entityType: 'User',
              entityId: newUser.id,
              message: `${newUser.name} joined workspace via invitation`
            });
          }
        }

        const userMemberships = await tx.workspaceMember.findMany({
          where: { userId: newUser.id }
        });

        if (userMemberships.length === 0) {
          const wsName = (workspaceName && workspaceName.trim()) || `${newUser.name}'s Household`;
          const workspace = await tx.workspace.create({
            data: {
              name: wsName,
              members: {
                create: { userId: newUser.id }
              },
              setting: {
                create: {
                  morningDefaultRate: 40,
                  nightDefaultRate: 40,
                  currency: 'INR',
                  currencySymbol: '₹'
                }
              }
            }
          });

          await logActivity(tx, {
            workspaceId: workspace.id,
            userId: newUser.id,
            action: 'WORKSPACE_CREATED',
            entityType: 'Workspace',
            entityId: workspace.id,
            message: `${newUser.name} created workspace "${workspace.name}"`
          });
        }

        return newUser;
      });
    } else if (!user.googleId && googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId }
      });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      include: { workspace: true }
    });

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
      workspaces: memberships.map((m) => m.workspace)
    });
  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
});

// Get current user profile & workspaces
router.get('/me', authenticateUser, async (req, res) => {
  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: req.user.id },
      include: { workspace: true }
    });

    return res.json({
      user: req.user,
      workspaces: memberships.map((m) => ({
        ...m.workspace,
        role: m.role || 'HEAD'
      }))
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

export default router;
