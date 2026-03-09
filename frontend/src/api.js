const API_BASE = "https://trolley-q781.onrender.com";

export async function getProducts() {
  const res = await fetch(`${API_BASE}/api/products`);
  return res.json();
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username: username,
      password: password
    })
  });

  return res.json();
}