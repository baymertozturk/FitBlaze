const express = require('express')
const ContactMessage = require('../models/ContactMessage')

const router = express.Router()

// POST /api/contact — İletişim formu mesajı gönder (public, login gerektirmez)
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Ad, e-posta ve mesaj alanları zorunludur.' })
    }

    const msg = await ContactMessage.create({ name, email, message })
    res.status(201).json({ message: 'Mesajınız başarıyla gönderildi.', id: msg._id })
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.', error: err.message })
  }
})

module.exports = router
