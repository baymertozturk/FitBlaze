// src/components/beslenme/BeslenmeModulu.jsx
import { useBeslenme }   from "../../hooks/useBeslenme";
import { BesinArama }    from "./BesinArama";
import { BesinKarti }    from "./BesinKarti";
import { GunlukGunluk }  from "./GunlukGunluk";
import "./beslenme.css";

export function BeslenmeModulu() {
  const {
    yukleniyor, hata, secilenBesin, oneriler, gunluk, toplam,
    ara, oneriGetir, oneriSec, gunlugeEkle, gunluktenSil, gunlukTemizle,
  } = useBeslenme();

  return (
    <div className="beslenme-modulu">
      <BesinArama
        onAra={ara}
        onOneriGetir={oneriGetir}
        onOneriSec={oneriSec}
        oneriler={oneriler}
        yukleniyor={yukleniyor}
      />

      {hata && (
        <div className="hata-mesaji">{hata}</div>
      )}

      {yukleniyor && (
        <div className="yukleniyor">
          <div className="yukleniyor-spinner" />
          <span>Aranıyor...</span>
        </div>
      )}

      <BesinKarti besin={secilenBesin} onGunlugeEkle={gunlugeEkle} />

      <GunlukGunluk
        gunluk={gunluk}
        toplam={toplam}
        onSil={gunluktenSil}
        onTemizle={gunlukTemizle}
      />
    </div>
  );
}
