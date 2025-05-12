const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Product');
    res.json(rows);
  } catch (err) {
    console.error("MySQL error:", err); // <-- log full error
    res.status(500).json({ error: 'Database error' });
  }
});


module.exports = router;
