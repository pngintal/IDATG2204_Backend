const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/payments
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM payment');
    res.json(rows);
  } catch (err) {
    console.error("MySQL error:", err.message); // <-- log full error
    res.status(500).json({ error: 'Database error.' });
  }
});


module.exports = router;
