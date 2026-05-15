// src/services/beslenmeApi.js
// Hibrit beslenme arama servisi
// Öncelik: 1) Yerel DB (1754 besin) → 2) Edamam API → 3) API Ninjas (fallback)

const TURKCE_INGILIZCE = {
  "elma": "apple", "muz": "banana", "portakal": "orange",
  "çilek": "strawberry", "üzüm": "grapes", "karpuz": "watermelon",
  "kavun": "melon", "kiraz": "cherry", "şeftali": "peach",
  "armut": "pear", "nar": "pomegranate", "incir": "fig",
  "domates": "tomato", "salatalık": "cucumber", "soğan": "onion",
  "sarımsak": "garlic", "havuç": "carrot", "patates": "potato",
  "biber": "pepper", "patlıcan": "eggplant", "kabak": "zucchini",
  "ıspanak": "spinach", "brokoli": "broccoli", "marul": "lettuce",
  "bezelye": "peas", "mısır": "corn",
  "tavuk": "chicken", "tavuk göğsü": "chicken breast",
  "kıyma": "ground beef", "biftek": "beef steak",
  "kuzu": "lamb", "balık": "fish", "somon": "salmon",
  "ton balığı": "tuna", "karides": "shrimp", "yumurta": "egg",
  "köfte": "meatball", "döner": "doner kebab",
  "pirinç": "rice", "bulgur": "bulgur", "makarna": "pasta",
  "ekmek": "bread", "yulaf": "oats", "mercimek": "lentils",
  "nohut": "chickpeas", "fasulye": "beans", "barbunya": "kidney beans",
  "süt": "milk", "yoğurt": "yogurt", "peynir": "cheese",
  "beyaz peynir": "feta cheese", "kaşar": "yellow cheese",
  "tereyağı": "butter", "krema": "cream",
  "zeytinyağı": "olive oil", "ayçiçek yağı": "sunflower oil",
  "bal": "honey", "reçel": "jam", "fındık": "hazelnut",
  "ceviz": "walnut", "badem": "almond", "çikolata": "chocolate",
  "mercimek çorbası": "lentil soup", "domates çorbası": "tomato soup",
  "pilav": "rice pilaf", "menemen": "turkish scrambled eggs",
  "börek": "pastry", "simit": "turkish bagel",
  "ayran": "ayran yogurt drink", "çay": "tea", "kahve": "coffee",
}

const onbellek = new Map()

// Türkçe karakterleri normalize et
function normalizeTr(str) {
  return str
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
}

// Normalize edilmiş eşleşme tablosu
const NORMALIZED_MAP = {}
for (const [tr, en] of Object.entries(TURKCE_INGILIZCE)) {
  NORMALIZED_MAP[normalizeTr(tr)] = en
}

function turkcedenCevir(sorgu) {
  const kucuk = sorgu.toLowerCase().trim()
  // Önce birebir eşleşme dene
  if (TURKCE_INGILIZCE[kucuk]) return TURKCE_INGILIZCE[kucuk]
  // Normalize edilmiş eşleşme (cikolata → chocolate gibi)
  const normalized = normalizeTr(kucuk)
  if (NORMALIZED_MAP[normalized]) return NORMALIZED_MAP[normalized]
  return sorgu
}

const API_BASE = import.meta.env.VITE_API_URL || '/api'

/**
 * Ana arama fonksiyonu — backend'e sorgu gönderir.
 * Backend sıralaması: Yerel DB → Edamam → API Ninjas
 */
export async function hybridBesinAra(sorgu) {
  const kucuk = sorgu.toLowerCase().trim()

  if (onbellek.has(kucuk)) return onbellek.get(kucuk)

  // Backend her zaman önce yerel veritabanını arar (1754 besin)
  // Yerel DB'de bulamazsa Edamam, sonra API Ninjas'a bakar
  const res = await fetch(`${API_BASE}/nutrition/search?q=${encodeURIComponent(kucuk)}`)

  if (res.status === 404) {
    // Yerel veritabanında bulunamazsa, İngilizce çevirisini dene
    const cevrilmis = turkcedenCevir(kucuk)
    if (cevrilmis !== kucuk) {
      const res2 = await fetch(`${API_BASE}/nutrition/search?q=${encodeURIComponent(cevrilmis)}`)
      if (res2.status === 404) return null
      if (!res2.ok) throw new Error(`Besin arama hatası: ${res2.status}`)
      const sonuc = await res2.json()
      onbellek.set(kucuk, sonuc)
      return sonuc
    }
    return null
  }

  if (!res.ok) throw new Error(`Besin arama hatası: ${res.status}`)

  const sonuc = await res.json()
  onbellek.set(kucuk, sonuc)
  return sonuc
}

/**
 * Otomatik tamamlama önerileri — yerel veritabanından arama
 */
export async function besinOnerileri(sorgu) {
  if (!sorgu || sorgu.trim().length < 2) return []

  const cacheKey = `_sug_${sorgu.toLowerCase().trim()}`
  if (onbellek.has(cacheKey)) return onbellek.get(cacheKey)

  try {
    const res = await fetch(
      `${API_BASE}/nutrition/suggestions?q=${encodeURIComponent(sorgu.trim())}`
    )
    if (!res.ok) return []
    const data = await res.json()
    onbellek.set(cacheKey, data)
    return data
  } catch {
    return []
  }
}

/**
 * Veritabanı istatistikleri
 */
export async function veritabaniIstatistikleri() {
  try {
    const res = await fetch(`${API_BASE}/nutrition/stats`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
