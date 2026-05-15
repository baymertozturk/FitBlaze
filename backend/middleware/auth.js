const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, res, next) => {
  let token = req.headers.authorization?.startsWith('Bearer')
    ? req.headers.authorization.split(' ')[1]
    : null

  if (!token) {
    return res.status(401).json({ message: 'Giriş yapmanız gerekiyor.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id)
    if (!req.user) return res.status(401).json({ message: 'Kullanıcı bulunamadı.' })
    next()
  } catch {
    return res.status(401).json({ message: 'Geçersiz token.' })
  }
}

module.exports = { protect }
