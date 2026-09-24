import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../storage/db.js';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await db.createUser({
      email,
      password_hash,
      name,
    });

    const token = jwt.sign(
      { id: newUser._id.toString(), email: newUser.email },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: { id: newUser._id, email: newUser.email, name: newUser.name },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: `Registration error: ${err.message}` });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      user: { id: user._id, email: user.email, name: user.name },
      token,
    });
  } catch (err) {
    res.status(500).json({ error: `Login error: ${err.message}` });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await db.findUserById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    res.status(500).json({ error: `Session error: ${err.message}` });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully.' });
});

export default router;
