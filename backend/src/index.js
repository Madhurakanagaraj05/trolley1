// backend/src/index.js
const express = require("express");
const cors = require("cors");

// Correct file names (plural)
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");  // <-- orders.js
const authRoutes = require("./routes/auth");

const app = express();

// Middleware
// Allow local dev and deployed frontend on Vercel
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:3004",
  "http://localhost:3005",
  "https://trolley1.vercel.app",
];

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools / same-origin requests (no origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/login", authRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({ success: true, message: "Smart Barcode Billing Backend Running" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));