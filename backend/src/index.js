const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Clerk middleware for JWT verification
let ClerkExpressRequireAuth;
try {
  const clerk = require('@clerk/clerk-sdk-node');
  ClerkExpressRequireAuth = clerk.ClerkExpressRequireAuth;
} catch (error) {
  console.warn('@clerk/clerk-sdk-node not installed. Run: npm install @clerk/clerk-sdk-node');
  // Factory function that returns middleware
  ClerkExpressRequireAuth = () => (req, res, next) => {
    console.warn('Clerk middleware not available - skipping auth check');
    next();
  };
}

const userRoutes = require('./routes/userRoutes');
const friendRoutes = require('./routes/friendRoutes');
const syncRoutes = require('./routes/syncRoutes');
const { attachClerkUser } = require('./middleware/auth');
const app = express();

// IMPORTANT: Middleware order matters!
app.use(cors());
app.use(express.json()); // Parse JSON bodies BEFORE routes

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Public routes (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Sync user route (requires auth, extracts Clerk user ID)
app.use('/api/sync-user', ClerkExpressRequireAuth(), syncRoutes);

// Protected routes (require authentication)
// Add ClerkExpressRequireAuth() middleware to routes that need authentication
app.use('/users', ClerkExpressRequireAuth(), attachClerkUser, userRoutes);
app.use('/friends', ClerkExpressRequireAuth(), attachClerkUser, friendRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
