const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/reviews — all reviews
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM review');
    res.json(rows);
  } catch (err) {
    console.error("MySQL error:", err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/reviews/:productId — reviews for one product
router.get('/:productId', async (req, res) => {
  const { productId } = req.params;

  try {
    const [rows] = await db.query(
      'SELECT * FROM review WHERE ProductID = ?',
      [productId]
    );
    res.json(rows);
  } catch (err) {
    console.error("MySQL error:", err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/reviews — create a new review
router.post('/', async (req, res) => {
  const { ProductID, UserID, Comment, Rating } = req.body;

  if (!ProductID || !UserID || !Comment || !Rating) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO review (ProductID, UserID, Comment, Rating) VALUES (?, ?, ?, ?)',
      [ProductID, UserID, Comment, Rating]
    );

    res.status(201).json({ message: 'Review added', reviewId: result.insertId });
  } catch (err) {
    console.error("MySQL error:", err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
