import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowRight, FiActivity, FiTarget, FiTrendingUp, FiHeart, FiZap, FiBarChart2, FiCheckCircle, FiSun, FiMoon, FiMail, FiPhone, FiMapPin } from 'react-icons/fi'
import { GiMuscleUp, GiMeal, GiWeightLiftingUp } from 'react-icons/gi'
import { ThemeContext } from '../App.jsx'
import { contactAPI } from '../services/adminApi.js'
import './LandingPage.css'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
  })
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [scrollingDown, setScrollingDown] = useState(false)
  const { theme, toggleTheme } = useContext(ThemeContext)
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [contactStatus, setContactStatus] = useState('')

  useEffect(() => {
    let lastScrollY = window.scrollY
    const handleScroll = () => {
      const currentY = window.scrollY
      const goingDown = currentY > lastScrollY
      lastScrollY = currentY
      setScrolled(currentY > 50)
      // Aşağı kaydırınca renk değişsin
      setScrollingDown(currentY > 20 && goingDown)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="landing">
      {/* Üst menü */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''} ${scrollingDown ? 'scrolling-down' : ''}`}>
        <div className="nav-container">
          {/* Sol: logo */}
          <div className="nav-left">
            <Link to="/" className="nav-logo-only-link">
              <img src="/images/fitblaze-logo.png" alt="FitBlaze Logo" className="nav-logo-img" />
            </Link>
          </div>

          {/* Orta: marka ve linkler */}
          <div className="nav-center">
            <Link to="/" className="nav-brand-center-link">
              <span className="logo-text">Fit<span className="logo-accent">Blaze</span></span>
            </Link>
            <div className="nav-links-desktop">
              <a href="#features" className="nav-link">Özellikler</a>
              <a href="#modules" className="nav-link">Modüller</a>
              <a href="#contact" className="nav-link">İletişim</a>
            </div>
          </div>

          {/* Sağ: butonlar */}
          <div className="nav-actions">
            <button className="theme-toggle-btn nav-theme-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Aydınlık Mod' : 'Karanlık Mod'}>
              {theme === 'dark' ? <FiSun /> : <FiMoon />}
            </button>
            <Link to="/login" className="btn btn-ghost">Giriş Yap</Link>
            <Link to="/register" className="btn btn-primary">
              Ücretsiz Başla
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero alanı */}
      <section className="hero">
        <div className="hero-bg-effects">
          <div className="hero-gradient-orb hero-orb-1" />
          <div className="hero-gradient-orb hero-orb-2" />
          <div className="hero-gradient-orb hero-orb-3" />
          <div className="hero-grid-pattern" />
        </div>

        <div className="hero-container">
          <motion.div 
            className="hero-content"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >

            <motion.h1 className="hero-title" variants={fadeInUp} custom={1}>
              FitBlaze<br />
              <span className="gradient-text">En İyi Formunu İnşa Et</span>
            </motion.h1>

            <motion.p className="hero-description" variants={fadeInUp} custom={2}>
              Spor ve beslenme rutinini tek bir yerden yönet. Gelişmiş analizlerle verilerini incele, kendi rotanı çizerek potansiyelini açığa çıkar.
            </motion.p>

            <motion.div className="hero-cta" variants={fadeInUp} custom={3}>
              <Link to="/register" className="btn btn-primary btn-lg">
                Hemen Başla
                <FiArrowRight />
              </Link>
              <a href="#features" className="btn btn-secondary btn-lg">
                Keşfet
              </a>
            </motion.div>

            <motion.div className="hero-stats-row" variants={fadeInUp} custom={4}>
              <div className="hero-stat">
                <span className="hero-stat-number">500+</span>
                <span className="hero-stat-label">Egzersiz</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-number">1754+</span>
                <span className="hero-stat-label">Besin Verisi</span>
              </div>
              <div className="hero-stat-divider" />
              <div className="hero-stat">
                <span className="hero-stat-number">%100</span>
                <span className="hero-stat-label">Ücretsiz</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Özellikler */}
      <section className="features" id="features">
        <div className="container">
          <motion.div 
            className="section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >

            <h2 className="section-title">
              Tüm fitness yolculuğun<br />
              <span className="gradient-text">tek platformda</span>
            </h2>
            <p className="section-desc">
              Antrenman programlarından beslenme takibine, ilerleme grafiklerinden vücut analizine kadar ihtiyacın olan her şey burada.
            </p>
          </motion.div>

          <motion.div 
            className="features-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            {[
              { icon: <GiWeightLiftingUp />, title: "Antrenman Takibi", desc: "Set, tekrar ve ağırlık logla. Haftalık program oluştur. Antrenman geçmişini görüntüle.", color: "#E62E00" },
              { icon: <GiMeal />, title: "Beslenme Takibi", desc: "Günlük kalori ve makro takibi. Öğün planlama. Besin arama veritabanı.", color: "#FBBF24" },
              { icon: <FiBarChart2 />, title: "Analiz & Grafikler", desc: "BMI ve vücut yağ oranı hesaplama. İlerleme grafikleri. Haftalık ve aylık raporlar.", color: "#38BDF8" },
              { icon: <FiTarget />, title: "Kalori Hedefi", desc: "Otomatik kalori hedefi önerisi.", color: "#A78BFA" },
              { icon: <GiMuscleUp />, title: "1RM Hesaplama", desc: "Epley formülü ile tahmini 1 tekrar maksimum ağırlık hesabı.", color: "#F472B6" },
              { icon: <FiTrendingUp />, title: "Vücut Ölçümleri", desc: "Göğüs, bel, kalça, kol çevresi takibi. Zaman içinde grafik görselleştirme.", color: "#FF4444" },
            ].map((feature, i) => (
              <motion.div className="feature-card" key={i} variants={fadeInUp} custom={i}>
                <div className="feature-icon" style={{ background: `${feature.color}15`, color: feature.color }}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Modüller */}
      <section className="modules" id="modules">
        <div className="container">
          <motion.div 
            className="section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <span className="section-tag">Modüller</span>
            <h2 className="section-title">
              Güçlü modüllerle<br />
              <span className="gradient-text">tam kontrol</span>
            </h2>
          </motion.div>

          <div className="modules-grid">
            <motion.div 
              className="module-card module-workout"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >

              <div className="module-icon-wrap">
                <GiWeightLiftingUp />
              </div>
              <h3>Antrenman Modülü</h3>
              <ul>
                <li><FiCheckCircle /> Bodybuilding egzersiz kütüphanesi</li>
                <li><FiCheckCircle /> Haftalık program oluşturucu</li>
                <li><FiCheckCircle /> Antrenman geçmişi</li>
                <li><FiCheckCircle /> Set / tekrar / ağırlık loglama</li>
              </ul>
            </motion.div>

            <motion.div 
              className="module-card module-nutrition"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              custom={1}
            >

              <div className="module-icon-wrap nutrition">
                <GiMeal />
              </div>
              <h3>Beslenme Modülü</h3>
              <ul>
                <li><FiCheckCircle /> Günlük kalori + makro takibi</li>
                <li><FiCheckCircle /> Besin arama veritabanı</li>
                <li><FiCheckCircle /> Türk mutfağı destekli</li>
                <li><FiCheckCircle /> Favori besinler listesi</li>
              </ul>
            </motion.div>

            <motion.div 
              className="module-card module-analytics"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              custom={2}
            >

              <div className="module-icon-wrap analytics">
                <FiBarChart2 />
              </div>
              <h3>Analiz &amp; Dashboard</h3>
              <ul>
                <li><FiCheckCircle /> BMI &amp; vücut yağ oranı</li>
                <li><FiCheckCircle /> İlerleme grafikleri</li>
                <li><FiCheckCircle /> Haftalık / aylık raporlar</li>
                <li><FiCheckCircle /> TDEE &amp; kalori hedefi</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* İstatistikler */}
      <section className="stats-section" id="stats">
        <div className="container">
          <div className="stats-grid">
            <motion.div 
              className="stat-card"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="stat-icon"><GiWeightLiftingUp /></div>
              <div className="stat-number">145+</div>
              <div className="stat-label">Hazır Egzersiz</div>
            </motion.div>
            <motion.div 
              className="stat-card"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              custom={1}
            >
              <div className="stat-icon"><GiMeal /></div>
              <div className="stat-number">1754+</div>
              <div className="stat-label">Besin Verisi</div>
            </motion.div>
            <motion.div 
              className="stat-card"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              custom={2}
            >
              <div className="stat-icon"><FiTarget /></div>
              <div className="stat-number">7</div>
              <div className="stat-label">Formül &amp; Hesaplama</div>
            </motion.div>
            <motion.div 
              className="stat-card"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              custom={3}
            >
              <div className="stat-icon"><FiActivity /></div>
              <div className="stat-number">%100</div>
              <div className="stat-label">Ücretsiz Kullanım</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Aksiyon bölümü */}
      <section className="cta-section">
        <div className="container">
          <motion.div 
            className="cta-card"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div className="cta-bg-effect" />
            <h2>Fitness yolculuğuna<br /><span className="gradient-text">bugün başla</span></h2>
            <p>Ücretsiz hesap oluştur, antrenman programını planla ve beslenme düzenini takip et.</p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Ücretsiz Kayıt Ol
              <FiArrowRight />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* İletişim */}
      <section className="contact-section" id="contact">
        <div className="container">
          <motion.div 
            className="section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <span className="section-tag">İletişim</span>
            <h2 className="section-title">
              Bizimle<br />
              <span className="gradient-text">iletişime geç</span>
            </h2>
            <p className="section-desc">
              Sorularınız, önerileriniz veya geri bildirimleriniz için bize ulaşın.
            </p>
          </motion.div>

          <div className="contact-grid">
            <motion.div 
              className="contact-info-card"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="contact-items">
                <div className="contact-item">
                  <div className="contact-icon"><FiMail /></div>
                  <div>
                    <span className="contact-label">E-posta</span>
                    <span className="contact-value">byrmmrt1446@gmail.com</span>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon"><FiPhone /></div>
                  <div>
                    <span className="contact-label">Telefon</span>
                    <span className="contact-value">05383801066</span>
                  </div>
                </div>
                <div className="contact-item">
                  <div className="contact-icon"><FiMapPin /></div>
                  <div>
                    <span className="contact-label">Adres</span>
                    <span className="contact-value">İstanbul, Türkiye</span>
                  </div>
                </div>
              </div>

            </motion.div>

            <motion.form 
              className="contact-form-card"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              custom={1}
              onSubmit={async (e) => {
                e.preventDefault()
                try {
                  await contactAPI.send(contactForm)
                  setContactStatus('success')
                  setContactForm({ name: '', email: '', message: '' })
                  setTimeout(() => setContactStatus(''), 4000)
                } catch {
                  setContactStatus('error')
                  setTimeout(() => setContactStatus(''), 4000)
                }
              }}
            >
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ad Soyad</label>
                  <input type="text" className="form-input" placeholder="Adınız Soyadınız" value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">E-posta</label>
                  <input type="email" className="form-input" placeholder="ornek@email.com" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Mesaj</label>
                <textarea className="form-input contact-textarea" placeholder="Mesajınızı buraya yazın..." rows={5} value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} required />
              </div>
              {contactStatus === 'success' && <p style={{ color: 'var(--color-success)', fontSize: '0.9rem', textAlign: 'center' }}>✓ Mesajınız başarıyla gönderildi!</p>}
              {contactStatus === 'error' && <p style={{ color: 'var(--color-danger)', fontSize: '0.9rem', textAlign: 'center' }}>Mesaj gönderilemedi, tekrar deneyin.</p>}
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Mesaj Gönder
                <FiArrowRight />
              </button>
            </motion.form>
          </div>
        </div>
      </section>

      {/* Alt bilgi */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-logo">
                <img src="/images/fitblaze-logo.png" alt="FitBlaze Logo" className="logo-img footer-logo-img" />
                <span className="logo-text">Fit<span className="logo-accent">Blaze</span></span>
              </div>
              <p className="footer-tagline">
                <span className="gradient-text">En iyi formunu</span> inşa et.
              </p>
            </div>

            <div className="footer-links-grid">
              <div className="footer-links-col">
                <h4 className="footer-col-title">Platform</h4>
                <ul>
                  <li><a href="#features">Özellikler</a></li>
                  <li><a href="#modules">Modüller</a></li>
                  <li><a href="#stats">İstatistikler</a></li>
                  <li><Link to="/register">Kayıt Ol</Link></li>
                </ul>
              </div>
              <div className="footer-links-col">
                <h4 className="footer-col-title">Modüller</h4>
                <ul>
                  <li><a href="#modules">Antrenman</a></li>
                  <li><a href="#modules">Beslenme</a></li>
                  <li><a href="#modules">Analiz</a></li>
                  <li><a href="#modules">Profil</a></li>
                </ul>
              </div>
              <div className="footer-links-col">
                <h4 className="footer-col-title">İletişim</h4>
                <ul>
                  <li><a href="#contact">Bize Ulaş</a></li>
                  <li><a href="mailto:destek@fitblaze.app">E-posta</a></li>
                  <li><a href="#contact">Destek</a></li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </footer>
    </div>
  )
}
