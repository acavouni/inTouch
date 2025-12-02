const express = require('express');
const router = express.Router();
const { syncUser } = require('../controllers/syncController');
const { attachClerkUser } = require('../middleware/auth');

// POST /api/sync-user - Sync Clerk user to database
router.post('/', attachClerkUser, syncUser);

module.exports = router;

