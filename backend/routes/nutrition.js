const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')

const EDAMAM_APP_ID  = process.env.EDAMAM_APP_ID
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY
const API_NINJAS_KEY = process.env.API_NINJAS_KEY

const dbPath = path.join(__dirname, '..', 'data', 'yerelBesinVeritabani.json')
let YEREL_DB = []
try {
  const raw = fs.readFileSync(dbPath, 'utf-8')
  YEREL_DB = JSON.parse(raw)
  console.log(`✅ Yerel besin veritabanı yüklendi: ${YEREL_DB.length} kayıt`)
} catch (err) {
  console.error('⚠️ Yerel besin veritabanı yüklenemedi:', err.message)
}

// Normalize Turkish characters for fuzzy matching
function normalizeTr(str) {
  return str
    .toLowerCase()
    .replace(/ç/g, 'c').replace(/Ç/g, 'c')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ı/g, 'i').replace(/İ/g, 'i')
    .replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/ş/g, 's').replace(/Ş/g, 's')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u')
}

// Pre-build normalized index for fast searching
const NORMALIZED_INDEX = YEREL_DB.map(item => ({
  ...item,
  _norm: normalizeTr(item.ad),
}))

function yerelAra(sorgu) {
  const norm = normalizeTr(sorgu.trim())
  if (!norm) return { exact: null, suggestions: [] }

  // 1) Exact match
  const exact = NORMALIZED_INDEX.find(b => b._norm === norm)
  if (exact) {
    const { _norm, ...clean } = exact
    return {
      exact: { ...clean, birim: '100g başına', kaynak: 'Yerel Veritabanı' },
      suggestions: [],
    }
  }

  // 2) Starts-with match
  const startsWithMatches = NORMALIZED_INDEX.filter(b => b._norm.startsWith(norm))

  // 3) Contains match
  const containsMatches = NORMALIZED_INDEX.filter(
    b => !b._norm.startsWith(norm) && b._norm.includes(norm)
  )

  // Combine: starts-with first, then contains, limit to 20
  const allMatches = [...startsWithMatches, ...containsMatches].slice(0, 20)

  if (allMatches.length === 1) {
    const { _norm, ...clean } = allMatches[0]
    return {
      exact: { ...clean, birim: '100g başına', kaynak: 'Yerel Veritabanı' },
      suggestions: [],
    }
  }

  if (allMatches.length > 0) {
    // If first match starts with query, auto-select it as exact
    if (startsWithMatches.length > 0) {
      const { _norm, ...clean } = startsWithMatches[0]
      return {
        exact: { ...clean, birim: '100g başına', kaynak: 'Yerel Veritabanı' },
        suggestions: allMatches.map(b => {
          const { _norm, ...c } = b
          return { ...c, birim: '100g başına', kaynak: 'Yerel Veritabanı' }
        }),
      }
    }

    return {
      exact: null,
      suggestions: allMatches.map(b => {
        const { _norm, ...c } = b
        return { ...c, birim: '100g başına', kaynak: 'Yerel Veritabanı' }
      }),
    }
  }

  return { exact: null, suggestions: [] }
}

function guvenliSayi(deger) {
  if (deger === null || deger === undefined) return 0
  if (typeof deger === 'string') {
    const sayi = parseFloat(deger)
    return isNaN(sayi) ? 0 : sayi
  }
  return typeof deger === 'number' && !isNaN(deger) ? deger : 0
}

async function edamamAra(sorgu) {
  const url =
    `https://api.edamam.com/api/food-database/v2/parser` +
    `?app_id=${EDAMAM_APP_ID}` +
    `&app_key=${EDAMAM_APP_KEY}` +
    `&ingr=${encodeURIComponent(sorgu)}` +
    `&nutrition-type=cooking`

  const res = await fetch(url)
  if (res.status === 429) throw new Error('EDAMAM_LIMIT')
  if (res.status === 401 || res.status === 403) throw new Error('EDAMAM_AUTH')
  if (!res.ok) throw new Error(`Edamam hatası: ${res.status}`)

  const data = await res.json()
  const hint = data.hints?.find(h => h.food?.nutrients?.ENERC_KCAL != null)
  if (!hint) return null

  const n = hint.food.nutrients
  return {
    ad:           hint.food.label,
    kalori:       Math.round(guvenliSayi(n.ENERC_KCAL)),
    protein:      parseFloat(guvenliSayi(n.PROCNT).toFixed(1)),
    karbonhidrat: parseFloat(guvenliSayi(n.CHOCDF).toFixed(1)),
    yag:          parseFloat(guvenliSayi(n.FAT).toFixed(1)),
    lif:          parseFloat(guvenliSayi(n.FIBTG).toFixed(1)),
    birim:        '100g başına',
    kaynak:       'Edamam',
  }
}

