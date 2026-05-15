import { useState, useContext, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUser, FiMail, FiSave, FiCamera, FiTrendingUp, FiEdit2, FiX, FiPlus, FiTrash2, FiCheckCircle } from 'react-icons/fi'
import { AuthContext } from '../App.jsx'
import { userAPI } from '../services/api.js'
import ConfirmPopover from '../components/ConfirmPopover.jsx'
import './Profile.css'

const buildSnapshot = (user) => ({
  formData: {
    name: user?.name || '',
    email: user?.email || '',
    age: user?.age ?? '',
    height: user?.height ?? '',
    weight: user?.weight ?? '',
    gender: user?.gender || 'male',
    goal: user?.goal || 'muscle_gain',
    activityLevel: user?.activityLevel || 1.55,
  },
  measurements: {
    chest: user?.measurements?.chest || '',
    waist: user?.measurements?.waist || '',
    hip: user?.measurements?.hip || '',
    upperArm: user?.measurements?.upperArm || '',
    thigh: user?.measurements?.thigh || '',
    shoulder: user?.measurements?.shoulder || '',
    calf: user?.measurements?.calf || '',
    wrist: user?.measurements?.wrist || '',
    neck: user?.measurements?.neck || '',
    bodyFat: user?.measurements?.bodyFat || '',
    benchPress1RM: user?.measurements?.benchPress1RM || '',
    squat1RM: user?.measurements?.squat1RM || '',
    deadlift1RM: user?.measurements?.deadlift1RM || '',
    overheadPress1RM: user?.measurements?.overheadPress1RM || '',
    bfMethod: user?.measurements?.bfMethod || 'navy',
    bfCaliper: user?.measurements?.bfCaliper || '',
    bfDexa: user?.measurements?.bfDexa || '',
    customExercises: Array.isArray(user?.measurements?.customExercises)
      ? user.measurements.customExercises.map(ex => ({ name: ex.name || '', value: ex.value ?? '' }))
      : [],
  },
  avatarUrl: user?.avatarUrl || null,
})

// BMI sınıflandırma — agirsaglam.com/vucut-kitle-indeksi-bmi tablosu
const BMI_RANGES = [
  { max: 18.5,     label: 'Zayıf',                   color: '#FCA5A5', range: '< 18.5' },
  { max: 25,       label: 'Normal',                  color: '#F87171', range: '18.5 – 24.9' },
  { max: 30,       label: 'Fazla Kilolu',            color: '#EF4444', range: '25.0 – 29.9' },
  { max: 35,       label: '1. Derece Obez',          color: '#DC2626', range: '30.0 – 34.9' },
  { max: 40,       label: '2. Derece Obez',          color: '#B91C1C', range: '35.0 – 39.9' },
  { max: Infinity, label: '3. Derece Obez (Morbid)', color: '#7F1D1D', range: '≥ 40.0' },
]

// 10 en bilindik temel hareket — select dropdown için
const EXERCISE_SUGGESTIONS = [
  'Bench Press',
  'Squat',
  'Deadlift',
  'Overhead Press',
  'Barbell Row',
  'Romanian Deadlift',
  'Incline Bench Press',
  'Front Squat',
  'Pull-up (Ağırlıklı)',
  'Hip Thrust',
]

const classifyBmi = (bmi) => {
  const v = Number(bmi)
  if (!v || Number.isNaN(v)) return null
  return BMI_RANGES.find(r => v < r.max)
}

// Vücut yağ oranı sınıflandırma — agirsaglam.com tablosu temelli
const classifyBodyFat = (gender, pct) => {
  const value = Number(pct)
  if (!value || Number.isNaN(value)) return null
  const ranges = gender === 'female'
    ? [
        { max: 13,       label: 'Yaşam İçin Esansiyel', color: '#FCA5A5' },
        { max: 20,       label: 'Sporcu',               color: '#F87171' },
        { max: 24,       label: 'Fit',                  color: '#EF4444' },
        { max: 31,       label: 'Ortalama',             color: '#DC2626' },
        { max: Infinity, label: 'Çok Yağlı / Obez',     color: '#991B1B' },
      ]
    : [
        { max: 5,        label: 'Yaşam İçin Esansiyel', color: '#FCA5A5' },
        { max: 13,       label: 'Sporcu',               color: '#F87171' },
        { max: 17,       label: 'Fit',                  color: '#EF4444' },
        { max: 24,       label: 'Ortalama',             color: '#DC2626' },
        { max: Infinity, label: 'Çok Yağlı / Obez',     color: '#991B1B' },
      ]
  return ranges.find(r => value <= r.max)
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5 }
  })
}

