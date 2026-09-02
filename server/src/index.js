import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import workspaceRouter from './routes/workspace.js';
import invoicesRouter from './routes/invoices.js';
import membersRouter from './routes/members.js';
import friendsRouter from './routes/friends.js';
import entriesRouter from './routes/entries.js';
import paymentsRouter from './routes/payments.js';
import settingsRouter from './routes/settings.js';
import activityRouter from './routes/activity.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = (process.env.CLIENT_URL || 'https://tiffinsplit.vercel.app').trim();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin === CLIENT_URL || origin.startsWith('http://localhost:5173') || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

// Public REST API Routes
app.use('/api/auth', authRouter);

// Workspace & Entity Routes (invoicesRouter mounted FIRST to serve public /invoices and workspace /workspaces routes)
app.use('/api/workspaces', workspaceRouter);
app.use('/api', invoicesRouter);
app.use('/api', membersRouter);
app.use('/api', friendsRouter);
app.use('/api', entriesRouter);
app.use('/api', paymentsRouter);
app.use('/api', settingsRouter);
app.use('/api', activityRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`TiffinSplit Express API Server listening on port ${PORT}`);
});
