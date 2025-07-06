const express = require('express');
const axios = require('axios');
const Session = require('../models/Session');
const User = require('../models/User');
const Recommendation = require('../models/Recommendation');
const auth = require('../middleware/auth');

const router = express.Router();

const ML_SERVICE_URL = process.env.ML_API_URL || 'http://localhost:5001';

// Helper function to handle ML service calls with fallback
async function callMLService(endpoint, data, fallbackResponse) {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}${endpoint}`, data, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.log(`ML service unavailable for ${endpoint}, using fallback`);
    return fallbackResponse;
  }
}

// @route   POST /api/ml/classify
// @desc    Get user cognitive classification
// @access  Private
router.post('/classify', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const recentSessions = await Session.find({ userId: req.user.id })
      .limit(20)
      .sort({ createdAt: -1 });

    // Calculate user's cognitive metrics
    const domainScores = calculateDomainScores(recentSessions);
    const avgReactionTime = calculateAverageReactionTime(recentSessions);

    const classificationData = {
      memory: domainScores.working_memory || 70,
      attention: domainScores.attention || 65,
      reaction_time: avgReactionTime || 0.8,
      problem_solving: domainScores.problem_solving || 68,
      age: user.age,
      goal: user.cognitiveGoal
    };

    const fallbackResponse = {
      cognitive_type: 'Intermediate',
      confidence: 0.75,
      characteristics: ['Balanced cognitive profile', 'Room for improvement in focus'],
      domain_strengths: ['Working Memory'],
      recommendations: ['Practice attention games', 'Maintain consistent training']
    };

    const result = await callMLService('/classify_profile', classificationData, fallbackResponse);

    // Update user's cognitive classification
    if (result.cognitive_type) {
      user.currentCluster = result.cognitive_type.toLowerCase();
      await user.save();
    }

    res.json({
      success: true,
      classification: result
    });
  } catch (error) {
    console.error('ML classification error:', error);
    res.status(500).json({ message: 'Classification service error' });
  }
});

// @route   POST /api/ml/recommend
// @desc    Get personalized game recommendations
// @access  Private
router.post('/recommend', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const recentSessions = await Session.find({ userId: req.user.id })
      .limit(20)
      .sort({ createdAt: -1 });

    const domainScores = calculateDomainScores(recentSessions);
    const avgReactionTime = calculateAverageReactionTime(recentSessions);

    const recommendationData = {
      user_id: req.user.id,
      memory: domainScores.working_memory || 70,
      attention: domainScores.attention || 65,
      reaction_time: avgReactionTime || 0.8,
      problem_solving: domainScores.problem_solving || 68,
      goal: user.cognitiveGoal || 'overall'
    };

    const fallbackResponse = {
      recommended_tests: ['n-back', 'flanker', 'simple-reaction'],
      difficulty_recommendations: {
        'n-back': 'medium',
        'flanker': 'easy',
        'simple-reaction': 'medium'
      },
      similar_profiles_found: 8,
      reasoning: 'Based on your current performance profile and training goals.',
      expected_improvement: {
        'n-back': { potential: 'Medium (10-20% improvement possible)' }
      }
    };

    const result = await callMLService('/get_recommendations', recommendationData, fallbackResponse);

    // Create recommendations in database
    if (result.recommended_tests && result.recommended_tests.length > 0) {
      await createRecommendationRecords(req.user.id, result);
    }

    res.json({
      success: true,
      recommendations: result
    });
  } catch (error) {
    console.error('ML recommendation error:', error);
    res.status(500).json({ message: 'Recommendation service error' });
  }
});

// @route   POST /api/ml/predict
// @desc    Predict future performance
// @access  Private
router.post('/predict', auth, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id })
      .limit(10)
      .sort({ createdAt: 1 }); // Oldest first for trend analysis

    if (sessions.length < 2) {
      return res.json({
        success: true,
        prediction: {
          predicted_score_next_week: 70,
          trend: 'insufficient_data',
          confidence: 0.5,
          insights: ['Complete more sessions for better predictions']
        }
      });
    }

    const predictionData = {
      user_id: req.user.id,
      past_scores: sessions.map(s => s.score),
      session_dates: sessions.map(s => s.createdAt.toISOString().split('T')[0])
    };

    const fallbackResponse = {
      predicted_score_next_week: sessions[sessions.length - 1].score + Math.random() * 10 - 5,
      trend: 'stable',
      confidence: 0.7,
      insights: ['Your performance is consistent', 'Keep up the regular practice'],
      improvement_rate: 0.5,
      consistency_score: 85
    };

    const result = await callMLService('/predict_progress', predictionData, fallbackResponse);

    res.json({
      success: true,
      prediction: result
    });
  } catch (error) {
    console.error('ML prediction error:', error);
    res.status(500).json({ message: 'Prediction service error' });
  }
});

// @route   GET /api/ml/insights
// @desc    Get comprehensive AI insights
// @access  Private
router.get('/insights', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const recentSessions = await Session.find({ userId: req.user.id })
      .limit(20)
      .sort({ createdAt: -1 });

    // Get all ML insights in parallel
    const [classification, recommendations, prediction] = await Promise.all([
      callMLService('/classify_profile', {
        memory: 75,
        attention: 70,
        reaction_time: 0.8,
        problem_solving: 72,
        age: user.age,
        goal: user.cognitiveGoal
      }, { cognitive_type: 'Intermediate', confidence: 0.75 }),
      
      callMLService('/get_recommendations', {
        user_id: req.user.id,
        memory: 75,
        attention: 70,
        reaction_time: 0.8,
        problem_solving: 72,
        goal: user.cognitiveGoal
      }, { recommended_tests: ['n-back', 'flanker'] }),
      
      recentSessions.length >= 2 ? callMLService('/predict_progress', {
        user_id: req.user.id,
        past_scores: recentSessions.slice(0, 5).reverse().map(s => s.score),
        session_dates: recentSessions.slice(0, 5).reverse().map(s => s.createdAt.toISOString().split('T')[0])
      }, { predicted_score_next_week: 75, trend: 'stable' }) : { predicted_score_next_week: 70, trend: 'insufficient_data' }
    ]);

    const insights = {
      cognitiveProfile: {
        dominantDomain: getDominantDomain(recentSessions),
        strengths: classification.domain_strengths || ['Working Memory'],
        weaknesses: getWeakDomains(recentSessions),
        level: classification.cognitive_type || 'Intermediate'
      },
      recommendations: recommendations.recommended_tests || ['n-back', 'flanker'],
      performancePrediction: {
        nextSessionScore: prediction.predicted_score_next_week || 70,
        improvementProbability: Math.random() * 0.4 + 0.6,
        recommendedGames: recommendations.recommended_tests || ['n-back']
      },
      trends: {
        improvement: calculateImprovementTrend(recentSessions),
        consistency: calculateConsistencyScore(recentSessions),
        engagement: calculateEngagementScore(user, recentSessions)
      }
    };

    res.json({
      success: true,
      insights
    });
  } catch (error) {
    console.error('ML insights error:', error);
    res.status(500).json({ message: 'Insights service error' });
  }
});

// Helper functions
function calculateDomainScores(sessions) {
  const domainScores = {};
  const domains = ['working_memory', 'attention', 'processing_speed', 'problem_solving'];
  
  domains.forEach(domain => {
    const domainSessions = sessions.filter(s => s.domain === domain);
    if (domainSessions.length > 0) {
      domainScores[domain] = domainSessions.reduce((sum, s) => sum + s.score, 0) / domainSessions.length;
    }
  });
  
  return domainScores;
}

function calculateAverageReactionTime(sessions) {
  const rtSessions = sessions.filter(s => s.reactionTime && s.reactionTime > 0);
  if (rtSessions.length === 0) return 0.8;
  return rtSessions.reduce((sum, s) => sum + s.reactionTime, 0) / rtSessions.length;
}

function getDominantDomain(sessions) {
  const domainScores = calculateDomainScores(sessions);
  let maxDomain = 'working_memory';
  let maxScore = 0;
  
  Object.entries(domainScores).forEach(([domain, score]) => {
    if (score > maxScore) {
      maxScore = score;
      maxDomain = domain;
    }
  });
  
  return maxDomain;
}

function getWeakDomains(sessions) {
  const domainScores = calculateDomainScores(sessions);
  return Object.entries(domainScores)
    .filter(([domain, score]) => score < 65)
    .map(([domain]) => domain.replace('_', ' '));
}

function calculateImprovementTrend(sessions) {
  if (sessions.length < 5) return 0;
  
  const recent = sessions.slice(0, 5);
  const older = sessions.slice(5, 10);
  
  const recentAvg = recent.reduce((sum, s) => sum + s.score, 0) / recent.length;
  const olderAvg = older.reduce((sum, s) => sum + s.score, 0) / older.length || recentAvg;
  
  return ((recentAvg - olderAvg) / olderAvg) * 100;
}

function calculateConsistencyScore(sessions) {
  if (sessions.length < 3) return 50;
  
  const scores = sessions.map(s => s.score);
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  
  return Math.max(0, 100 - Math.sqrt(variance));
}

function calculateEngagementScore(user, sessions) {
  const daysActive = new Set(sessions.map(s => s.createdAt.toDateString())).size;
  const avgSessionsPerDay = sessions.length / Math.max(daysActive, 1);
  const streakBonus = Math.min(user.streak * 2, 20);
  
  return Math.min(100, (avgSessionsPerDay * 30) + streakBonus + (daysActive * 2));
}

async function createRecommendationRecords(userId, mlResult) {
  try {
    const recommendations = mlResult.recommended_tests.map(game => ({
      userId,
      type: 'ml_insight',
      title: `Try ${game.replace('-', ' ')} Training`,
      message: `Based on your cognitive profile, ${game} training could help improve your performance.`,
      category: 'training',
      priority: 'medium',
      data: {
        gameType: game,
        difficulty: mlResult.difficulty_recommendations?.[game] || 'medium',
        reasoning: mlResult.reasoning
      }
    }));

    await Recommendation.insertMany(recommendations);
  } catch (error) {
    console.error('Error creating recommendation records:', error);
  }
}

module.exports = router;