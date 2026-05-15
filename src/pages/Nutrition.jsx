import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiHeart, FiX, FiPlus, FiMinus, FiTrash2, FiSave, FiClock, FiChevronDown, FiChevronUp, FiEdit2 } from 'react-icons/fi'
import { GiMeal } from 'react-icons/gi'
import ConfirmPopover from '../components/ConfirmPopover.jsx'
import { useBeslenme } from '../hooks/useBeslenme'
import { besinOnerileri } from '../services/beslenmeApi'
import './Nutrition.css'

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

function setSavedLogs(logs) {
  localStorage.setItem('fitblaze_daily_logs', JSON.stringify(logs))
  window.dispatchEvent(new Event('fitblaze:data-updated'))
}

// Son 7 kaydı "Kaydedilen Günler", gerisini "Geçmiş Beslenmelerim" olarak ayır
function splitLogs(logs) {
  const recentLogs = {}
  const oldLogs = {}
  const entries = Object.entries(logs).sort((a, b) => b[0].localeCompare(a[0]))

  entries.forEach(([date, data], idx) => {
    if (idx < 7) {
      recentLogs[date] = data
    } else {
      oldLogs[date] = data
    }
  })
  return { recentLogs, oldLogs }
}

export default function Nutrition() {
  const navigate = useNavigate()
  const { yukleniyor, hata, secilenBesin, gunluk, toplam, ara, gunlugeEkle, gunluktenSil, gunlukTemizle } = useBeslenme()
  const [confirmDeleteDay, setConfirmDeleteDay] = useState(null)
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [populerBesinler, setPopulerBesinler] = useState([])
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fitblaze_favs') || '[]') } catch { return [] }
  })
  const [activeTab, setActiveTab] = useState('search')
  const [selectedFood, setSelectedFood] = useState(null)
  const [miktar, setMiktar] = useState(100)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [savedLogEntries, setSavedLogEntries] = useState(() => getSavedLogs())
  const searchTimerRef = useRef(null)

  // Popüler besinleri başlangıçta yükle
  useEffect(() => {
    const loadPopular = async () => {
      try {
        const populerSorgular = [
          'tavuk', 'yumurta', 'pirinç', 'elma', 'yulaf', 'mercimek',
          'süt', 'somon', 'muz', 'peynir', 'makarna', 'zeytinyağı',
          'yoğurt', 'ekmek', 'domates', 'salatalık', 'bal', 'ceviz',
          'patates', 'brokoli', 'havuç', 'nohut', 'bulgur', 'fındık',
          'ton balığı', 'avokado', 'ispanak', 'kabak', 'karpuz', 'üzüm',
          'bezelye', 'fasulye', 'arpa', 'çilek', 'portakal', 'kivi'
        ]
        const results = []
        for (const sorgu of populerSorgular) {
          const oneriler = await besinOnerileri(sorgu)
          if (oneriler && oneriler.length > 0) {
            // "domuz" içeren sonuçları filtrele
            const filtered = oneriler.find(o => !o.ad?.toLowerCase().includes('domuz'))
            if (filtered) results.push(filtered)
          }
        }
        setPopulerBesinler(results)
      } catch (err) {
        console.warn('Popüler besinler yüklenemedi:', err)
      }
    }
    loadPopular()
  }, [])

  // Anlık arama
  const handleSearch = useCallback((term) => {
    setSearchTerm(term)
    if (!term.trim()) {
      setSearchResults([])
      return
    }

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)

    if (term.trim().length >= 2) {
      searchTimerRef.current = setTimeout(async () => {
        try {
          const oneriler = await besinOnerileri(term)
          setSearchResults(oneriler || [])
          ara(term)
        } catch {
          ara(term)
        }
      }, 300)
    }
  }, [ara])

  // API sonucunu arama sonuçlarına ekle
  useEffect(() => {
    if (secilenBesin && searchTerm.trim()) {
      setSearchResults(prev => {
        const alreadyExists = prev.some(f => f.ad === secilenBesin.ad)
        if (alreadyExists) return prev
        return [{ ...secilenBesin, id: `api-${secilenBesin.ad}` }, ...prev]
      })
    }
  }, [secilenBesin, searchTerm])

  const saveFavorites = (favs) => {
    setFavorites(favs)
    localStorage.setItem('fitblaze_favs', JSON.stringify(favs))
  }

  const toggleFavorite = (food) => {
    const exists = favorites.some(f => f.id === food.id || f.ad === food.ad)
    if (exists) {
      saveFavorites(favorites.filter(f => (f.id || f.ad) !== (food.id || food.ad)))
    } else {
      saveFavorites([...favorites, food])
    }
  }

  const isFavorite = (food) => favorites.some(f => (f.id || f.ad) === (food.id || food.ad))

  const selectFood = (food) => {
    setSelectedFood(food)
    setMiktar(100)
  }

  const computedMacros = selectedFood ? {
    kalori:       Math.round(selectedFood.kalori * miktar / 100),
    protein:      +((selectedFood.protein || 0) * miktar / 100).toFixed(1),
    karbonhidrat: +((selectedFood.karbonhidrat || 0) * miktar / 100).toFixed(1),
    yag:          +((selectedFood.yag || 0) * miktar / 100).toFixed(1),
    lif:          +((selectedFood.lif || 0) * miktar / 100).toFixed(1),
    seker:        +((selectedFood.seker || 0) * miktar / 100).toFixed(1),
  } : null

  const addToDaily = () => {
    if (!selectedFood || !computedMacros) return
    gunlugeEkle(selectedFood, miktar, selectedDate)
    setSelectedFood(null)
    setSearchTerm('')
    setSearchResults([])
  }

  const saveDay = () => {
    if (gunluk.length === 0) return
    const logs = getSavedLogs()
    logs[selectedDate] = { items: gunluk, toplam, savedAt: new Date().toISOString() }
    setSavedLogs(logs)
    setSavedLogEntries({ ...logs })
    gunlukTemizle()
  }

  const deleteSavedDay = (date) => {
    const logs = getSavedLogs()
    delete logs[date]
    setSavedLogs(logs)
    setSavedLogEntries({ ...logs })
    setConfirmDeleteDay(null)
  }

  const editSavedDay = (date) => {
    const logs = getSavedLogs()
    const log = logs[date]
    if (!log) return
    // Günlüğe yükle — kayıtlı item'lar hesaplanmış değerlere sahip,
    // gunlugeEkle tekrar hesaplayacağı için 100g bazına çeviriyoruz
    log.items.forEach(item => {
      const oran = (item.miktar || 100) / 100
      const besinPer100g = {
        ad: item.ad,
        kalori: oran > 0 ? Math.round(item.kalori / oran) : item.kalori,
        protein: oran > 0 ? +(item.protein / oran).toFixed(1) : item.protein,
        karbonhidrat: oran > 0 ? +(item.karbonhidrat / oran).toFixed(1) : item.karbonhidrat,
        yag: oran > 0 ? +(item.yag / oran).toFixed(1) : item.yag,
        lif: oran > 0 ? +((item.lif || 0) / oran).toFixed(1) : (item.lif || 0),
        seker: oran > 0 ? +((item.seker || 0) / oran).toFixed(1) : (item.seker || 0),
      }
      gunlugeEkle(besinPer100g, item.miktar || 100)
    })
    setSelectedDate(date)
    // Kaydı sil
    delete logs[date]
    setSavedLogs(logs)
    setSavedLogEntries({ ...logs })
  }

  const { recentLogs } = splitLogs(savedLogEntries)
  const recentDates = Object.keys(recentLogs).sort((a, b) => b.localeCompare(a))
  const allLogCount = Object.keys(savedLogEntries).length

  const displayList = searchTerm.trim()
    ? searchResults
    : populerBesinler

  return (
    <div className="nutrition-page">
      <motion.div className="page-header" initial="hidden" animate="visible" variants={fadeInUp}>
        <div>
          <h1>Beslenme</h1>
          <p className="page-subtitle">Besinleri takip et, hedefine ulaş</p>
        </div>
      </motion.div>

      <div className="nutrition-layout">
        {/* Left: Search / Favorites */}
        <motion.div className="nutrition-left" initial="hidden" animate="visible" variants={fadeInUp} custom={1}>
          {/* Sekmeler */}
          <div className="nutr-tabs">
            <button className={`nutr-tab ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
              <FiSearch /> Ara
            </button>
            <button className={`nutr-tab ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>
              <FiHeart /> Favoriler {favorites.length > 0 && <span className="fav-count">{favorites.length}</span>}
            </button>
          </div>

          {/* Arama sekmesi */}
          {activeTab === 'search' && (
            <div className="search-section">
              <div className="search-bar">
                <FiSearch className="sb-icon" />
                <input
                  type="text"
                  placeholder="Besin adı yaz... (örn: elma, tavuk, yulaf)"
                  value={searchTerm}
                  onChange={e => handleSearch(e.target.value)}
                  className="sb-input"
                  autoFocus
                />
                {searchTerm && (
                  <button className="sb-clear" onClick={() => { setSearchTerm(''); setSearchResults([]) }}>
                    <FiX />
                  </button>
                )}
              </div>

              {hata && <div className="nutr-error">{hata}</div>}

              <div className="food-list">
              {yukleniyor && (
                  <div className="food-loading">
                    <div className="food-loading-spinner" />
                    <p>Aranıyor...</p>
                  </div>
                )}
                {searchTerm && displayList.length === 0 && !yukleniyor && (
                  <div className="food-empty">
                    <GiMeal />
                    <p>"{searchTerm}" için sonuç bulunamadı</p>
                  </div>
                )}
                {!searchTerm && (
                  <p className="food-list-title">Popüler Besinler</p>
                )}
                {searchTerm && displayList.length > 0 && (
                  <p className="food-list-title">
                    {displayList.length} sonuç bulundu
                  </p>
                )}
                {displayList.map((food, i) => (
                  <motion.div
                    key={food.id || food.ad || i}
                    className={`food-row ${selectedFood?.ad === food.ad ? 'selected' : ''}`}
                    onClick={() => selectFood(food)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <div className="food-row-info">
                      <span className="food-row-name">{food.ad}</span>
                      <span className="food-row-macros">
                        {food.kalori} kcal · P:{food.protein}g · K:{food.karbonhidrat}g · Y:{food.yag}g · L:{food.lif || 0}g · Ş:{food.seker || 0}g
                      </span>
                    </div>
                    <div className="food-row-actions">
                      <button
                        className={`fav-btn ${isFavorite(food) ? 'fav-active' : ''}`}
                        onClick={e => { e.stopPropagation(); toggleFavorite(food) }}
                        title="Favorilere ekle"
                      >
                        <FiHeart />
                      </button>
                      <button className="add-quick-btn" onClick={e => { e.stopPropagation(); gunlugeEkle(food, 100) }}>
                        <FiPlus />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Favoriler sekmesi */}
          {activeTab === 'favorites' && (
            <div className="search-section">
              {favorites.length === 0 ? (
                <div className="food-empty">
                  <FiHeart />
                  <p>Henüz favori besin yok. Besinlerin yanındaki kalp ikonuna tıklayarak favorilere ekleyebilirsin.</p>
                </div>
              ) : (
                <div className="food-list">
                  <p className="food-list-title">Favori Besinlerim ({favorites.length})</p>
                  {favorites.map((food, i) => (
                    <motion.div
                      key={food.id || i}
                      className={`food-row ${selectedFood?.ad === food.ad ? 'selected' : ''}`}
                      onClick={() => selectFood(food)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <div className="food-row-info">
                        <span className="food-row-name">{food.ad}</span>
                        <span className="food-row-macros">
                          {food.kalori} kcal · P:{food.protein}g · K:{food.karbonhidrat}g · Y:{food.yag}g · L:{food.lif || 0}g · Ş:{food.seker || 0}g
                        </span>
                      </div>
                      <div className="food-row-actions">
                        <button className="fav-btn fav-active" onClick={e => { e.stopPropagation(); toggleFavorite(food) }} title="Favoriden çıkar">
                          <FiHeart />
                        </button>
                        <button className="add-quick-btn" onClick={e => { e.stopPropagation(); gunlugeEkle(food, 100) }}>
                          <FiPlus />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

        </motion.div>

        {/* Right: Selected Food Details + Daily Log + Saved Logs */}
        <div className="nutrition-right">
          {/* Besin detay kartı */}
          <AnimatePresence>
            {selectedFood && computedMacros && (
              <motion.div
                className="food-detail-card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
              >
                <div className="fdc-header">
                  <div>
                    <h3 className="fdc-name">{selectedFood.ad}</h3>
                  </div>
                  <button className="fav-btn fdc-fav-btn" onClick={() => toggleFavorite(selectedFood)}>
                    <FiHeart style={{ fill: isFavorite(selectedFood) ? 'currentColor' : 'none' }} />
                  </button>
                </div>

                {/* Miktar */}
                <div className="miktar-row">
                  <span className="miktar-label-txt">Miktar</span>
                  <div className="miktar-controls">
                    <button className="miktar-btn" onClick={() => setMiktar(m => Math.max(10, m - 10))}>
                      <FiMinus />
                    </button>
                    <div className="miktar-display">
                      <input
                        type="number"
                        value={miktar}
                        min={10}
                        max={2000}
                        onChange={e => setMiktar(Number(e.target.value))}
                        className="miktar-input-num"
                      />
                      <span className="miktar-unit">g</span>
                    </div>
                    <button className="miktar-btn" onClick={() => setMiktar(m => Math.min(2000, m + 10))}>
                      <FiPlus />
                    </button>
                  </div>
                </div>

                {/* Makrolar */}
                <div className="fdc-macros">
                  <div className="fdc-macro fdc-macro-cal">
                    <span className="fdc-macro-val">{computedMacros.kalori}</span>
                    <span className="fdc-macro-unit">kcal</span>
                    <span className="fdc-macro-name">Kalori</span>
                  </div>
                  <div className="fdc-macro fdc-macro-pro">
                    <span className="fdc-macro-val">{computedMacros.protein}</span>
                    <span className="fdc-macro-unit">g</span>
                    <span className="fdc-macro-name">Protein</span>
                  </div>
                  <div className="fdc-macro fdc-macro-carb">
                    <span className="fdc-macro-val">{computedMacros.karbonhidrat}</span>
                    <span className="fdc-macro-unit">g</span>
                    <span className="fdc-macro-name">Karbonhidrat</span>
                  </div>
                  <div className="fdc-macro fdc-macro-fat">
                    <span className="fdc-macro-val">{computedMacros.yag}</span>
                    <span className="fdc-macro-unit">g</span>
                    <span className="fdc-macro-name">Yağ</span>
                  </div>
                  <div className="fdc-macro fdc-macro-fiber">
                    <span className="fdc-macro-val">{computedMacros.lif}</span>
                    <span className="fdc-macro-unit">g</span>
                    <span className="fdc-macro-name">Lif</span>
                  </div>
                  <div className="fdc-macro fdc-macro-sugar">
                    <span className="fdc-macro-val">{computedMacros.seker}</span>
                    <span className="fdc-macro-unit">g</span>
                    <span className="fdc-macro-name">Şeker</span>
                  </div>
                </div>

                <button className="btn btn-primary fdc-add-btn" onClick={addToDaily}>
                  <FiPlus /> Günlüğe Ekle ({miktar}g)
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Daily Log (active session) */}
          {gunluk.length > 0 && (
            <motion.div
              className="daily-log-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="dlc-header">
                <h3>Günlük Kayıt</h3>
                <div className="dlc-header-right">
                  <input
                    type="date"
                    className="dlc-date-input"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    title="Tarih seç"
                  />
                  <button className="clear-log-btn" onClick={gunlukTemizle}>
                    <FiTrash2 /> Temizle
                  </button>
                </div>
              </div>

              <div className="dlc-items">
                {gunluk.map(item => (
                  <div key={item.id} className="dlc-item">
                    <div className="dlc-item-info">
                      <span className="dlc-item-name">{item.ad}</span>
                      <span className="dlc-item-detail">{item.miktar}g · {item.kalori} kcal</span>
                    </div>
                    <div className="dlc-item-macros">
                      <span className="dlc-macro-pill macro-pill-pro">P {item.protein}g</span>
                      <span className="dlc-macro-pill macro-pill-carb">K {item.karbonhidrat}g</span>
                      <span className="dlc-macro-pill macro-pill-fat">Y {item.yag}g</span>
                      <span className="dlc-macro-pill macro-pill-fiber">L {item.lif || 0}g</span>
                      <span className="dlc-macro-pill macro-pill-sugar">Ş {item.seker || 0}g</span>
                    </div>
                    <div className="exercise-delete-wrap">
                      <button className="dlc-delete" onClick={() => setConfirmDeleteItem(item.id)}>
                        <FiX />
                      </button>
                      {confirmDeleteItem === item.id && (
                        <ConfirmPopover
                          title={`"${item.ad}" besinini silmek istediğine emin misin?`}
                          onConfirm={() => { gunluktenSil(item.id); setConfirmDeleteItem(null) }}
                          onCancel={() => setConfirmDeleteItem(null)}
                          placement="left"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="dlc-totals">
                <span className="dlc-total-label">Toplam</span>
                <div className="dlc-total-values">
                  <span className="dlc-total-cal">{toplam.kalori || 0} kcal</span>
                  <span>P: {(toplam.protein || 0).toFixed(1)}g</span>
                  <span>K: {(toplam.karbonhidrat || 0).toFixed(1)}g</span>
                  <span>Y: {(toplam.yag || 0).toFixed(1)}g</span>
                  <span>L: {(toplam.lif || 0).toFixed(1)}g</span>
                  <span>Ş: {(toplam.seker || 0).toFixed(1)}g</span>
                </div>
              </div>

              <button className="btn btn-primary dlc-save-btn" onClick={saveDay}>
                <FiSave /> Günü Kaydet ({formatTarih(selectedDate)})
              </button>
            </motion.div>
          )}

          {}
          <button className="gecmis-beslenme-nav-btn" onClick={() => navigate('/dashboard/nutrition/history')}>
            <FiClock />
            Geçmiş Beslenmelerim
          </button>

          {}
          {recentDates.length > 0 && (
            <motion.div
              className="saved-logs-section"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="saved-logs-title">📋 Kaydedilen Günler</h3>
              <div className="saved-logs-list">
                {recentDates.map(date => {
                  const log = recentLogs[date]
                  const fark = gunFarki(date)
                  const label = fark === 0 ? 'Bugün' : fark === 1 ? 'Dün' : `${fark} gün önce`
                  const isToday = fark === 0
                  return (
                    <div key={date} className="saved-day-card">
                      <div className="saved-day-header">
                        <div>
                          <span className="saved-day-date">{formatTarih(date)}</span>
                          <span className="saved-day-ago">{label}</span>
                        </div>
                        <div className="saved-day-header-actions">
                          {isToday && (
                            <button className="saved-day-edit" onClick={() => editSavedDay(date)} title="Düzenle">
                              <FiEdit2 />
                            </button>
                          )}
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
                      </div>
                      <div className="saved-day-summary">
                        <span className="saved-day-cal">{log.toplam?.kalori || 0} kcal</span>
                        <span>P: {(log.toplam?.protein || 0).toFixed(1)}g</span>
                        <span>K: {(log.toplam?.karbonhidrat || 0).toFixed(1)}g</span>
                        <span>Y: {(log.toplam?.yag || 0).toFixed(1)}g</span>
                        <span>L: {(log.toplam?.lif || 0).toFixed ? (log.toplam?.lif || 0).toFixed(1) : (log.toplam?.lif || 0)}g</span>
                        <span>Ş: {(log.toplam?.seker || 0).toFixed ? (log.toplam?.seker || 0).toFixed(1) : (log.toplam?.seker || 0)}g</span>
                      </div>
                      <div className="saved-day-items">
                        {(log.items || []).map((item, idx) => (
                          <span key={idx} className="saved-day-food saved-day-food-red">{item.ad} ({item.miktar}g)</span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {gunluk.length === 0 && !selectedFood && recentDates.length === 0 && (
            <div className="nutrition-placeholder">
              <GiMeal />
              <p>Sol taraftan bir besin seç veya ara, ardından günlüğüne ekle.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
