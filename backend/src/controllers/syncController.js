const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Sync user from Clerk to database
 * Creates user if doesn't exist, returns existing user if found
 */
async function syncUser(req, res) {
  try {
    console.log('=== SYNC USER REQUEST ===');
    console.log('Request Body:', req.body);
    console.log('Clerk User ID (from middleware):', req.clerkUserId);
    console.log('Clerk Auth Object:', req.clerkUser);

    const clerkUserId = req.clerkUserId; // Set by attachClerkUser middleware

    if (!clerkUserId) {
      console.error('ERROR: No Clerk user ID found');
      return res.status(401).json({ error: 'Unauthorized: No Clerk user ID' });
    }

    // Get user info from request body (sent by frontend)
    const { email, name, username } = req.body;

    console.log('Extracted Data:', { clerkUserId, email, name, username });

    if (!email) {
      console.error('ERROR: No email in request body');
      return res.status(400).json({ 
        error: 'Email is required',
        received: req.body 
      });
    }

    // Check if user exists by clerkId
    let user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (user) {
      console.log('User exists - updating:', user.id);
      // User exists, update email/name if they changed in Clerk
      user = await prisma.user.update({
        where: { clerkId: clerkUserId },
        data: {
          email,
          name,
          lastUpdated: new Date(),
        },
      });
      console.log('User updated successfully:', user);
    } else {
      console.log('User does not exist - creating new user');
      // User doesn't exist, create new user
      user = await prisma.user.create({
        data: {
          clerkId: clerkUserId,
          email,
          name,
        },
      });
      console.log('User created successfully:', user);
    }

    console.log('=== SYNC COMPLETE ===');
    res.json(user);
  } catch (error) {
    console.error('=== ERROR SYNCING USER ===');
    console.error('Error details:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Handle unique constraint violation (email already exists with different clerkId)
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Email already exists with a different account',
        code: 'EMAIL_CONFLICT'
      });
    }
    
    res.status(500).json({ error: 'Failed to sync user', details: error.message });
  }
}

module.exports = { syncUser };

