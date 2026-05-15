import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiSearch, FiCheckCircle, FiEdit2, FiTrash2, FiX, FiSave, FiHeart } from 'react-icons/fi'
import {
  GiWeightLiftingUp,
} from 'react-icons/gi'
import ConfirmPopover from '../components/ConfirmPopover.jsx'
import './Workouts.css'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5 }
  })
}

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

const muscleGroups = [
  { id: 'chest',    name: 'Göğüs',    color: '#E62E00' },
  { id: 'shoulder', name: 'Omuz',     color: '#A78BFA' },
  { id: 'triceps',  name: 'Arka Kol', color: '#38BDF8' },
  { id: 'back',     name: 'Sırt',     color: '#4ADE80' },
  { id: 'biceps',   name: 'Ön Kol',   color: '#F472B6' },
  { id: 'forearm',  name: 'Bilek',    color: '#FBBF24' },
  { id: 'legs',     name: 'Bacak',    color: '#FF4444' },
  { id: 'abs',      name: 'Karın',    color: '#FB923C' },
  { id: 'glutes',   name: 'Kalça',    color: '#EC4899' },
]

// Egzersiz veritabanı
const exerciseDB = {
  chest: {
    title: 'Göğüs Egzersizleri',
    exercises: [
      { id: 1, name: 'Bench Press' },
      { id: 2, name: 'İncline Dumbbell Press' },
      { id: 3, name: 'Cable Crossover' },
      { id: 4, name: 'Dips' },
      { id: 5, name: 'Pec Deck Fly' },
      { id: 6, name: 'Decline Bench Press' },
      { id: 7, name: 'Dumbbell Fly' },
      { id: 8, name: 'Push-Up' },
      { id: 9, name: 'Machine Chest Press' },
      { id: 10, name: 'Landmine Press' },
      { id: 11, name: 'İncline Barbell Press' },
      { id: 12, name: 'Dumbbell Pullover' },
      { id: 13, name: 'Svend Press' },
      { id: 14, name: 'Chest Dip' },
      { id: 15, name: 'Floor Press' },
    ]
  },
  shoulder: {
    title: 'Omuz Egzersizleri',
    exercises: [
      { id: 1, name: 'Overhead Press' },
      { id: 2, name: 'Lateral Raise' },
      { id: 3, name: 'Front Raise' },
      { id: 4, name: 'Face Pull' },
      { id: 5, name: 'Arnold Press' },
      { id: 6, name: 'Rear Delt Fly' },
      { id: 7, name: 'Upright Row' },
      { id: 8, name: 'Shrugs' },
      { id: 9, name: 'Cable Lateral Raise' },
      { id: 10, name: 'Dumbbell Shoulder Press' },
      { id: 11, name: 'Behind-the-Neck Press' },
      { id: 12, name: 'Machine Shoulder Press' },
      { id: 13, name: 'Reverse Pec Deck' },
      { id: 14, name: 'Landmine Lateral Raise' },
      { id: 15, name: 'Lu Raise' },
    ]
  },
  back: {
    title: 'Sırt Egzersizleri',
    exercises: [
      { id: 1, name: 'Lat Pulldown' },
      { id: 2, name: 'Barbell Row' },
      { id: 3, name: 'Seated Cable Row' },
      { id: 4, name: 'Deadlift' },
      { id: 5, name: 'Pull-Up' },
      { id: 6, name: 'T-Bar Row' },
      { id: 7, name: 'Dumbbell Row' },
      { id: 8, name: 'Hyperextension' },
      { id: 9, name: 'Straight Arm Pulldown' },
      { id: 10, name: 'Chin-Up' },
      { id: 11, name: 'Pendlay Row' },
      { id: 12, name: 'Meadows Row' },
      { id: 13, name: 'Cable Pullover' },
      { id: 14, name: 'Rack Pull' },
      { id: 15, name: 'Inverted Row' },
    ]
  },
  legs: {
    title: 'Bacak Egzersizleri',
    exercises: [
      { id: 1, name: 'Squat' },
      { id: 2, name: 'Leg Press' },
      { id: 3, name: 'Leg Extension' },
      { id: 4, name: 'Leg Curl' },
      { id: 5, name: 'Bulgarian Split Squat' },
      { id: 6, name: 'Calf Raise' },
      { id: 7, name: 'Hack Squat' },
      { id: 8, name: 'Romanian Deadlift' },
      { id: 9, name: 'Walking Lunges' },
      { id: 10, name: 'Hip Thrust' },
      { id: 11, name: 'Goblet Squat' },
      { id: 12, name: 'Step Up' },
      { id: 13, name: 'Front Squat' },
      { id: 14, name: 'Sissy Squat' },
      { id: 15, name: 'Seated Calf Raise' },
    ]
  },
  biceps: {
    title: 'Ön Kol Egzersizleri',
    exercises: [
      { id: 1, name: 'Barbell Curl' },
      { id: 2, name: 'Dumbbell Curl' },
      { id: 3, name: 'Hammer Curl' },
      { id: 4, name: 'Preacher Curl' },
      { id: 5, name: 'Cable Curl' },
      { id: 6, name: 'Concentration Curl' },
      { id: 7, name: 'EZ-Bar Curl' },
      { id: 8, name: 'Incline Dumbbell Curl' },
      { id: 9, name: 'Spider Curl' },
      { id: 10, name: 'Reverse Curl' },
      { id: 11, name: 'Drag Curl' },
      { id: 12, name: 'Zottman Curl' },
      { id: 13, name: 'Cable Hammer Curl' },
      { id: 14, name: 'Machine Curl' },
      { id: 15, name: '21s Curl' },
    ]
  },
  triceps: {
    title: 'Arka Kol Egzersizleri',
    exercises: [
      { id: 1, name: 'Triceps Pushdown' },
      { id: 2, name: 'Overhead Triceps Extension' },
      { id: 3, name: 'Close Grip Bench Press' },
      { id: 4, name: 'Skull Crushers' },
      { id: 5, name: 'Rope Pushdown' },
      { id: 6, name: 'Kickbacks' },
      { id: 7, name: 'Diamond Push-Up' },
      { id: 8, name: 'Dumbbell Overhead Extension' },
      { id: 9, name: 'Cable Overhead Extension' },
      { id: 10, name: 'Bench Dips' },
      { id: 11, name: 'JM Press' },
      { id: 12, name: 'Tate Press' },
      { id: 13, name: 'V-Bar Pushdown' },
      { id: 14, name: 'Single Arm Pushdown' },
      { id: 15, name: 'French Press' },
    ]
  },
  abs: {
    title: 'Karın Egzersizleri',
    exercises: [
      { id: 1, name: 'Crunch' },
      { id: 2, name: 'Plank' },
      { id: 3, name: 'Leg Raise' },
      { id: 4, name: 'Russian Twist' },
      { id: 5, name: 'Ab Wheel Rollout' },
      { id: 6, name: 'Cable Crunch' },
      { id: 7, name: 'Bicycle Crunch' },
      { id: 8, name: 'Mountain Climber' },
      { id: 9, name: 'Hanging Leg Raise' },
      { id: 10, name: 'V-Up' },
      { id: 11, name: 'Dead Bug' },
      { id: 12, name: 'Pallof Press' },
      { id: 13, name: 'Side Plank' },
      { id: 14, name: 'Flutter Kicks' },
      { id: 15, name: 'Decline Sit-Up' },
    ]
  },
  forearm: {
    title: 'Bilek Egzersizleri',
    exercises: [
      { id: 1, name: 'Wrist Curl' },
      { id: 2, name: 'Reverse Wrist Curl' },
      { id: 3, name: 'Farmer Walk' },
      { id: 4, name: 'Plate Pinch' },
      { id: 5, name: 'Behind-the-Back Wrist Curl' },
      { id: 6, name: 'Wrist Roller' },
      { id: 7, name: 'Towel Hang' },
      { id: 8, name: 'Dead Hang' },
      { id: 9, name: 'Reverse Barbell Curl' },
      { id: 10, name: 'Hammer Curl' },
      { id: 11, name: 'Fat Grip Hold' },
      { id: 12, name: 'Finger Curl' },
      { id: 13, name: 'Wrist Extension' },
      { id: 14, name: 'Radial Deviation' },
      { id: 15, name: 'Ulnar Deviation' },
    ]
  },
  glutes: {
    title: 'Kalça Egzersizleri',
    exercises: [
      { id: 1, name: 'Hip Thrust' },
      { id: 2, name: 'Glute Bridge' },
      { id: 3, name: 'Cable Kickback' },
      { id: 4, name: 'Sumo Deadlift' },
      { id: 5, name: 'Fire Hydrant' },
      { id: 6, name: 'Donkey Kick' },
      { id: 7, name: 'Frog Pump' },
      { id: 8, name: 'Single Leg Hip Thrust' },
      { id: 9, name: 'Curtsy Lunge' },
      { id: 10, name: 'Step Up' },
      { id: 11, name: 'Cable Pull Through' },
      { id: 12, name: 'Banded Walk' },
      { id: 13, name: 'Reverse Lunge' },
      { id: 14, name: 'Good Morning' },
      { id: 15, name: 'Barbell Glute Bridge' },
    ]
  }
}

