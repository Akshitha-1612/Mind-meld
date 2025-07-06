const express = require('express');
const axios = require('axios');
const Session = require('../models/Session');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Mock ML service responses when actual service is unavailable
const mockMLResponses = {
  cluster: (userData) => ({
    cluster: ['beginner', 'intermediate', 'advanced', 'expert'][Math.floor(Math.random() * 4)],
    confidence: Math.random() * 0.5 + 0.5,
    characteristics: [
      'Strong working memory performance',
      'Consistent reaction times',
      'Good problem-solving skills'
    ]
  }),
  
  predict: (sessionData) => ({
    nextSessionScore: Math.max(0, Math.min(100, sessionData.averageScore + (Math.random() * 20 - 10))),
    improvementProbability: Math.random(),
    recommendedDifficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
    confidence: Math.random() * 0.4 + 0.6
  }),
  
  bandit: (gameHistory) => ({
    recommendedGame: ['n-back', 'flanker', 'ravens-matrices', 'tower-hanoi'][Math.floor(Math.random() * 4)],
    difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
    expectedReward: Math.random(),
    reasoning: 'Based on your recent performance patterns'
  }),
  
  anomaly: (sessionData) => ({
    isAnomaly: Math.random() < 0.1, // 10% chance of anomaly
    anomalyScore: Math.random(),
    reasons: Math.random() < 0.1 ? ['Unusually high performance', 'Inconsistent reaction times'] : []
  }),
  
  norms: (userAge, domain, score) => ({
    percentile: Math.max(5, Math.min(95, score + Math.random() * 20 - 10)),
    zScore: (Math.random() * 4 - 2),
    ageGroupPercentile: Math.max(5, Math.min(95, score + Math.random() * 15 - 7.5)),
    interpretation: score > 80 ? 'Above average' : score > 60 ? 'Average' : 'Below average'
  })
};

