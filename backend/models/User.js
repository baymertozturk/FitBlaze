const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const customExerciseSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  value: { type: Number, default: null },
}, { _id: false })

const measurementsSchema = new mongoose.Schema({
  chest:           { type: Number, default: null },
  waist:           { type: Number, default: null },
  hip:             { type: Number, default: null },
  upperArm:        { type: Number, default: null },
  thigh:           { type: Number, default: null },
  shoulder:        { type: Number, default: null },
  calf:            { type: Number, default: null },
  wrist:           { type: Number, default: null },
  neck:            { type: Number, default: null },
  bodyFat:         { type: Number, default: null },
  benchPress1RM:   { type: Number, default: null },
  squat1RM:        { type: Number, default: null },
  deadlift1RM:     { type: Number, default: null },
  overheadPress1RM:{ type: Number, default: null },
  bfCaliper:       { type: Number, default: null },
  bfDexa:          { type: Number, default: null },
  bfMethod:        { type: String, default: 'navy' },
  customExercises: { type: [customExerciseSchema], default: [] },
}, { _id: false })

const userSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:      { type: String, required: true, minlength: 6, select: false },
  age:           { type: Number, default: null },
  height:        { type: Number, default: null },
  weight:        { type: Number, default: null },
  gender:        { type: String, enum: ['male', 'female'], default: 'male' },
  goal:          { type: String, enum: ['muscle_gain', 'fat_loss', 'maintain', 'recomp'], default: 'maintain' },
  activityLevel: { type: Number, default: 1.55 },
  measurements:  { type: measurementsSchema, default: () => ({}) },
  avatarUrl:     { type: String, default: null },
  isFrozen:      { type: Boolean, default: false },
}, { timestamps: true })

// Şifreyi kaydetmeden önce hash'le
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Şifre karşılaştırma metodu
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password)
}

module.exports = mongoose.model('User', userSchema)
