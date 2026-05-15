import { useContext, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts'
import { AuthContext } from '../App.jsx'
import { STORAGE_KEY_WORKOUT_LOGS } from './Workouts.jsx'
import './Analytics.css'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5 }
  })
}

const HISTORY_KEY = 'fitblaze_profile_history'
const DAILY_LOGS_KEY = 'fitblaze_daily_logs'
const DEMO_EMAIL = 'byrmmrt1446@gmail.com'

const pad2 = (n) => String(n).padStart(2, '0')

const formatFullDate = (ts) => {
  const d = new Date(ts)
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`
}

const formatTime = (ts) => {
  const d = new Date(ts)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const ts = payload[0]?.payload?.timestamp
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}{ts ? ` • ${formatTime(ts)}` : ''}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

const loadProfileHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

const loadDailyLogs = () => {
  try {
    const raw = localStorage.getItem(DAILY_LOGS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

const loadWorkoutLogs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WORKOUT_LOGS)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

// Kullanıcının mevcut profil verisinden anlık snapshot üret (geçmiş henüz boşsa)
const buildCurrentSnapshot = (user) => {
  if (!user || !user.weight) return null
  const weight = Number(user.weight)
  const height = Number(user.height) || 0
  const age = Number(user.age) || 0
  const activity = Number(user.activityLevel) || 1.55
  const bmr = user.gender === 'female'
    ? Math.round(10 * weight + 6.25 * height - 5 * age - 161)
    : Math.round(10 * weight + 6.25 * height - 5 * age + 5)
  const tdee = Math.round(bmr * activity)
  let recommendedCalories = tdee
  if (user.goal === 'muscle_gain') recommendedCalories = tdee + 300
  if (user.goal === 'fat_loss')    recommendedCalories = tdee - 500
  if (user.goal === 'recomp')      recommendedCalories = tdee - 200

  const m = user.measurements || {}

  // Navy yağ oranı
  let bodyFat = null
  const waistN = Number(m.waist), neckN = Number(m.neck), hipN = Number(m.hip)
  if (user.gender === 'male' && waistN && neckN && height) {
    const denom = waistN - neckN
    if (denom > 0) {
      const raw = 495 / (1.0324 - 0.19077 * Math.log10(denom) + 0.15456 * Math.log10(height)) - 450
      if (Number.isFinite(raw) && raw > 0) bodyFat = parseFloat(raw.toFixed(1))
    }
  } else if (user.gender === 'female' && waistN && neckN && hipN && height) {
    const denom = waistN + hipN - neckN
    if (denom > 0) {
      const raw = 495 / (1.29579 - 0.35004 * Math.log10(denom) + 0.22100 * Math.log10(height)) - 450
      if (Number.isFinite(raw) && raw > 0) bodyFat = parseFloat(raw.toFixed(1))
    }
  }

  const isDemo = (user.email || '').toLowerCase() === DEMO_EMAIL
  return {
    // Demo için bugün baseline; diğerleri için createdAt
    timestamp: isDemo
      ? Date.now()
      : (user.createdAt ? new Date(user.createdAt).getTime() : Date.now()),
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

export default function Analytics() {
  const { user } = useContext(AuthContext)
  const [period, setPeriod] = useState('weekly')
  const [profileHistory, setProfileHistory] = useState(() => loadProfileHistory())
  const [dailyLogs, setDailyLogs] = useState(() => loadDailyLogs())
  const [workoutLogs, setWorkoutLogs] = useState(() => loadWorkoutLogs())

  const isDemo = (user?.email || '').toLowerCase() === DEMO_EMAIL
  const demoStartDate = isDemo ? localStorage.getItem('fitblaze_demo_start_date') : null

  // Sayfaya geri gelindiğinde / pencere odak aldığında verileri tazele
  useEffect(() => {
    const refresh = () => {
      setProfileHistory(loadProfileHistory())
      setDailyLogs(loadDailyLogs())
      setWorkoutLogs(loadWorkoutLogs())
    }
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', refresh)
    // Profil/beslenme/antrenman tarafından tetiklenen anlık güncellemeler
    window.addEventListener('fitblaze:data-updated', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', refresh)
      window.removeEventListener('fitblaze:data-updated', refresh)
    }
  }, [])

  // user objesindeki değişimde de localStorage'tan yeniden oku
  useEffect(() => {
    setProfileHistory(loadProfileHistory())
    setDailyLogs(loadDailyLogs())
    setWorkoutLogs(loadWorkoutLogs())
  }, [user])

  // Geçmiş henüz boşsa, kullanıcının ŞU ANKİ verisini tek nokta olarak kullan
  const currentSnapshot = buildCurrentSnapshot(user)
  const effectiveHistory = profileHistory.length > 0
    ? profileHistory
    : (currentSnapshot ? [currentSnapshot] : [])

  // Periyoda göre filtrele (haftalık: son 7 gün, aylık: son 30 gün)
  const periodDays = period === 'weekly' ? 7 : 30
  const periodCutoff = Date.now() - periodDays * 24 * 60 * 60 * 1000

  const filteredHistory = useMemo(() => {
    const filtered = effectiveHistory.filter(h => h.timestamp >= periodCutoff)
    // En azından son nokta görünsün diye, hiç giriş yoksa son kaydı kullan
    if (filtered.length === 0 && effectiveHistory.length > 0) {
      return [effectiveHistory[effectiveHistory.length - 1]]
    }
    return filtered
  }, [effectiveHistory, periodCutoff])

  const weightData = filteredHistory
    .filter(h => h.weight != null)
    .map(h => ({ date: formatFullDate(h.timestamp), timestamp: h.timestamp, weight: h.weight }))

  const fatData = filteredHistory
    .filter(h => h.bodyFat != null)
    .map(h => ({ date: formatFullDate(h.timestamp), timestamp: h.timestamp, yag: h.bodyFat }))

  // Radar: ilk kayıt vs. son kayıttaki ölçümleri karşılaştır
  const firstH = filteredHistory[0] || effectiveHistory[0]
  const latestH = filteredHistory[filteredHistory.length - 1] || effectiveHistory[effectiveHistory.length - 1]

  const MEASURE_FIELDS = [
    { key: 'neck',     label: 'Boyun' },
    { key: 'shoulder', label: 'Omuz' },
    { key: 'chest',    label: 'Göğüs' },
    { key: 'upperArm', label: 'Kol' },
    { key: 'wrist',    label: 'Bilek' },
    { key: 'waist',    label: 'Bel' },
    { key: 'hip',      label: 'Kalça' },
    { key: 'thigh',    label: 'Bacak' },
    { key: 'calf',     label: 'Kalf' },
  ]

  const radarData = MEASURE_FIELDS
    .map(f => ({
      measure: f.label,
      ilk:    Number(firstH?.[f.key])  || 0,
      simdiki: Number(latestH?.[f.key]) || 0,
    }))
    .filter(d => d.ilk > 0 || d.simdiki > 0)

  // 2+ kayıt varsa "Şimdiki" barı da göster
  const showCompareInRadar = effectiveHistory.length >= 2

  // Kalori dengesi
  const targetCalories = filteredHistory.length > 0
    ? (filteredHistory[filteredHistory.length - 1].recommendedCalories || 0)
    : (effectiveHistory[effectiveHistory.length - 1]?.recommendedCalories || 0)

  const calorieData = (() => {
    const days = []
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const isoKey = d.toISOString().slice(0, 10)
      // Demo: sadece başlangıç tarihinden sonraki günler
      if (demoStartDate && isoKey < demoStartDate) continue
      const log = dailyLogs[isoKey]
      days.push({
        date: formatFullDate(d.getTime()),
        timestamp: d.getTime(),
        hedef: targetCalories,
        alinan: log?.toplam?.kalori || 0,
      })
    }
    return days
  })()

  // Hedef vs alınan protein
  const latestWeight = Number(latestH?.weight) || Number(user?.weight) || 0
  const proteinTargetMin = Math.round(latestWeight * 1.6)
  const proteinTargetMax = Math.round(latestWeight * 2.2)
  const proteinTargetMid = Math.round(latestWeight * 1.8)

  const proteinData = (() => {
    const days = []
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const isoKey = d.toISOString().slice(0, 10)
      if (demoStartDate && isoKey < demoStartDate) continue
      const log = dailyLogs[isoKey]
      days.push({
        date: formatFullDate(d.getTime()),
        timestamp: d.getTime(),
        hedef: proteinTargetMid,
        alinan: Math.round(log?.toplam?.protein || 0),
      })
    }
    return days
  })()

  // Antrenman takibi
  const workoutData = (() => {
    const days = []
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const isoKey = d.toISOString().slice(0, 10)
      if (demoStartDate && isoKey < demoStartDate) continue
      const list = workoutLogs[isoKey] || []
      const done = list.filter(l => l.completed).length
      const skipped = list.filter(l => !l.completed).length
      days.push({
        date: formatFullDate(d.getTime()),
        timestamp: d.getTime(),
        yapilan: done,
        atlanan: skipped,
      })
    }
    return days
  })()

  // Trend rozeti
  const weightTrend = weightData.length >= 2
    ? (weightData[weightData.length - 1].weight - weightData[0].weight).toFixed(1)
    : null

  const fatTrend = fatData.length >= 2
    ? (fatData[fatData.length - 1].yag - fatData[0].yag).toFixed(1)
    : null

  const hasProfileData = effectiveHistory.length > 0

  // X ekseni aralığı
  const tickGap = periodDays === 7 ? 0 : 4 // aylıkta her 5. günü göster

  return (
    <div className="analytics-page">
      <motion.div className="page-header" initial="hidden" animate="visible" variants={fadeInUp}>
        <div>
          <h1>Analiz & Raporlar</h1>
        </div>
        <div className="period-toggle">
          {[
            { id: 'weekly',  label: 'Haftalık' },
            { id: 'monthly', label: 'Aylık' },
          ].map(p => (
            <button
              key={p.id}
              className={`period-btn ${period === p.id ? 'active' : ''}`}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </motion.div>

      {!hasProfileData ? (
        <motion.div className="analytics-empty" initial="hidden" animate="visible" variants={fadeInUp} custom={1}>
          <h3>Henüz veri yok</h3>
          <p>Grafiklerin oluşması için Profil sayfasından bilgilerini güncelle ve kaydet. Her kaydettiğinde yeni bir veri noktası oluşur.</p>
        </motion.div>
      ) : (
        <div className="charts-grid">
          {/* Kilo Değişimi */}
          <motion.div className="chart-card" initial="hidden" animate="visible" variants={fadeInUp} custom={2}>
            <div className="chart-header">
              <h3>Kilo Değişimi</h3>
              {weightTrend != null && (
                <div className={`chart-trend ${weightTrend < 0 ? 'down' : 'up'}`}>
                  {weightTrend > 0 ? '+' : ''}{weightTrend} kg
                </div>
              )}
            </div>
            {weightData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={weightData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E62E00" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#E62E00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" stroke="#71717A" fontSize={10} tickLine={false} interval={tickGap} />
                  <YAxis stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="weight" stroke="#E62E00" strokeWidth={2} fill="url(#weightGrad)" name="Kilo (kg)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="chart-empty">Bu periyotta kilo verisi yok.</p>
            )}
          </motion.div>

          {/* Yağ Oranı */}
          <motion.div className="chart-card" initial="hidden" animate="visible" variants={fadeInUp} custom={3}>
            <div className="chart-header">
              <h3>Yağ Oranı</h3>
              {fatTrend != null && (
                <div className={`chart-trend ${fatTrend < 0 ? 'down' : 'up'}`}>
                  {fatTrend > 0 ? '+' : ''}{fatTrend}%
                </div>
              )}
            </div>
            {fatData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={fatData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FBBF24" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" stroke="#71717A" fontSize={10} tickLine={false} interval={tickGap} />
                  <YAxis stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="yag" stroke="#FBBF24" strokeWidth={2} fill="url(#fatGrad)" name="Yağ (%)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="chart-empty">Yağ oranı verisi yok — boyun/bel/kalça ölçümlerini gir.</p>
            )}
          </motion.div>

          {/* Kalori Dengesi */}
          <motion.div className="chart-card" initial="hidden" animate="visible" variants={fadeInUp} custom={4}>
            <div className="chart-header">
              <h3>Kalori Dengesi</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={calorieData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="#71717A" fontSize={10} tickLine={false} interval={tickGap} />
                <YAxis stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                <Bar dataKey="hedef" fill="#38BDF8" radius={[4, 4, 0, 0]} name="Hedef Kalori" />
                <Bar dataKey="alinan" fill="#E62E00" radius={[4, 4, 0, 0]} name="Alınan Kalori" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Antrenman Takibi */}
          <motion.div className="chart-card" initial="hidden" animate="visible" variants={fadeInUp} custom={5}>
            <div className="chart-header">
              <h3>Antrenman Takibi</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={workoutData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="#71717A" fontSize={10} tickLine={false} interval={tickGap} />
                <YAxis stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                <Bar dataKey="yapilan" stackId="w" fill="#4ADE80" radius={[4, 4, 0, 0]} name="Yapılan" />
                <Bar dataKey="atlanan" stackId="w" fill="#EF4444" radius={[4, 4, 0, 0]} name="Atlanan" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Hedef Protein */}
          <motion.div className="chart-card" initial="hidden" animate="visible" variants={fadeInUp} custom={6}>
            <div className="chart-header">
              <h3>Hedef Protein</h3>
              {proteinTargetMin > 0 && (
                <div className="chart-trend up" style={{ background: 'rgba(56,189,248,0.12)', color: '#38BDF8' }}>
                  Hedef: {proteinTargetMin}–{proteinTargetMax} g
                </div>
              )}
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={proteinData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="#71717A" fontSize={10} tickLine={false} interval={tickGap} />
                <YAxis stroke="#71717A" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                <Bar dataKey="hedef"  fill="#38BDF8" radius={[4, 4, 0, 0]} name="Hedef Protein (g)" />
                <Bar dataKey="alinan" fill="#E62E00" radius={[4, 4, 0, 0]} name="Alınan Protein (g)" />
                {proteinTargetMin > 0 && (
                  <ReferenceLine y={proteinTargetMin} stroke="#4ADE80" strokeDasharray="4 4" label={{ value: 'Min', position: 'right', fill: '#4ADE80', fontSize: 10 }} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Vücut Ölçümleri — Yatay Bar Karşılaştırması */}
          <motion.div className="chart-card" initial="hidden" animate="visible" variants={fadeInUp} custom={7}>
            <div className="chart-header">
              <h3>Vücut Ölçümleri</h3>
              <div className="radar-legend">
                <span><span className="radar-dot" style={{ background: '#71717A' }} /> İlk Kayıt</span>
                {showCompareInRadar && (
                  <span><span className="radar-dot" style={{ background: '#E62E00' }} /> Şimdiki</span>
                )}
              </div>
            </div>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={radarData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 0 }}
                  barGap={2}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" stroke="#71717A" fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis dataKey="measure" type="category" stroke="#71717A" fontSize={11} width={56} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="ilk" fill="#71717A" radius={[0, 3, 3, 0]} name="İlk (cm)" />
                  {showCompareInRadar && (
                    <Bar dataKey="simdiki" fill="#E62E00" radius={[0, 3, 3, 0]} name="Şimdiki (cm)" />
                  )}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="chart-empty">Vücut ölçüm verisi yok — profilden ölçümleri gir.</p>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
