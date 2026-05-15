import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi'
import { AuthContext, ThemeContext } from '../App.jsx'
import { authAPI } from '../services/api.js'
import './AuthPages.css'

export default function LoginPage() {
  const { login } = useContext(AuthContext)
  const { theme } = useContext(ThemeContext)
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await authAPI.login({ email: formData.email, password: formData.password })
      login(res.data.user, res.data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Giriş bilgileri hatalı. Lütfen tekrar deneyin.')
      setLoading(false)
    }
  }

  return (
    <div className="auth-page" data-theme={theme}>
      <div className="auth-bg-effects">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
      </div>

      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/" className="auth-logo">
          <img src="/images/fitblaze-logo.png" alt="FitBlaze Logo" className="logo-img" />
          <span className="logo-text">Fit<span className="logo-accent">Blaze</span></span>
        </Link>

        <div className="auth-header">
          <h1>Hoş Geldin</h1>
          <p>Hesabına giriş yap ve en iyi formunu inşa etmeye devam et</p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">E-posta</label>
            <div className="input-wrapper">
              <FiMail className="input-icon" />
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="ornek@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Şifre</label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="input-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className={`btn btn-primary btn-lg auth-submit ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <span className="btn-spinner" />
            ) : (
              <>
                Giriş Yap
                <FiArrowRight />
              </>
            )}
          </button>
        </form>

        <p className="auth-switch">
          Hesabın yok mu? <Link to="/register">Ücretsiz Kayıt Ol</Link>
        </p>
      </motion.div>
    </div>
  )
}
