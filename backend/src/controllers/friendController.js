const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addFriend(req, res) {
  try {
    const { userId, friendId } = req.body;

    // Prevent adding yourself as a friend
    if (userId === friendId) {
      return res.status(400).json({ error: "Cannot add yourself as a friend." });
    }

    // Create friendship with PENDING status
    const newFriendship = await prisma.friendship.create({
      data: {
        userId,
        friendId,
        status: 'PENDING',
      },
      include: {
        friend: true,
      },
    });

    res.status(201).json(newFriendship);
  } catch (error) {
    console.error("Error creating friendship:", error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "Friend request already sent." });
    }
    res.status(500).json({ error: "Failed to send friend request." });
  }
}

async function removeFriend(req, res) {
  try {
    const { userId, friendId } = req.body;

    const friendship = await prisma.friendship.findFirst({
      where: {
        userId,
        friendId,
      },
    });

    if (!friendship) {
      return res.status(404).json({ error: "Friendship not found." });
    }

    await prisma.friendship.delete({
      where: {
        id: friendship.id,
      },
    });

    res.status(200).json({ message: "Friendship removed successfully." });
  } catch (error) {
    console.error("Error removing friendship:", error);
    res.status(500).json({ error: "Failed to remove friendship." });
  }
}

async function getFriendRequests(req, res) {
  try {
    const { userId } = req.params;

    // Get all PENDING friend requests where the user is the recipient
    const requests = await prisma.friendship.findMany({
      where: {
        friendId: userId,
        status: 'PENDING',
      },
      include: {
        user: true, // The person who sent the request
      },
    });

    // Return the users who sent the requests with the friendship ID
    const requesters = requests.map((entry) => ({
      ...entry.user,
      friendshipId: entry.id,
    }));

    res.json(requesters);
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    res.status(500).json({ error: "Failed to fetch friend requests." });
  }
}

async function acceptFriendRequest(req, res) {
  try {
    const { id } = req.params; // Friendship ID

    // Update the friendship status to ACCEPTED
    const updatedFriendship = await prisma.friendship.update({
      where: { id },
      data: { status: 'ACCEPTED' },
      include: { user: true, friend: true },
    });

    res.json({ 
      message: "Friend request accepted.", 
      friendship: updatedFriendship 
    });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Friend request not found." });
    }
    res.status(500).json({ error: "Failed to accept friend request." });
  }
}

async function rejectFriendRequest(req, res) {
  try {
    const { id } = req.params; // Friendship ID

    // Delete the friendship entry
    await prisma.friendship.delete({
      where: { id },
    });

    res.json({ message: "Friend request rejected." });
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Friend request not found." });
    }
    res.status(500).json({ error: "Failed to reject friend request." });
  }
}

module.exports = {
  addFriend,
  removeFriend,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
};
