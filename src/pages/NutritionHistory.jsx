import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiTrash2, FiCalendar } from 'react-icons/fi'
import ConfirmPopover from '../components/ConfirmPopover.jsx'
import './NutritionHistory.css'

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.45 } })
}

function formatTarih(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'short' })
}

function gunFarki(dateStr) {
  const bugun = new Date()
  bugun.setHours(0, 0, 0, 0)
  const tarih = new Date(dateStr + 'T00:00:00')
  return Math.abs(Math.floor((bugun - tarih) / (1000 * 60 * 60 * 24)))
}

function getSavedLogs() {
  try { return JSON.parse(localStorage.getItem('fitblaze_daily_logs') || '{}') } catch { return {} }
}

function setSavedLogsStorage(logs) {
  localStorage.setItem('fitblaze_daily_logs', JSON.stringify(logs))
}

export default function NutritionHistory() {
  const navigate = useNavigate()
  const [savedLogs, setSavedLogs] = useState(() => getSavedLogs())
  const [confirmDeleteDay, setConfirmDeleteDay] = useState(null)

  // Tüm kayıtları tarihe göre sırala (eskiden yeniye)
  const allDates = Object.keys(savedLogs).sort((a, b) => a.localeCompare(b))

  const deleteSavedDay = (date) => {
    const logs = getSavedLogs()
    delete logs[date]
    setSavedLogsStorage(logs)
    setSavedLogs({ ...logs })
    setConfirmDeleteDay(null)
  }

  // Aylara göre grupla
  const groupedByMonth = {}
  allDates.forEach(date => {
    const d = new Date(date + 'T00:00:00')
    const key = d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
    if (!groupedByMonth[key]) groupedByMonth[key] = []
    groupedByMonth[key].push(date)
  })

  const monthKeys = Object.keys(groupedByMonth)

  // Toplam istatistikler
  const totalDays = allDates.length
  const totalCalories = allDates.reduce((sum, date) => sum + (savedLogs[date]?.toplam?.kalori || 0), 0)
  const avgCalories = totalDays > 0 ? Math.round(totalCalories / totalDays) : 0

  return (
    <div className="nutrition-history-page">
      <motion.div className="page-header" initial="hidden" animate="visible" variants={fadeInUp}>
        <div className="nh-header-left">
          <button className="nh-back-btn" onClick={() => navigate('/dashboard/nutrition')}>
            <FiArrowLeft />
          </button>
          <div>
            <h1>Geçmiş Beslenmelerim</h1>
            <p className="page-subtitle">Tüm beslenme kayıtlarını incele</p>
          </div>
        </div>
      </motion.div>

      {/* İstatistik Kartları */}
      <motion.div className="nh-stats" initial="hidden" animate="visible" variants={fadeInUp} custom={1}>
        <div className="nh-stat-card">
          <span className="nh-stat-value">{totalDays}</span>
          <span className="nh-stat-label">Kayıtlı Gün</span>
        </div>
        <div className="nh-stat-card">
          <span className="nh-stat-value">{totalCalories.toLocaleString('tr-TR')}</span>
          <span className="nh-stat-label">Toplam Kalori</span>
        </div>
        <div className="nh-stat-card">
          <span className="nh-stat-value">{avgCalories}</span>
          <span className="nh-stat-label">Ort. Günlük Kalori</span>
        </div>
      </motion.div>

      {/* Kayıtlar */}
      {totalDays === 0 ? (
        <motion.div className="nh-empty" initial="hidden" animate="visible" variants={fadeInUp} custom={2}>
          <FiCalendar />
          <p>Henüz kaydedilmiş beslenme günü yok.</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard/nutrition')}>
            Beslenme Sayfasına Git
          </button>
        </motion.div>
      ) : (
        <div className="nh-timeline">
          {monthKeys.map((month, mi) => (
            <motion.div
              key={month}
              className="nh-month-group"
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              custom={mi * 0.5 + 2}
            >
              <h3 className="nh-month-title">
                <FiCalendar />
                {month}
                <span className="nh-month-count">{groupedByMonth[month].length} gün</span>
              </h3>
              <div className="nh-month-cards">
                {groupedByMonth[month].map(date => {
                  const log = savedLogs[date]
                  const fark = gunFarki(date)
                  const label = fark === 0 ? 'Bugün' : fark === 1 ? 'Dün' : `${fark} gün önce`

                  return (
                    <div key={date} className="nh-day-card">
                      <div className="nh-day-header">
                        <div>
                          <span className="nh-day-date">{formatTarih(date)}</span>
                          <span className="nh-day-ago">{label}</span>
                        </div>
                        <div className="exercise-delete-wrap">
                          <button className="saved-day-delete" onClick={() => setConfirmDeleteDay(date)} title="Kaydı sil">
                            <FiTrash2 />
                          </button>
                          {confirmDeleteDay === date && (
                            <ConfirmPopover
                              title={`${formatTarih(date)} tarihli kaydı silmek istediğine emin misin?`}
                              onConfirm={() => deleteSavedDay(date)}
                              onCancel={() => setConfirmDeleteDay(null)}
                              placement="left"
                            />
                          )}
                        </div>
                      </div>

                      <div className="nh-day-macros">
                        <span className="nh-macro nh-macro-cal">{log.toplam?.kalori || 0} kcal</span>
                        <span className="nh-macro">P: {(log.toplam?.protein || 0).toFixed(1)}g</span>
                        <span className="nh-macro">K: {(log.toplam?.karbonhidrat || 0).toFixed(1)}g</span>
                        <span className="nh-macro">Y: {(log.toplam?.yag || 0).toFixed(1)}g</span>
                        <span className="nh-macro">L: {(log.toplam?.lif || 0).toFixed ? (log.toplam?.lif || 0).toFixed(1) : 0}g</span>
                        <span className="nh-macro">Ş: {(log.toplam?.seker || 0).toFixed ? (log.toplam?.seker || 0).toFixed(1) : 0}g</span>
                      </div>

                      <div className="nh-day-foods">
                        {(log.items || []).map((item, idx) => (
                          <span key={idx} className="nh-food-tag">
                            {item.ad} ({item.miktar}g)
                            <span className="nh-food-cal">{item.kalori} kcal</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
