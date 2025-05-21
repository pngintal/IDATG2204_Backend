const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { username, password, email, firstName, lastName } = req.body;

  if (!username || !password || !email || !firstName || !lastName) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const [existing] = await db.query(
      'SELECT * FROM user WHERE Username = ?', [username]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const [result] = await db.query(
      'INSERT INTO user (Username, Password, Email, FirstName, LastName) VALUES (?, ?, ?, ?, ?)',
      [username, password, email, firstName, lastName]
    );

    res.status(201).json({
      message: 'User registered',
      user: {
        id: result.insertId,
        username,
        email,
        firstName,
        lastName
      }
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }

  try {
    const [users] = await db.query(
      'SELECT * FROM user WHERE Username = ? AND Password = ?',
      [username, password]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = users[0];

    res.json({
      message: 'Login successful',
      user: {
        id: user.UserID,
        username: user.Username,
        email: user.Email,
        firstName: user.FirstName,
        lastName: user.LastName
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
