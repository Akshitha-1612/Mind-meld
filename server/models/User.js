const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [13, 'Must be at least 13 years old'],
    max: [120, 'Age cannot exceed 120']
  },
  profession: {
    type: String,
    required: [true, 'Profession is required'],
    trim: true,
    maxlength: [100, 'Profession cannot exceed 100 characters']
  },
  cognitiveGoal: {
    type: String,
    required: [true, 'Cognitive goal is required'],
    enum: ['memory', 'attention', 'processing_speed', 'problem_solving', 'overall'],
    default: 'overall'
  },
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  xp: {
    type: Number,
    default: 0,
    min: 0
  },
  streak: {
    type: Number,
    default: 0,
    min: 0
  },
  lastActiveDate: {
    type: Date,
    default: Date.now
  },
  badges: [{
    id: String,
    name: String,
    description: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  currentCluster: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  preferences: {
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'adaptive'],
      default: 'adaptive'
    },
    notifications: {
      type: Boolean,
      default: true
    },
    dataSharing: {
      type: Boolean,
      default: false
    }
  },
  stats: {
    totalSessions: {
      type: Number,
      default: 0
    },
    totalPlayTime: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    bestStreak: {
      type: Number,
      default: 0
    },
    gamesPlayed: {
      type: Map,
      of: Number,
      default: new Map()
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update streak
userSchema.methods.updateStreak = function() {
  const today = new Date();
  const lastActive = new Date(this.lastActiveDate);
  const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 1) {
    this.streak += 1;
    this.bestStreak = Math.max(this.bestStreak, this.streak);
  } else if (daysDiff > 1) {
    this.streak = 1;
  }
  
  this.lastActiveDate = today;
};

// Method to add XP and level up
userSchema.methods.addXP = function(points) {
  this.xp += points;
  const newLevel = Math.floor(this.xp / 1000) + 1;
  if (newLevel > this.level) {
    this.level = newLevel;
    return { leveledUp: true, newLevel };
  }
  return { leveledUp: false };
};

// Method to award badge
userSchema.methods.awardBadge = function(badgeData) {
  const existingBadge = this.badges.find(badge => badge.id === badgeData.id);
  if (!existingBadge) {
    this.badges.push(badgeData);
    return true;
  }
  return false;
};

module.exports = mongoose.model('User', userSchema);