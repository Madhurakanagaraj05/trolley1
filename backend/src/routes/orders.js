/**
 * Order routes: create order (save bill) and get purchase history.
 */
const express = require('express');
const { db, generateOrderId } = require('../db/database');

const router = express.Router();

// POST /api/orders - create new order (bill) and save to purchase history
router.post('/', (req, res) => {
  const { userId, items, totalAmount, paymentMode, paymentStatus } = req.body || {};
  if (!items || !Array.isArray(items) || items.length === 0 || totalAmount == null) {
    return res.status(400).json({ success: false, message: 'Items and totalAmount required' });
  }
  const orderId = generateOrderId();
  const mode = paymentMode || 'Cash';
  const status = paymentStatus || (mode === 'Cash' ? 'PENDING' : 'PAID');

  const insertOrder = db.prepare(`
    INSERT INTO orders (order_id, user_id, total_amount, payment_mode, payment_status)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, barcode, product_name, price, quantity, subtotal, weight_grams)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const run = db.transaction(() => {
    const result = insertOrder.run(orderId, userId || null, totalAmount, mode, status);
    const orderPk = result.lastInsertRowid;
    for (const item of items) {
      insertItem.run(
        orderPk,
        item.productId,
        item.barcode,
        item.productName,
        item.price,
        item.quantity,
        item.subtotal,
        item.weightGrams || 0
      );
    }
    return { orderPk, orderId };
  });

  try {
    const { orderId: savedOrderId } = run();
    res.json({ success: true, orderId: savedOrderId, paymentStatus: status });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to save order' });
  }
});

// GET /api/orders - purchase history (list orders)
router.get('/', (req, res) => {
  const orders = db.prepare(`
    SELECT o.id, o.order_id as orderId, o.total_amount as totalAmount,
           o.payment_mode as paymentMode, o.payment_status as paymentStatus,
           o.created_at as createdAt
    FROM orders o
    ORDER BY o.created_at DESC
    LIMIT 100
  `).all();
  res.json({ success: true, orders });
});

// GET /api/orders/:orderId - get single order with items (for invoice)
router.get('/:orderId', (req, res) => {
  const { orderId } = req.params;
  const order = db.prepare(`
    SELECT id, order_id as orderId, total_amount as totalAmount,
           payment_mode as paymentMode, payment_status as paymentStatus,
           created_at as createdAt
    FROM orders WHERE order_id = ?
  `).get(orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  const items = db.prepare(`
    SELECT barcode, product_name as productName, price, quantity, subtotal, weight_grams as weightGrams
    FROM order_items WHERE order_id = ?
  `).all(order.id);
  res.json({ success: true, order: { ...order, items } });
});

module.exports = router;
