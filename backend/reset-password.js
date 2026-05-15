require('dotenv').config()
const mongoose = require('mongoose')
const User = require('./models/User')

const EMAIL = 'byrmmrt1446@gmail.com'
const NEW_PASSWORD = 'FitBlaze123'

async function resetPassword() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('MongoDB bağlandı')

  const user = await User.findOne({ email: EMAIL })
  if (!user) {
    console.log('Kullanıcı bulunamadı:', EMAIL)
    process.exit(1)
  }

  user.password = NEW_PASSWORD
  await user.save()

  console.log(`✅ Şifre sıfırlandı!`)
  console.log(`   E-posta : ${EMAIL}`)
  console.log(`   Yeni şifre: ${NEW_PASSWORD}`)
  process.exit(0)
}

resetPassword().catch(err => {
  console.error(err)
  process.exit(1)
})
