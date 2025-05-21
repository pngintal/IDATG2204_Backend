const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/userReviews/:userId — reviews made by 1 user
router.get('/:UserId', async (req, res) => {
  const { UserId } = req.params;

  try {
    const [rows] = await db.query(
      'SELECT * FROM review WHERE UserID = ?',
      [UserId]
    );
    res.json(rows);
  } catch (err) {
    console.error("MySQL error:", err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;