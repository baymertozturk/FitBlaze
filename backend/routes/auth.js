const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { protect } = require('../middleware/auth')

const router = express.Router()

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE })

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Tüm alanları doldurun.' })

    const existing = await User.findOne({ email })
    if (existing)
      return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı.' })

    const user = await User.create({ name, email, password })
    const token = signToken(user._id)

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        height: user.height,
        weight: user.weight,
        gender: user.gender,
        goal: user.goal,
        activityLevel: user.activityLevel,
        measurements: user.measurements,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.', error: err.message })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ message: 'E-posta ve şifre gerekli.' })

    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'E-posta veya şifre hatalı.' })

    const token = signToken(user._id)

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        height: user.height,
        weight: user.weight,
        gender: user.gender,
        goal: user.goal,
        activityLevel: user.activityLevel,
        measurements: user.measurements,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.', error: err.message })
  }
})

// GET /api/auth/me  — token geçerliliğini kontrol eder
router.get('/me', protect, async (req, res) => {
  const u = req.user
  res.json({
    id: u._id,
    name: u.name,
    email: u.email,
    age: u.age,
    height: u.height,
    weight: u.weight,
    gender: u.gender,
    goal: u.goal,
    activityLevel: u.activityLevel,
    measurements: u.measurements,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt,
  })
})

module.exports = router
