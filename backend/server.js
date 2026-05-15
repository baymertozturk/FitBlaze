require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectDB = require('./config/db')

const app = express()

// Veritabanı bağlantısı
connectDB()

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use('/api/auth', require('./routes/auth'))
app.use('/api/users', require('./routes/users'))
app.use('/api/nutrition', require('./routes/nutrition'))
app.use('/api/admin', require('./routes/admin'))
app.use('/api/contact', require('./routes/contact'))

// Sağlık kontrolü
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FitBlaze API çalışıyor.' })
})

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint bulunamadı.' })
})

const PORT = process.env.PORT || 5000
const server = app.listen(PORT, () => {
  console.log(`FitBlaze API http://localhost:${PORT} adresinde çalışıyor`)
})

// Süreç kapanırken portu serbest bırak
const shutdown = () => {
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 3000).unref()
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
