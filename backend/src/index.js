/**
 * Smart Barcode Billing - Backend API
 * Runs on http://localhost:5000
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const PORT = process.env.PORT || 5001;

async function start() {
  const database = require('./db/database');
  await database.init();

  const authRoutes = require('./routes/auth');
  const productRoutes = require('./routes/products');
  const orderRoutes = require('./routes/orders');

  const app = express();
  app.use(cors({ origin: true }));
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ ok: true });
  });

  app.listen(PORT, () => {
    console.log(`Smart Barcode Billing API running at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
