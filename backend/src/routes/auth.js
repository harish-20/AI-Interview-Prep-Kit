const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const { protect } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Helper: sign JWT
const generateToken = (userId, email) => {
  return jwt.sign({ id: userId, email }, env.JWT_SECRET, { expiresIn: '7d' });
};

/**
 * POST /api/auth/register
 */
router.post('/register', validateBody(['email', 'password']), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        error: {
          code: 'USER_EXISTS',
          message: 'A user with this email address already exists.',
        },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    const token = generateToken(user._id, user.email);
    res.cookie('token', token, COOKIE_OPTIONS);

    return res.status(201).json({
      message: 'Registration successful',
      user: { id: user._id, email: user.email },
      token,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 */
router.post('/login', validateBody(['email', 'password']), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
    }

    const token = generateToken(user._id, user.email);
    res.cookie('token', token, COOKIE_OPTIONS);

    return res.status(200).json({
      message: 'Login successful',
      user: { id: user._id, email: user.email },
      token,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  return res.status(200).json({ message: 'Logout successful' });
});

/**
 * GET /api/auth/me
 */
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User not found.' },
      });
    }
    return res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