const goals = [
  { id: 'muscle_gain', label: 'Kas Kazanımı', icon: '💪', desc: 'Kalori fazlası ile kas kütlesi artışı' },
  { id: 'fat_loss', label: 'Yağ Yakımı', icon: '🔥', desc: 'Kalori açığı ile yağ kaybı' },
  { id: 'maintain', label: 'Koruma', icon: '⚖️', desc: 'Mevcut kiloyu koruma' },
  { id: 'recomp', label: 'Yağ Yakımı + Kas Kazanımı', icon: '🔁', desc: 'Düşük kalori açığı ve yüksek protein' },
]

const activityLevels = [
  { id: 1.2, label: 'Hareketsiz', desc: 'Masa başı iş, egzersiz yok' },
  { id: 1.375, label: 'Az Aktif', desc: 'Haftada 1-3 gün hafif egzersiz' },
  { id: 1.55, label: 'Orta Aktif', desc: 'Haftada 3-5 gün orta egzersiz' },
  { id: 1.725, label: 'Çok Aktif', desc: 'Haftada 6-7 gün yoğun egzersiz' },
  { id: 1.9, label: 'Ekstra Aktif', desc: 'Günde 2 antrenman veya ağır iş' },
]

const genders = [
  { id: 'male', label: 'Erkek' },
  { id: 'female', label: 'Kadın' },
]

