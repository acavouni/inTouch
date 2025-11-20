const express = require('express');
const router = express.Router();
const { createUser, getUserById, getAllUsers, getUserFriends, updateUser, searchUsers } = require('../controllers/userController');


// POST /users
router.post('/', createUser);

// GET /users/search?q=query - must be before /:id route
router.get('/search', searchUsers);

router.get('/:id', getUserById);
router.get('/', getAllUsers);
router.get('/:id/friends', getUserFriends);
router.put('/:id', updateUser);

module.exports = router;
