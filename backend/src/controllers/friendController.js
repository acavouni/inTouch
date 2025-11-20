const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addFriend(req, res) {
  try {
    const { userId, friendId } = req.body;

    // Prevent adding yourself as a friend
    if (userId === friendId) {
      return res.status(400).json({ error: "Cannot add yourself as a friend." });
    }

    const newFriendship = await prisma.friendship.create({
      data: {
        userId,
        friendId,
      },
      include: {
        friend: true,
      },
    });

    res.status(201).json(newFriendship);
  } catch (error) {
    console.error("Error creating friendship:", error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "Friendship already exists." });
    }
    res.status(500).json({ error: "Failed to create friendship." });
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

module.exports = {
  addFriend,
  removeFriend,
};
