/**
 * Auth routes: login (simple username/password for demo).
 */
const express = require('express');
const { db } = require('../db/database');

const router = express.Router();

// Demo login - no JWT for simplicity; in production use sessions or JWT
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }
  const user = db.prepare('SELECT id, username FROM users WHERE username = ? AND password_hash = ?').get(username, password);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  res.json({ success: true, user: { id: user.id, username: user.username } });
});

module.exports = router;
