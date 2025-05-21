const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/orders
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM orders');
    res.json(rows);
  } catch (err) {
    console.error("MySQL error:", err.message); // <-- log full error
    res.status(500).json({ error: 'Database error.' });
  }
});

// GET /api/orders/:userID
router.get('/:userID', async (req, res) => {
  const userID = req.params.userID;

  try {
    const [rows] = await db.query('SELECT * FROM orders WHERE userID = ?', [userID]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No orders found for the specified user.' });
    }

    res.json(rows);
  } catch (err) {
    console.error("MySQL error:", err.message);
    res.status(500).json({ error: 'Database error.' });
  }
});

module.exports = router;