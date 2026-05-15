/**
 * Bu script toplamBesinVeri_FitBlaze_1754.md dosyasını parse ederek
 * yerelBesinVeritabani.json dosyasını oluşturur.
 * 
 * Kullanım: node generateDb.js
 */
const fs = require('fs');
const path = require('path');

const mdPath = path.resolve(__dirname, '../../../toplamBesinVeri_FitBlaze_1754.md');
const outPath = path.resolve(__dirname, 'yerelBesinVeritabani.json');

const raw = fs.readFileSync(mdPath, 'utf-8');
const lines = raw.split('\n');

const veritabani = [];

// Satır formatı:  | # | Besin Adı | Kalori | Protein | Karbonhidrat | Yağ | Şeker | Lif |
const mdRowRx = /^\|\s*(\d+)\s*\|\s*(.+?)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|/;

// Bölüm-kategori eşlemesi (section header → kategori)
let currentKategori = 'Genel';
const kategoriMap = {
  'et & kümes': 'Et & Kümes',
  'balık & deniz': 'Balık & Deniz Ürünleri',
  'yumurta & süt': 'Süt Ürünleri',
  'baklagil': 'Baklagiller',
  'tahıl': 'Tahıllar',
  'sebze': 'Sebzeler',
  'meyve': 'Meyveler',
  'kuruyemiş': 'Kuruyemişler',
  'yağ': 'Yağlar & Soslar',
  'sos': 'Yağlar & Soslar',
  'sporcu': 'Sporcu Besinleri',
  'içecek': 'İçecekler',
  'diğer sağlıklı': 'Diğer',
  'ek besin': 'Diğer',
  'tatlı': 'Tatlılar',
  'atıştırmalık': 'Atıştırmalıklar',
  'dünya mutfak': 'Dünya Mutfakları',
  'hazır yemek': 'Dünya Mutfakları',
  'fonksiyonel': 'Takviyeler',
  'türk mutfağı': 'Türk Mutfağı',
  'çorba': 'Çorbalar',
  'kebap': 'Et Yemekleri',
  'pide': 'Hamur İşleri',
  'lahmacun': 'Hamur İşleri',
  'zeytinyağlı': 'Sebze Yemekleri',
  'pilav': 'Pilavlar',
  'geleneksel tatlı': 'Tatlılar',
  'kahvaltılık': 'Kahvaltılıklar',
  'sokak': 'Sokak Lezzetleri',
  'meze': 'Mezeler',
  'salata': 'Salatalar',
  'bölgesel': 'Bölgesel Yemekler',
  'glütensiz': 'Tahıllar',
  'salata yeşillik': 'Sebzeler',
};

function detectKategori(headerLine) {
  const lower = headerLine.toLowerCase();
  for (const [key, val] of Object.entries(kategoriMap)) {
    if (lower.includes(key)) return val;
  }
  return currentKategori; // keep current if no match
}

const seenIds = new Set();

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Detect section headers
  if (line.startsWith('###') || line.startsWith('## ')) {
    currentKategori = detectKategori(line);
    continue;
  }

  // Parse markdown table rows
  const m = mdRowRx.exec(line);
  if (m) {
    const id = parseInt(m[1], 10);
    if (seenIds.has(id)) continue; // skip duplicates
    seenIds.add(id);

    veritabani.push({
      id,
      ad: m[2].trim(),
      kategori: currentKategori,
      kalori: parseFloat(m[3]),
      protein: parseFloat(m[4]),
      karbonhidrat: parseFloat(m[5]),
      yag: parseFloat(m[6]),
      seker: parseFloat(m[7]),
      lif: parseFloat(m[8]),
    });
  }
}

// CSV başlığı: ad,kategori,kalori,protein,karbonhidrat,yag,seker,lif
const csvStart = lines.findIndex(l => l.trim().startsWith('ad,kategori,kalori'));
if (csvStart !== -1) {
  let nextId = veritabani.length > 0 ? Math.max(...veritabani.map(b => b.id)) + 1 : 1255;

  for (let i = csvStart + 1; i < lines.length; i++) {
    const csvLine = lines[i].trim();
    if (!csvLine || csvLine.startsWith('```')) break;

    const parts = csvLine.split(',');
    if (parts.length < 8) continue;

    const ad = parts[0].trim();
    const kategori = parts[1].trim();
    const kalori = parseFloat(parts[2]);
    const protein = parseFloat(parts[3]);
    const karbonhidrat = parseFloat(parts[4]);
    const yag = parseFloat(parts[5]);
    const seker = parseFloat(parts[6]);
    const lif = parseFloat(parts[7]);

    if (isNaN(kalori)) continue;

    veritabani.push({
      id: nextId++,
      ad,
      kategori,
      kalori,
      protein,
      karbonhidrat,
      yag,
      seker,
      lif,
    });
  }
}

fs.writeFileSync(outPath, JSON.stringify(veritabani, null, 0), 'utf-8');
console.log(`✅ ${veritabani.length} besin verisi ${outPath} dosyasına yazıldı.`);
