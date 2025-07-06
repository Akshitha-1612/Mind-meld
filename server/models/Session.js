const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameType: {
    type: String,
    required: true,
    enum: [
      'n-back',
      'dual-task',
      'flanker',
      'attention-network',
      'simple-reaction',
      'choice-reaction',
      'ravens-matrices',
      'tower-hanoi'
    ]
  },
  domain: {
    type: String,
    required: true,
    enum: ['working_memory', 'attention', 'processing_speed', 'problem_solving']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  duration: {
    type: Number,
    required: true,
    min: 0
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  accuracy: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  reactionTime: {
    type: Number,
    min: 0
  },
  metrics: {
    // Game-specific metrics
    correctResponses: Number,
    totalResponses: Number,
    errors: Number,
    omissions: Number,
    falseAlarms: Number,
    
    // N-Back specific
    dPrime: Number,
    criterion: Number,
    
    // Flanker specific
    congruentRT: Number,
    incongruentRT: Number,
    flankerEffect: Number,
    
    // ANT specific
    alertingEffect: Number,
    orientingEffect: Number,
    executiveEffect: Number,
    
    // Choice RT specific
    complexity: Number,
    hicksLawSlope: Number,
    
    // Ravens specific
    problemsSolved: Number,
    totalProblems: Number,
    
    // Tower of Hanoi specific
    moves: Number,
    optimalMoves: Number,
    efficiency: Number
  },
  percentileScores: {
    overall: Number,
    ageGroup: Number,
    profession: Number
  },
  anomalyFlag: {
    type: Boolean,
    default: false
  },
  anomalyReason: String,
  mlPredictions: {
    nextSessionScore: Number,
    improvementProbability: Number,
    recommendedDifficulty: String
  },
  deviceInfo: {
    userAgent: String,
    screenResolution: String,
    platform: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ gameType: 1, domain: 1 });
sessionSchema.index({ userId: 1, gameType: 1, createdAt: -1 });

// Virtual for performance rating
sessionSchema.virtual('performanceRating').get(function() {
  if (this.score >= 90) return 'excellent';
  if (this.score >= 80) return 'good';
  if (this.score >= 70) return 'average';
  if (this.score >= 60) return 'below_average';
  return 'poor';
});

// Method to calculate percentile
sessionSchema.methods.calculatePercentile = function(normativeData) {
  // Mock percentile calculation - in real app, use actual normative data
  const basePercentile = Math.min(95, Math.max(5, this.score + Math.random() * 20 - 10));
  return {
    overall: Math.round(basePercentile),
    ageGroup: Math.round(basePercentile + Math.random() * 10 - 5),
    profession: Math.round(basePercentile + Math.random() * 8 - 4)
  };
};

module.exports = mongoose.model('Session', sessionSchema);