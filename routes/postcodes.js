const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/postcodes
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM post');
    res.json(rows);
  } catch (err) {
    console.error("MySQL error:", err.message); // <-- log full error
    res.status(500).json({ error: 'Database error.' });
  }
});

// GET /api/postcodes/:postcode
router.get('/:postcode', async (req, res) => {
  const { postcode } = req.params;

  try {
    const [rows] = await db.query('SELECT City FROM postcode WHERE PostCode = ?', [postcode]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Postcode not found' });
    }
    res.json(rows[0]); // { City: 'Oslo' }
  } catch (err) {
    console.error("Postcode lookup error:", err.message);
    res.status(500).json({ error: 'Failed to look up postcode' });
  }
});

module.exports = router;
