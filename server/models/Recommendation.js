const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['ml_insight', 'percentile_feedback', 'anomaly_alert', 'improvement_tip', 'challenge_suggestion']
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['performance', 'training', 'achievement', 'warning', 'tip'],
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
});

// Index for efficient queries
recommendationSchema.index({ userId: 1, createdAt: -1 });
recommendationSchema.index({ userId: 1, isRead: 1 });
recommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create ML-based recommendation
recommendationSchema.statics.createMLRecommendation = async function(userId, mlData) {
  const recommendations = [];
  
  if (mlData.cluster) {
    recommendations.push({
      userId,
      type: 'ml_insight',
      title: 'Cognitive Profile Update',
      message: `Based on your recent performance, you've been classified as ${mlData.cluster} level. Keep up the great work!`,
      category: 'performance',
      data: { cluster: mlData.cluster }
    });
  }
  
  if (mlData.prediction && mlData.prediction.improvementProbability > 0.7) {
    recommendations.push({
      userId,
      type: 'improvement_tip',
      title: 'High Improvement Potential',
      message: 'Our AI predicts you have a 70%+ chance of improvement in your next session. Focus on consistency!',
      category: 'tip',
      data: { probability: mlData.prediction.improvementProbability }
    });
  }
  
  return await this.insertMany(recommendations);
};

module.exports = mongoose.model('Recommendation', recommendationSchema);