import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, createContext } from 'react'
import { authAPI } from './services/api.js'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardLayout from './layouts/DashboardLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Workouts from './pages/Workouts.jsx'
import Nutrition from './pages/Nutrition.jsx'
import NutritionHistory from './pages/NutritionHistory.jsx'
import Analytics from './pages/Analytics.jsx'
import Profile from './pages/Profile.jsx'
import AdminPanel from './pages/AdminPanel.jsx'

export const AuthContext = createContext(null)
export const ThemeContext = createContext(null)

const ACTIVE_USER_KEY = 'fitblaze_active_user'
const DEMO_SEED_KEY = 'fitblaze_demo_seed'        // statik orijinal demo verisi (ilk açılışta)
const DEMO_STATE_KEY = 'fitblaze_demo_state'      // demo'nun yaşayan/güncel durumu
const DEMO_MARKER = 'demo'                        // ACTIVE_USER_KEY'de demo işareti
const DEMO_EMAIL = 'byrmmrt1446@gmail.com'
const SCHEMA_VERSION_KEY = 'fitblaze_schema_version'
const CURRENT_SCHEMA_VERSION = '2'

const PROMPT_FLAG_KEYS = [
  'fitblaze_profile_prompt_dismissed',
  'fitblaze_nutrition_prompt_dismissed',
  'fitblaze_analytics_prompt_dismissed',
  'fitblaze_analytics_viewed_date',
]

const collectAppKeys = () => {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (
      key &&
      key.startsWith('fitblaze_') &&
      key !== ACTIVE_USER_KEY &&
      key !== DEMO_SEED_KEY &&
      key !== DEMO_STATE_KEY
    ) {
      keys.push(key)
    }
  }
  return keys
}

// Demo verisini yedekle
const saveDemoState = () => {
  const state = {}
  collectAppKeys().forEach(k => { state[k] = localStorage.getItem(k) })
  if (Object.keys(state).length === 0) return
  localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(state))
}

// Yedeklenmiş demo verisini geri yükle
const restoreDemoState = () => {
  const raw = localStorage.getItem(DEMO_STATE_KEY)
  if (!raw) return false
  try {
    const state = JSON.parse(raw)
    if (!state || typeof state !== 'object') return false
    clearAppData()
    Object.entries(state).forEach(([k, v]) => {
      if (typeof v === 'string') localStorage.setItem(k, v)
    })
    return true
  } catch { return false }
}

const clearAppData = () => {
  collectAppKeys().forEach(k => localStorage.removeItem(k))
}

const snapshotAppData = () => {
  const snap = {}
  collectAppKeys().forEach(k => { snap[k] = localStorage.getItem(k) })
  return snap
}

const restoreAppData = (snap) => {
  clearAppData()
  Object.entries(snap || {}).forEach(([k, v]) => {
    if (typeof v === 'string') localStorage.setItem(k, v)
  })
}

// İlk açılışta demo verisini seed olarak sakla
const ensureDemoSeed = () => {
  if (localStorage.getItem(DEMO_SEED_KEY)) return
  const snap = snapshotAppData()
  if (Object.keys(snap).length === 0) return
  localStorage.setItem(DEMO_SEED_KEY, JSON.stringify(snap))
}

const getUserIdentity = (userData) => {
  if (!userData) return null
  return userData._id || userData.id || userData.email || null
}

const isDemoUser = (userData) =>
  (userData?.email || '').toLowerCase() === DEMO_EMAIL.toLowerCase()

const todayDateStr = () => new Date().toISOString().slice(0, 10)

const daysBetween = (fromStr, toStr) => {
  const from = new Date(fromStr + 'T00:00:00')
  const to = new Date(toStr + 'T00:00:00')
  return Math.round((to - from) / 86400000)
}

