const prisma = require('../config/db');
// We would usually use bcrypt for hashing and jsonwebtoken for auth tokens.
// For now, setting up the basic logic structure.
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Basic string comparison for now. Ideally use bcrypt.compare
    if (user.passwordHash !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Mock token generation. Ideally use jsonwebtoken
    const token = `mock-token-for-${user.id}`;

    res.status(200).json({ token, message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login' });
  }
};
