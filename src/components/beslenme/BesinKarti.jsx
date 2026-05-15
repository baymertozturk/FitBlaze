// src/components/beslenme/BesinKarti.jsx
import { useState } from "react";

export function BesinKarti({ besin, onGunlugeEkle }) {
  const [miktar, setMiktar] = useState(100);

  if (!besin) return null;

  const oran        = miktar / 100;
  const hesaplanan  = {
    kalori:       Math.round(besin.kalori * oran),
    protein:      (besin.protein * oran).toFixed(1),
    karbonhidrat: (besin.karbonhidrat * oran).toFixed(1),
    yag:          (besin.yag * oran).toFixed(1),
    lif:          (besin.lif * oran).toFixed(1),
    seker:        ((besin.seker || 0) * oran).toFixed(1),
  };

  return (
    <div className="besin-karti">
      <div className="besin-karti-baslik">
        <div>
          <h3 className="besin-adi">{besin.ad}</h3>
        </div>
      </div>

      {/* Miktar ayarlayıcı */}
      <div className="miktar-ayarlayici">
        <label className="miktar-label">Miktar (gram)</label>
        <div className="miktar-kontrol">
          <button onClick={() => setMiktar((m) => Math.max(10, m - 10))}>−</button>
          <input
            type="number"
            value={miktar}
            min={10}
            max={2000}
            onChange={(e) => setMiktar(Number(e.target.value))}
            className="miktar-input"
          />
          <button onClick={() => setMiktar((m) => Math.min(2000, m + 10))}>+</button>
        </div>
      </div>

      {/* Makro değerleri */}
      <div className="makro-grid">
        <div className="makro-kart makro-kalori">
          <span className="makro-deger">{hesaplanan.kalori}</span>
          <span className="makro-birim">kcal</span>
          <span className="makro-ad">Kalori</span>
        </div>
        <div className="makro-kart makro-protein">
          <span className="makro-deger">{hesaplanan.protein}</span>
          <span className="makro-birim">g</span>
          <span className="makro-ad">Protein</span>
        </div>
        <div className="makro-kart makro-karb">
          <span className="makro-deger">{hesaplanan.karbonhidrat}</span>
          <span className="makro-birim">g</span>
          <span className="makro-ad">Karbonhidrat</span>
        </div>
        <div className="makro-kart makro-yag">
          <span className="makro-deger">{hesaplanan.yag}</span>
          <span className="makro-birim">g</span>
          <span className="makro-ad">Yağ</span>
        </div>
        <div className="makro-kart makro-lif">
          <span className="makro-deger">{hesaplanan.lif}</span>
          <span className="makro-birim">g</span>
          <span className="makro-ad">Lif</span>
        </div>
        <div className="makro-kart makro-seker">
          <span className="makro-deger">{hesaplanan.seker}</span>
          <span className="makro-birim">g</span>
          <span className="makro-ad">Şeker</span>
        </div>
      </div>

      <button
        className="gunluge-ekle-btn"
        onClick={() => onGunlugeEkle(besin, miktar)}
      >
        + Günlüğe Ekle ({miktar}g)
      </button>
    </div>
  );
}
