const express = require('express');
const { body, validationResult } = require('express-validator');
const Session = require('../models/Session');
const User = require('../models/User');
const Recommendation = require('../models/Recommendation');
const auth = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// @route   POST /api/sessions
// @desc    Create a new game session
// @access  Private
router.post('/', auth, [
  body('gameType').isIn(['n-back', 'dual-task', 'flanker', 'attention-network', 'simple-reaction', 'choice-reaction', 'ravens-matrices', 'tower-hanoi']),
  body('domain').isIn(['working_memory', 'attention', 'processing_speed', 'problem_solving']),
  body('difficulty').isIn(['easy', 'medium', 'hard']),
  body('duration').isInt({ min: 1 }),
  body('score').isFloat({ min: 0, max: 100 }),
  body('accuracy').isFloat({ min: 0, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const sessionData = {
      userId: req.user.id,
      ...req.body
    };

    // Create session
    const session = new Session(sessionData);
    
    // Calculate percentiles (mock implementation)
    session.percentileScores = session.calculatePercentile();
    
    await session.save();

    // Update user stats
    const user = await User.findById(req.user.id);
    user.stats.totalSessions += 1;
    user.stats.totalPlayTime += sessionData.duration;
    
    // Update average score
    const totalScore = (user.stats.averageScore * (user.stats.totalSessions - 1)) + sessionData.score;
    user.stats.averageScore = totalScore / user.stats.totalSessions;
    
    // Update games played count
    const currentCount = user.stats.gamesPlayed.get(sessionData.gameType) || 0;
    user.stats.gamesPlayed.set(sessionData.gameType, currentCount + 1);
    
    // Add XP based on performance
    const xpGained = Math.floor(sessionData.score / 10) * 10 + 50; // Base 50 XP + performance bonus
    const levelResult = user.addXP(xpGained);
    
    // Check for badges
    await checkAndAwardBadges(user, session);
    
    await user.save();

    // Get ML predictions (mock call to ML service)
    try {
      const mlResponse = await axios.post(`${process.env.ML_API_URL}/predict`, {
        userId: req.user.id,
        sessionData: sessionData,
        userHistory: await Session.find({ userId: req.user.id }).limit(10).sort({ createdAt: -1 })
      });
      
      session.mlPredictions = mlResponse.data;
      await session.save();
      
      // Create ML-based recommendations
      await Recommendation.createMLRecommendation(req.user.id, mlResponse.data);
    } catch (mlError) {
      console.log('ML service unavailable, using mock predictions');
      session.mlPredictions = {
        nextSessionScore: sessionData.score + Math.random() * 10 - 5,
        improvementProbability: Math.random(),
        recommendedDifficulty: sessionData.difficulty
      };
      await session.save();
    }

    res.status(201).json({
      success: true,
      session,
      userUpdates: {
        xpGained,
        leveledUp: levelResult.leveledUp,
        newLevel: levelResult.newLevel,
        totalXP: user.xp,
        currentLevel: user.level
      }
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/sessions
// @desc    Get user's sessions
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, gameType, domain, startDate, endDate } = req.query;
    
    const query = { userId: req.user.id };
    
    if (gameType) query.gameType = gameType;
    if (domain) query.domain = domain;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sessions = await Session.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Session.countDocuments(query);

    res.json({
      success: true,
      sessions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/sessions/:id
// @desc    Get specific session
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to check and award badges
async function checkAndAwardBadges(user, session) {
  const badges = [];
  
  // First session badge
  if (user.stats.totalSessions === 1) {
    badges.push({
      id: 'first-session',
      name: 'Getting Started',
      description: 'Completed your first cognitive training session'
    });
  }
  
  // Perfect score badge
  if (session.score === 100) {
    badges.push({
      id: 'perfect-score',
      name: 'Perfect Performance',
      description: 'Achieved a perfect score in a training session'
    });
  }
  
  // Session milestone badges
  if ([10, 25, 50, 100].includes(user.stats.totalSessions)) {
    badges.push({
      id: `sessions-${user.stats.totalSessions}`,
      name: `${user.stats.totalSessions} Sessions`,
      description: `Completed ${user.stats.totalSessions} training sessions`
    });
  }
  
  // Streak badges
  if ([7, 14, 30].includes(user.streak)) {
    badges.push({
      id: `streak-${user.streak}`,
      name: `${user.streak}-Day Streak`,
      description: `Maintained a ${user.streak}-day training streak`
    });
  }
  
  // Award new badges
  for (const badge of badges) {
    const awarded = user.awardBadge(badge);
    if (awarded) {
      user.addXP(100); // Bonus XP for earning badge
    }
  }
}

module.exports = router;