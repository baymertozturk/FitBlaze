// src/hooks/useBeslenme.js
import { useState, useCallback } from "react";
import { hybridBesinAra, besinOnerileri } from "../services/beslenmeApi";

export function useBeslenme() {
  const [yukleniyor,  setYukleniyor]  = useState(false);
  const [hata,        setHata]        = useState(null);
  const [secilenBesin, setSecilenBesin] = useState(null);
  const [oneriler,    setOneriler]    = useState([]);
  const [gunluk,      setGunluk]      = useState([]);

  const oneriGetir = useCallback(async (sorgu) => {
    if (!sorgu || sorgu.trim().length < 2) {
      setOneriler([]);
      return;
    }
    try {
      const data = await besinOnerileri(sorgu);
      setOneriler(data || []);
    } catch {
      setOneriler([]);
    }
  }, []);

  const ara = useCallback(async (sorgu) => {
    if (!sorgu.trim()) return;

    setYukleniyor(true);
    setHata(null);
    setSecilenBesin(null);
    setOneriler([]);

    try {
      const sonuc = await hybridBesinAra(sorgu.trim());
      if (sonuc) {
        setSecilenBesin(sonuc);
        // Eğer öneriler varsa onları da set et
        if (sonuc.oneriler && sonuc.oneriler.length > 0) {
          setOneriler(sonuc.oneriler);
        }
      } else {
        setHata("Bu besin için sonuç bulunamadı. Farklı bir isim deneyin.");
      }
    } catch {
      setHata("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
    } finally {
      setYukleniyor(false);
    }
  }, []);

  const oneriSec = useCallback((besin) => {
    setSecilenBesin(besin);
    setOneriler([]);
    setHata(null);
  }, []);

  const gunlugeEkle = useCallback((besin, miktar = 100) => {
    if (!besin) return;

    const oran    = miktar / 100;
    const yeniItem = {
      id:           Date.now(),
      ad:           besin.ad,
      miktar,
      kalori:       Math.round(besin.kalori * oran),
      protein:      parseFloat((besin.protein * oran).toFixed(1)),
      karbonhidrat: parseFloat((besin.karbonhidrat * oran).toFixed(1)),
      yag:          parseFloat((besin.yag * oran).toFixed(1)),
      lif:          parseFloat(((besin.lif || 0) * oran).toFixed(1)),
      seker:        parseFloat(((besin.seker || 0) * oran).toFixed(1)),
    };

    setGunluk((prev) => [...prev, yeniItem]);
  }, []);

  const gunluktenSil = useCallback((id) => {
    setGunluk((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const gunlukTemizle = useCallback(() => setGunluk([]), []);

  const toplam = gunluk.reduce(
    (acc, item) => ({
      kalori:       acc.kalori       + item.kalori,
      protein:      parseFloat((acc.protein + item.protein).toFixed(1)),
      karbonhidrat: parseFloat((acc.karbonhidrat + item.karbonhidrat).toFixed(1)),
      yag:          parseFloat((acc.yag + item.yag).toFixed(1)),
      lif:          parseFloat((acc.lif + (item.lif || 0)).toFixed(1)),
      seker:        parseFloat((acc.seker + (item.seker || 0)).toFixed(1)),
    }),
    { kalori: 0, protein: 0, karbonhidrat: 0, yag: 0, lif: 0, seker: 0 }
  );

  return {
    yukleniyor,
    hata,
    secilenBesin,
    oneriler,
    gunluk,
    toplam,
    ara,
    oneriGetir,
    oneriSec,
    gunlugeEkle,
    gunluktenSil,
    gunlukTemizle,
  };
}
