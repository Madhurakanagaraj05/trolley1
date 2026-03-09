import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Demo data
let products = [
  { id: 1, barcode: "8909106072572", product_name: "CLINIC PLUS", price: 1, weight: 6.5 },
  { id: 2, barcode: "8906057534098", product_name: "MEDIMIX SOAP", price: 45, weight: 100 },
  { id: 3, barcode: "8901234567890", product_name: "Milk Packet", price: 60, weight: 1000 },
];

let orders = [];

// Routes

// 1️⃣ Login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  // Demo credentials
  if (username === "admin" && password === "admin123") {
    return res.json({ success: true, username });
  }

  return res.status(401).json({ success: false, message: "Invalid credentials" });
});

// 2️⃣ Get all products
app.get("/api/products", (req, res) => {
  res.json({ success: true, products });
});

// 3️⃣ Create new order
app.post("/api/orders", (req, res) => {
  const { items, total } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "Order must have items" });
  }

  const order = {
    id: orders.length + 1,
    items,
    total,
    createdAt: new Date(),
  };

  orders.push(order);

  res.json({ success: true, order });
});

// 4️⃣ Get all orders
app.get("/api/orders", (req, res) => {
  res.json({ success: true, orders });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});