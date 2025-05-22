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

// GET /api/orders/details/:orderId — full order details
router.get('/details/:orderId', async (req, res) => {
  const orderId = req.params.orderId;

  try {
    // 1. Get order base data
    const [[order]] = await db.query('SELECT * FROM orders WHERE OrderID = ?', [orderId]);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const userId = order.UserID;
    const addressId = order.AddressID;

    // 2. Get user info
    const [[user]] = await db.query('SELECT * FROM user WHERE UserID = ?', [userId]);

    // 3. Get address
    const [[address]] = await db.query('SELECT * FROM address WHERE AddressID = ?', [addressId]);

    // 4. Get payment info
    const [[payment]] = await db.query('SELECT * FROM payment WHERE OrderID = ?', [orderId]);

    // 5. Get order items (join products)
    const [items] = await db.query(`
      SELECT oi.Quantity, p.ProductName as name, p.Price as price, p.ImageURL as image
      FROM order_items oi
      JOIN product p ON oi.ProductID = p.ProductID
      WHERE oi.OrderID = ?
    `, [orderId]);

    // 6. Send structured response
    res.json({
      OrderDate: order.OrderDate,
      Amount: order.Amount,
      Status: order.Status,
      Street: address?.Street,
      PostCode: address?.PostCode,
      FirstName: user?.FirstName,
      LastName: user?.LastName,
      Email: user?.Email,
      Username: user?.Username,
      PaymentDate: payment?.PaymentDate,
      PaymentStatus: payment?.Status,
      PaymentMethod: payment?.PaymentMethod,
      Items: items || []
    });

  } catch (err) {
    console.error('Order fetch error:', err.message);
    console.error('Full stack trace:', err);
    res.status(500).json({ error: 'Failed to fetch order details' });
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

// POST /api/orders — create full order with payment and clear cart
router.post('/', async (req, res) => {
  const { userId, addressId, paymentMethod } = req.body;

  if (!userId || !addressId || !paymentMethod) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get user's cart ID
    const [cartRows] = await connection.query(
      'SELECT CartID FROM cart WHERE UserID = ?',
      [userId]
    );
    if (cartRows.length === 0) throw new Error('Cart not found');
    const cartId = cartRows[0].CartID;

    // Get cart items with price
    const [cartItems] = await connection.query(
      `SELECT ci.ProductID, ci.Quantity, p.Price
       FROM cartitem ci
       JOIN product p ON ci.ProductID = p.ProductID
       WHERE ci.CartID = ?`,
      [cartId]
    );
    if (cartItems.length === 0) throw new Error('Cart is empty');

    // Calculate total
    const total = cartItems.reduce((sum, item) => sum + item.Quantity * item.Price, 0);
    const today = new Date().toISOString().slice(0, 10);

    // Insert order
    const [orderResult] = await connection.query(
      'INSERT INTO orders (UserID, AddressID, OrderDate, Amount, Status) VALUES (?, ?, ?, ?, ?)',
      [userId, addressId, today, total, 'processed']
    );
    const orderId = orderResult.insertId;

    // Insert order_items
    const orderItems = cartItems.map(item => [orderId, item.ProductID, item.Quantity]);
    await connection.query(
      'INSERT INTO order_items (OrderID, ProductID, Quantity) VALUES ?',
      [orderItems]
    );

    // Insert payment
    await connection.query(
      'INSERT INTO payment (OrderID, PaymentMethod, PaymentDate, Status) VALUES (?, ?, ?, ?)',
      [orderId, paymentMethod, today, 'received']
    );

    // Clear cart
    await connection.query('DELETE FROM cartitem WHERE CartID = ?', [cartId]);

    await connection.commit();
    res.status(201).json({ message: 'Order placed', orderId });
  } catch (err) {
    await connection.rollback();
    console.error('Order failed:', err.message);
    res.status(500).json({ error: 'Order placement failed' });
  } finally {
    connection.release();
  }
});

module.exports = router;