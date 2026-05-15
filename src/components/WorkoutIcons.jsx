// Kas grubu ikonları
import chestImg from '../assets/muscle-icons/chest.png'
import shoulderImg from '../assets/muscle-icons/shoulder.png'
import tricepsImg from '../assets/muscle-icons/triceps.png'
import backImg from '../assets/muscle-icons/back.png'
import bicepsImg from '../assets/muscle-icons/biceps.png'
import forearmImg from '../assets/muscle-icons/forearm.png'
import legsImg from '../assets/muscle-icons/legs.png'
import absImg from '../assets/muscle-icons/abs.png'
import glutesImg from '../assets/muscle-icons/glutes.png'

const iconStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: 'inherit',
}

export function GiChestBenchPress() {
  return <img src={chestImg} alt="Göğüs" style={iconStyle} />
}

export function GiShoulderOverheadPress() {
  return <img src={shoulderImg} alt="Omuz" style={iconStyle} />
}

export function GiTricepCablePushdown() {
  return <img src={tricepsImg} alt="Arka Kol" style={iconStyle} />
}

export function GiBackPullUp() {
  return <img src={backImg} alt="Sırt" style={iconStyle} />
}

export function GiBicepBarbellCurl() {
  return <img src={bicepsImg} alt="Ön Kol" style={iconStyle} />
}

export function GiForearmWristCurl() {
  return <img src={forearmImg} alt="Bilek" style={iconStyle} />
}

export function GiLegSquat() {
  return <img src={legsImg} alt="Bacak" style={iconStyle} />
}

export function GiAbsPlank() {
  return <img src={absImg} alt="Karın" style={iconStyle} />
}

export function GiGluteBridge() {
  return <img src={glutesImg} alt="Kalça" style={iconStyle} />
}
