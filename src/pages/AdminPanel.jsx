import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiUsers, FiMail, FiActivity, FiTrendingUp, FiSearch,
  FiEye, FiEyeOff, FiTrash2, FiChevronLeft, FiChevronRight,
  FiLock, FiUnlock, FiGrid, FiSun, FiMoon, FiLogOut,
  FiBarChart2, FiCalendar, FiClock, FiMessageSquare
} from 'react-icons/fi'
import { GiWeightLiftingUp, GiMeal, GiMuscleUp } from 'react-icons/gi'
import { adminAPI } from '../services/adminApi.js'
import { ThemeContext, AuthContext } from '../App.jsx'
import './AdminPanel.css'

const TABS = [
  { id: 'overview', label: 'Genel Bakış', icon: <FiGrid /> },
  { id: 'users', label: 'Kullanıcılar', icon: <FiUsers /> },
  { id: 'messages', label: 'Mesajlar', icon: <FiMail /> },
  { id: 'workouts', label: 'Antrenmanlar', icon: <GiWeightLiftingUp /> },
  { id: 'nutrition', label: 'Beslenme', icon: <GiMeal /> },
]

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

function OverviewTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getOverview()
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="admin-loading"><div className="loading-spinner" /></div>
  if (!data) return <div className="admin-empty">Veri yüklenemedi.</div>

  const metrics = [
    { label: 'Toplam Üye', value: data.totalUsers, icon: <FiUsers />, color: '#E62E00' },
    { label: 'Aktif (7 gün)', value: data.activeUsersWeek, icon: <FiActivity />, color: '#38BDF8' },
    { label: 'Bugün Kayıt', value: data.newUsersToday, icon: <FiCalendar />, color: '#4ADE80' },
    { label: 'Okunmamış Mesaj', value: data.unreadMessages, icon: <FiMessageSquare />, color: '#FBBF24' },
  ]

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn}>
      <div className="admin-metrics-grid">
        {metrics.map((m, i) => (
          <motion.div
            className="admin-metric-card"
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="metric-icon" style={{ background: `${m.color}18`, color: m.color }}>
              {m.icon}
            </div>
            <div className="metric-info">
              <span className="metric-value">{m.value}</span>
              <span className="metric-label">{m.label}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="admin-chart-section">
        <h3 className="admin-section-title">Son 7 Gün — Yeni Kayıtlar</h3>
        <div className="admin-chart-bar-container">
          {data.registrationChart.map((d, i) => {
            const max = Math.max(...data.registrationChart.map(x => x.count), 1)
            const pct = (d.count / max) * 100
            const dayName = new Date(d.date + 'T00:00:00').toLocaleDateString('tr-TR', { weekday: 'short' })
            return (
              <div className="chart-bar-col" key={i}>
                <span className="chart-bar-value">{d.count}</span>
                <div className="chart-bar-track">
                  <motion.div
                    className="chart-bar-fill"
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(pct, 4)}%` }}
                    transition={{ delay: i * 0.08, duration: 0.5 }}
                  />
                </div>
                <span className="chart-bar-label">{dayName}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="admin-quick-info">
        <div className="quick-info-card">
          <FiMail />
          <div>
            <strong>{data.totalMessages}</strong>
            <span>Toplam Mesaj</span>
          </div>
        </div>
        <div className="quick-info-card">
          <FiUsers />
          <div>
            <strong>{data.totalUsers}</strong>
            <span>Toplam Kullanıcı</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchUsers = (p = 1, s = '') => {
    setLoading(true)
    adminAPI.getUsers({ page: p, search: s })
      .then(r => {
        setUsers(r.data.users)
        setTotalPages(r.data.totalPages)
        setTotal(r.data.total)
        setPage(r.data.page)
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchUsers(1, search)
  }

  const handleFreeze = async (userId) => {
    try {
      const r = await adminAPI.toggleFreezeUser(userId)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isFrozen: r.data.isFrozen } : u))
    } catch {}
  }

  const goalLabels = { muscle_gain: 'Kas Kazanımı', fat_loss: 'Yağ Yakımı', maintain: 'Koruma', recomp: 'Recomp' }
  const formatDate = (d) => new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn}>
      <div className="admin-toolbar">
        <form onSubmit={handleSearch} className="admin-search-form">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="İsim veya e-posta ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="admin-search-input"
          />
        </form>
        <span className="admin-count-badge">{total} kullanıcı</span>
      </div>

      {loading ? (
        <div className="admin-loading"><div className="loading-spinner" /></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Kullanıcı</th>
                <th>E-posta</th>
                <th>Kayıt Tarihi</th>
                <th>Son Güncelleme</th>
                <th>Hedef</th>
                <th>Durum</th>
                <th>Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className={u.isFrozen ? 'row-frozen' : ''}>
                  <td>
                    <div className="user-cell">
                      <div className="user-cell-avatar">
                        {u.avatarUrl ? <img src={u.avatarUrl} alt="" /> : u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span>{u.name}</span>
                    </div>
                  </td>
                  <td className="td-email">{u.email}</td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>{formatDate(u.updatedAt)}</td>
                  <td><span className="goal-badge">{goalLabels[u.goal] || u.goal}</span></td>
                  <td>
                    <span className={`status-badge ${u.isFrozen ? 'frozen' : 'active'}`}>
                      {u.isFrozen ? 'Dondurulmuş' : 'Aktif'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`admin-action-btn ${u.isFrozen ? 'unfreeze' : 'freeze'}`}
                      onClick={() => handleFreeze(u.id)}
                      title={u.isFrozen ? 'Aktif Et' : 'Dondur'}
                    >
                      {u.isFrozen ? <FiUnlock /> : <FiLock />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button disabled={page <= 1} onClick={() => fetchUsers(page - 1, search)}><FiChevronLeft /></button>
          <span>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => fetchUsers(page + 1, search)}><FiChevronRight /></button>
        </div>
      )}
    </motion.div>
  )
}

function MessagesTab() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [expandedId, setExpandedId] = useState(null)

  const fetchMessages = (p = 1, f = '') => {
    setLoading(true)
    adminAPI.getMessages({ page: p, filter: f || undefined })
      .then(r => {
        setMessages(r.data.messages)
        setTotalPages(r.data.totalPages)
        setPage(r.data.page)
      })
      .catch(() => setMessages([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchMessages() }, [])

  const toggleRead = async (id) => {
    try {
      const r = await adminAPI.toggleReadMessage(id)
      setMessages(prev => prev.map(m => m._id === id ? r.data : m))
    } catch {}
  }

  const deleteMsg = async (id) => {
    try {
      await adminAPI.deleteMessage(id)
      setMessages(prev => prev.filter(m => m._id !== id))
    } catch {}
  }

  const formatDate = (d) => new Date(d).toLocaleString('tr-TR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn}>
      <div className="admin-toolbar">
        <div className="admin-filter-group">
          {[
            { val: '', label: 'Tümü' },
            { val: 'unread', label: 'Okunmamış' },
            { val: 'read', label: 'Okunmuş' },
          ].map(f => (
            <button
              key={f.val}
              className={`admin-filter-btn ${filter === f.val ? 'active' : ''}`}
              onClick={() => { setFilter(f.val); fetchMessages(1, f.val) }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="admin-loading"><div className="loading-spinner" /></div>
      ) : messages.length === 0 ? (
        <div className="admin-empty">Mesaj bulunamadı.</div>
      ) : (
        <div className="admin-messages-list">
          {messages.map(m => (
            <motion.div
              key={m._id}
              className={`admin-message-card ${m.isRead ? 'read' : 'unread'}`}
              layout
            >
              <div className="message-header" onClick={() => setExpandedId(expandedId === m._id ? null : m._id)}>
                <div className="message-dot-wrap">
                  {!m.isRead && <span className="unread-dot" />}
                </div>
                <div className="message-meta">
                  <strong>{m.name}</strong>
                  <span className="message-email">{m.email}</span>
                </div>
                <span className="message-date">{formatDate(m.createdAt)}</span>
              </div>
              <AnimatePresence>
                {expandedId === m._id && (
                  <motion.div
                    className="message-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p>{m.message}</p>
                    <div className="message-actions">
                      <button onClick={() => toggleRead(m._id)} className="admin-action-btn read-toggle">
                        {m.isRead ? <><FiEyeOff /> Okunmadı Yap</> : <><FiEye /> Okundu Yap</>}
                      </button>
                      <button onClick={() => deleteMsg(m._id)} className="admin-action-btn delete">
                        <FiTrash2 /> Sil
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button disabled={page <= 1} onClick={() => fetchMessages(page - 1, filter)}><FiChevronLeft /></button>
          <span>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => fetchMessages(page + 1, filter)}><FiChevronRight /></button>
        </div>
      )}
    </motion.div>
  )
}

function WorkoutsTab() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    try {
      const workouts = JSON.parse(localStorage.getItem('fitblaze_workouts') || '[]')
      const logs = JSON.parse(localStorage.getItem('fitblaze_workout_logs') || '{}')

      const exerciseCount = {}
      workouts.forEach(w => {
        (w.exercises || []).forEach(ex => {
          exerciseCount[ex.name] = (exerciseCount[ex.name] || 0) + 1
        })
      })

      const popular = Object.entries(exerciseCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ name, count }))

      const dailyActivity = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        const dayName = d.toLocaleDateString('tr-TR', { weekday: 'short' })
        dailyActivity.push({ day: dayName, count: Array.isArray(logs[key]) ? logs[key].length : 0 })
      }

      setStats({ popular, dailyActivity, totalWorkouts: Object.keys(logs).length })
    } catch {
      setStats({ popular: [], dailyActivity: [], totalWorkouts: 0 })
    }
  }, [])

  if (!stats) return <div className="admin-loading"><div className="loading-spinner" /></div>

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn}>
      <div className="admin-metrics-grid cols-2">
        <div className="admin-metric-card">
          <div className="metric-icon" style={{ background: '#E62E0018', color: '#E62E00' }}><GiWeightLiftingUp /></div>
          <div className="metric-info">
            <span className="metric-value">{stats.totalWorkouts}</span>
            <span className="metric-label">Antrenman Günü</span>
          </div>
        </div>
        <div className="admin-metric-card">
          <div className="metric-icon" style={{ background: '#38BDF818', color: '#38BDF8' }}><FiBarChart2 /></div>
          <div className="metric-info">
            <span className="metric-value">{stats.popular.length}</span>
            <span className="metric-label">Farklı Egzersiz</span>
          </div>
        </div>
      </div>

      <div className="admin-chart-section">
        <h3 className="admin-section-title">Son 7 Gün — Antrenman Aktivitesi</h3>
        <div className="admin-chart-bar-container">
          {stats.dailyActivity.map((d, i) => {
            const max = Math.max(...stats.dailyActivity.map(x => x.count), 1)
            const pct = (d.count / max) * 100
            return (
              <div className="chart-bar-col" key={i}>
                <span className="chart-bar-value">{d.count}</span>
                <div className="chart-bar-track">
                  <motion.div
                    className="chart-bar-fill workout"
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(pct, 4)}%` }}
                    transition={{ delay: i * 0.08, duration: 0.5 }}
                  />
                </div>
                <span className="chart-bar-label">{d.day}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="admin-chart-section">
        <h3 className="admin-section-title"><GiMuscleUp style={{ marginRight: 8 }} /> En Popüler Egzersizler</h3>
        <div className="popular-exercises-list">
          {stats.popular.length === 0 ? (
            <p className="admin-empty">Henüz egzersiz verisi yok.</p>
          ) : stats.popular.map((ex, i) => {
            const maxC = stats.popular[0]?.count || 1
            return (
              <div className="popular-exercise-row" key={i}>
                <span className="exercise-rank">#{i + 1}</span>
                <span className="exercise-name">{ex.name}</span>
                <div className="exercise-bar-track">
                  <motion.div
                    className="exercise-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${(ex.count / maxC) * 100}%` }}
                    transition={{ delay: i * 0.06, duration: 0.4 }}
                  />
                </div>
                <span className="exercise-count">{ex.count}×</span>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

function NutritionTab() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    try {
      const logs = JSON.parse(localStorage.getItem('fitblaze_daily_logs') || '{}')
      const days = Object.entries(logs)

      let totalCal = 0, totalP = 0, totalC = 0, totalF = 0, mealCount = 0, dayCount = days.length

      days.forEach(([, dayData]) => {
        const items = dayData?.items || dayData?.meals || []
        if (Array.isArray(items)) {
          items.forEach(item => {
            totalCal += Number(item.calories) || 0
            totalP += Number(item.protein) || 0
            totalC += Number(item.carbs) || 0
            totalF += Number(item.fat) || 0
            mealCount++
          })
        }
      })

      const avgCal = dayCount ? Math.round(totalCal / dayCount) : 0
      const avgP = dayCount ? Math.round(totalP / dayCount) : 0
      const avgC = dayCount ? Math.round(totalC / dayCount) : 0
      const avgF = dayCount ? Math.round(totalF / dayCount) : 0
      const trackRate = dayCount

      const macroTotal = avgP + avgC + avgF || 1
      const macros = [
        { label: 'Protein', value: avgP, pct: Math.round((avgP / macroTotal) * 100), color: '#4ADE80' },
        { label: 'Karbonhidrat', value: avgC, pct: Math.round((avgC / macroTotal) * 100), color: '#38BDF8' },
        { label: 'Yağ', value: avgF, pct: Math.round((avgF / macroTotal) * 100), color: '#FBBF24' },
      ]

      setStats({ avgCal, macros, trackRate, mealCount })
    } catch {
      setStats({ avgCal: 0, macros: [], trackRate: 0, mealCount: 0 })
    }
  }, [])

  if (!stats) return <div className="admin-loading"><div className="loading-spinner" /></div>

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeIn}>
      <div className="admin-metrics-grid cols-3">
        <div className="admin-metric-card">
          <div className="metric-icon" style={{ background: '#FBBF2418', color: '#FBBF24' }}><GiMeal /></div>
          <div className="metric-info">
            <span className="metric-value">{stats.avgCal}</span>
            <span className="metric-label">Ort. Günlük Kalori</span>
          </div>
        </div>
        <div className="admin-metric-card">
          <div className="metric-icon" style={{ background: '#4ADE8018', color: '#4ADE80' }}><FiTrendingUp /></div>
          <div className="metric-info">
            <span className="metric-value">{stats.trackRate}</span>
            <span className="metric-label">Takip Edilen Gün</span>
          </div>
        </div>
        <div className="admin-metric-card">
          <div className="metric-icon" style={{ background: '#38BDF818', color: '#38BDF8' }}><FiActivity /></div>
          <div className="metric-info">
            <span className="metric-value">{stats.mealCount}</span>
            <span className="metric-label">Toplam Öğün</span>
          </div>
        </div>
      </div>

      <div className="admin-chart-section">
        <h3 className="admin-section-title">Ortalama Makro Dağılımı</h3>
        <div className="macro-distribution">
          <div className="macro-bar-full">
            {stats.macros.map((m, i) => (
              <motion.div
                key={m.label}
                className="macro-bar-segment"
                style={{ background: m.color }}
                initial={{ width: 0 }}
                animate={{ width: `${m.pct}%` }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
              />
            ))}
          </div>
          <div className="macro-legend">
            {stats.macros.map(m => (
              <div className="macro-legend-item" key={m.label}>
                <span className="macro-dot" style={{ background: m.color }} />
                <span className="macro-legend-label">{m.label}</span>
                <span className="macro-legend-value">{m.value}g ({m.pct}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview')
  const { theme, toggleTheme } = useContext(ThemeContext)
  const { logout } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />
      case 'users': return <UsersTab />
      case 'messages': return <MessagesTab />
      case 'workouts': return <WorkoutsTab />
      case 'nutrition': return <NutritionTab />
      default: return <OverviewTab />
    }
  }

  return (
    <div className="admin-panel">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <img src="/images/fitblaze-logo.png" alt="FitBlaze" className="admin-logo-img" />
          <span className="logo-text">Fit<span className="logo-accent">Blaze</span></span>
        </div>
        <span className="admin-sidebar-badge">Admin Panel</span>

        <nav className="admin-sidebar-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`admin-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="admin-nav-icon">{tab.icon}</span>
              <span className="admin-nav-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" onClick={toggleTheme}>
            <span className="admin-nav-icon">{theme === 'dark' ? <FiSun /> : <FiMoon />}</span>
            <span className="admin-nav-label">{theme === 'dark' ? 'Aydınlık Mod' : 'Karanlık Mod'}</span>
          </button>
          <button className="admin-nav-item logout-btn" onClick={handleLogout}>
            <span className="admin-nav-icon"><FiLogOut /></span>
            <span className="admin-nav-label">Çıkış Yap</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <h1 className="admin-page-title">
            {TABS.find(t => t.id === activeTab)?.icon}
            {TABS.find(t => t.id === activeTab)?.label}
          </h1>
          <div className="admin-header-right">
            <span className="admin-date">{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </header>

        <div className="admin-content">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
