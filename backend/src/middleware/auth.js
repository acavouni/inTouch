/**
 * Auth middleware that extracts Clerk user ID from authenticated requests
 * This middleware should be used after ClerkExpressRequireAuth()
 */
function attachClerkUser(req, res, next) {
  // ClerkExpressRequireAuth() attaches auth object to req.auth
  if (req.auth && req.auth.userId) {
    // Attach Clerk user ID to request for easy access in controllers
    req.clerkUserId = req.auth.userId;
    req.clerkUser = req.auth; // Full auth object if needed
  } else {
    return res.status(401).json({ error: 'Unauthorized: No user ID found' });
  }
  next();
}

module.exports = { attachClerkUser };

