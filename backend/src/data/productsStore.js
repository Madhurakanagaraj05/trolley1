/**
 * Load products from data/products.json.
 * File format: { "products": [ { id, barcode, product_name, price, weight } ] }
 */
const path = require('path');
const fs = require('fs');

const productsPath = path.join(__dirname, '..', '..', 'data', 'products.json');

function loadProducts() {
  const raw = fs.readFileSync(productsPath, 'utf8');
  const data = JSON.parse(raw);
  return data.products || [];
}

/**
 * Find product by barcode. Returns API shape: id, barcode, name, price, weightGrams, imageUrl
 */
function getProductByBarcode(barcode) {
  const products = loadProducts();
  const b = (barcode || '').trim();
  const row = products.find((p) => String(p.barcode) === b);
  if (!row) return null;
  return {
    id: row.id,
    barcode: row.barcode,
    name: row.product_name,
    price: Number(row.price),
    weightGrams: Number(row.weight) || 0,
    imageUrl: row.image_url || '',
  };
}

module.exports = { loadProducts, getProductByBarcode };
