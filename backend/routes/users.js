const express = require('express')
const User = require('../models/User')
const { protect } = require('../middleware/auth')

const router = express.Router()

// PUT /api/users/profile  — profil güncelle
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email, age, height, weight, gender, goal, activityLevel, measurements, avatarUrl } = req.body

    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' })

    if (name)          user.name          = name
    if (email)         user.email         = email
    if (age != null)   user.age           = age
    if (height != null) user.height       = height
    if (weight != null) user.weight       = weight
    if (gender)        user.gender        = gender
    if (goal)          user.goal          = goal
    if (activityLevel != null) user.activityLevel = activityLevel
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl

    if (measurements) {
      user.measurements = { ...user.measurements.toObject(), ...measurements }
    }

    await user.save()

    res.json({
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
    })
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.', error: err.message })
  }
})

// PUT /api/users/password  — şifre değiştir
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Mevcut ve yeni şifre gerekli.' })

    const user = await User.findById(req.user._id).select('+password')
    if (!(await user.matchPassword(currentPassword)))
      return res.status(401).json({ message: 'Mevcut şifre hatalı.' })

    if (newPassword.length < 6)
      return res.status(400).json({ message: 'Şifre en az 6 karakter olmalı.' })

    user.password = newPassword
    await user.save()

    res.json({ message: 'Şifre başarıyla güncellendi.' })
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.', error: err.message })
  }
})

module.exports = router
