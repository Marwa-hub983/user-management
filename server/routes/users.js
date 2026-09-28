const express = require('express');
const mongoose = require('mongoose');
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

module.exports = router;