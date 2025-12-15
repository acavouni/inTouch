const express = require('express');
const router = express.Router();
const { 
  addFriend, 
  removeFriend, 
  getFriendRequests, 
  acceptFriendRequest, 
  rejectFriendRequest 
} = require('../controllers/friendController');

// POST /friends - Send a friend request
router.post('/', addFriend);

// DELETE /friends - Remove a friendship
router.delete('/', removeFriend);

// GET /friends/requests/:userId - Get incoming friend requests
router.get('/requests/:userId', getFriendRequests);

// PUT /friends/:id/accept - Accept a friend request
router.put('/:id/accept', acceptFriendRequest);

// DELETE /friends/:id/reject - Reject a friend request
router.delete('/:id/reject', rejectFriendRequest);

module.exports = router;
