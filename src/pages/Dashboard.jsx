import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiCheckCircle, FiX } from 'react-icons/fi'
import { AuthContext } from '../App.jsx'
import { STORAGE_KEY_SAVED, STORAGE_KEY_WORKOUT_LOGS } from './Workouts.jsx'
import './Dashboard.css'

const DAY_LABELS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
const todayLabel = () => DAY_LABELS[new Date().getDay()]
const todayKey = () => new Date().toISOString().slice(0, 10)

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 }
  })
}

export default function Dashboard() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  // Bugünkü antrenmanları ve log'ları oku
  const [todayWorkouts, setTodayWorkouts] = useState([])
  const [workoutLogs, setWorkoutLogs] = useState({})

  // Günlük durum izleme — profil / beslenme / analiz
  const PROFILE_PROMPT_KEY   = 'fitblaze_profile_prompt_dismissed'
  const NUTRITION_PROMPT_KEY = 'fitblaze_nutrition_prompt_dismissed'
  const ANALYTICS_PROMPT_KEY = 'fitblaze_analytics_prompt_dismissed'
  const ANALYTICS_VIEWED_KEY = 'fitblaze_analytics_viewed_date'

  const [profileTodayStatus,   setProfileTodayStatus]   = useState('pending')
  const [nutritionTodayStatus, setNutritionTodayStatus] = useState('pending')
  const [analyticsTodayStatus, setAnalyticsTodayStatus] = useState('pending')

  const checkDailyStatuses = () => {
    const today = todayKey()
    // Profil
    try {
      const dismiss = localStorage.getItem(PROFILE_PROMPT_KEY)
      const history = JSON.parse(localStorage.getItem('fitblaze_profile_history') || '[]')
      const lastDate = history.length > 0
        ? new Date(history[history.length - 1].timestamp).toISOString().slice(0, 10)
        : null
      if (lastDate === today) setProfileTodayStatus('updated')
      else if (dismiss === today) setProfileTodayStatus('skipped')
      else setProfileTodayStatus('pending')
    } catch { setProfileTodayStatus('pending') }
    // Beslenme
    try {
      const dismiss = localStorage.getItem(NUTRITION_PROMPT_KEY)
      const logs = JSON.parse(localStorage.getItem('fitblaze_daily_logs') || '{}')
      if (logs[today]) setNutritionTodayStatus('logged')
      else if (dismiss === today) setNutritionTodayStatus('skipped')
      else setNutritionTodayStatus('pending')
    } catch { setNutritionTodayStatus('pending') }
    // Analiz
    try {
      const dismiss = localStorage.getItem(ANALYTICS_PROMPT_KEY)
      const viewed = localStorage.getItem(ANALYTICS_VIEWED_KEY)
      if (viewed === today) setAnalyticsTodayStatus('viewed')
      else if (dismiss === today) setAnalyticsTodayStatus('skipped')
      else setAnalyticsTodayStatus('pending')
    } catch { setAnalyticsTodayStatus('pending') }
  }

  useEffect(() => {
    checkDailyStatuses()
    const onFocus = () => checkDailyStatuses()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  // Profil
  const dismissProfilePrompt = () => {
    localStorage.setItem(PROFILE_PROMPT_KEY, todayKey())
    setProfileTodayStatus('skipped')
  }
  const resetProfilePrompt = () => {
    localStorage.removeItem(PROFILE_PROMPT_KEY)
    checkDailyStatuses()
  }
  const goToProfile = () => navigate('/dashboard/profile')

  // Beslenme
  const dismissNutritionPrompt = () => {
    localStorage.setItem(NUTRITION_PROMPT_KEY, todayKey())
    setNutritionTodayStatus('skipped')
  }
  const resetNutritionPrompt = () => {
    localStorage.removeItem(NUTRITION_PROMPT_KEY)
    checkDailyStatuses()
  }
  const goToNutrition = () => navigate('/dashboard/nutrition')

  // Analiz
  const dismissAnalyticsPrompt = () => {
    localStorage.setItem(ANALYTICS_PROMPT_KEY, todayKey())
    setAnalyticsTodayStatus('skipped')
  }
  const resetAnalyticsPrompt = () => {
    localStorage.removeItem(ANALYTICS_PROMPT_KEY)
    checkDailyStatuses()
  }
  const goToAnalytics = () => {
    localStorage.setItem(ANALYTICS_VIEWED_KEY, todayKey())
    navigate('/dashboard/analytics')
  }

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_SAVED) || '[]')
      const dayLabel = todayLabel()
      setTodayWorkouts(saved.filter(w => Array.isArray(w.days) && w.days.includes(dayLabel)))
    } catch { setTodayWorkouts([]) }
    try {
      setWorkoutLogs(JSON.parse(localStorage.getItem(STORAGE_KEY_WORKOUT_LOGS) || '{}'))
    } catch { setWorkoutLogs({}) }
  }, [])

  const logWorkout = (workout, completed) => {
    const key = todayKey()
    const next = { ...workoutLogs }
    const dayList = Array.isArray(next[key]) ? [...next[key]] : []
    const existingIdx = dayList.findIndex(l => l.workoutId === workout.id)
    const entry = {
      workoutId: workout.id,
      workoutName: workout.name,
      completed,
      timestamp: Date.now(),
    }
    if (existingIdx >= 0) dayList[existingIdx] = entry
    else dayList.push(entry)
    next[key] = dayList
    setWorkoutLogs(next)
    localStorage.setItem(STORAGE_KEY_WORKOUT_LOGS, JSON.stringify(next))
    window.dispatchEvent(new Event('fitblaze:data-updated'))
  }

  const getTodayLog = (workoutId) => {
    const list = workoutLogs[todayKey()] || []
    return list.find(l => l.workoutId === workoutId)
  }

  return (
    <div className="dashboard">
      {/* Karşılama */}
      <motion.div
        className="dashboard-welcome"
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
      >
        <div>
          <h1 className="welcome-name">Hoş Geldin, {user?.name?.split(' ')[0] || 'Kullanıcı'}!</h1>
        </div>
        <div className="welcome-date">
          {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </motion.div>

      {/* Günlük Profil Güncelleme Kartı */}
      <motion.div
        className="today-workout-card twc-accent twc-accent-red"
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        custom={0.2}
      >
        <div className="twc-header">
          <div>
            <h3>Günlük Profil Güncellemesi</h3>
            <p>Kişisel bilgilerini bugün güncellemek ister misin?</p>
          </div>
        </div>
        <div className="twc-list">
          <div className="twc-item">
            <div className="twc-item-info">
              <span className="twc-item-name">Kilo, vücut ölçümleri ve hedefler</span>
              <span className="twc-item-sub">Günde en fazla 1 güncelleme, ilerleme takibi için önemli</span>
            </div>
            {profileTodayStatus === 'updated' ? (
              <div className="twc-item-status done">
                <FiCheckCircle /> Bugün güncellendi
                <button className="twc-undo" onClick={goToProfile} title="Tekrar düzenle">
                  Yeniden düzenle
                </button>
              </div>
            ) : profileTodayStatus === 'skipped' ? (
              <div className="twc-item-status skipped">
                <FiX /> Bugün atlandı
                <button className="twc-undo" onClick={resetProfilePrompt} title="Geri al">
                  Geri al
                </button>
              </div>
            ) : (
              <div className="twc-item-actions">
                <button className="twc-btn twc-btn-yes" onClick={goToProfile}>
                  <FiCheckCircle /> Evet, güncelle
                </button>
                <button className="twc-btn twc-btn-no" onClick={dismissProfilePrompt}>
                  <FiX /> Hayır
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Bugünkü Antrenman Sorgusu */}
      {todayWorkouts.length > 0 && (
        <motion.div
          className="today-workout-card twc-accent twc-accent-orange"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          custom={0.5}
        >
          <div className="twc-header">
            <div>
              <h3>Bugünkü Antrenman</h3>
              <p>Bugün planlı antrenmanlarını yaptın mı?</p>
            </div>
          </div>
          <div className="twc-list">
            {todayWorkouts.map(workout => {
              const log = getTodayLog(workout.id)
              return (
                <div className="twc-item" key={workout.id}>
                  <div className="twc-item-info">
                    <span className="twc-item-name">{workout.name}</span>
                    <span className="twc-item-sub">{workout.exercises?.length || 0} egzersiz</span>
                  </div>
                  {log ? (
                    <div className={`twc-item-status ${log.completed ? 'done' : 'skipped'}`}>
                      {log.completed ? <><FiCheckCircle /> Yapıldı</> : <><FiX /> Yapılmadı</>}
                      <button className="twc-undo" onClick={() => logWorkout(workout, !log.completed)} title="Değiştir">
                        Değiştir
                      </button>
                    </div>
                  ) : (
                    <div className="twc-item-actions">
                      <button className="twc-btn twc-btn-yes" onClick={() => logWorkout(workout, true)}>
                        <FiCheckCircle /> Yaptım
                      </button>
                      <button className="twc-btn twc-btn-no" onClick={() => logWorkout(workout, false)}>
                        <FiX /> Yapmadım
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Beslenme Kaydı Kartı */}
      <motion.div
        className="today-workout-card twc-accent twc-accent-green"
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        custom={0.7}
      >
        <div className="twc-header">
          <div>
            <h3>Beslenme Kaydı</h3>
            <p>Bugün yediklerini kaydettin mi?</p>
          </div>
        </div>
        <div className="twc-list">
          <div className="twc-item">
            <div className="twc-item-info">
              <span className="twc-item-name">Günlük yemek günlüğü</span>
              <span className="twc-item-sub">Kalori, protein, karbonhidrat, yağ takibi</span>
            </div>
            {nutritionTodayStatus === 'logged' ? (
              <div className="twc-item-status done">
                <FiCheckCircle /> Kayıt var
                <button className="twc-undo" onClick={goToNutrition} title="Düzenle">
                  Düzenle
                </button>
              </div>
            ) : nutritionTodayStatus === 'skipped' ? (
              <div className="twc-item-status skipped">
                <FiX /> Bugün atlandı
                <button className="twc-undo" onClick={resetNutritionPrompt} title="Geri al">
                  Geri al
                </button>
              </div>
            ) : (
              <div className="twc-item-actions">
                <button className="twc-btn twc-btn-yes" onClick={goToNutrition}>
                  <FiCheckCircle /> Evet, kaydet
                </button>
                <button className="twc-btn twc-btn-no" onClick={dismissNutritionPrompt}>
                  <FiX /> Hayır
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Analiz Kontrolü Kartı */}
      <motion.div
        className="today-workout-card twc-accent twc-accent-blue"
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        custom={1}
      >
        <div className="twc-header">
          <div>
            <h3>Analiz Kontrolü</h3>
            <p>İlerlemeni bugün incelemek ister misin?</p>
          </div>
        </div>
        <div className="twc-list">
          <div className="twc-item">
            <div className="twc-item-info">
              <span className="twc-item-name">Kilo, yağ oranı ve antrenman grafikleri</span>
              <span className="twc-item-sub">Vücut ve performans gelişimini gör</span>
            </div>
            {analyticsTodayStatus === 'viewed' ? (
              <div className="twc-item-status done">
                <FiCheckCircle /> Bugün görüldü
                <button className="twc-undo" onClick={goToAnalytics} title="Tekrar gör">
                  Tekrar gör
                </button>
              </div>
            ) : analyticsTodayStatus === 'skipped' ? (
              <div className="twc-item-status skipped">
                <FiX /> Bugün atlandı
                <button className="twc-undo" onClick={resetAnalyticsPrompt} title="Geri al">
                  Geri al
                </button>
              </div>
            ) : (
              <div className="twc-item-actions">
                <button className="twc-btn twc-btn-yes" onClick={goToAnalytics}>
                  <FiCheckCircle /> Evet, göster
                </button>
                <button className="twc-btn twc-btn-no" onClick={dismissAnalyticsPrompt}>
                  <FiX /> Hayır
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
