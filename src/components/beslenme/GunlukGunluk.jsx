// src/components/beslenme/GunlukGunluk.jsx
export function GunlukGunluk({ gunluk, toplam, onSil, onTemizle }) {
  if (gunluk.length === 0) return null;

  return (
    <div className="gunluk-gunluk">
      <div className="gunluk-baslik">
        <h3>📋 Günlük Kayıt</h3>
        <button onClick={onTemizle} className="temizle-btn">
          Tümünü Sil
        </button>
      </div>

      {/* Günlük listesi */}
      <ul className="gunluk-liste">
        {gunluk.map((item) => (
          <li key={item.id} className="gunluk-item">
            <div className="gunluk-item-bilgi">
              <span className="gunluk-item-ad">{item.ad}</span>
              <span className="gunluk-item-miktar">{item.miktar}g</span>
            </div>
            <div className="gunluk-item-makro">
              <span>{item.kalori} kcal</span>
              <span>P: {item.protein}g</span>
              <span>K: {item.karbonhidrat}g</span>
              <span>Y: {item.yag}g</span>
            </div>
            <button onClick={() => onSil(item.id)} className="sil-btn">
              ×
            </button>
          </li>
        ))}
      </ul>

      {/* Toplam */}
      <div className="gunluk-toplam">
        <span className="toplam-baslik">Toplam:</span>
        <div className="toplam-degerler">
          <span><strong>{toplam.kalori}</strong> kcal</span>
          <span>Protein: <strong>{toplam.protein}g</strong></span>
          <span>Karb: <strong>{toplam.karbonhidrat}g</strong></span>
          <span>Yağ: <strong>{toplam.yag}g</strong></span>
        </div>
      </div>
    </div>
  );
}