const initialWorkouts = [
  {
    id: 1,
    name: 'İtiş Günü',
    days: ['Pzt', 'Per'],
    date: '27.04.2026',
    exercises: [
      { name: 'Bench Press', sets: '4×12/10/8/6' },
      { name: 'Overhead Press', sets: '4×12/10/8/6' },
      { name: 'Triceps Pushdown', sets: '4×15/12/10/10' },
      { name: 'Lat Pulldown', sets: '4×12/10/10/8' },
    ]
  },
  {
    id: 2,
    name: 'Çekiş Günü',
    days: ['Sal', 'Cum'],
    date: '25.04.2026',
    exercises: [
      { name: 'Deadlift', sets: '4×8/6/6/4' },
      { name: 'Barbell Row', sets: '4×12/10/8/8' },
      { name: 'Lat Pulldown', sets: '3×12/10/10' },
      { name: 'Barbell Curl', sets: '3×15/12/10' },
    ]
  },
  {
    id: 3,
    name: 'Bacak Günü',
    days: ['Çar', 'Cmt'],
    date: '26.04.2026',
    exercises: [
      { name: 'Squat', sets: '4×10/8/6/6' },
      { name: 'Leg Press', sets: '4×12/12/10/10' },
      { name: 'Leg Extension', sets: '3×15/12/10' },
      { name: 'Leg Curl', sets: '3×15/12/10' },
      { name: 'Calf Raise', sets: '4×20/15/15/12' },
    ]
  }
]

