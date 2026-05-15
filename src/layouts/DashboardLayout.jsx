import { useState, useContext } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiGrid, FiUser, FiLogOut, FiUserPlus,
  FiMenu, FiX, FiBarChart2, FiSun, FiMoon, FiChevronRight
} from 'react-icons/fi'
import { GiWeightLiftingUp, GiMeal } from 'react-icons/gi'
import { AuthContext, ThemeContext } from '../App.jsx'
import './DashboardLayout.css'

const navItems = [
  { path: '/dashboard', icon: <FiGrid />, label: 'Dashboard', exact: true },
  { path: '/dashboard/workouts', icon: <GiWeightLiftingUp />, label: 'Antrenmanlar' },
  { path: '/dashboard/nutrition', icon: <GiMeal />, label: 'Beslenme' },
  { path: '/dashboard/analytics', icon: <FiBarChart2 />, label: 'Analiz' },
  { path: '/dashboard/profile', icon: <FiUser />, label: 'Profil' },
]

function getCurrentPageLabel(pathname) {
  const match = [...navItems]
    .sort((a, b) => b.path.length - a.path.length)
    .find(item => item.exact ? pathname === item.path : pathname.startsWith(item.path))
  return match?.label || ''
}

function NavItemList({ items, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()

  return items.map((item) => {
    const isActive = item.exact
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path)

    return (
      <button
        key={item.path}
        className={`nav-item ${isActive ? 'active' : ''}`}
        onClick={() => { navigate(item.path); onClose(); }}
      >
        <span className="nav-icon">{item.icon}</span>
        <span className="nav-label">{item.label}</span>
      </button>
    )
  })
}

export default function DashboardLayout() {
  const { user, logout } = useContext(AuthContext)
  const { theme, toggleTheme } = useContext(ThemeContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const currentPageLabel = getCurrentPageLabel(location.pathname)

  const handleLogout = () => {
    setUserMenuOpen(false)
    logout()
    navigate('/')
  }

  const handleSwitchAccount = () => {
    setUserMenuOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <div className="dashboard-layout">
      {/* Mobil overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Yan menü */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/images/fitblaze-logo.png" alt="FitBlaze Logo" className="logo-img" />
            <span className="logo-text">Fit<span className="logo-accent">Blaze</span></span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <FiX />
          </button>
        </div>

        {/* Kullanıcı kartı */}
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user?.name || 'Avatar'} className="user-avatar-img" />
            ) : (
              user?.name?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'Kullanıcı'}</span>
            <span className="user-email">{user?.email || ''}</span>
          </div>
        </div>

        {/* Menü */}
        <nav className="sidebar-nav">
          <span className="nav-section-title">ANA MENÜ</span>
          <NavItemList items={navItems} onClose={() => setSidebarOpen(false)} />
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <span className="nav-icon"><FiLogOut /></span>
            <span className="nav-label">Çıkış Yap</span>
          </button>
        </div>
      </aside>

      {/* Ana içerik */}
      <main className="main-content">
        <header className="main-header">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            <FiMenu />
          </button>
          {currentPageLabel && (
            <nav className="breadcrumb" aria-label="breadcrumb">
              <span className="breadcrumb-root">Ana Menü</span>
              <FiChevronRight className="breadcrumb-sep" />
              <span className="breadcrumb-current">{currentPageLabel}</span>
            </nav>
          )}
          <div className="header-spacer" />
          <div className="header-actions">
            <button 
              className="theme-toggle-btn" 
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Aydınlık Mod' : 'Karanlık Mod'}
            >
              {theme === 'dark' ? <FiSun /> : <FiMoon />}
            </button>
            <div className="header-user">
              <button
                className="header-avatar-btn"
                onClick={() => setUserMenuOpen(v => !v)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                title={user?.name || 'Kullanıcı'}
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user?.name || 'Avatar'} className="header-avatar-img" />
                ) : (
                  <span className="header-avatar-initial">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </button>
              {userMenuOpen && (
                <>
                  <div className="header-dropdown-backdrop" onClick={() => setUserMenuOpen(false)} />
                  <div className="header-dropdown" role="menu">
                    <div className="header-dropdown-user">
                      <div className="header-dropdown-avatar">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" />
                        ) : (
                          user?.name?.charAt(0)?.toUpperCase() || 'U'
                        )}
                      </div>
                      <div className="header-dropdown-info">
                        <span className="header-dropdown-name">{user?.name || 'Kullanıcı'}</span>
                        <span className="header-dropdown-email">{user?.email || ''}</span>
                      </div>
                    </div>
                    <div className="header-dropdown-divider" />
                    <button className="header-dropdown-item" onClick={() => { setUserMenuOpen(false); navigate('/dashboard/profile') }}>
                      <FiUser /> Profilim
                    </button>
                    <button className="header-dropdown-item" onClick={handleSwitchAccount}>
                      <FiUserPlus /> Farklı Hesaba Geç
                    </button>
                    <button className="header-dropdown-item danger" onClick={handleLogout}>
                      <FiLogOut /> Çıkış Yap
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="main-body">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
