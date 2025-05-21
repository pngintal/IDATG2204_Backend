const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM product');
    res.json(rows);
  } catch (err) {
    console.error("MySQL error:", err.message); // <-- log full error
    res.status(500).json({ error: 'Database error.' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  const productId = req.params.id;

  try {
    const [rows] = await db.query('SELECT * FROM product WHERE ProductID = ?', [productId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("MySQL error:", err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
