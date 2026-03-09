// API base URL (Render backend)
const API_BASE = "https://trolley-q781.onrender.com";

// Get all products
export async function getAllProducts() {
  try {
    const response = await fetch(`${API_BASE}/api/products`);

    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Error fetching products:", error);
    return { success: false, products: [] };
  }
}


// Get product by barcode
export async function getProductByBarcode(barcode) {
  try {
    const response = await fetch(
      `${API_BASE}/api/products/barcode/${barcode}`
    );

    if (!response.ok) {
      throw new Error("Product not found");
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Error fetching product:", error);
    return { success: false, product: null };
  }
}


// Wake backend (helps when Render service sleeps)
export async function wakeBackend() {
  try {
    await fetch(`${API_BASE}/api/products`);
  } catch (error) {
    console.log("Backend wake attempt");
  }
}