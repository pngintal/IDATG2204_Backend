const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/products — with filters & sorting
router.get('/', async (req, res) => {
  try {
    let query = `SELECT * FROM product WHERE 1=1`;
    const params = [];

    // Filter by brand
    if (req.query.brand) {
      query += ` AND BrandID = ?`;
      params.push(req.query.brand);
    }

    // Filter by category
    if (req.query.category) {
      query += ` AND CategoryID = ?`;
      params.push(req.query.category);
    }

    // Sort by price
    if (req.query.sort === 'price_asc') {
      query += ` ORDER BY Price ASC`;
    } else if (req.query.sort === 'price_desc') {
      query += ` ORDER BY Price DESC`;
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("MySQL error:", err.message);
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
