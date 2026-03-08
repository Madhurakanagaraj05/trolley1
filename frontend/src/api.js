/**
 * API helper - all backend calls go through this.
 * Base URL uses Vite proxy: /api -> http://localhost:5000
 */
const API = '/api';

async function parseJson(res) {
  const text = await res.text();
  if (!text || text.trim().startsWith('<')) {
    throw new Error('Backend not running. Start it with: cd backend && node src/index.js');
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Backend not running. Start it with: cd backend && node src/index.js');
  }
}

export async function login(username, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || 'Login failed');
  return data;
}

export async function getProductByBarcode(barcode) {
  const res = await fetch(`${API}/products/barcode/${encodeURIComponent(barcode)}`);
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || 'Product not found');
  return data.product;
}

export async function createOrder(payload) {
  const res = await fetch(`${API}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || 'Failed to create order');
  return data;
}

export async function getOrder(orderId) {
  const res = await fetch(`${API}/orders/${encodeURIComponent(orderId)}`);
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || 'Order not found');
  return data.order;
}

export async function getOrders() {
  const res = await fetch(`${API}/orders`);
  const data = await parseJson(res);
  if (!res.ok) throw new Error(data.message || 'Failed to fetch orders');
  return data.orders;
}