async function apiNinjasAra(sorgu) {
  const url = `https://api.api-ninjas.com/v1/nutrition?query=${encodeURIComponent(sorgu)}`
  const res = await fetch(url, { headers: { 'X-Api-Key': API_NINJAS_KEY } })
  if (!res.ok) throw new Error(`API Ninjas hatası: ${res.status}`)

  const data = await res.json()
  if (!Array.isArray(data) || data.length === 0) return null

  const item   = data[0]
  const karb    = guvenliSayi(item.carbohydrates_total_g)
  const protein = guvenliSayi(item.protein_g)
  const yag     = guvenliSayi(item.fat_total_g)
  const lif     = guvenliSayi(item.fiber_g)
  let kalori    = guvenliSayi(item.calories)
  if (kalori === 0 && (karb + protein + yag) > 0) {
    kalori = Math.round(karb * 4 + protein * 4 + yag * 9)
  }

  return {
    ad:           item.name || sorgu,
    kalori,
    protein:      parseFloat(protein.toFixed(1)),
    karbonhidrat: parseFloat(karb.toFixed(1)),
    yag:          parseFloat(yag.toFixed(1)),
    lif:          parseFloat(lif.toFixed(1)),
    birim:        '100g başına',
    kaynak:       'API Ninjas',
  }
}

// Öncelik sırası: 1) Yerel DB  2) Edamam API  3) API Ninjas (fallback)
router.get('/search', async (req, res) => {
  const sorgu = req.query.q
  if (!sorgu) return res.status(400).json({ message: 'Arama terimi gerekli.' })

  // 1) Yerel veritabanında ara
  const yerelSonuc = yerelAra(sorgu)
  if (yerelSonuc.exact) {
    return res.json({
      ...yerelSonuc.exact,
      oneriler: yerelSonuc.suggestions.length > 1 ? yerelSonuc.suggestions : undefined,
    })
  }

  // Eğer sadece öneriler varsa (exact yok) → önerileri döndür
  if (yerelSonuc.suggestions.length > 0) {
    // İlk öneriyi ana sonuç yap, diğerlerini yanına koy
    const [ilk, ...geri] = yerelSonuc.suggestions
    return res.json({
      ...ilk,
      oneriler: geri.length > 0 ? yerelSonuc.suggestions : undefined,
    })
  }

  // 2) Edamam API
  try {
    const edamamSonuc = await edamamAra(sorgu)
    if (edamamSonuc) return res.json(edamamSonuc)
  } catch (err) {
    console.warn('Edamam başarısız:', err.message)
  }

  // 3) API Ninjas (fallback)
  try {
    const ninjasSonuc = await apiNinjasAra(sorgu)
    if (ninjasSonuc) return res.json(ninjasSonuc)
  } catch (err) {
    console.warn('API Ninjas başarısız:', err.message)
  }

  res.status(404).json({ message: 'Besin bulunamadı.' })
})

// Otomatik tamamlama için yerel veritabanında arama
router.get('/suggestions', (req, res) => {
  const sorgu = req.query.q
  if (!sorgu || sorgu.trim().length < 2) {
    return res.json([])
  }

  const norm = normalizeTr(sorgu.trim())
  const results = NORMALIZED_INDEX
    .filter(b => b._norm.includes(norm))
    .slice(0, 15)
    .map(b => {
      const { _norm, ...clean } = b
      return { ...clean, birim: '100g başına', kaynak: 'Yerel Veritabanı' }
    })

  res.json(results)
})

// Veritabanı istatistikleri
router.get('/stats', (req, res) => {
  const kategoriler = {}
  YEREL_DB.forEach(b => {
    kategoriler[b.kategori] = (kategoriler[b.kategori] || 0) + 1
  })

  res.json({
    toplamKayit: YEREL_DB.length,
    kategoriler,
    kaynaklar: [
      { ad: 'Yerel Veritabanı (1754 besin)', durum: 'Aktif', tip: 'Yerel' },
      { ad: 'Edamam Food Database API', durum: 'Bağlı', tip: 'API' },
      { ad: 'API Ninjas Nutrition API', durum: 'Bağlı (fallback)', tip: 'API' },
    ],
  })
})

module.exports = router
