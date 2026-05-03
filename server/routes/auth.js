const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { getCollection } = require('../mongodb');
const { sign } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const usersCollection = getCollection('users');
    const user = await usersCollection.findOne({ username: username.trim().toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.active) return res.status(403).json({ error: 'Account is inactive' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = sign(user);
    res.json({
      token,
      user: { _id: user._id, username: user.username, name: user.name, role: user.role, tlId: user.tlId },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
