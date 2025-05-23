const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/addresses/:userId
router.get('/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    const [rows] = await db.query(`
   SELECT a.AddressID, a.Street, a.PostCode, p.City
    FROM address a
   JOIN post p ON a.PostCode = p.PostCode
    WHERE a.UserID = ?`, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No addresses found for the specified user.' });
    }

    res.json(rows);
  } catch (err) {
    console.error("MySQL error:", err.message);
    res.status(500).json({ error: 'Database error.' });
  }
});

// POST /api/addresses — add new address
router.post('/', async (req, res) => {
  const { userId, street, postCode } = req.body;

  if (!userId || !street || !postCode) {
    return res.status(400).json({ error: 'Missing required address fields' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO address (UserID, Street, PostCode ) VALUES (?, ?, ? )',
      [userId, street, postCode ]
    );

    res.status(201).json({ message: 'Address added successfully', addressId: result.insertId });
  } catch (err) {
    console.error("MySQL insert error:", err.message);
    res.status(500).json({ error: 'Failed to add address' });
  }
});

module.exports = router;
