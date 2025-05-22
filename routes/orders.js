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

// POST /api/orders — Place new order from cart
router.post('/', async (req, res) => {
  const { userId, addressId, paymentMethod } = req.body;

  if (!userId || !addressId || !paymentMethod) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    // 1. Get user's cart ID
    const [cartRows] = await connection.query('SELECT CartID FROM cart WHERE UserID = ?', [userId]);
    if (cartRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Cart not found for user' });
    }
    const cartId = cartRows[0].CartID;

    // 2. Get all cart items with prices
    const [cartItems] = await connection.query(`
      SELECT ci.ProductID, ci.Quantity, p.Price
      FROM cartitem ci
      JOIN product p ON ci.ProductID = p.ProductID
      WHERE ci.CartID = ?
    `, [cartId]);

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // 3. Calculate total amount
    const totalAmount = cartItems.reduce((sum, item) => sum + item.Price * item.Quantity, 0);

    const orderDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // 4. Insert new order
    const [orderResult] = await connection.query(`
      INSERT INTO orders (UserID, AddressID, OrderDate, Amount, Status)
      VALUES (?, ?, ?, ?, 'Processed')
    `, [userId, addressId, orderDate, totalAmount]);

    const orderId = orderResult.insertId;

    // 5. Insert into order_items
    const orderItemValues = cartItems.map(item => [orderId, item.ProductID, item.Quantity, item.Price]);
    await connection.query(`
      INSERT INTO order_items (OrderID, ProductID, Quantity, Price)
      VALUES ?
    `, [orderItemValues]);

    // 6. Insert payment record
    await connection.query(`
      INSERT INTO payment (OrderID, PaymentMethod, PaymentDate, Status)
      VALUES (?, ?, ?, 'Received')
    `, [orderId, paymentMethod, orderDate]);

    // 7. Clear cart items
    await connection.query('DELETE FROM cartitem WHERE CartID = ?', [cartId]);

    await connection.commit();
    res.status(201).json({ message: 'Order placed successfully', orderId });

  } catch (err) {
    await connection.rollback();
    console.error('Order processing error:', err.message);
    res.status(500).json({ error: 'Failed to place order' });
  } finally {
    connection.release();
  }
});

module.exports = router;