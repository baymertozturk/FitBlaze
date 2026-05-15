// src/components/beslenme/BesinArama.jsx
import { useState, useEffect, useRef } from "react";
import { FiSearch } from "react-icons/fi";

export function BesinArama({ onAra, onOneriGetir, onOneriSec, oneriler = [], yukleniyor }) {
  const [sorgu, setSorgu] = useState("");
  const [showOneriler, setShowOneriler] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  // Gecikmeli otomatik tamamlama
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (sorgu.trim().length >= 2 && onOneriGetir) {
      debounceRef.current = setTimeout(() => {
        onOneriGetir(sorgu);
        setShowOneriler(true);
      }, 300);
    } else {
      setShowOneriler(false);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [sorgu, onOneriGetir]);

  // Dışarı tıklayınca kapat
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowOneriler(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowOneriler(false);
    onAra(sorgu);
  };

  const handleOneriClick = (besin) => {
    setSorgu(besin.ad);
    setShowOneriler(false);
    if (onOneriSec) {
      onOneriSec(besin);
    } else {
      onAra(besin.ad);
    }
  };

  return (
    <div className="besin-arama-container" ref={wrapperRef}>
      <form onSubmit={handleSubmit} className="besin-arama-form">
        <div className="besin-arama-wrapper">
          <FiSearch className="besin-arama-icon" />
          <input
            type="text"
            value={sorgu}
            onChange={(e) => setSorgu(e.target.value)}
            onFocus={() => oneriler.length > 0 && setShowOneriler(true)}
            placeholder="Besin ara... (örn: elma, tavuk göğsü)"
            className="besin-arama-input"
            disabled={yukleniyor}
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          className="besin-arama-btn"
          disabled={yukleniyor || !sorgu.trim()}
        >
          {yukleniyor ? "Aranıyor..." : "Ara"}
        </button>
      </form>

      {/* Otomatik tamamlama dropdown */}
      {showOneriler && oneriler.length > 0 && (
        <ul className="besin-oneriler-dropdown">
          {oneriler.map((besin, idx) => (
            <li
              key={besin.id || idx}
              className="besin-oneri-item"
              onClick={() => handleOneriClick(besin)}
            >
              <span className="oneri-ad">{besin.ad}</span>
              <span className="oneri-detay">
                {besin.kalori} kcal · P:{besin.protein}g · K:{besin.karbonhidrat}g · Y:{besin.yag}g · L:{besin.lif || 0}g · Ş:{besin.seker || 0}g
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
