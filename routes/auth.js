const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [users] = await db.query('SELECT * FROM user WHERE Username = ? AND Password = ?', [username, password]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.user = {
      id: users[0].UserID,
      username: users[0].Username
    };

    res.json({ message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});
