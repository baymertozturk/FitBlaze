/**
 * Yorum temizleme scripti
 * Süslü başlıkları, emoji yorumlarını ve İngilizce kurumsal yorumları kaldırır.
 * Kod mantığına dokunmaz.
 */
const fs = require('fs');
const path = require('path');

// Temizlenecek dosya listesi
const files = [
  // CSS dosyaları
  'src/styles/index.css',
  'src/pages/Workouts.css',
  'src/pages/Profile.css',
  'src/pages/NutritionHistory.css',
  'src/pages/Nutrition.css',
  'src/pages/LandingPage.css',
  'src/pages/Dashboard.css',
  'src/pages/AuthPages.css',
  'src/pages/Analytics.css',
  'src/pages/AdminPanel.css',
  'src/layouts/DashboardLayout.css',
  'src/components/beslenme/beslenme.css',
  // JS/JSX dosyaları
  'src/App.jsx',
  'src/pages/AdminPanel.jsx',
  'src/pages/Workouts.jsx',
  'src/pages/Profile.jsx',
  'src/pages/Nutrition.jsx',
  'src/hooks/useBeslenme.js',
  'src/services/adminApi.js',
  'src/services/api.js',
  'src/services/beslenmeApi.js',
  'src/pages/LandingPage.jsx',
  'src/pages/LoginPage.jsx',
  'src/pages/RegisterPage.jsx',
  'src/pages/Dashboard.jsx',
  'src/pages/Analytics.jsx',
  'src/pages/NutritionHistory.jsx',
  'src/layouts/DashboardLayout.jsx',
  // Backend
  'backend/server.js',
  'backend/middleware/auth.js',
  'backend/middleware/admin.js',
  'backend/models/User.js',
  'backend/models/ContactMessage.js',
  'backend/routes/auth.js',
  'backend/routes/users.js',
  'backend/routes/admin.js',
  'backend/routes/contact.js',
  'backend/routes/nutrition.js',
  'backend/config/db.js',
  'backend/data/generateDb.js',
];

const root = path.resolve(__dirname, '..');

let totalCleaned = 0;

files.forEach(relPath => {
  const fullPath = path.join(root, relPath);
  if (!fs.existsSync(fullPath)) return;

  let content = fs.readFileSync(fullPath, 'utf-8');
  const original = content;

  // CSS ve JS süslü başlık blokları sil:
  // /* ============================================
  //    BAŞLIK
  //    ============================================ */
  content = content.replace(/\/\*\s*={3,}[\s\S]*?={3,}\s*\*\//g, '');

  // /* ─── BAŞLIK ─── */ veya /* ─── BAŞLIK ──────── */
  content = content.replace(/\/\*\s*─{2,}[\s\S]*?─{2,}\s*\*\//g, '');

  // Tek satır süslü CSS yorumları: /* Footer */ , /* Dashboard Preview (Removed) */
  // Sadece İngilizce olanları kaldır
  content = content.replace(/^\s*\/\*\s*[A-Z][A-Za-z &\-()\/,]+\s*\*\/\s*$/gm, '');

  // JS tek satır süslü başlıklar: // ─── BAŞLIK ───────
  content = content.replace(/^\s*\/\/\s*─{2,}.*$/gm, '');

  // JS tek satır İngilizce kurumsal yorumlar
  // Örn: // Auth, // Routes, // Middleware, // Protected Routes
  // Ama Türkçe yorumlara dokunma
  content = content.replace(/^\s*\/\/\s*(?:Auth|Routes|Middleware|Protected Routes|Kullanıcı|Health check)\s*$/gm, '');

  // Emoji yorumlarını sil (satır başı //🔥... veya /* 🔥... */)
  content = content.replace(/^\s*\/\/\s*🔥.*$/gm, '');
  content = content.replace(/\/\*\s*🔥[^*]*\*\//g, '');

  // /** ... */ JSDoc stil süslü blok yorumları (sadece dosya başındaki büyük açıklama blokları)
  // Bunlara dokunmuyoruz çünkü bazıları gerekli olabilir

  // CSS: Ardışık boş satırları en fazla 1'e indir
  content = content.replace(/\n{3,}/g, '\n\n');

  // Dosya başındaki boş satırları temizle
  content = content.replace(/^\n+/, '');

  if (content !== original) {
    fs.writeFileSync(fullPath, content, 'utf-8');
    totalCleaned++;
    console.log(`Temizlendi: ${relPath}`);
  }
});

console.log(`\nToplam ${totalCleaned} dosya temizlendi.`);