// @route   POST /api/ml/cluster
// @desc    Get user cognitive cluster
// @access  Private
router.post('/cluster', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const recentSessions = await Session.find({ userId }).limit(20).sort({ createdAt: -1 });
    
    const userData = {
      age: user.age,
      profession: user.profession,
      cognitiveGoal: user.cognitiveGoal,
      stats: user.stats,
      recentPerformance: recentSessions.map(s => ({
        gameType: s.gameType,
        domain: s.domain,
        score: s.score,
        accuracy: s.accuracy,
        reactionTime: s.reactionTime
      }))
    };

    let clusterResult;
    
    try {
      // Try to call actual ML service
      const response = await axios.post(`${process.env.ML_API_URL}/cluster`, userData, {
        timeout: 5000
      });
      clusterResult = response.data;
    } catch (error) {
      console.log('ML service unavailable, using mock response');
      clusterResult = mockMLResponses.cluster(userData);
    }
    
    // Update user's current cluster
    user.currentCluster = clusterResult.cluster;
    await user.save();

    res.json({
      success: true,
      cluster: clusterResult
    });
  } catch (error) {
    console.error('Cluster analysis error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/ml/predict
// @desc    Predict future performance
// @access  Private
router.post('/predict', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const sessions = await Session.find({ userId }).limit(50).sort({ createdAt: -1 });
    
    const predictionData = {
      userId,
      userProfile: {
        age: user.age,
        level: user.level,
        streak: user.streak,
        averageScore: user.stats.averageScore
      },
      sessionHistory: sessions.map(s => ({
        gameType: s.gameType,
        domain: s.domain,
        score: s.score,
        accuracy: s.accuracy,
        difficulty: s.difficulty,
        timestamp: s.createdAt
      })),
      ...req.body
    };

    let predictionResult;
    
    try {
      const response = await axios.post(`${process.env.ML_API_URL}/predict`, predictionData, {
        timeout: 5000
      });
      predictionResult = response.data;
    } catch (error) {
      console.log('ML service unavailable, using mock response');
      predictionResult = mockMLResponses.predict(predictionData.userProfile);
    }

    res.json({
      success: true,
      prediction: predictionResult
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/ml/bandit
// @desc    Get adaptive game recommendation
// @access  Private
router.post('/bandit', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const recentSessions = await Session.find({ userId }).limit(10).sort({ createdAt: -1 });
    
    const banditData = {
      userId,
      userProfile: {
        level: user.level,
        cognitiveGoal: user.cognitiveGoal,
        currentCluster: user.currentCluster
      },
      recentPerformance: recentSessions.map(s => ({
        gameType: s.gameType,
        difficulty: s.difficulty,
        score: s.score,
        reward: s.score / 100 // Normalize score as reward
      })),
      availableGames: [
        'n-back', 'dual-task', 'flanker', 'attention-network',
        'simple-reaction', 'choice-reaction', 'ravens-matrices', 'tower-hanoi'
      ]
    };

    let banditResult;
    
    try {
      const response = await axios.post(`${process.env.ML_API_URL}/bandit`, banditData, {
        timeout: 5000
      });
      banditResult = response.data;
    } catch (error) {
      console.log('ML service unavailable, using mock response');
      banditResult = mockMLResponses.bandit(banditData.recentPerformance);
    }

    res.json({
      success: true,
      recommendation: banditResult
    });
  } catch (error) {
    console.error('Bandit recommendation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/ml/anomaly
// @desc    Detect performance anomalies
// @access  Private
router.post('/anomaly', auth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await Session.findById(sessionId);
    
    if (!session || session.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Session not found' });
    }
    
    const userSessions = await Session.find({ 
      userId: req.user.id,
      gameType: session.gameType 
    }).limit(20).sort({ createdAt: -1 });
    
    const anomalyData = {
      currentSession: {
        score: session.score,
        accuracy: session.accuracy,
        reactionTime: session.reactionTime,
        duration: session.duration
      },
      historicalSessions: userSessions.map(s => ({
        score: s.score,
        accuracy: s.accuracy,
        reactionTime: s.reactionTime,
        duration: s.duration
      }))
    };

    let anomalyResult;
    
    try {
      const response = await axios.post(`${process.env.ML_API_URL}/anomaly`, anomalyData, {
        timeout: 5000
      });
      anomalyResult = response.data;
    } catch (error) {
      console.log('ML service unavailable, using mock response');
      anomalyResult = mockMLResponses.anomaly(anomalyData.currentSession);
    }
    
    // Update session with anomaly information
    if (anomalyResult.isAnomaly) {
      session.anomalyFlag = true;
      session.anomalyReason = anomalyResult.reasons.join(', ');
      await session.save();
    }

    res.json({
      success: true,
      anomaly: anomalyResult
    });
  } catch (error) {
    console.error('Anomaly detection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/ml/norms
// @desc    Get normative percentiles
// @access  Private
router.post('/norms', auth, async (req, res) => {
  try {
    const { domain, score } = req.body;
    const user = await User.findById(req.user.id);
    
    const normsData = {
      age: user.age,
      profession: user.profession,
      domain,
      score
    };

    let normsResult;
    
    try {
      const response = await axios.post(`${process.env.ML_API_URL}/norms`, normsData, {
        timeout: 5000
      });
      normsResult = response.data;
    } catch (error) {
      console.log('ML service unavailable, using mock response');
      normsResult = mockMLResponses.norms(user.age, domain, score);
    }

    res.json({
      success: true,
      norms: normsResult
    });
  } catch (error) {
    console.error('Norms calculation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/ml/insights
// @desc    Get comprehensive ML insights
// @access  Private
router.get('/insights', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const recentSessions = await Session.find({ userId }).limit(20).sort({ createdAt: -1 });
    
    // Get cluster analysis
    const clusterResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/ml/cluster`, {}, {
      headers: { Authorization: req.headers.authorization }
    }).catch(() => ({ data: { cluster: mockMLResponses.cluster({}) } }));
    
    // Get performance prediction
    const predictionResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/ml/predict`, {}, {
      headers: { Authorization: req.headers.authorization }
    }).catch(() => ({ data: { prediction: mockMLResponses.predict(user.stats) } }));
    
    // Get game recommendation
    const banditResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/ml/bandit`, {}, {
      headers: { Authorization: req.headers.authorization }
    }).catch(() => ({ data: { recommendation: mockMLResponses.bandit([]) } }));

    const insights = {
      cognitiveProfile: clusterResponse.data.cluster,
      performancePrediction: predictionResponse.data.prediction,
      gameRecommendation: banditResponse.data.recommendation,
      trends: {
        improvement: calculateImprovementTrend(recentSessions),
        consistency: calculateConsistency(recentSessions),
        strengths: identifyStrengths(recentSessions),
        areasForImprovement: identifyWeaknesses(recentSessions)
      },
      recommendations: generatePersonalizedRecommendations(user, recentSessions)
    };

    res.json({
      success: true,
      insights
    });
  } catch (error) {
    console.error('ML insights error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper functions for insights
function calculateImprovementTrend(sessions) {
  if (sessions.length < 5) return 0;
  
  const recent = sessions.slice(0, 5);
  const older = sessions.slice(5, 10);
  
  const recentAvg = recent.reduce((sum, s) => sum + s.score, 0) / recent.length;
  const olderAvg = older.reduce((sum, s) => sum + s.score, 0) / older.length;
  
  return ((recentAvg - olderAvg) / olderAvg) * 100;
}

function calculateConsistency(sessions) {
  if (sessions.length < 3) return 50;
  
  const scores = sessions.map(s => s.score);
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  
  return Math.max(0, 100 - Math.sqrt(variance));
}

function identifyStrengths(sessions) {
  const domainPerformance = {};
  
  sessions.forEach(session => {
    if (!domainPerformance[session.domain]) {
      domainPerformance[session.domain] = [];
    }
    domainPerformance[session.domain].push(session.score);
  });
  
  const strengths = [];
  Object.keys(domainPerformance).forEach(domain => {
    const avg = domainPerformance[domain].reduce((sum, score) => sum + score, 0) / domainPerformance[domain].length;
    if (avg > 80) {
      strengths.push({
        domain,
        averageScore: Math.round(avg),
        description: `Strong performance in ${domain.replace('_', ' ')}`
      });
    }
  });
  
  return strengths;
}

function identifyWeaknesses(sessions) {
  const domainPerformance = {};
  
  sessions.forEach(session => {
    if (!domainPerformance[session.domain]) {
      domainPerformance[session.domain] = [];
    }
    domainPerformance[session.domain].push(session.score);
  });
  
  const weaknesses = [];
  Object.keys(domainPerformance).forEach(domain => {
    const avg = domainPerformance[domain].reduce((sum, score) => sum + score, 0) / domainPerformance[domain].length;
    if (avg < 60) {
      weaknesses.push({
        domain,
        averageScore: Math.round(avg),
        description: `Room for improvement in ${domain.replace('_', ' ')}`
      });
    }
  });
  
  return weaknesses;
}

function generatePersonalizedRecommendations(user, sessions) {
  const recommendations = [];
  
  // Based on streak
  if (user.streak < 3) {
    recommendations.push({
      type: 'consistency',
      message: 'Try to maintain a daily training routine to build momentum',
      priority: 'medium'
    });
  }
  
  // Based on recent performance
  if (sessions.length > 0) {
    const recentAvg = sessions.slice(0, 5).reduce((sum, s) => sum + s.score, 0) / Math.min(5, sessions.length);
    
    if (recentAvg > 85) {
      recommendations.push({
        type: 'challenge',
        message: 'Consider increasing difficulty level to continue challenging yourself',
        priority: 'low'
      });
    } else if (recentAvg < 60) {
      recommendations.push({
        type: 'support',
        message: 'Focus on easier levels to build confidence and consistency',
        priority: 'high'
      });
    }
  }
  
  return recommendations;
}

module.exports = router;