const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createUser(req, res) {
  try {
    const { name, email, company, homeCity, currentCity } = req.body;

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        company,
        homeCity,
        currentCity,
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user." });
  }
}

async function getAllUsers(req, res) {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error("Error retrieving users:", error);
    res.status(500).json({ error: "Failed to retrieve users." });
  }
}

async function getUserById(req, res) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to retrieve user." });
  }
}

async function getUserFriends(req, res) {
  try {
    const { id } = req.params;

    const friendships = await prisma.friendship.findMany({
      where: { userId: id },
      include: { friend: true },
    });

    // Return friends with friendship ID for deletion
    const friends = friendships.map((entry) => ({
      ...entry.friend,
      friendshipId: entry.id,
    }));

    res.json(friends);
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ error: "Failed to fetch friends." });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, company, homeCity, currentCity } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(company !== undefined && { company }),
        ...(homeCity !== undefined && { homeCity }),
        ...(currentCity !== undefined && { currentCity }),
        lastUpdated: new Date(),
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "User not found." });
    }
    res.status(500).json({ error: "Failed to update user." });
  }
}

async function searchUsers(req, res) {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json([]);
    }

    const searchTerm = q.trim().toLowerCase();

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { name: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: 10, // Limit results
    });

    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Failed to search users." });
  }
}

module.exports = {
  createUser,
  getUserById,
  getAllUsers,
  getUserFriends,
  updateUser,
  searchUsers,
};
