/**
 * Product routes: fetch product by barcode from data/products.json.
 */
const express = require('express');
const { getProductByBarcode } = require('../data/productsStore');

const router = express.Router();

// GET /api/products/barcode/:barcode - fetch single product by barcode
router.get('/barcode/:barcode', (req, res) => {
  const { barcode } = req.params;
  if (!barcode || !barcode.trim()) {
    return res.status(400).json({ success: false, message: 'Barcode required' });
  }
  const product = getProductByBarcode(barcode);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.json({ success: true, product });
});

module.exports = router;
