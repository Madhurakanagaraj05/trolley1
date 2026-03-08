/**
 * Seed script: creates demo user and sample products with barcodes.
 * Run: npm run seed
 */
const { db, initDatabase } = require('./database');

initDatabase();

// Demo user (password: admin123 - hashed with simple hash for demo only)
// In production use bcrypt
const demoPasswordHash = 'admin123'; // Demo: store plain for simplicity. Use bcrypt in production.

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, username, password_hash) VALUES (1, 'admin', ?)
`);
insertUser.run(demoPasswordHash);

// Sample products with real-looking barcodes (EAN-13 format)
const products = [
  { barcode: '8901234567890', name: 'Organic Rice 1kg', price: 120, weight_grams: 1000, image_url: '' },
  { barcode: '8901234567891', name: 'Sunflower Oil 1L', price: 180, weight_grams: 1000, image_url: '' },
  { barcode: '8901234567892', name: 'Wheat Flour 500g', price: 45, weight_grams: 500, image_url: '' },
  { barcode: '8901234567893', name: 'Tea Powder 250g', price: 95, weight_grams: 250, image_url: '' },
  { barcode: '8901234567894', name: 'Sugar 1kg', price: 55, weight_grams: 1000, image_url: '' },
  { barcode: '8901234567895', name: 'Salt 1kg', price: 22, weight_grams: 1000, image_url: '' },
  { barcode: '8901234567896', name: 'Biscuit Pack', price: 30, weight_grams: 200, image_url: '' },
  { barcode: '8901234567897', name: 'Milk 1L', price: 60, weight_grams: 1000, image_url: '' },
  { barcode: '8901234567898', name: 'Soap Bar', price: 40, weight_grams: 100, image_url: '' },
  { barcode: '8901234567899', name: 'Shampoo 200ml', price: 150, weight_grams: 200, image_url: '' },
];

const insertProduct = db.prepare(`
  INSERT OR REPLACE INTO products (barcode, name, price, weight_grams, image_url)
  VALUES (@barcode, @name, @price, @weight_grams, @image_url)
`);

for (const p of products) {
  insertProduct.run(p);
}

console.log('Seed complete. Demo user: admin / admin123');
console.log('Sample products added with barcodes 8901234567890 to 8901234567899');