export const STORAGE_KEY_SAVED = 'fitblaze_workouts'
export const STORAGE_KEY_DELETED = 'fitblaze_workouts_deleted'
export const STORAGE_KEY_WORKOUT_LOGS = 'fitblaze_workout_logs'

export default function Workouts() {
  const [activeTab, setActiveTab] = useState('my')
  const [selectedMuscle, setSelectedMuscle] = useState('chest')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExercises, setSelectedExercises] = useState({})
  const [savedWorkouts, setSavedWorkouts] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SAVED)
      if (stored !== null) return JSON.parse(stored)
    } catch {}
    return []
  })
  const [deletedWorkouts, setDeletedWorkouts] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DELETED)
      if (stored !== null) return JSON.parse(stored)
    } catch {}
    return []
  })
  const [favoriteExercises, setFavoriteExercises] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fitblaze_fav_exercises') || '[]') } catch { return [] }
  })
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null)

  // Antrenmanları ve silinenleri localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SAVED, JSON.stringify(savedWorkouts))
  }, [savedWorkouts])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DELETED, JSON.stringify(deletedWorkouts))
  }, [deletedWorkouts])

  const toggleFavoriteExercise = (muscleId, exercise) => {
    const key = `${muscleId}-${exercise.id}`
    setFavoriteExercises(prev => {
      const exists = prev.some(f => f.key === key)
      const updated = exists ? prev.filter(f => f.key !== key) : [...prev, { key, muscleId, ...exercise }]
      localStorage.setItem('fitblaze_fav_exercises', JSON.stringify(updated))
      return updated
    })
  }

  const isFavoriteExercise = (muscleId, exId) => {
    return favoriteExercises.some(f => f.key === `${muscleId}-${exId}`)
  }

  const [showAddModal, setShowAddModal] = useState(false)
  const [workoutName, setWorkoutName] = useState('')
  const [selectedDays, setSelectedDays] = useState([])
  // Her egzersiz için set/tekrar
  const [exerciseConfig, setExerciseConfig] = useState({})

  // Düzenleme state'i
  const [editingWorkout, setEditingWorkout] = useState(null)
  const [editWorkoutName, setEditWorkoutName] = useState('')
  const [editWorkoutDays, setEditWorkoutDays] = useState([])
  const [editWorkoutExercises, setEditWorkoutExercises] = useState([])

  const currentGroup = exerciseDB[selectedMuscle] || exerciseDB.chest
  const selectedCount = Object.values(selectedExercises).filter(Boolean).length

  const toggleExercise = (muscleId, exId) => {
    const key = `${muscleId}-${exId}`
    setSelectedExercises(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const filteredExercises = currentGroup.exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleDay = (day) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const toggleEditDay = (day) => {
    setEditWorkoutDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const getSelectedExerciseList = () => {
    const list = []
    Object.entries(selectedExercises).forEach(([key, isSelected]) => {
      if (!isSelected) return
      const [muscleId, exIdStr] = key.split('-')
      const exId = parseInt(exIdStr)
      const group = exerciseDB[muscleId]
      if (!group) return
      const ex = group.exercises.find(e => e.id === exId)
      if (!ex) return
      const cfg = exerciseConfig[key] || { sets: 3, reps: 12 }
      list.push({ key, name: ex.name, sets: `${cfg.sets}×${cfg.reps}`, setsCount: cfg.sets, repsCount: cfg.reps })
    })
    return list
  }

  const updateExerciseConfig = (key, field, value) => {
    const num = Math.max(1, Math.min(99, parseInt(value) || 0))
    setExerciseConfig(prev => ({
      ...prev,
      [key]: { sets: 3, reps: 12, ...prev[key], [field]: num },
    }))
  }

  // Seçili egzersizler için varsayılan değerleri hazırla
  useEffect(() => {
    if (!showAddModal) return
    setExerciseConfig(prev => {
      const next = { ...prev }
      Object.entries(selectedExercises).forEach(([key, isSelected]) => {
        if (isSelected && !next[key]) next[key] = { sets: 3, reps: 12 }
      })
      return next
    })
  }, [showAddModal, selectedExercises])

  const handleAddWorkout = () => {
    if (!workoutName.trim()) return
    const exercises = getSelectedExerciseList().map(({ key, setsCount, repsCount, ...rest }) => rest)
    const newWorkout = {
      id: Date.now(),
      name: workoutName,
      days: selectedDays,
      date: new Date().toLocaleDateString('tr-TR'),
      exercises,
    }
    setSavedWorkouts(prev => [newWorkout, ...prev])
    setSelectedExercises({})
    setExerciseConfig({})
    setWorkoutName('')
    setSelectedDays([])
    setShowAddModal(false)
    setActiveTab('my')
  }

  const handleDeleteWorkout = (id) => {
    const workout = savedWorkouts.find(w => w.id === id)
    if (workout) {
      setDeletedWorkouts(prev => [
        { ...workout, deletedAt: new Date().toLocaleDateString('tr-TR') },
        ...prev
      ])
    }
    setSavedWorkouts(prev => prev.filter(w => w.id !== id))
    setConfirmingDeleteId(null)
  }

  // Düzenleme fonksiyonları
  const handleEditWorkout = (workout) => {
    setEditingWorkout(workout.id)
    setEditWorkoutName(workout.name)
    setEditWorkoutDays([...workout.days])
    setEditWorkoutExercises(workout.exercises.map(ex => ({ ...ex })))
  }

  const handleEditExerciseSets = (index, newSets) => {
    setEditWorkoutExercises(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], sets: newSets }
      return updated
    })
  }

  const handleRemoveEditExercise = (index) => {
    setEditWorkoutExercises(prev => prev.filter((_, i) => i !== index))
  }

  const handleSaveEdit = () => {
    if (!editWorkoutName.trim()) return
    setSavedWorkouts(prev => prev.map(w =>
      w.id === editingWorkout
        ? { ...w, name: editWorkoutName, days: editWorkoutDays, exercises: editWorkoutExercises }
        : w
    ))
    setEditingWorkout(null)
  }

  const handleCancelEdit = () => {
    setEditingWorkout(null)
  }

  // Geçmiş: silinen antrenmanlar
  const historyWorkouts = [...deletedWorkouts].sort((a, b) => b.id - a.id)

  return (
    <div className="workouts-page">
      {/* Sayfa başlığı */}
      <motion.div className="page-header" initial="hidden" animate="visible" variants={fadeInUp}>
        <div className="page-header-left">
          <GiWeightLiftingUp className="page-header-svg-icon" />
          <h1>Antrenman Planları</h1>
        </div>
        {selectedCount > 0 && activeTab === 'add' && (
          <button className="btn btn-primary selected-btn" onClick={() => setShowAddModal(true)}>
            <FiPlus /> Seçilenleri Ekle ({selectedCount})
          </button>
        )}
      </motion.div>

      {/* Sekmeler */}
      <motion.div className="tab-nav" initial="hidden" animate="visible" variants={fadeInUp} custom={1}>
        <button
          className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          Antrenmanlarım
        </button>
        <button
          className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          <FiPlus /> Antrenman Ekle
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Geçmiş Antrenmanlarım
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        {}
        {activeTab === 'my' && (
          <motion.div
            key="my"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {savedWorkouts.length === 0 ? (
              <div className="workouts-empty">
                <GiWeightLiftingUp className="history-empty-icon" />
                <h3>Henüz antrenman yok</h3>
                <p>"Antrenman Ekle" sekmesinden antrenmanlarını oluşturabilirsin.</p>
                <button className="btn btn-primary" onClick={() => setActiveTab('add')}>
                  <FiPlus /> İlk Antrenmanı Oluştur
                </button>
              </div>
            ) : (
              <div className="saved-workouts">
                {savedWorkouts.map((workout) => (
                  <div className="saved-workout-card" key={workout.id}>
                    {editingWorkout === workout.id ? (
                      
                      <div className="edit-workout-form">
                        <div className="form-group">
                          <label className="form-label">Antrenman Adı</label>
                          <input
                            type="text"
                            className="form-input"
                            value={editWorkoutName}
                            onChange={e => setEditWorkoutName(e.target.value)}
                          />
                        </div>
                        <div className="form-group" style={{ marginTop: '0.75rem' }}>
                          <label className="form-label">Günler</label>
                          <div className="days-selector">
                            {DAYS.map(day => (
                              <button
                                key={day}
                                className={`day-chip ${editWorkoutDays.includes(day) ? 'active' : ''}`}
                                onClick={() => toggleEditDay(day)}
                                type="button"
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="form-group" style={{ marginTop: '0.75rem' }}>
                          <label className="form-label">Egzersizler</label>
                          <div className="edit-exercise-list">
                            {editWorkoutExercises.map((ex, i) => (
                              <div className="edit-exercise-row" key={i}>
                                <span className="edit-ex-name">{ex.name}</span>
                                <input
                                  type="text"
                                  className="edit-ex-sets-input"
                                  value={ex.sets}
                                  onChange={e => handleEditExerciseSets(i, e.target.value)}
                                />
                                <button
                                  className="action-btn delete-btn"
                                  onClick={() => handleRemoveEditExercise(i)}
                                  style={{ width: 28, height: 28, fontSize: '0.8rem' }}
                                >
                                  <FiX />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="edit-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                          <button className="btn btn-secondary" onClick={handleCancelEdit}>İptal</button>
                          <button className="btn btn-primary" onClick={handleSaveEdit}><FiSave /> Kaydet</button>
                        </div>
                      </div>
                    ) : (
                      
                      <div className="saved-workout-header">
                        <div className="saved-workout-info">
                          <div className="saved-workout-title-row">
                            <span className="saved-workout-name">{workout.name}</span>
                            <div className="saved-workout-days">
                              {workout.days.map((day, i) => (
                                <span className="day-badge" key={i}>{day}</span>
                              ))}
                            </div>
                          </div>
                          <span className="saved-workout-meta">
                            {workout.exercises.length} egzersiz · {workout.date}
                          </span>
                          <div className="saved-workout-exercises">
                            {workout.exercises.map((ex, i) => (
                              <span className="exercise-tag" key={i}>
                                {ex.name} <span className="exercise-sets">{ex.sets}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="saved-workout-actions">
                          <button className="action-btn edit-btn" onClick={() => handleEditWorkout(workout)}><FiEdit2 /></button>
                          <div className="delete-btn-wrap">
                            <button className="action-btn delete-btn" onClick={() => setConfirmingDeleteId(workout.id)}><FiTrash2 /></button>
                            {confirmingDeleteId === workout.id && (
                              <ConfirmPopover
                                title="Antrenmanı silmek istediğine emin misin?"
                                onConfirm={() => handleDeleteWorkout(workout.id)}
                                onCancel={() => setConfirmingDeleteId(null)}
                                placement="below"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {}
        {activeTab === 'add' && (
          <motion.div
            key="add"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Kas grubu butonları */}
            <div className="muscle-chips">
              {muscleGroups.map((mg) => (
                <button
                  key={mg.id}
                  className={`muscle-chip ${selectedMuscle === mg.id ? 'active' : ''}`}
                  onClick={() => { setSelectedMuscle(mg.id); setSearchTerm('') }}
                  style={selectedMuscle === mg.id ? {
                    background: '#E62E00',
                    borderColor: '#E62E00',
                    color: '#fff'
                  } : {}}
                >
                  {mg.name}
                </button>
              ))}
            </div>

            {/* Seçilen sayısı */}
            {selectedCount > 0 && (
              <div className="selection-info">
                <span className="selection-count">{selectedCount}</span>
                egzersiz seçildi — farklı kas gruplarından seçmeye devam edebilirsiniz
              </div>
            )}

            {/* Egzersiz listesi */}
            <div className="exercise-list-card">
              <div className="exercise-list-header">
                <div className="exercise-list-title">
                  <div>
                    <h3>{currentGroup.title}</h3>
                    <p>İstediğin egzersizleri seç ve antrenmanlarına ekle</p>
                  </div>
                </div>
                <div className="exercise-search">
                  <FiSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Egzersiz ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>

              <div className="exercise-items">
                {filteredExercises.map((exercise) => {
                  const key = `${selectedMuscle}-${exercise.id}`
                  const isSelected = selectedExercises[key]
                  const isFav = isFavoriteExercise(selectedMuscle, exercise.id)
                  return (
                    <div
                      className={`exercise-item ${isSelected ? 'selected' : ''}`}
                      key={exercise.id}
                    >
                      <label className="exercise-checkbox-label">
                        <input
                          type="checkbox"
                          checked={isSelected || false}
                          onChange={() => toggleExercise(selectedMuscle, exercise.id)}
                          className="exercise-checkbox"
                        />
                        <span className="custom-checkbox">
                          {isSelected && <FiCheckCircle />}
                        </span>
                        <span className="exercise-name">{exercise.name}</span>
                      </label>
                      <button
                        className={`exercise-fav-btn ${isFav ? 'fav-active' : ''}`}
                        onClick={() => toggleFavoriteExercise(selectedMuscle, exercise)}
                        title={isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                      >
                        <FiHeart />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        {}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="history-section">
              {historyWorkouts.length === 0 && savedWorkouts.length === 0 ? (
                <div className="history-empty">
                  <GiWeightLiftingUp className="history-empty-icon" />
                  <h3>Antrenman Geçmişi</h3>
                  <p>Tamamladığın antrenmanlar burada görüntülenecek. Bir antrenman başlat ve ilerlemeni takip et!</p>
                  <button className="btn btn-primary" onClick={() => setActiveTab('add')}>
                    <FiPlus /> İlk Antrenmanını Oluştur
                  </button>
                </div>
              ) : historyWorkouts.length === 0 ? (
                <div className="history-empty">
                  <GiWeightLiftingUp className="history-empty-icon" />
                  <h3>Geçmişte Antrenman Yok</h3>
                  <p>Sildiğin veya tamamladığın antrenmanlar burada görünecek.</p>
                </div>
              ) : (
                <div className="saved-workouts">
                  {historyWorkouts.map((workout) => (
                    <div className="saved-workout-card history-card" key={workout.id + '-hist'}>
                      <div className="saved-workout-header">
                        <div className="saved-workout-info">
                          <div className="saved-workout-title-row">
                            <span className="saved-workout-name">{workout.name}</span>
                            <div className="saved-workout-days">
                              {workout.days.map((day, i) => (
                                <span className="day-badge" key={i}>{day}</span>
                              ))}
                            </div>
                          </div>
                          <span className="saved-workout-meta">
                            {workout.exercises.length} egzersiz · {workout.deletedAt ? `Silindi: ${workout.deletedAt}` : workout.date}
                          </span>
                          <div className="saved-workout-exercises">
                            {workout.exercises.map((ex, i) => (
                              <span className="exercise-tag" key={i}>
                                {ex.name} <span className="exercise-sets">{ex.sets}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Antrenman ekleme modalı */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false) }}
          >
            <motion.div
              className="workout-modal"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Antrenman Planı Oluştur</h3>
                <button className="modal-close" onClick={() => setShowAddModal(false)}><FiX /></button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Antrenman Adı</label>
                  <input
                    type="text"
                    className="form-input"
                    value={workoutName}
                    onChange={e => setWorkoutName(e.target.value)}
                    placeholder="örn: İtiş Günü, Bacak Günü..."
                    autoFocus
                  />
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Günler</label>
                  <div className="days-selector">
                    {DAYS.map(day => (
                      <button
                        key={day}
                        className={`day-chip ${selectedDays.includes(day) ? 'active' : ''}`}
                        onClick={() => toggleDay(day)}
                        type="button"
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="modal-exercises">
                  <span className="form-label">Seçilen Egzersizler ({selectedCount})</span>
                  <div className="modal-exercise-list">
                    {getSelectedExerciseList().map((ex) => (
                      <div key={ex.key} className="modal-exercise-item">
                        <FiCheckCircle style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                        <span className="modal-exercise-name">{ex.name}</span>
                        <div className="modal-exercise-config">
                          <label>
                            Set
                            <input
                              type="number"
                              min="1"
                              max="99"
                              value={ex.setsCount}
                              onChange={(e) => updateExerciseConfig(ex.key, 'sets', e.target.value)}
                            />
                          </label>
                          <span className="modal-exercise-x">×</span>
                          <label>
                            Tekrar
                            <input
                              type="number"
                              min="1"
                              max="99"
                              value={ex.repsCount}
                              onChange={(e) => updateExerciseConfig(ex.key, 'reps', e.target.value)}
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>İptal</button>
                <button
                  className="btn btn-primary"
                  onClick={handleAddWorkout}
                  disabled={!workoutName.trim() || selectedCount === 0}
                >
                  <FiSave /> Antrenmanı Kaydet
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
