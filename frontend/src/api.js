// src/api.js
// Deployed backend base URL
const API_URL = "https://trolley-q781.onrender.com/api";

// Normalized helpers so the UI always gets the shapes it expects

// Login used by Login.jsx – should either return { user } or throw
export async function login(username, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Login failed");
  }
  // UI expects an object with `user`
  return { user: { id: 1, username: data.username || username } };
}

// Get all products (not heavily used in UI, but keep return shape)
export async function getProducts() {
  const res = await fetch(`${API_URL}/products`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch products");
  }
  return data.products;
}

// Get product by barcode – Scan.jsx expects a single product object
export async function getProductByBarcode(barcode) {
  const res = await fetch(`${API_URL}/products/barcode/${encodeURIComponent(barcode)}`);
  const data = await res.json();
  if (!res.ok || !data.success || !data.product) {
    throw new Error(data.message || "Product not found");
  }
  const p = data.product;
  return {
    id: p.id,
    barcode: p.barcode,
    name: p.product_name,
    price: Number(p.price),
    weightGrams: Number(p.weight) || 0,
    imageUrl: p.imageUrl || "",
  };
}

// Create an order – Payment.jsx expects `{ orderId }`
export async function createOrder(orderPayload) {
  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderPayload),
  });
  const data = await res.json();
  if (!res.ok || !data.success || !data.order) {
    throw new Error(data.message || "Failed to create order");
  }
  return { orderId: data.order.id };
}

// Get all orders (not critical for current UI)
export async function getOrders() {
  const res = await fetch(`${API_URL}/orders`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to fetch orders");
  }
  return data.orders;
}

// Get single order by id – Invoice.jsx expects a rich `order` object
export async function getOrder(orderId) {
  const res = await fetch(`${API_URL}/orders/${encodeURIComponent(orderId)}`);
  const data = await res.json();
  if (!res.ok || !data.success || !data.order) {
    throw new Error(data.message || "Order not found");
  }
  const o = data.order;
  // Back-end stores the cart payload; normalize to what Invoice.jsx uses
  return {
    orderId: o.id,
    createdAt: o.createdAt || new Date().toISOString(),
    paymentMode: o.paymentMode || o.payment_mode || "Unknown",
    paymentStatus: o.paymentStatus || o.payment_status || "PAID",
    totalAmount: o.totalAmount || o.total || o.total_amount,
    totalWeight: o.totalWeight || o.total_weight || 0,
    items: o.items || o.cart || [],
  };
}