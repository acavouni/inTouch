const express = require('express');
const router = express.Router();
const { addFriend, removeFriend } = require('../controllers/friendController');

// POST /friends
router.post('/', addFriend);

// DELETE /friends
router.delete('/', removeFriend);

module.exports = router;
