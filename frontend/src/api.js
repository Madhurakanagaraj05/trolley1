// src/api.js
const API_URL = "https://trolley-q781.onrender.com/api";

// Login
export async function login(username, password) {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    return { success: false, message: "Login failed" };
  }
}

// Get all products
export async function getProducts() {
  try {
    const res = await fetch(`${API_URL}/products`);
    return await res.json();
  } catch (err) {
    console.error(err);
    return { success: false, products: [] };
  }
}

// Get product by barcode
export async function getProductByBarcode(barcode) {
  try {
    const res = await fetch(`${API_URL}/products/barcode/${barcode}`);
    return await res.json();
  } catch (err) {
    console.error(err);
    return { success: false, product: null };
  }
}

// Create an order
export async function createOrder(items, total) {
  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, total })
    });
    return await res.json();
  } catch (err) {
    console.error(err);
    return { success: false, order: null };
  }
}

// Get all orders
export async function getOrders() {
  try {
    const res = await fetch(`${API_URL}/orders`);
    return await res.json();
  } catch (err) {
    console.error(err);
    return { success: false, orders: [] };
  }
}

// Get single order by id
export async function getOrder(orderId) {
  try {
    const res = await fetch(`${API_URL}/orders`);
    const data = await res.json();
    if (!data.success) return { success: false, order: null };
    const order = data.orders.find(o => o.id === Number(orderId));
    return order ? { success: true, order } : { success: false, order: null };
  } catch (err) {
    console.error(err);
    return { success: false, order: null };
  }
}