const addDaysStr = (dateStr, days) => {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// Demo tarihlerini bugüne kaydır
const shiftDemoDatesToToday = () => {
  let maxDate = null
  const trackDate = (s) => {
    if (!s) return
    if (!maxDate || s > maxDate) maxDate = s
  }

  let dailyLogs = {}
  let workoutLogs = {}
  let profileHistory = []

  try { dailyLogs = JSON.parse(localStorage.getItem('fitblaze_daily_logs') || '{}') } catch {}
  try { workoutLogs = JSON.parse(localStorage.getItem('fitblaze_workout_logs') || '{}') } catch {}
  try { profileHistory = JSON.parse(localStorage.getItem('fitblaze_profile_history') || '[]') } catch {}

  Object.keys(dailyLogs).forEach(trackDate)
  Object.keys(workoutLogs).forEach(trackDate)
  profileHistory.forEach(h => {
    if (h?.timestamp) trackDate(new Date(h.timestamp).toISOString().slice(0, 10))
  })

  if (!maxDate) return

  const offsetDays = daysBetween(maxDate, todayDateStr())
  if (offsetDays === 0) return
  const offsetMs = offsetDays * 86400000

  // Beslenme günlükleri
  try {
    const shifted = {}
    Object.entries(dailyLogs).forEach(([date, val]) => {
      shifted[addDaysStr(date, offsetDays)] = val
    })
    localStorage.setItem('fitblaze_daily_logs', JSON.stringify(shifted))
  } catch {}

  // Antrenman logları
  try {
    const shifted = {}
    Object.entries(workoutLogs).forEach(([date, arr]) => {
      const newArr = Array.isArray(arr)
        ? arr.map(item => ({
            ...item,
            timestamp: typeof item?.timestamp === 'number' ? item.timestamp + offsetMs : item?.timestamp,
          }))
        : arr
      shifted[addDaysStr(date, offsetDays)] = newArr
    })
    localStorage.setItem('fitblaze_workout_logs', JSON.stringify(shifted))
  } catch {}

  // Profil geçmişi
  try {
    const shifted = profileHistory.map(h => ({
      ...h,
      timestamp: typeof h?.timestamp === 'number' ? h.timestamp + offsetMs : h?.timestamp,
    }))
    localStorage.setItem('fitblaze_profile_history', JSON.stringify(shifted))
  } catch {}
}

const resetDailyPromptFlags = () => {
  PROMPT_FLAG_KEYS.forEach(k => localStorage.removeItem(k))
}

// Demo için ilk profil snapshot'unu üret
const computeUserSnapshot = (userData) => {
  if (!userData) return null
  const weight = Number(userData.weight) || null
  const height = Number(userData.height) || 0
  const age = Number(userData.age) || 0
  const activity = Number(userData.activityLevel) || 1.55
  const m = userData.measurements || {}

  let recommendedCalories = null
  if (weight && height && age) {
    const bmr = userData.gender === 'female'
      ? Math.round(10 * weight + 6.25 * height - 5 * age - 161)
      : Math.round(10 * weight + 6.25 * height - 5 * age + 5)
    const tdee = Math.round(bmr * activity)
    recommendedCalories = tdee
    if (userData.goal === 'muscle_gain') recommendedCalories = tdee + 300
    if (userData.goal === 'fat_loss')    recommendedCalories = tdee - 500
    if (userData.goal === 'recomp')      recommendedCalories = tdee - 200
  }

  // Navy yağ oranı
  let bodyFat = null
  const waistN = Number(m.waist), neckN = Number(m.neck), hipN = Number(m.hip)
  if (userData.gender === 'male' && waistN && neckN && height) {
    const denom = waistN - neckN
    if (denom > 0) {
      const raw = 495 / (1.0324 - 0.19077 * Math.log10(denom) + 0.15456 * Math.log10(height)) - 450
      if (Number.isFinite(raw) && raw > 0) bodyFat = parseFloat(raw.toFixed(1))
    }
  } else if (userData.gender === 'female' && waistN && neckN && hipN && height) {
    const denom = waistN + hipN - neckN
    if (denom > 0) {
      const raw = 495 / (1.29579 - 0.35004 * Math.log10(denom) + 0.22100 * Math.log10(height)) - 450
      if (Number.isFinite(raw) && raw > 0) bodyFat = parseFloat(raw.toFixed(1))
    }
  }

  return {
    timestamp: Date.now(),
    weight,
    chest:    Number(m.chest)    || null,
    waist:    Number(m.waist)    || null,
    hip:      Number(m.hip)      || null,
    upperArm: Number(m.upperArm) || null,
    thigh:    Number(m.thigh)    || null,
    shoulder: Number(m.shoulder) || null,
    calf:     Number(m.calf)     || null,
    wrist:    Number(m.wrist)    || null,
    neck:     Number(m.neck)     || null,
    bodyFat:  bodyFat ?? (Number(m.bodyFat) || null),
    recommendedCalories,
  }
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  // Kullanıcıya göre localStorage'ı hazırla
  const setupStorageForUser = (userData) => {
    if (!userData) return
    const identity = getUserIdentity(userData)
    const previous = localStorage.getItem(ACTIVE_USER_KEY)
    const storedVersion = localStorage.getItem(SCHEMA_VERSION_KEY)
    const schemaOutdated = storedVersion !== CURRENT_SCHEMA_VERSION

    if (isDemoUser(userData)) {
      // Demo girişi: profile_history yoksa demo_state veya seed'den geri yükle
      const alreadyInitialized = !!localStorage.getItem('fitblaze_profile_history')
      if (!alreadyInitialized) {
        const restored = restoreDemoState()
        if (!restored) {
          ensureDemoSeed()
          const rawSeed = localStorage.getItem(DEMO_SEED_KEY)
          if (rawSeed) {
            try { restoreAppData(JSON.parse(rawSeed)) } catch {}
          }
          shiftDemoDatesToToday()
          const initialSnapshot = computeUserSnapshot(userData)
          if (initialSnapshot) {
            localStorage.setItem('fitblaze_profile_history', JSON.stringify([initialSnapshot]))
          }
          localStorage.setItem('fitblaze_demo_start_date', new Date().toISOString().slice(0, 10))
          resetDailyPromptFlags()
        }
      }
      localStorage.setItem(ACTIVE_USER_KEY, DEMO_MARKER)
    } else {
      // Önceki kullanıcı demo ise verisini yedekle
      const previousWasDemo =
        previous === DEMO_MARKER ||
        !!localStorage.getItem('fitblaze_demo_start_date')
      if (previousWasDemo) {
        saveDemoState()
      }
      if (previous !== String(identity) || schemaOutdated) {
        clearAppData()
        // Antrenmanlar boş başlasın
        localStorage.setItem('fitblaze_workouts', '[]')
        localStorage.setItem('fitblaze_workouts_deleted', '[]')
      }
      if (identity) localStorage.setItem(ACTIVE_USER_KEY, String(identity))
    }

    localStorage.setItem(SCHEMA_VERSION_KEY, CURRENT_SCHEMA_VERSION)
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      // Token yokken bile demo verisini seed olarak yedekle
      ensureDemoSeed()
      setLoading(false)
      return
    }
    authAPI.me()
      .then(res => {
        setupStorageForUser(res.data)
        setUser(res.data)
      })
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })
      .finally(() => setLoading(false))
  }, [])

  // Demo verisi değiştikçe demo_state'i senkronla
  useEffect(() => {
    if (!user || !isDemoUser(user)) return
    const syncDemoState = () => saveDemoState()
    syncDemoState()
    window.addEventListener('fitblaze:data-updated', syncDemoState)
    return () => window.removeEventListener('fitblaze:data-updated', syncDemoState)
  }, [user])

  const login = (userData, token) => {
    setupStorageForUser(userData)
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    // Veri sonraki girişte temizlenir
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary)'
      }}>
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <AuthContext.Provider value={{ user, login, logout }}>
        <Router>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
            <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />

            {/* Korumalı sayfalar */}
            <Route path="/dashboard" element={user ? <DashboardLayout /> : <Navigate to="/login" />}>
              <Route index element={<Dashboard />} />
              <Route path="workouts" element={<Workouts />} />
              <Route path="nutrition" element={<Nutrition />} />
              <Route path="nutrition/history" element={<NutritionHistory />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Admin Panel — kullanıcı sisteminden bağımsız */}
            <Route path="/admin" element={<AdminPanel />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  )
}

export default App