export default function Profile() {
  const { user, login } = useContext(AuthContext)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('personal')
  const [isEditing, setIsEditing] = useState(false)
  const [snapshot, setSnapshot] = useState(() => buildSnapshot(user))
  const [avatarUrl, setAvatarUrl] = useState(snapshot.avatarUrl)
  const [formData, setFormData] = useState(snapshot.formData)
  const [measurements, setMeasurements] = useState(snapshot.measurements)
  const [customModes, setCustomModes] = useState({}) // { rowIdx: true } — özel hareket modu
  const [confirmingExerciseDelete, setConfirmingExerciseDelete] = useState(null) // satır indeksi
  const fileInputRef = useRef(null)

  // user değişince state'i senkronla
  useEffect(() => {
    const fresh = buildSnapshot(user)
    setSnapshot(fresh)
    setFormData(fresh.formData)
    setMeasurements(fresh.measurements)
    setAvatarUrl(fresh.avatarUrl)
  }, [user])

  // Her alanı normalize ederek karşılaştır — string/number/null/'' tip farkları sorun çıkarmasın
  const isFieldEqual = (a, b) => {
    const normA = a == null || a === '' ? '' : String(a).trim()
    const normB = b == null || b === '' ? '' : String(b).trim()
    return normA === normB
  }

  const isObjectChanged = (current, original) => {
    const keys = new Set([...Object.keys(current || {}), ...Object.keys(original || {})])
    for (const key of keys) {
      if (key === 'customExercises') {
        if (JSON.stringify(current[key] || []) !== JSON.stringify(original[key] || [])) return true
      } else if (!isFieldEqual(current[key], original[key])) {
        return true
      }
    }
    return false
  }

  const hasChanges =
    isObjectChanged(formData, snapshot.formData) ||
    isObjectChanged(measurements, snapshot.measurements) ||
    (avatarUrl || '') !== (snapshot.avatarUrl || '')

  const handleChange = (e) => {
    if (!isEditing) return
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setSaved(false)
  }

  const handleMeasurementChange = (e) => {
    if (!isEditing) return
    setMeasurements({ ...measurements, [e.target.name]: e.target.value })
    setSaved(false)
  }

  const handleCustomExerciseChange = (index, field, value) => {
    if (!isEditing) return
    const list = [...(measurements.customExercises || [])]
    list[index] = { ...list[index], [field]: value }
    setMeasurements({ ...measurements, customExercises: list })
    setSaved(false)
  }

  const addCustomExercise = () => {
    if (!isEditing) return
    const list = [...(measurements.customExercises || []), { name: '', value: '' }]
    setMeasurements({ ...measurements, customExercises: list })
    setSaved(false)
  }

  const removeCustomExercise = (index) => {
    if (!isEditing) return
    const list = (measurements.customExercises || []).filter((_, i) => i !== index)
    setMeasurements({ ...measurements, customExercises: list })
    // customModes indekslerini kaydır
    setCustomModes(prev => {
      const next = {}
      Object.entries(prev).forEach(([k, v]) => {
        const ki = Number(k)
        if (ki < index) next[ki] = v
        else if (ki > index) next[ki - 1] = v
      })
      return next
    })
    setConfirmingExerciseDelete(null)
    setSaved(false)
  }

  const handleExerciseSelect = (idx, value) => {
    if (value === '__custom__') {
      setCustomModes(prev => ({ ...prev, [idx]: true }))
      handleCustomExerciseChange(idx, 'name', '')
    } else {
      setCustomModes(prev => ({ ...prev, [idx]: false }))
      handleCustomExerciseChange(idx, 'name', value)
    }
  }

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    if (!isEditing || !hasChanges) return

    const cleanedMeasurements = {
      ...measurements,
      customExercises: (measurements.customExercises || [])
        .filter(ex => ex.name && ex.name.trim() !== '')
        .map(ex => ({ name: ex.name.trim(), value: ex.value === '' ? null : Number(ex.value) })),
    }

    // Backend yanıtını beklemeden UI'yi hemen güncelle
    setSaved(true)
    setIsEditing(false)
    setSaving(true)
    setSnapshot({
      formData: { ...formData },
      measurements: { ...cleanedMeasurements },
      avatarUrl,
    })

    // Toast'ı 2 saniye sonra gizle
    setTimeout(() => setSaved(false), 2000)

    // Analiz grafikleri için profil snapshot'u — her kaydetmede yeni veri noktası
    try {
      const HISTORY_KEY = 'fitblaze_profile_history'
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
      const entry = {
        timestamp: Date.now(),
        weight: Number(formData.weight) || null,
        chest: Number(measurements.chest) || null,
        waist: Number(measurements.waist) || null,
        hip: Number(measurements.hip) || null,
        upperArm: Number(measurements.upperArm) || null,
        thigh: Number(measurements.thigh) || null,
        shoulder: Number(measurements.shoulder) || null,
        calf: Number(measurements.calf) || null,
        wrist: Number(measurements.wrist) || null,
        neck: Number(measurements.neck) || null,
        bodyFat: bodyFatPct ? Number(bodyFatPct) : null,
        recommendedCalories,
      }
      history.push(entry)
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
      window.dispatchEvent(new Event('fitblaze:data-updated'))
    } catch (_) { /* ignore */ }

    // Arka planda backend'e gönder
    try {
      const res = await userAPI.updateProfile({ ...formData, measurements: cleanedMeasurements, avatarUrl })
      login(res.data, localStorage.getItem('token'))
      const fresh = buildSnapshot(res.data)
      setSnapshot(fresh)
      setFormData(fresh.formData)
      setMeasurements(fresh.measurements)
      setAvatarUrl(fresh.avatarUrl)
    } catch (err) {
      console.error('Profil kaydedilemedi:', err.response?.data?.message)
      setSaved(false)
      setIsEditing(true)
    } finally {
      setSaving(false)
    }
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // İptal: snapshot'a geri dön
      setFormData(snapshot.formData)
      setMeasurements(snapshot.measurements)
      setAvatarUrl(snapshot.avatarUrl)
      setIsEditing(false)
      setSaved(false)
    } else {
      setIsEditing(true)
    }
  }

  const handleAvatarClick = () => {
    if (!isEditing) return
    fileInputRef.current?.click()
  }

  const handleAvatarChange = (e) => {
    if (!isEditing) return
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Görsel boyutu 2MB\'tan küçük olmalı.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setAvatarUrl(reader.result)
    reader.readAsDataURL(file)
  }

  const heightM = Number(formData.height) / 100
  const weight = Number(formData.weight)
  const age = Number(formData.age)
  const height = Number(formData.height)

  // BMI
  const bmi = heightM > 0 ? (weight / (heightM * heightM)).toFixed(1) : 0
  const bmiCat = classifyBmi(bmi) || { label: '—', color: 'var(--text-muted)' }

  // BMR — Mifflin-St Jeor
  let bmr = 0
  if (formData.gender === 'male') {
    bmr = Math.round(10 * weight + 6.25 * height - 5 * age + 5)
  } else {
    bmr = Math.round(10 * weight + 6.25 * height - 5 * age - 161)
  }

  // TDEE
  const activityFactor = Number(formData.activityLevel)
  const tdee = Math.round(bmr * activityFactor)

  // Önerilen kalori
  let recommendedCalories = tdee
  if (formData.goal === 'muscle_gain') recommendedCalories = tdee + 300
  if (formData.goal === 'fat_loss')    recommendedCalories = tdee - 500
  if (formData.goal === 'recomp')      recommendedCalories = tdee - 200

  // Vücut yağ oranı — Navy formülü
  let bodyFatPct = null
  const waistN = Number(measurements.waist)
  const neckN  = Number(measurements.neck)
  const hipN   = Number(measurements.hip)
  if (formData.gender === 'male' && waistN && neckN && height) {
    const denom = waistN - neckN
    if (denom > 0) {
      const raw = 495 / (1.0324 - 0.19077 * Math.log10(denom) + 0.15456 * Math.log10(height)) - 450
      if (Number.isFinite(raw) && raw > 0) bodyFatPct = raw.toFixed(1)
    }
  } else if (formData.gender === 'female' && waistN && neckN && hipN && height) {
    const denom = waistN + hipN - neckN
    if (denom > 0) {
      const raw = 495 / (1.29579 - 0.35004 * Math.log10(denom) + 0.22100 * Math.log10(height)) - 450
      if (Number.isFinite(raw) && raw > 0) bodyFatPct = raw.toFixed(1)
    }
  }

  // Yağ oranı sınıflandırma
  const bfClass = classifyBodyFat(formData.gender, bodyFatPct)

  // Protein recommendation — kişiye özel
  const proteinMin = Math.round(weight * 1.6)
  const proteinMax = Math.round(weight * 2.2)

  // Günlük makro aralıkları
  const fatMin    = Math.round((recommendedCalories * 0.20) / 9)
  const fatMax    = Math.round((recommendedCalories * 0.35) / 9)
  const carbMin   = Math.max(0, Math.round((recommendedCalories * 0.45) / 4))
  const carbMax   = Math.max(0, Math.round((recommendedCalories * 0.65) / 4))
  const fiberMin  = Math.round((recommendedCalories / 1000) * 14)
  const fiberMax  = Math.round((recommendedCalories / 1000) * 19)
  const sugarMax  = Math.round((recommendedCalories * 0.10) / 4)

  // BMI için ideal kilo aralığı
  const idealWeightMin = Math.round(18.5 * heightM * heightM)
  const idealWeightMax = Math.round(24.9 * heightM * heightM)

  // BMI göstergesinin yüzde pozisyonu
  const bmiScaleMin = 10
  const bmiScaleMax = 45
  const bmiScalePos = Math.min(100, Math.max(0, ((Number(bmi) - bmiScaleMin) / (bmiScaleMax - bmiScaleMin)) * 100))

  return (
    <div className="profile-page">
      <motion.div className="page-header" initial="hidden" animate="visible" variants={fadeInUp}>
        <div>
          <h1>Profil</h1>
          <p className="page-subtitle">Kişisel bilgilerini, hedeflerini ve vücut ölçümlerini yönet</p>
        </div>
        <div className="page-header-actions">
          <AnimatePresence>
            {saved && (
              <motion.div
                className="save-success-toast"
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.25 }}
              >
                <FiCheckCircle /> Değişiklikler başarıyla kaydedildi
              </motion.div>
            )}
          </AnimatePresence>
          <button
            className="btn btn-secondary"
            onClick={handleEditToggle}
            disabled={saving}
          >
            {isEditing ? <><FiX /> İptal</> : <><FiEdit2 /> Düzenle</>}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !isEditing || !hasChanges}
          >
            <FiSave /> Kaydet
          </button>
        </div>
      </motion.div>

      {/* İstatistik özeti */}
      <motion.div className="profile-stats-overview" initial="hidden" animate="visible" variants={fadeInUp} custom={0.5}>
        <div className="pso-card">
          <span className="pso-label">BMI — Vücut Kitle Endeksi</span>
          <span className="pso-value" style={{ color: 'var(--color-primary)' }}>{bmi}</span>
          <span className="pso-badge" style={{ background: 'var(--color-primary-glow)', color: 'var(--color-primary)' }}>{bmiCat.label}</span>
        </div>
        <div className="pso-card">
          <span className="pso-label">Kilo</span>
          <span className="pso-value" style={{ color: 'var(--color-primary)' }}>{weight || '—'}</span>
          <span className="pso-unit">kg</span>
        </div>
        <div className="pso-card">
          <span className="pso-label">Yağ Oranı</span>
          <span className="pso-value" style={{ color: 'var(--color-primary)' }}>{bodyFatPct ? `${bodyFatPct}%` : '—'}</span>
          <span className="pso-unit">{bodyFatPct ? 'vücut yağı' : 'ölçüm girin'}</span>
        </div>
        <div className="pso-card">
          <span className="pso-label">Hedef Kalori</span>
          <span className="pso-value" style={{ color: 'var(--color-primary)' }}>{recommendedCalories}</span>
          <span className="pso-unit">kcal/gün</span>
        </div>
        <div className="pso-card">
          <span className="pso-label">Protein Hedefi</span>
          <span className="pso-value" style={{ color: 'var(--color-primary)' }}>{proteinMin}–{proteinMax}</span>
          <span className="pso-unit">g/gün</span>
        </div>
      </motion.div>

      <div className="profile-grid">
        {/* Profil kartı */}
        <motion.div className="profile-card" initial="hidden" animate="visible" variants={fadeInUp} custom={1}>
          <div className="profile-avatar-section">
            <div 
              className="profile-avatar-large"
              style={avatarUrl ? {
                backgroundImage: `url(${avatarUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: 'transparent'
              } : {}}
            >
              {!avatarUrl && (formData.name?.charAt(0)?.toUpperCase() || 'U')}
            </div>
            <button
              className="avatar-upload-btn"
              onClick={handleAvatarClick}
              disabled={!isEditing}
              title={isEditing ? 'Fotoğraf yükle' : 'Düzenlemek için "Düzenle" butonuna basın'}
            >
              <FiCamera />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>
          <h2 className="profile-name">{formData.name}</h2>
          <p className="profile-email">{formData.email}</p>

          <div className="calorie-recommendation">
            <span className="cr-label">Önerilen Günlük Kalori</span>
            <span className="cr-value">{recommendedCalories} <small>kcal</small></span>
            <ul className="cr-macros">
              <li><span className="cr-macro-label">Protein</span><span className="cr-macro-value">{proteinMin}–{proteinMax} g</span></li>
              <li><span className="cr-macro-label">Karbonhidrat</span><span className="cr-macro-value">{carbMin}–{carbMax} g</span></li>
              <li><span className="cr-macro-label">Yağ</span><span className="cr-macro-value">{fatMin}–{fatMax} g</span></li>
              <li><span className="cr-macro-label">Şeker (max)</span><span className="cr-macro-value">{sugarMax} g</span></li>
              <li><span className="cr-macro-label">Lif</span><span className="cr-macro-value">{fiberMin}–{fiberMax} g</span></li>
            </ul>
          </div>
        </motion.div>

        {/* Düzenleme formu */}
        <motion.div className="profile-form-card" initial="hidden" animate="visible" variants={fadeInUp} custom={2}>
          {/* Sekmeler */}
          <div className="profile-tabs">
            <button 
              className={`profile-tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              <FiUser /> Kişisel Bilgiler
            </button>
            <button 
              className={`profile-tab-btn ${activeTab === 'measurements' ? 'active' : ''}`}
              onClick={() => setActiveTab('measurements')}
            >
              <FiTrendingUp /> Vücut Ölçümleri
            </button>
            <button
              className={`profile-tab-btn ${activeTab === 'oneRM' ? 'active' : ''}`}
              onClick={() => setActiveTab('oneRM')}
            >
              <FiTrendingUp /> 1RM Ölçümü
            </button>
            <button
              className={`profile-tab-btn ${activeTab === 'bodyFatCalc' ? 'active' : ''}`}
              onClick={() => setActiveTab('bodyFatCalc')}
            >
              <FiTrendingUp /> Yağ Oranı Ölçümü
            </button>
            <button
              className={`profile-tab-btn ${activeTab === 'bmiCalc' ? 'active' : ''}`}
              onClick={() => setActiveTab('bmiCalc')}
            >
              <FiTrendingUp /> BMI Ölçümü
            </button>
          </div>

          <form onSubmit={handleSave}>
            {activeTab === 'personal' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Ad Soyad</label>
                    <div className="input-wrapper">
                      <FiUser className="input-icon" />
                      <input
                        type="text"
                        name="name"
                        className="form-input"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">E-posta</label>
                    <div className="input-wrapper">
                      <FiMail className="input-icon" />
                      <input
                        type="email"
                        name="email"
                        className="form-input"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Cinsiyet</label>
                  <div className="gender-selection">
                    {genders.map(g => (
                      <label key={g.id} className={`gender-option ${formData.gender === g.id ? 'selected' : ''} ${!isEditing ? 'disabled' : ''}`}>
                        <input
                          type="radio"
                          name="gender"
                          value={g.id}
                          checked={formData.gender === g.id}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                        <span>{g.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-row triple">
                  <div className="form-group">
                    <label className="form-label">Yaş</label>
                    <input
                      type="number"
                      name="age"
                      className="form-input"
                      value={formData.age}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Boy (cm)</label>
                    <input
                      type="number"
                      name="height"
                      className="form-input"
                      value={formData.height}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kilo (kg)</label>
                    <input
                      type="number"
                      name="weight"
                      className="form-input"
                      value={formData.weight}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Aktivite Seviyesi</label>
                  <select
                    name="activityLevel"
                    className="form-input form-select"
                    value={formData.activityLevel}
                    onChange={handleChange}
                    disabled={!isEditing}
                  >
                    {activityLevels.map(level => (
                      <option key={level.id} value={level.id}>
                        {level.label} — {level.desc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Hedef</label>
                  <select
                    name="goal"
                    className="form-input form-select"
                    value={formData.goal}
                    onChange={handleChange}
                    disabled={!isEditing}
                  >
                    {goals.map(goal => (
                      <option key={goal.id} value={goal.id}>
                        {goal.label} — {goal.desc}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {activeTab === 'oneRM' && (
              <>
                <div className="custom-exercises">
                  <div className="custom-exercises-header">
                    <h4>1RM Hareketleri</h4>
                    <button
                      type="button"
                      className="btn-add-exercise"
                      onClick={addCustomExercise}
                      disabled={!isEditing}
                    >
                      <FiPlus /> Hareket Ekle
                    </button>
                  </div>
                  {(measurements.customExercises || []).length === 0 ? (
                    <p className="custom-exercises-empty">
                      Henüz hareket eklenmedi. "Hareket Ekle" ile listeden seç veya "Diğer" ile kendi hareketini yaz, 1RM değerini gir.
                    </p>
                  ) : (
                    (measurements.customExercises || []).map((ex, idx) => {
                      const isCustom = customModes[idx] || (ex.name && !EXERCISE_SUGGESTIONS.includes(ex.name))
                      return (
                        <div className="custom-exercise-row" key={idx}>
                          {isCustom ? (
                            <input
                              type="text"
                              className="form-input"
                              placeholder="Hareket adını yaz"
                              value={ex.name}
                              onChange={(e) => handleCustomExerciseChange(idx, 'name', e.target.value)}
                              disabled={!isEditing}
                            />
                          ) : (
                            <select
                              className="form-input form-select"
                              value={ex.name}
                              onChange={(e) => handleExerciseSelect(idx, e.target.value)}
                              disabled={!isEditing}
                            >
                              <option value="">Hareket seç...</option>
                              {EXERCISE_SUGGESTIONS.map(name => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                              <option value="__custom__">+ Diğer (Yazarak Ekle)</option>
                            </select>
                          )}
                          <input
                            type="number"
                            className="form-input"
                            placeholder="1RM (kg)"
                            value={ex.value}
                            onChange={(e) => handleCustomExerciseChange(idx, 'value', e.target.value)}
                            disabled={!isEditing}
                          />
                          <div className="exercise-delete-wrap">
                            <button
                              type="button"
                              className="btn-remove-exercise"
                              onClick={() => setConfirmingExerciseDelete(idx)}
                              disabled={!isEditing}
                              title="Sil"
                            >
                              <FiTrash2 />
                            </button>
                            {confirmingExerciseDelete === idx && (
                              <ConfirmPopover
                                title={ex.name ? `"${ex.name}" hareketini silmek istediğine emin misin?` : 'Bu hareketi silmek istediğine emin misin?'}
                                onConfirm={() => removeCustomExercise(idx)}
                                onCancel={() => setConfirmingExerciseDelete(null)}
                                placement="left"
                              />
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

              </>
            )}

            {activeTab === 'bodyFatCalc' && (
              <>
                {bodyFatPct && (
                  <div className="bf-result-card" style={{ borderColor: bfClass?.color || 'var(--border-color)' }}>
                    <div className="bf-result-main">
                      <span className="bf-result-label">Vücut Yağ Oranınız</span>
                      <span className="bf-result-value" style={{ color: bfClass?.color }}>
                        %{bodyFatPct}
                      </span>
                    </div>
                    {bfClass && (
                      <div className="bf-result-badge" style={{ background: `${bfClass.color}20`, color: bfClass.color, borderColor: `${bfClass.color}40` }}>
                        {bfClass.label}
                      </div>
                    )}
                  </div>
                )}

                {!bodyFatPct && (
                  <div className="bf-required-card">
                    <div className="bf-required-title">Yağ oranını hesaplamak için şu bilgileri girin</div>
                    <ul className="bf-required-list">
                      <li className={Number(measurements.neck) > 0 ? 'done' : 'pending'}>
                        <span className="bf-req-check">{Number(measurements.neck) > 0 ? '✓' : '○'}</span>
                        Boyun {Number(measurements.neck) > 0 ? `(${measurements.neck} cm)` : ''}
                      </li>
                      <li className={Number(measurements.waist) > 0 ? 'done' : 'pending'}>
                        <span className="bf-req-check">{Number(measurements.waist) > 0 ? '✓' : '○'}</span>
                        Bel {Number(measurements.waist) > 0 ? `(${measurements.waist} cm)` : ''}
                      </li>
                      {formData.gender === 'female' && (
                        <li className={Number(measurements.hip) > 0 ? 'done' : 'pending'}>
                          <span className="bf-req-check">{Number(measurements.hip) > 0 ? '✓' : '○'}</span>
                          Kalça {Number(measurements.hip) > 0 ? `(${measurements.hip} cm)` : ''}
                        </li>
                      )}
                      <li className={Number(formData.height) > 0 ? 'done' : 'pending'}>
                        <span className="bf-req-check">{Number(formData.height) > 0 ? '✓' : '○'}</span>
                        Boy {Number(formData.height) > 0 ? `(${formData.height} cm)` : ''}
                      </li>
                    </ul>
                  </div>
                )}

                <div className="bf-table-wrap">
                  <h4 className="bf-table-title">Vücut Yağ Oranı Sınıflandırması</h4>
                  <table className="bf-table">
                    <thead>
                      <tr>
                        <th>Kategori</th>
                        <th>Erkek</th>
                        <th>Kadın</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { cat: 'Yaşam İçin Esansiyel', male: '%2–5',  female: '%10–13', color: '#FCA5A5' },
                        { cat: 'Sporcu',               male: '%6–13', female: '%14–20', color: '#F87171' },
                        { cat: 'Fit',                  male: '%14–17',female: '%21–24', color: '#EF4444' },
                        { cat: 'Ortalama',             male: '%18–24',female: '%25–31', color: '#DC2626' },
                        { cat: 'Çok Yağlı / Obez',     male: '%25+',  female: '%32+',   color: '#991B1B' },
                      ].map(row => (
                        <tr
                          key={row.cat}
                          className={bfClass?.label === row.cat ? 'bf-row-active' : ''}
                          style={bfClass?.label === row.cat ? { background: `${row.color}15` } : {}}
                        >
                          <td><span className="bf-dot" style={{ background: row.color }} />{row.cat}</td>
                          <td>{row.male}</td>
                          <td>{row.female}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </>
            )}

            {activeTab === 'bmiCalc' && (
              <>
                {Number(bmi) > 0 && (
                  <div className="bf-result-card" style={{ borderColor: bmiCat.color }}>
                    <div className="bf-result-main">
                      <span className="bf-result-label">Vücut Kitle Endeksiniz</span>
                      <span className="bf-result-value" style={{ color: bmiCat.color }}>
                        {bmi}
                      </span>
                    </div>
                    <div className="bf-result-badge" style={{ background: `${bmiCat.color}20`, color: bmiCat.color, borderColor: `${bmiCat.color}40` }}>
                      {bmiCat.label}
                    </div>
                  </div>
                )}

                {Number(bmi) <= 0 && (
                  <div className="bf-required-card">
                    <div className="bf-required-title">BMI hesaplamak için şu bilgileri girin</div>
                    <ul className="bf-required-list">
                      <li className={Number(formData.height) > 0 ? 'done' : 'pending'}>
                        <span className="bf-req-check">{Number(formData.height) > 0 ? '✓' : '○'}</span>
                        Boy {Number(formData.height) > 0 ? `(${formData.height} cm)` : ''}
                      </li>
                      <li className={Number(formData.weight) > 0 ? 'done' : 'pending'}>
                        <span className="bf-req-check">{Number(formData.weight) > 0 ? '✓' : '○'}</span>
                        Kilo {Number(formData.weight) > 0 ? `(${formData.weight} kg)` : ''}
                      </li>
                    </ul>
                  </div>
                )}

                <div className="bf-table-wrap">
                  <h4 className="bf-table-title">BMI Sınıflandırması</h4>
                  <table className="bf-table bmi-table">
                    <thead>
                      <tr>
                        <th>Kategori</th>
                        <th>BMI Aralığı</th>
                      </tr>
                    </thead>
                    <tbody>
                      {BMI_RANGES.map(row => (
                        <tr
                          key={row.label}
                          className={bmiCat?.label === row.label ? 'bf-row-active' : ''}
                          style={bmiCat?.label === row.label ? { background: `${row.color}15` } : {}}
                        >
                          <td><span className="bf-dot" style={{ background: row.color }} />{row.label}</td>
                          <td>{row.range}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeTab === 'measurements' && (
              <>
                <div className="form-row triple">
                  <div className="form-group">
                    <label className="form-label">Göğüs (cm)</label>
                    <input
                      type="number"
                      name="chest"
                      className="form-input"
                      value={measurements.chest}
                      onChange={handleMeasurementChange}
                      placeholder="örn: 100"
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bel (cm)</label>
                    <input
                      type="number"
                      name="waist"
                      className="form-input"
                      value={measurements.waist}
                      onChange={handleMeasurementChange}
                      placeholder="örn: 80"
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kalça (cm)</label>
                    <input
                      type="number"
                      name="hip"
                      className="form-input"
                      value={measurements.hip}
                      onChange={handleMeasurementChange}
                      placeholder="örn: 95"
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="form-row triple">
                  <div className="form-group">
                    <label className="form-label">Boyun (cm)</label>
                    <input
                      type="number"
                      name="neck"
                      className="form-input"
                      value={measurements.neck}
                      onChange={handleMeasurementChange}
                      placeholder="örn: 38"
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Omuz (cm)</label>
                    <input
                      type="number"
                      name="shoulder"
                      className="form-input"
                      value={measurements.shoulder}
                      onChange={handleMeasurementChange}
                      placeholder="örn: 120"
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kol (cm)</label>
                    <input
                      type="number"
                      name="upperArm"
                      className="form-input"
                      value={measurements.upperArm}
                      onChange={handleMeasurementChange}
                      placeholder="örn: 35"
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="form-row triple">
                  <div className="form-group">
                    <label className="form-label">Bacak (cm)</label>
                    <input
                      type="number"
                      name="thigh"
                      className="form-input"
                      value={measurements.thigh}
                      onChange={handleMeasurementChange}
                      placeholder="örn: 55"
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kalf (cm)</label>
                    <input
                      type="number"
                      name="calf"
                      className="form-input"
                      value={measurements.calf}
                      onChange={handleMeasurementChange}
                      placeholder="örn: 38"
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bilek (cm)</label>
                    <input
                      type="number"
                      name="wrist"
                      className="form-input"
                      value={measurements.wrist}
                      onChange={handleMeasurementChange}
                      placeholder="örn: 17"
                      disabled={!isEditing}
                    />
                  </div>
                </div>

              </>
            )}

          </form>
        </motion.div>
      </div>
    </div>
  )
}
