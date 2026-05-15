const express = require('express')
const { adminOnly } = require('../middleware/admin')
const User = require('../models/User')
const ContactMessage = require('../models/ContactMessage')

const router = express.Router()

// Admin route'ları kullanıcı girişinden bağımsız çalışır
router.use(adminOnly)

router.get('/overview', async (req, res) => {
  try {
    const now = Date.now()
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    // Tüm sorguları paralel çalıştır (12 sıralı → 6 paralel)
    const [totalUsers, newUsersToday, activeUsersWeek, unreadMessages, totalMessages, chartAgg] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      User.countDocuments({ updatedAt: { $gte: oneWeekAgo } }),
      ContactMessage.countDocuments({ isRead: false }),
      ContactMessage.countDocuments(),
      // 7 ayrı sorgu yerine tek aggregation pipeline
      User.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]),
    ])

    // Aggregation sonucunu 7 günlük diziye dönüştür
    const chartMap = {}
    chartAgg.forEach(r => { chartMap[r._id] = r.count })
    const registrationChart = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      registrationChart.push({ date: key, count: chartMap[key] || 0 })
    }

    res.json({ totalUsers, newUsersToday, activeUsersWeek, unreadMessages, totalMessages, registrationChart })
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.', error: err.message })
  }
})

router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 20)
    const skip = (page - 1) * limit
    const search = req.query.search || ''

    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {}

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ])

    res.json({
      users: users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        gender: u.gender,
        age: u.age,
        goal: u.goal,
        weight: u.weight,
        height: u.height,
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        isFrozen: u.isFrozen || false,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.', error: err.message })
  }
})

// Hesap dondur/aktif et
router.put('/users/:id/toggle-freeze', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' })

    user.isFrozen = !user.isFrozen
    await user.save()

    res.json({ id: user._id, isFrozen: user.isFrozen })
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.', error: err.message })
  }
})

router.get('/messages', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 20)
    const skip = (page - 1) * limit
    const filter = req.query.filter // 'unread' | 'read' | undefined

    const query = {}
    if (filter === 'unread') query.isRead = false
    if (filter === 'read') query.isRead = true

    const [messages, total] = await Promise.all([
      ContactMessage.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ContactMessage.countDocuments(query),
    ])

    res.json({
      messages,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.', error: err.message })
  }
})

// Mesaj okundu/okunmadı toggle
router.put('/messages/:id/toggle-read', async (req, res) => {
  try {
    const msg = await ContactMessage.findById(req.params.id)
    if (!msg) return res.status(404).json({ message: 'Mesaj bulunamadı.' })

    msg.isRead = !msg.isRead
    await msg.save()

    res.json(msg)
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.', error: err.message })
  }
})

// Mesaj sil
router.delete('/messages/:id', async (req, res) => {
  try {
    await ContactMessage.findByIdAndDelete(req.params.id)
    res.json({ message: 'Mesaj silindi.' })
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.', error: err.message })
  }
})

module.exports = router
