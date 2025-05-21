const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/cart — all cart records (admin/testing)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM cart');
    res.json(rows);
  } catch (err) {
    console.error("MySQL error:", err.message);
    res.status(500).json({ error: 'Database error.' });
  }
});

// GET /api/cart/:userId — full cart with products for a user
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const [cartRows] = await db.query('SELECT CartID FROM cart WHERE UserID = ?', [userId]);

    if (cartRows.length === 0) return res.json([]); // User has no cart yet

    const cartId = cartRows[0].CartID;

    const [items] = await db.query(`
      SELECT ci.CartItemID, ci.Quantity, p.*
      FROM cartitem ci
      JOIN product p ON ci.ProductID = p.ProductID
      WHERE ci.CartID = ?
    `, [cartId]);

    res.json(items);
  } catch (err) {
    console.error('Cart fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// POST /api/cart — add item to cart
router.post('/', async (req, res) => {
  const { userId, productId, quantity } = req.body;

  if (!userId || !productId || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Get or create cart
    let [cartRows] = await db.query('SELECT CartID FROM cart WHERE UserID = ?', [userId]);
    let cartId;

    if (cartRows.length === 0) {
      const [result] = await db.query('INSERT INTO cart (UserID) VALUES (?)', [userId]);
      cartId = result.insertId;
    } else {
      cartId = cartRows[0].CartID;
    }

    // Add item or update quantity
    await db.query(`
      INSERT INTO cartitem (CartID, ProductID, Quantity)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE Quantity = Quantity + ?
    `, [cartId, productId, quantity, quantity]);

    res.json({ message: 'Item added to cart' });
  } catch (err) {
    console.error('Cart insert error:', err.message);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// DELETE /api/cart/:cartItemId — remove item from cart
router.delete('/:cartItemId', async (req, res) => {
  const { cartItemId } = req.params;

  try {
    await db.query('DELETE FROM cartitem WHERE CartItemID = ?', [cartItemId]);
    res.json({ message: 'Item removed' });
  } catch (err) {
    console.error('Cart delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;
