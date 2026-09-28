const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/users  (admin: list all users for dashboard table)
router.get('/', adminOnly, async (req, res, next) => {
  try {
    res.json(await User.find().sort({ createdAt: -1 }));
  } catch (err) {
    next(err);
  }
});


router.get('/profile', (req, res) => res.json(req.user));

router.put(
  '/profile',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Invalid email format').normalizeEmail(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

      const { name, email } = req.body;
      if (email && email !== req.user.email) {
        if (await User.findOne({ email })) {
          return res.status(400).json({ message: 'Email already in use' });
        }
        req.user.email = email;
      }
      if (name) req.user.name = name;
      await req.user.save();
      res.json(req.user);
    } catch (err) {
      next(err);
    }
  }
);


router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid user id' });

    const isSelf = req.user._id.toString() === id;
    if (req.user.role !== 'admin' && !isSelf) {
      return res.status(403).json({ message: 'Not allowed to delete this user' });
    }
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
});
// POST /api/users  (admin: create user)
router.post(
  '/',
  adminOnly,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

      const { name, email, password, role } = req.body;
      if (await User.findOne({ email })) {
        return res.status(400).json({ message: 'User already exists' });
      }
      const user = await User.create({
        name,
        email,
        password: await bcrypt.hash(password, 10),
        role: role || 'user',
      });
      res.status(201).json(user); // password has select:false, so it isn't returned
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/users/:id  (admin: update any user)
router.put(
  '/:id',
  adminOnly,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid user id' });
      }

      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });

      const { name, email, role } = req.body;
      if (email && email !== user.email) {
        if (await User.findOne({ email })) {
          return res.status(400).json({ message: 'Email already in use' });
        }
        user.email = email;
      }
      if (name) user.name = name;
      if (role) user.role = role;
      await user.save();
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);
module.exports = router;